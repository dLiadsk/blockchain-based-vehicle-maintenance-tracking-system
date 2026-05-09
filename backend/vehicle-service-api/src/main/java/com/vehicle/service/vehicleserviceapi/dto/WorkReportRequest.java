package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

import java.util.List;

@Data
public class WorkReportRequest {
    private List<WorkItem> items;
    private Long finalTotalAmount;
    private String warrantyInfo; // Інформація про гарантію
}