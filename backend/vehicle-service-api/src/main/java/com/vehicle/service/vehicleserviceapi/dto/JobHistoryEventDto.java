package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для представлення історичної події зміни статусу (StatusChanged),
 * отриманої з логів Ethereum/Bloxsberg.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobHistoryEventDto {
    private Long jobId;
    private Integer statusIndex;
    private String reason;

    // Метадані транзакції для аудиту
    private String transactionHash;
    private Long blockNumber;
}