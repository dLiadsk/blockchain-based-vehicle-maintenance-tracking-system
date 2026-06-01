package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.BlockchainJobDto;
import com.vehicle.service.vehicleserviceapi.dto.IntegrityCheckResponse;
import com.vehicle.service.vehicleserviceapi.dto.JobHistoryEventDto;
import com.vehicle.service.vehicleserviceapi.model.ServiceRequest;
import com.vehicle.service.vehicleserviceapi.model.StatusHistory;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.repository.ServiceRequestRepository;
import com.vehicle.service.vehicleserviceapi.repository.StatusHistoryRepository;
import com.vehicle.service.vehicleserviceapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainAuditService {

    private final BlockchainService blockchainService;
    private final ServiceRequestRepository requestRepository;
    private final VehicleRepository vehicleRepository;
    private final StatusHistoryRepository statusHistoryRepository;


    private static final String[] STATUS_MAPPING = {
            "RequestCreated", "AcceptedByAdmin", "VehicleArrived", "Inspected",
            "DepositPaid", "WorkInProgress", "ReadyForPickup", "Finalized", "Rejected", "Cancelled"
    };

    @Transactional(readOnly = true)
    public IntegrityCheckResponse verifyJobIntegrity(Long requestId) throws Exception {
        ServiceRequest dbRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Заявку не знайдено в локальній БД"));

        if (dbRequest.getBlockchainJobId() == null) {
            return IntegrityCheckResponse.builder()
                    .valid(false)
                    .message("Заявку ще не синхронізовано з блокчейном.")
                    .build();
        }

        BlockchainJobDto blockchainJob = blockchainService.getJobFromBlockchain(dbRequest.getBlockchainJobId());

        StringBuilder discrepancies = new StringBuilder();
        boolean isValid = true;

        // Змінні для виведення в UI (за замовчуванням показуємо статуси)
        String localDataToDisplay = dbRequest.getStatus();
        String bcDataToDisplay = STATUS_MAPPING[blockchainJob.getStatusIndex()];

        // 1. Перевірка статусу
        String mappedStatus = STATUS_MAPPING[blockchainJob.getStatusIndex()];
        if (!dbRequest.getStatus().equalsIgnoreCase(mappedStatus)) {
            isValid = false;
            discrepancies.append(String.format("Статус підроблено! "));
        }

        // 2. Перевірка первинної заявки
        if (!compareHashes(dbRequest.getPdfHash(), blockchainJob.getRequestPdfHash())) {
            isValid = false; discrepancies.append("Початковий PDF змінено! ");
            localDataToDisplay = "Хеш: " + (dbRequest.getPdfHash() != null ? dbRequest.getPdfHash() : "Пусто");
            bcDataToDisplay = "Хеш: " + blockchainJob.getRequestPdfHash();
        }

        // 3. Перевірка акту огляду
        if (!compareHashes(dbRequest.getInspectionPdfHash(), blockchainJob.getInspectionPdfHash())) {
            isValid = false; discrepancies.append("Акт огляду змінено! ");
            localDataToDisplay = "Хеш: " + (dbRequest.getInspectionPdfHash() != null ? dbRequest.getInspectionPdfHash() : "Пусто");
            bcDataToDisplay = "Хеш: " + blockchainJob.getInspectionPdfHash();
        }

        // 4. Розумна перевірка квитанцій (враховуючи специфіку Solidity контракту)
        String bcReceipt = blockchainJob.getReceiptPdfHash();
        boolean receiptValid = compareHashes(dbRequest.getPaymentReceiptPdfHash(), bcReceipt) ||
                compareHashes(dbRequest.getFinalReceiptPdfHash(), bcReceipt);

        if (!receiptValid && (dbRequest.getPaymentReceiptPdfHash() != null || dbRequest.getFinalReceiptPdfHash() != null)) {
            isValid = false; discrepancies.append("Квитанцію оплати або чек змінено! ");
            localDataToDisplay = "Завдаток: " + dbRequest.getPaymentReceiptPdfHash() + " / Фінальний: " + dbRequest.getFinalReceiptPdfHash();
            bcDataToDisplay = "Квитанція Блокчейн: " + bcReceipt;
        }

        // 5. Перевірка акту виконаних робіт
        if (!compareHashes(dbRequest.getWorkReportPdfHash(), blockchainJob.getWorkReportPdfHash())) {
            isValid = false; discrepancies.append("Акт виконаних робіт змінено! ");
            localDataToDisplay = "Хеш: " + (dbRequest.getWorkReportPdfHash() != null ? dbRequest.getWorkReportPdfHash() : "Пусто");
            bcDataToDisplay = "Хеш: " + blockchainJob.getWorkReportPdfHash();
        }

        return IntegrityCheckResponse.builder()
                .valid(isValid)
                .currentFileHash(localDataToDisplay)
                .originalBlockchainHash(bcDataToDisplay)
                .message(isValid ? "Цілісність підтверджено: дані в БД повністю відповідають Блокчейну."
                        : "КРИТИЧНА ПОМИЛКА: " + discrepancies.toString())
                .build();
    }

    @Transactional
    public List<Long> syncDeletedRequests() throws Exception {
        log.info("Starting global synchronization of missing requests from the blockchain...");
        Long totalJobs = blockchainService.getJobCounter();
        List<Long> recoveredIds = new ArrayList<>();

        for (long i = 1; i <= totalJobs; i++) {
            boolean exists = requestRepository.existsByBlockchainJobId(i);

            if (!exists) {
                log.warn("Discrepancy detected: Job ID {} is missing in DB! Recovering...", i);

                BlockchainJobDto chainJob = blockchainService.getJobFromBlockchain(i);

                Vehicle vehicle = vehicleRepository.findByVin(chainJob.getVin()).orElseGet(() -> {
                    Vehicle orphanVehicle = Vehicle.builder()
                            .vin(chainJob.getVin())
                            .brand("Відновлено")
                            .model("Аудит-запис")
                            .year((short) 2026)
                            .owner(null)
                            .build();
                    return vehicleRepository.save(orphanVehicle);
                });

                ServiceRequest recoveredRequest = ServiceRequest.builder()
                        .blockchainJobId(chainJob.getId())
                        .vehicle(vehicle)
                        .customer(vehicle.getOwner())
                        .stoProfile(null)
                        .description("ВІДНОВЛЕНО З БЛОКЧЕЙНУ: Деталі збережено в смарт-контракті.")
                        .status(STATUS_MAPPING[chainJob.getStatusIndex()])
                        .totalAmount(chainJob.getEstimatedTotal())
                        .depositAmount(chainJob.getDepositRequired())
                        .pdfHash(chainJob.getRequestPdfHash())
                        .inspectionPdfHash(chainJob.getInspectionPdfHash())
                        .workReportPdfHash(chainJob.getWorkReportPdfHash())
                        .paymentReceiptPdfHash(chainJob.getReceiptPdfHash())
                        .arrivalInstructions(chainJob.getCancelReason())
                        .build();

                // 1. Зберігаємо відновлену заявку
                ServiceRequest saved = requestRepository.save(recoveredRequest);
                recoveredIds.add(saved.getBlockchainJobId());

                // 2. Відновлюємо ІСТОРІЮ СТАТУСІВ з логів смарт-контракту
                try {
                    List<JobHistoryEventDto> historyEvents = blockchainService.getJobHistoryFromBlockchain(i);
                    if (historyEvents != null && !historyEvents.isEmpty()) {
                        for (JobHistoryEventDto event : historyEvents) {
                            StatusHistory history = StatusHistory.builder()
                                    .serviceRequest(saved) // Прив'язуємо до збереженої заявки
                                    .status(STATUS_MAPPING[event.getStatusIndex()])
                                    .changedAt(LocalDateTime.now()) // Ставимо поточний час відновлення
                                    .blockchainTxHash(event.getTransactionHash())
                                    .build();

                            statusHistoryRepository.save(history); // Зберігаємо статус у БД
                        }
                        log.info("Successfully recovered {} history events for Job ID {}", historyEvents.size(), i);
                    }
                } catch (Exception e) {
                    log.error("Failed to recover history for Job ID {}: {}", i, e.getMessage());
                }
            }
        }
        return recoveredIds;
    }

    /**
     * Безпечне порівняння хешів, яке нівелює різницю між null (в Java) та "" (в Solidity).
     */
    private boolean compareHashes(String dbHash, String bcHash) {
        String safeDbHash = (dbHash == null) ? "" : dbHash.trim();
        String safeBcHash = (bcHash == null) ? "" : bcHash.trim();
        return safeDbHash.equals(safeBcHash);
    }
}