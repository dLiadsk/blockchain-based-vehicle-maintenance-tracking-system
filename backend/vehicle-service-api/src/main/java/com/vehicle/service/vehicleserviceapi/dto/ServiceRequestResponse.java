package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Comprehensive response containing full details of a service request,
 * including financial data, blockchain metadata, and audit trail.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestResponse {
    private Long id;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String arrivalInstructions;

    /** Estimated total cost of the maintenance. */
    private Long totalAmount;
    /** Required pre-payment amount. */
    private Long depositAmount;

    /** Index of the maintenance job in the blockchain smart contract. */
    private Long blockchainJobId;
    /** Hash of the most recent blockchain transaction associated with this request. */
    private String blockchainTxHash;

    /** SHA-256 hashes of generated PDF documents for integrity verification. */
    private String pdfHash;
    private String inspectionPdfHash;
    private String paymentReceiptPdfHash;
    private String workReportPdfHash;
    private String finalReceiptPdfHash;

    private VehicleResponse vehicle;
    private UserResponse customer;
    private StoProfileResponse sto;
    private Long mileage;

    private List<String> workTypes;
    /** Chronological list of status changes (Audit Trail). */
    private List<StatusHistoryResponse> statusHistory;
}