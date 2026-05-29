package com.vehicle.service.vehicleserviceapi.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IntegrityCheckResponse {
    private boolean valid;
    private String currentFileHash;
    private String originalBlockchainHash;
    private String message;
}