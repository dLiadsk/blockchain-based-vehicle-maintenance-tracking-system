package com.vehicle.service.vehicleserviceapi.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для представлення поточного стану заявки (RepairJob),
 * отриманого безпосередньо зі смарт-контракту.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockchainJobDto {
    private Long id;
    private String vin;
    private String clientAddress;

    // Enum Status у Solidity повертається як число (індекс від 0 до 9)
    private Integer statusIndex;

    private Long estimatedTotal;
    private Long depositRequired;
    private String cancelReason;

    // Хеші документів для аудиту
    private String requestPdfHash;
    private String inspectionPdfHash;
    private String workReportPdfHash;
    private String receiptPdfHash;
}