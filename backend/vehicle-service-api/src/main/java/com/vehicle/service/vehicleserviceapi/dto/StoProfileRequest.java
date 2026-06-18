package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for creating or updating a Service Station profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoProfileRequest {
    private String stationName;
    private String address;
    private String region;
    private String city;
    private String description;
    private List<String> serviceTypes;
}