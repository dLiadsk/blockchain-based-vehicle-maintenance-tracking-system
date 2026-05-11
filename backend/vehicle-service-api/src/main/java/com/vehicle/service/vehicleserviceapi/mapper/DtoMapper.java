package com.vehicle.service.vehicleserviceapi.mapper;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.model.*;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

/**
 * Mapper component for converting Entities to DTOs.
 * Updated to include blockchain metadata, financial data, and status history audit trail.
 */
@Component
public class DtoMapper {

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

    public ServiceRequestResponse toServiceRequestResponse(ServiceRequest request) {
        if (request == null) return null;

        return ServiceRequestResponse.builder()
                .id(request.getId())
                .description(request.getDescription())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .arrivalInstructions(request.getArrivalInstructions())

                // Blockchain Metadata
                .blockchainJobId(request.getBlockchainJobId())
                .blockchainTxHash(request.getBlockchainTxHash())

                // Financial Data
                .totalAmount(request.getTotalAmount())
                .depositAmount(request.getDepositAmount())

                // Document Audit Trail (SHA-256 Hashes)
                .pdfHash(request.getPdfHash()) // Initial request
                .inspectionPdfHash(request.getInspectionPdfHash())
                .paymentReceiptPdfHash(request.getPaymentReceiptPdfHash())
                .workReportPdfHash(request.getWorkReportPdfHash())

                // Linked Entities
                .vehicleVin(request.getVehicle() != null ? request.getVehicle().getVin() : null)
                .customer(toUserResponse(request.getCustomer()))
                .stoProfile(toStoResponse(request.getStoProfile()))

                // Status History (Audit Trail for Frontend Timeline)
                .statusHistory(request.getStatusHistory() != null ?
                        request.getStatusHistory().stream()
                                .map(this::toStatusHistoryResponse)
                                .collect(Collectors.toList()) : Collections.emptyList())
                .build();
    }

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