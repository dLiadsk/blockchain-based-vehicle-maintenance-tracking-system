package com.vehicle.service.vehicleserviceapi.mapper;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.model.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

/**
 * Utility component responsible for mapping internal JPA Entities to public-facing Data Transfer Objects (DTOs).
 * Ensures that sensitive entity data is hidden and that complex relationships are flattened for API responses.
 * Includes mapping for blockchain metadata, financial data, and cryptographic document hashes.
 */
@Component
public class DtoMapper {

    // ============================================================================
    // USER & STO PROFILES
    // ============================================================================

    /**
     * Converts a User entity to a safe UserResponse DTO, omitting passwords and sensitive data.
     *
     * @param user The internal User JPA entity.
     * @return The public-facing UserResponse DTO, or null if input is null.
     */
    public UserResponse toUserResponse(User user) {
        if (user == null) return null;

        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .stoProfile(user.getStoProfile() != null ? toStoResponse(user.getStoProfile()) : null)
                .build();
    }

    /**
     * Converts a StoProfile entity to a StoProfileResponse DTO.
     *
     * @param profile The internal StoProfile JPA entity.
     * @return The public-facing StoProfileResponse DTO, or null if input is null.
     */
    public StoProfileResponse toStoResponse(StoProfile profile) {
        if (profile == null) return null;

        return StoProfileResponse.builder()
                .id(profile.getId())
                .stationName(profile.getStationName())
                .address(profile.getAddress())
                .city(profile.getCity())
                .region(profile.getRegion())
                .description(profile.getDescription())
                .serviceTypes(profile.getServiceTypes())
                .build();
    }

    // ============================================================================
    // CORE BUSINESS LOGIC (SERVICE REQUESTS & VEHICLES)
    // ============================================================================

    /**
     * Converts a complex ServiceRequest entity into a comprehensive ServiceRequestResponse DTO.
     * Maps all related entities, blockchain metadata, and nested status history.
     *
     * @param request The internal ServiceRequest JPA entity.
     * @return The comprehensive ServiceRequestResponse DTO, or null if input is null.
     */
    public ServiceRequestResponse toServiceRequestResponse(ServiceRequest request) {
        if (request == null) return null;

        return ServiceRequestResponse.builder()
                // Basic Info
                .id(request.getId())
                .description(request.getDescription())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .arrivalInstructions(request.getArrivalInstructions())
                .mechanic(request.getMechanic())
                .workTypes(request.getWorkTypes())
                .mileage(request.getMileage())

                // Blockchain Metadata
                .blockchainJobId(request.getBlockchainJobId())
                .blockchainTxHash(request.getBlockchainTxHash())

                // Financial Data
                .totalAmount(request.getTotalAmount())
                .depositAmount(request.getDepositAmount())

                // Document Audit Trail (SHA-256 Hashes)
                .pdfHash(request.getPdfHash())
                .inspectionPdfHash(request.getInspectionPdfHash())
                .paymentReceiptPdfHash(request.getPaymentReceiptPdfHash())
                .workReportPdfHash(request.getWorkReportPdfHash())
                .finalReceiptPdfHash(request.getFinalReceiptPdfHash())

                // Linked Entities
                .vehicle(request.getVehicle() != null ? toVehicleResponse(request.getVehicle()) : null)
                .customer(toUserResponse(request.getCustomer()))
                .manager(toUserResponse(request.getManager()))
                .sto(toStoResponse(request.getStoProfile()))

                // Status History (Audit Trail for Frontend Timeline)
                .statusHistory(request.getStatusHistory() != null ?
                        request.getStatusHistory().stream()
                                .map(this::toStatusHistoryResponse)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

    /**
     * Converts a Vehicle entity to a VehicleResponse DTO.
     *
     * @param vehicle The internal Vehicle JPA entity.
     * @return The public-facing VehicleResponse DTO, or null if input is null.
     */
    public VehicleResponse toVehicleResponse(Vehicle vehicle) {
        if (vehicle == null) return null;

        return VehicleResponse.builder()
                .vin(vehicle.getVin())
                .brand(vehicle.getBrand())
                .model(vehicle.getModel())
                .year(vehicle.getYear())
                .vehicleType(vehicle.getVehicleType())
                .number(vehicle.getNumber())
                .mileage(vehicle.getMileage())
                .build();
    }

    /**
     * Converts a StatusHistory entity to a StatusHistoryResponse DTO.
     * Extracts timeline events and their corresponding blockchain transaction hashes.
     *
     * @param history The internal StatusHistory JPA entity.
     * @return The public-facing StatusHistoryResponse DTO, or null if input is null.
     */
    public StatusHistoryResponse toStatusHistoryResponse(StatusHistory history) {
        if (history == null) return null;

        return StatusHistoryResponse.builder()
                .id(history.getId())
                .status(history.getStatus())
                .changedAt(history.getChangedAt())
                .blockchainTxHash(history.getBlockchainTxHash())
                .build();
    }
}