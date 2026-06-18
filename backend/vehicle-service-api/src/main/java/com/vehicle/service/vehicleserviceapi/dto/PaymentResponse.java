package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Response returned after a successful blockchain status update or payment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String txHash;
    private LocalDateTime paymentDate;
    private String receiptPdfHash;
}