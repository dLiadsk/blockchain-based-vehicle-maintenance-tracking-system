package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;
import java.util.List;

@Data
public class InspectionRequest {
    private Long totalAmount;
    private Long depositAmount;
    private String findings; // Опис знайдених несправностей та перелік робіт
}