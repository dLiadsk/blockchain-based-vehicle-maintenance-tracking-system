package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.BlockchainJobDto;
import com.vehicle.service.vehicleserviceapi.dto.IntegrityCheckResponse;
import com.vehicle.service.vehicleserviceapi.dto.JobHistoryEventDto;
import com.vehicle.service.vehicleserviceapi.model.ServiceRequest;
import com.vehicle.service.vehicleserviceapi.model.StatusHistory;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
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

/**
 * Core service responsible for cryptographic auditing and data synchronization
 * between the local relational database and the immutable Ethereum/Bloxsberg smart contract.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BlockchainAuditService {

    private final BlockchainService blockchainService;
    private final ServiceRequestRepository requestRepository;
    private final VehicleRepository vehicleRepository;
    private final StatusHistoryRepository statusHistoryRepository;

    /** * Maps the numeric status index from the Solidity smart contract to the String representation.
     */
    private static final String[] STATUS_MAPPING = {
            "RequestCreated", "AcceptedByAdmin", "VehicleArrived", "Inspected",
            "DepositPaid", "WorkInProgress", "ReadyForPickup", "Finalized", "Cancelled"
    };

    /**
     * Performs a deep cryptographic integrity check of a local service request
     * against the immutable data stored on the blockchain.
     *
     * @param requestId The local database ID of the service request.
     * @return IntegrityCheckResponse detailing any discrepancies found.
     * @throws Exception If blockchain communication fails.
     */
    @Transactional(readOnly = true)
    public IntegrityCheckResponse verifyJobIntegrity(Long requestId) throws Exception {
        ServiceRequest dbRequest = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found in the local database."));

        if (dbRequest.getBlockchainJobId() == null) {
            return IntegrityCheckResponse.builder()
                    .valid(false)
                    .message("Request has not been synchronized with the blockchain yet.")
                    .build();
        }

        BlockchainJobDto blockchainJob = blockchainService.getJobFromBlockchain(dbRequest.getBlockchainJobId());

        StringBuilder discrepancies = new StringBuilder();
        boolean isValid = true;

        // Variables for UI display (defaults to showing the status)
        String localDataToDisplay = dbRequest.getStatus();
        String bcDataToDisplay = STATUS_MAPPING[blockchainJob.getStatusIndex()];

        // 1. Status Verification
        String mappedStatus = STATUS_MAPPING[blockchainJob.getStatusIndex()];
        if (!dbRequest.getStatus().equalsIgnoreCase(mappedStatus)) {
            isValid = false;
            discrepancies.append("Status tampered! ");
        }

        // 2. Initial Request Document Verification
        if (!compareHashes(dbRequest.getPdfHash(), blockchainJob.getRequestPdfHash())) {
            isValid = false;
            discrepancies.append("Initial PDF tampered! ");
            localDataToDisplay = "Hash: " + (dbRequest.getPdfHash() != null ? dbRequest.getPdfHash() : "Empty");
            bcDataToDisplay = "Hash: " + blockchainJob.getRequestPdfHash();
        }

        // 3. Inspection Report Verification
        if (!compareHashes(dbRequest.getInspectionPdfHash(), blockchainJob.getInspectionPdfHash())) {
            isValid = false;
            discrepancies.append("Inspection report tampered! ");
            localDataToDisplay = "Hash: " + (dbRequest.getInspectionPdfHash() != null ? dbRequest.getInspectionPdfHash() : "Empty");
            bcDataToDisplay = "Hash: " + blockchainJob.getInspectionPdfHash();
        }

        // 4. Smart Receipt Verification (Handling Solidity contract specifics where one field might hold either receipt)
        String bcReceipt = blockchainJob.getReceiptPdfHash();
        boolean receiptValid = compareHashes(dbRequest.getPaymentReceiptPdfHash(), bcReceipt) ||
                compareHashes(dbRequest.getFinalReceiptPdfHash(), bcReceipt);

        if (!receiptValid && (dbRequest.getPaymentReceiptPdfHash() != null || dbRequest.getFinalReceiptPdfHash() != null)) {
            isValid = false;
            discrepancies.append("Payment receipt tampered! ");
            localDataToDisplay = "Deposit: " + dbRequest.getPaymentReceiptPdfHash() + " / Final: " + dbRequest.getFinalReceiptPdfHash();
            bcDataToDisplay = "Blockchain Receipt: " + bcReceipt;
        }

        // 5. Work Report Verification
        if (!compareHashes(dbRequest.getWorkReportPdfHash(), blockchainJob.getWorkReportPdfHash())) {
            isValid = false;
            discrepancies.append("Work report tampered! ");
            localDataToDisplay = "Hash: " + (dbRequest.getWorkReportPdfHash() != null ? dbRequest.getWorkReportPdfHash() : "Empty");
            bcDataToDisplay = "Hash: " + blockchainJob.getWorkReportPdfHash();
        }

        return IntegrityCheckResponse.builder()
                .valid(isValid)
                .currentFileHash(localDataToDisplay)
                .originalBlockchainHash(bcDataToDisplay)
                .message(isValid ? "Integrity confirmed: Local database perfectly matches the Blockchain."
                        : "CRITICAL ERROR: " + discrepancies.toString())
                .build();
    }

    /**
     * Disaster recovery mechanism. Scans the blockchain for all existing jobs
     * and restores any records that are missing or deleted from the local database.
     *
     * @return List of blockchain Job IDs that were successfully recovered.
     * @throws Exception If blockchain communication fails.
     */
    @Transactional
    public List<Long> syncDeletedRequests() throws Exception {
        log.info("Starting global synchronization of missing requests from the blockchain...");
        Long totalJobs = blockchainService.getJobCounter();
        List<Long> recoveredIds = new ArrayList<>();

        for (long i = 1; i <= totalJobs; i++) {
            boolean exists = requestRepository.existsByBlockchainJobId(i);

            if (!exists) {
                log.warn("Discrepancy detected: Job ID {} is missing in DB! Initiating recovery...", i);

                BlockchainJobDto chainJob = blockchainService.getJobFromBlockchain(i);

                // Recover or create a placeholder vehicle if it doesn't exist
                Vehicle vehicle = vehicleRepository.findByVin(chainJob.getVin()).orElseGet(() -> {
                    Vehicle orphanVehicle = Vehicle.builder()
                            .vin(chainJob.getVin())
                            .brand("Recovered")
                            .model("Audit Record")
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
                        .description("RECOVERED FROM BLOCKCHAIN: Details preserved in the smart contract.")
                        .status(STATUS_MAPPING[chainJob.getStatusIndex()])
                        .totalAmount(chainJob.getEstimatedTotal())
                        .depositAmount(chainJob.getDepositRequired())
                        .pdfHash(chainJob.getRequestPdfHash())
                        .inspectionPdfHash(chainJob.getInspectionPdfHash())
                        .workReportPdfHash(chainJob.getWorkReportPdfHash())
                        .paymentReceiptPdfHash(chainJob.getReceiptPdfHash())
                        .arrivalInstructions(chainJob.getCancelReason())
                        .build();

                // 1. Save the recovered base request
                ServiceRequest saved = requestRepository.save(recoveredRequest);
                recoveredIds.add(saved.getBlockchainJobId());

                // 2. Recover STATUS HISTORY from smart contract event logs
                try {
                    List<JobHistoryEventDto> historyEvents = blockchainService.getJobHistoryFromBlockchain(i);
                    if (historyEvents != null && !historyEvents.isEmpty()) {
                        for (JobHistoryEventDto event : historyEvents) {
                            StatusHistory history = StatusHistory.builder()
                                    .serviceRequest(saved)
                                    .status(STATUS_MAPPING[event.getStatusIndex()])
                                    .changedAt(LocalDateTime.now()) // Note: Using recovery time as block timestamps require extra RPC calls
                                    .blockchainTxHash(event.getTransactionHash())
                                    .build();

                            statusHistoryRepository.save(history);
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
     * Safe hash comparison that normalizes null values (in Java) and empty strings (in Solidity).
     */
    private boolean compareHashes(String dbHash, String bcHash) {
        String safeDbHash = (dbHash == null) ? "" : dbHash.trim();
        String safeBcHash = (bcHash == null) ? "" : bcHash.trim();
        return safeDbHash.equals(safeBcHash);
    }
}