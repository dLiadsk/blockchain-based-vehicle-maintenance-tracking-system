package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

import java.util.List;

/**
 * DTO used by STO admins to record technical inspection findings and estimated costs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionRequest {
    private Long totalAmount;
    private Long depositAmount;
    /** Detailed description of technical findings and required spare parts. */
    private String findings;
    private Long currentMileage;
    /**
     * Confirmed list of work types to be performed after inspection.
     */
    private List<String> workTypes;
}