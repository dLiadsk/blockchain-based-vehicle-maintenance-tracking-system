package com.vehicle.service.vehicleserviceapi.dto;

import lombok.*;

import java.util.List;

/**
 * Detailed response containing information about a Service Station.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoProfileResponse {
    private Long id;
    private String stationName;
    private String address;
    private String region;
    private String city;
    private String description;
    private List<String> serviceTypes;
}