package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

import java.util.List;

/**
 * Request DTO for finalizing the repair work with a detailed list of items.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkReportRequest {
    private String message;
    private String mechanicName;
    private List<WorkItem> items;
    private Long finalTotalAmount;
}