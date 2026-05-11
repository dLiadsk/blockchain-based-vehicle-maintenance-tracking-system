package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

/**
 * Represents a single line item in a work report (e.g., a specific part or labor hour).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkItem {
    private String description;
    private Integer quantity;
    private Long unitPrice;
    private Long totalPrice;
}