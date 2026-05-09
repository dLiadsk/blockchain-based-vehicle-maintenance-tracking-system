package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;

@Data
public class WorkItem {
    private String description; // Назва деталі або послуги
    private Integer quantity;   // Кількість
    private Long unitPrice;     // Ціна за одиницю
    private Long totalPrice;    // Загальна сума за позицію
}