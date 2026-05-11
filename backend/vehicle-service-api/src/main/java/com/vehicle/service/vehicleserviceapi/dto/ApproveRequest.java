package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * DTO for approving a service request by the STO admin.
 * Contains additional instructions for the vehicle owner.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveRequest {
    /** Custom message or instructions for the customer (e.g., specific arrival time). */
    private String message;
}