package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing a historical status change event (StatusChanged).
 * Retrieved directly from the Ethereum/Bloxsberg smart contract event logs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobHistoryEventDto {

    /** The unique identifier of the repair job. */
    private Long jobId;

    /** The numerical index representing the new status of the job. */
    private Integer statusIndex;

    /** The reason or additional context provided during the status change. */
    private String reason;

    // ============================================================================
    // TRANSACTION METADATA (FOR AUDIT TRAIL)
    // ============================================================================

    /** The unique hash of the blockchain transaction that triggered this event. */
    private String transactionHash;

    /** The block number in which this transaction was permanently recorded. */
    private Long blockNumber;
}