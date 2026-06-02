package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object representing the result of a blockchain integrity audit.
 * Compares the locally stored document hash against the immutable hash on the ledger.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrityCheckResponse {

    /** Indicates whether the local hash successfully matches the blockchain hash. */
    private boolean valid;

    /** The SHA-256 hash calculated from the currently stored local file. */
    private String currentFileHash;

    /** The original immutable SHA-256 hash retrieved from the smart contract. */
    private String originalBlockchainHash;

    /** Human-readable message detailing the outcome of the verification process. */
    private String message;
}