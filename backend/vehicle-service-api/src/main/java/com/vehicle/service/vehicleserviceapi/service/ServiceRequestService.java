package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Core business service for managing vehicle service requests.
 * Orchestrates database operations, PDF generation, blockchain synchronization,
 * and maintains an immutable status history (Audit Trail).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ServiceRequestService {

    private final ServiceRequestRepository requestRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final StoProfileRepository stoProfileRepository;
    private final PdfService pdfService;
    private final BlockchainService blockchainService;
    private final DtoMapper dtoMapper;

    /**
     * Creates a new service request, registers it on the blockchain, and logs the initial status.
     */
    @Transactional
    public ServiceRequestResponse createRequest(CreateServiceRequest dto, String customerEmail) throws Exception {
        log.info("Processing new service request creation for user: {}", customerEmail);

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Vehicle vehicle = vehicleRepository.findByVin(dto.getVin())
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + dto.getVin()));

        if (!vehicle.getOwner().getId().equals(customer.getId())) {
            throw new RuntimeException("Access denied: You are not the owner of this vehicle");
        }

        StoProfile stoProfile = stoProfileRepository.findById(dto.getStoId())
                .orElseThrow(() -> new RuntimeException("Selected STO station not found"));

        // 1. Generate Request PDF
        String pdfHash = pdfService.generateAndSaveServiceRequestPdf(
                vehicle.getVin(),
                dto.getDescription(),
                customer.getFirstName() + " " + customer.getLastName()
        );

        // 2. Blockchain Registration
        BlockchainResult result = blockchainService.createServiceRequest(vehicle.getVin(), pdfHash);

        // 3. Save Service Request to Database
        ServiceRequest request = ServiceRequest.builder()
                .vehicle(vehicle)
                .customer(customer)
                .stoProfile(stoProfile)
                .description(dto.getDescription())
                .status("RequestCreated")
                .blockchainJobId(result.jobId())
                .blockchainTxHash(result.txHash())
                .pdfHash(pdfHash)
                .workTypes(dto.getWorkTypes())
                .mileage(dto.getMileage())
                .build();

        ServiceRequest savedRequest = requestRepository.save(request);

        // 4. RECORD STATUS HISTORY (Audit Trail)
        recordStatusChange(savedRequest, "RequestCreated", result.txHash());

        log.info("Service request created successfully with JobId: {}", result.jobId());
        return dtoMapper.toServiceRequestResponse(savedRequest);
    }

    /**
     * Processes an online payment and returns a structured payment response.
     */
    @Transactional
    public PaymentResponse payOnline(Long requestId, String customerEmail) throws Exception {
        log.info("Processing online payment for request ID: {}", requestId);

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        String transactionId = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        String receiptHash = pdfService.generateOnlineReceiptPdf(
                request.getId(),
                request.getVehicle().getVin(),
                request.getDepositAmount(),
                transactionId
        );

        String txHash = blockchainService.payDepositOnline(request.getBlockchainJobId(), receiptHash);

        request.setStatus("DepositPaid");
        request.setPaymentReceiptPdfHash(receiptHash);
        request.setBlockchainTxHash(txHash);
        requestRepository.save(request);

        recordStatusChange(request, "DepositPaid", txHash);

        // Тепер використовуємо наш PaymentResponse
        return PaymentResponse.builder()
                .txHash(txHash)
                .paymentDate(LocalDateTime.now())
                .receiptPdfHash(receiptHash)
                .build();
    }

    /**
     * Helper method to record status transitions in the history table.
     */
    private void recordStatusChange(ServiceRequest request, String status, String txHash) {
        StatusHistory history = StatusHistory.builder()
                .serviceRequest(request)
                .status(status)
                .blockchainTxHash(txHash)
                .build();
        statusHistoryRepository.save(history);
        log.debug("Status history recorded: {} for Request ID: {}", status, request.getId());
    }

    // Additional read methods (getMyRequests, getRequestDetails) would go here...
    public List<ServiceRequestResponse> getRequestsByCustomer(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return requestRepository.findAllByCustomerId(user.getId()).stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves detailed information about a specific request.
     * Includes security checks to ensure only the owner or the assigned STO can view it.
     */
    @Transactional(readOnly = true)
    public ServiceRequestResponse getRequestDetails(Long requestId, String currentUserEmail) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found with ID: " + requestId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Security Check: Is the user the owner OR is the user the admin of the assigned STO?
        boolean isOwner = request.getCustomer().getId().equals(currentUser.getId());
        boolean isAssignedSto = currentUser.getStoProfile() != null &&
                request.getStoProfile().getId().equals(currentUser.getStoProfile().getId());

        if (!isOwner && !isAssignedSto && !currentUser.getRole().equals(UserRole.ROLE_ADMIN)) {
            log.warn("Access denied for user {} to request ID {}", currentUserEmail, requestId);
            throw new RuntimeException("Access denied: You are not authorized to view this request");
        }

        return dtoMapper.toServiceRequestResponse(request);
    }

    /**
     * Cancels a service request if it hasn't been processed or paid for yet.
     * Synchronizes the cancellation with the blockchain.
     */
    @Transactional
    public ServiceRequestResponse cancelRequest(Long requestId, String customerEmail, String reason) throws Exception {
        log.info("User {} is attempting to cancel request ID {} with reason: {}", customerEmail, requestId, reason);

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Заявку не знайдено"));

        User currentUser = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        boolean isOwner = request.getCustomer().getId().equals(currentUser.getId());
        boolean isAssignedSto = currentUser.getStoProfile() != null &&
                request.getStoProfile().getId().equals(currentUser.getStoProfile().getId());
        boolean isAdmin = currentUser.getRole().name().equals("ROLE_ADMIN");

        List<String> cancellableStatuses = List.of(
                "RequestCreated",
                "AcceptedByAdmin",
                "VehicleArrived"
        );

        if (!isOwner && !isAssignedSto && !isAdmin) {
            throw new RuntimeException("Відмовлено в доступі: ви не можете скасувати цю заявку");
        }

        if (!cancellableStatuses.contains(request.getStatus())) {
            throw new RuntimeException("Цю заявку вже неможливо скасувати на поточному етапі (огляд вже проведено)");
        }

        String finalReason = (reason == null || reason.trim().isEmpty()) ? "Скасовано без вказання причини" : reason;

        String txHash = blockchainService.cancelRequest(request.getBlockchainJobId(), finalReason);

        request.setArrivalInstructions(reason);
        request.setStatus("CANCELLED");
        request.setBlockchainTxHash(txHash);
        ServiceRequest savedRequest = requestRepository.save(request);

        recordStatusChange(savedRequest, "CANCELLED", txHash);

        return dtoMapper.toServiceRequestResponse(savedRequest);
    }

    @Transactional(readOnly = true)
    public IntegrityCheckResponse verifyDocumentIntegrity(Long requestId, String docType) throws Exception {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Заявку не знайдено"));

        // 1. Додано підтримку final_settlement
        String originalHash = switch (docType.toLowerCase()) {
            case "service_request" -> request.getPdfHash();
            case "inspection_report" -> request.getInspectionPdfHash();
            case "deposit_receipt" -> request.getPaymentReceiptPdfHash();
            case "work_report" -> request.getWorkReportPdfHash();
            case "final_settlement" -> request.getFinalReceiptPdfHash();
            default -> throw new RuntimeException("Невідомий тип документа: " + docType);
        };

        if (originalHash == null || originalHash.isEmpty()) {
            return IntegrityCheckResponse.builder()
                    .valid(false)
                    .message("Документ ще не згенеровано або не збережено в блокчейн.")
                    .build();
        }

        String vin = request.getVehicle().getVin();
        String filePrefix = docType.toLowerCase();
        String exactFileName = filePrefix + "_" + originalHash + ".pdf";
        Path filePath = Paths.get("storage/requests/" + vin + "/" + exactFileName);

        // 2. Розумна перевірка для завдатку: якщо оплата була онлайн, файл має інший префікс
        if (filePrefix.equals("deposit_receipt") && !Files.exists(filePath)) {
            exactFileName = "online_receipt_" + originalHash + ".pdf";
            filePath = Paths.get("storage/requests/" + vin + "/" + exactFileName);
        }

        if (!Files.exists(filePath)) {
            return IntegrityCheckResponse.builder()
                    .valid(false)
                    .message("Файл втрачено або видалено з сервера!")
                    .build();
        }

        String currentHash = pdfService.calculateFileHash(filePath);

        boolean isValid = currentHash.equals(originalHash);

        return IntegrityCheckResponse.builder()
                .valid(isValid)
                .currentFileHash(currentHash)
                .originalBlockchainHash(originalHash)
                .message(isValid ? "Цілісність підтверджено: файл не змінювався." : "УВАГА: Хеш не співпадає! Файл був підроблений.")
                .build();
    }
}