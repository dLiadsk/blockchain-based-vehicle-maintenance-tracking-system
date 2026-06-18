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
 * Core business service for managing the lifecycle of vehicle service requests.
 * Orchestrates local database operations, secure PDF generation, blockchain synchronization,
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

    // ============================================================================
    // CREATION & PAYMENT ENDPOINTS
    // ============================================================================

    /**
     * Creates a new service request, generates the initial PDF, registers it on the blockchain,
     * and logs the initial status into the audit trail.
     *
     * @param dto           Payload containing VIN, selected STO, and problem description.
     * @param customerEmail Email of the currently authenticated user.
     * @return DTO representation of the newly created service request.
     */
    @Transactional
    public ServiceRequestResponse createRequest(CreateServiceRequest dto, String customerEmail) throws Exception {
        log.info("Processing new service request creation for user: {} and VIN: {}", customerEmail, dto.getVin());

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found in the database."));

        Vehicle vehicle = vehicleRepository.findByVin(dto.getVin())
                .orElseThrow(() -> new RuntimeException("Vehicle not found: " + dto.getVin()));

        if (!vehicle.getOwner().getId().equals(customer.getId())) {
            log.warn("Unauthorized request attempt: User {} is not the owner of VIN {}", customerEmail, dto.getVin());
            throw new RuntimeException("Access denied: You are not the authorized owner of this vehicle.");
        }

        StoProfile stoProfile = stoProfileRepository.findById(dto.getStoId())
                .orElseThrow(() -> new RuntimeException("Selected Service Station (STO) not found."));

        // 1. Generate Request PDF with cryptographic hash
        String pdfHash = pdfService.generateAndSaveServiceRequestPdf(
                vehicle,
                stoProfile,
                customer.getFirstName() + " " + customer.getLastName(),
                dto.getDescription(),
                dto.getMileage()
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

        // 4. Record the initial state in the audit trail
        recordStatusChange(savedRequest, "RequestCreated", result.txHash());

        log.info("Service request successfully created and secured on-chain. JobId: {}", result.jobId());
        return dtoMapper.toServiceRequestResponse(savedRequest);
    }

    /**
     * Processes an online deposit payment, generates a digital receipt, and syncs the status
     * with the smart contract.
     *
     * @param requestId     The ID of the service request.
     * @param customerEmail The email of the paying customer.
     * @return Payment confirmation details including the transaction hash.
     */
    @Transactional
    public PaymentResponse payOnline(Long requestId, String customerEmail) throws Exception {
        log.info("Processing online payment for request ID: {} by user: {}", requestId, customerEmail);

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found."));

        // Mocking an external payment gateway transaction ID
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

        log.info("Online payment successful for request ID: {}. TxHash: {}", requestId, txHash);
        return PaymentResponse.builder()
                .txHash(txHash)
                .paymentDate(LocalDateTime.now())
                .receiptPdfHash(receiptHash)
                .build();
    }

    // ============================================================================
    // RETRIEVAL & ACTIONS
    // ============================================================================

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getRequestsByCustomer(String email) {
        log.info("Fetching service requests for customer: {}", email);
        User user = userRepository.findByEmail(email).orElseThrow();
        return requestRepository.findAllByCustomerId(user.getId()).stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceRequestResponse getRequestDetails(Long requestId, String currentUserEmail) {
        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found with ID: " + requestId));

        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

        // Security Validation
        boolean isOwner = request.getCustomer().getId().equals(currentUser.getId());
        boolean isAssignedSto = currentUser.getStoProfile() != null &&
                request.getStoProfile().getId().equals(currentUser.getStoProfile().getId());

        if (!isOwner && !isAssignedSto && !currentUser.getRole().equals(UserRole.ROLE_ADMIN)) {
            log.warn("Access denied for user {} to request ID {}", currentUserEmail, requestId);
            throw new RuntimeException("Access denied: You are not authorized to view this request.");
        }

        return dtoMapper.toServiceRequestResponse(request);
    }

    /**
     * Cancels an active service request if it hasn't progressed past the inspection phase.
     * Updates both the local database and the smart contract.
     */
    @Transactional
    public ServiceRequestResponse cancelRequest(Long requestId, String customerEmail, String reason) throws Exception {
        log.info("User {} is attempting to cancel request ID {} with reason: {}", customerEmail, requestId, reason);

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found."));

        User currentUser = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found."));

        boolean isOwner = request.getCustomer().getId().equals(currentUser.getId());
        boolean isAssignedSto = currentUser.getStoProfile() != null &&
                request.getStoProfile().getId().equals(currentUser.getStoProfile().getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ROLE_ADMIN;

        if (!isOwner && !isAssignedSto && !isAdmin) {
            throw new RuntimeException("Access denied: You are not authorized to cancel this request.");
        }

        List<String> cancellableStatuses = List.of("RequestCreated", "AcceptedByAdmin", "VehicleArrived");

        if (!cancellableStatuses.contains(request.getStatus())) {
            throw new RuntimeException("This request can no longer be cancelled at this stage (inspection already completed).");
        }

        String finalReason = (reason == null || reason.trim().isEmpty()) ? "Cancelled without specifying a reason." : reason;

        String txHash = blockchainService.cancelRequest(request.getBlockchainJobId(), finalReason);

        request.setArrivalInstructions(finalReason); // Repurposing field or logging reason
        request.setStatus("CANCELLED");
        request.setBlockchainTxHash(txHash);
        ServiceRequest savedRequest = requestRepository.save(request);

        recordStatusChange(savedRequest, "CANCELLED", txHash);

        log.info("Request ID {} successfully cancelled.", requestId);
        return dtoMapper.toServiceRequestResponse(savedRequest);
    }

    // ============================================================================
    // AUDIT & INTEGRITY
    // ============================================================================

    /**
     * Verifies the cryptographic integrity of a specific physical document file
     * against the immutable hash stored in the database/blockchain.
     */
    @Transactional(readOnly = true)
    public IntegrityCheckResponse verifyDocumentIntegrity(Long requestId, String docType) throws Exception {
        log.info("Verifying document integrity for request ID: {}, Document Type: {}", requestId, docType);

        ServiceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Service request not found."));

        String originalHash = switch (docType.toLowerCase()) {
            case "service_request" -> request.getPdfHash();
            case "inspection_report" -> request.getInspectionPdfHash();
            case "deposit_receipt" -> request.getPaymentReceiptPdfHash();
            case "work_report" -> request.getWorkReportPdfHash();
            case "final_settlement" -> request.getFinalReceiptPdfHash();
            default -> throw new RuntimeException("Unknown document type requested: " + docType);
        };

        if (originalHash == null || originalHash.isEmpty()) {
            return IntegrityCheckResponse.builder()
                    .valid(false)
                    .message("Document has not been generated or secured on the blockchain yet.")
                    .build();
        }

        String vin = request.getVehicle().getVin();
        String filePrefix = docType.toLowerCase();
        String exactFileName = filePrefix + "_" + originalHash + ".pdf";
        Path filePath = Paths.get("storage/requests/" + vin + "/" + exactFileName);

        // Smart fallback logic for deposit receipts (online vs offline naming)
        if (filePrefix.equals("deposit_receipt") && !Files.exists(filePath)) {
            exactFileName = "online_receipt_" + originalHash + ".pdf";
            filePath = Paths.get("storage/requests/" + vin + "/" + exactFileName);
        }

        if (!Files.exists(filePath)) {
            log.error("Integrity failure: File physically missing from server storage. Path: {}", filePath);
            return IntegrityCheckResponse.builder()
                    .valid(false)
                    .message("File is missing or deleted from the server storage!")
                    .build();
        }

        String currentHash = pdfService.calculateFileHash(filePath);
        boolean isValid = currentHash.equals(originalHash);

        return IntegrityCheckResponse.builder()
                .valid(isValid)
                .currentFileHash(currentHash)
                .originalBlockchainHash(originalHash)
                .message(isValid ? "Integrity confirmed: The file has not been altered."
                        : "WARNING: Hash mismatch! The file has been tampered with or corrupted.")
                .build();
    }

    /**
     * Helper method to securely record status transitions in the history table.
     */
    private void recordStatusChange(ServiceRequest request, String status, String txHash) {
        StatusHistory history = StatusHistory.builder()
                .serviceRequest(request)
                .status(status)
                .blockchainTxHash(txHash)
                .changedAt(LocalDateTime.now())
                .build();
        statusHistoryRepository.save(history);
        log.info("Status history recorded: {} for Request ID: {}", status, request.getId());
    }
}