package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

@Data
public class ServiceRequestDTO {
    private String vin;        // VIN автомобіля
    private Long stoId;        // ID обраного СТО з бази даних
    private String description; // Опис проблеми
}