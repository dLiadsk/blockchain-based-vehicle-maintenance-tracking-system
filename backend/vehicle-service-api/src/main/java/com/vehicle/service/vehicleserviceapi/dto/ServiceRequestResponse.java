package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ServiceRequestResponse {
    private Long id;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private String arrivalInstructions;
    private String blockchainTxHash;
    private Long blockchainJobId;
    private String pdfHash;
    private UserResponse customer;
    private StoProfileResponse stoProfile;
    private String vehicleVin;
}