package com.vehicle.service.vehicleserviceapi.dto;

/**
 * Record representing the result of a blockchain transaction.
 * @param jobId The unique ID of the maintenance job in the smart contract.
 * @param txHash The transaction hash on the distributed ledger.
 */
public record BlockchainResult(Long jobId, String txHash) {}