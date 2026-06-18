package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing the current state of a repair job
 * exactly as it is stored on the decentralized ledger (smart contract).
 * This class maps directly to the `RepairJob` struct in the VehicleService Solidity contract.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockchainJobDto {

    /** The unique identifier of the job on the blockchain. */
    private Long id;

    /** The Vehicle Identification Number (VIN). */
    private String vin;

    /** The Ethereum wallet address of the client (vehicle owner). */
    private String clientAddress;

    /**
     * The numerical index representing the current status of the job.
     * Maps strictly to the Status enum in the smart contract
     * (e.g., 0 = RequestCreated, 3 = Inspected, 8 = Cancelled).
     */
    private Integer statusIndex;

    /** The current estimated or final total cost of the repair. */
    private Long estimatedTotal;

    /** The required deposit amount defined after the inspection. */
    private Long depositRequired;

    /** The reason for cancellation, populated only if the status is Cancelled. */
    private String cancelReason;

    // ============================================================================
    // CRYPTOGRAPHIC HASHES (FOR INTEGRITY AUDIT)
    // ============================================================================

    /** SHA-256 / IPFS hash of the initial service request PDF. */
    private String requestPdfHash;

    /** SHA-256 / IPFS hash of the technical inspection report PDF. */
    private String inspectionPdfHash;

    /** SHA-256 / IPFS hash of the completed work report PDF. */
    private String workReportPdfHash;

    /** SHA-256 / IPFS hash of the deposit or final payment receipt PDF. */
    private String receiptPdfHash;
}