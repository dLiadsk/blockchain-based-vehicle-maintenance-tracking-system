package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestResponse;
import com.vehicle.service.vehicleserviceapi.dto.UserResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import com.vehicle.service.vehicleserviceapi.model.UserRole;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.repository.ServiceRequestRepository;
import com.vehicle.service.vehicleserviceapi.repository.StoProfileRepository;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import com.vehicle.service.vehicleserviceapi.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ServiceRequestRepository requestRepository;
    private final DtoMapper dtoMapper;
    private final StoProfileRepository stoProfileRepository;

    @Transactional(readOnly = true)
    public List<StoProfile> getAllStos() {
        return stoProfileRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllStoAdmins() {
        log.debug("Fetching all STO administrators");
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.ROLE_STO)
                .map(dtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Vehicle> getAllVehicles() {
        log.debug("Fetching all registered vehicles");
        return vehicleRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getAllRequests() {
        log.debug("Fetching all service requests");
        return requestRepository.findAll().stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList());
    }
}