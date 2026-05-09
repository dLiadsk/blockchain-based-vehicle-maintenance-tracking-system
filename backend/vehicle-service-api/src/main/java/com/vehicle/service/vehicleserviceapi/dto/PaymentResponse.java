package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentResponse {
    private String txHash;
    private LocalDateTime paymentDate;
    private String receiptPdfHash;
}