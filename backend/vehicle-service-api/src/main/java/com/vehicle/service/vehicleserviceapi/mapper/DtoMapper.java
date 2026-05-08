package com.vehicle.service.vehicleserviceapi.mapper;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.model.*;
import org.springframework.stereotype.Component;

@Component
public class DtoMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        UserResponse res = new UserResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setFirstName(user.getFirstName());
        res.setLastName(user.getLastName());
        res.setPhoneNumber(user.getPhoneNumber());
        res.setRole(user.getRole().name());

        if (user.getStoProfile() != null) {
            res.setStoProfile(toStoResponse(user.getStoProfile()));
        }
        return res;
    }

    public StoProfileResponse toStoResponse(StoProfile profile) {
        if (profile == null) return null;
        StoProfileResponse res = new StoProfileResponse();
        res.setId(profile.getId());
        res.setStationName(profile.getStationName());
        res.setAddress(profile.getAddress());
        return res;
    }

    public ServiceRequestResponse toServiceRequestResponse(ServiceRequest request) {
        if (request == null) return null;
        ServiceRequestResponse res = new ServiceRequestResponse();
        res.setId(request.getId());
        res.setDescription(request.getDescription());
        res.setStatus(request.getStatus());
        res.setCreatedAt(request.getCreatedAt());
        res.setArrivalInstructions(request.getArrivalInstructions());
        res.setBlockchainTxHash(request.getBlockchainTxHash());
        res.setBlockchainJobId(request.getBlockchainJobId());
        res.setPdfHash(request.getPdfHash());

        if (request.getVehicle() != null) {
            res.setVehicleVin(request.getVehicle().getVin());
        }

        res.setCustomer(toUserResponse(request.getCustomer()));
        res.setStoProfile(toStoResponse(request.getStoProfile()));

        return res;
    }

}