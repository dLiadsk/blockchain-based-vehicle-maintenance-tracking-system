package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object representing a single point in the service request's history.
 * Used to build the chronological timeline of events on the client side.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistoryResponse {

    /**
     * Unique identifier of the history record.
     */
    private Long id;

    /**
     * The status name (e.g., "RequestCreated", "Inspected", "WorkInProgress").
     */
    private String status;

    /**
     * Timestamp when this specific status was reached.
     */
    private LocalDateTime changedAt;

    /**
     * Blockchain transaction hash associated with this status transition.
     * Allows users to verify the record on the blockchain explorer.
     */
    private String blockchainTxHash;
}