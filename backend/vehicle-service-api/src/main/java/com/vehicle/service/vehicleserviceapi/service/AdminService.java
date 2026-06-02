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

/**
 * Service implementation for handling high-level administrative management tasks.
 * Optimizes performance across all lookup operations by leveraging read-only transactions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final VehicleRepository vehicleRepository;
    private final ServiceRequestRepository requestRepository;
    private final StoProfileRepository stoProfileRepository;
    private final DtoMapper dtoMapper;

    /**
     * Retrieves a complete list of all registered Service Station (STO) profiles.
     *
     * @return A list containing all StoProfile entities found in the database.
     */
    @Transactional(readOnly = true)
    public List<StoProfile> getAllStos() {
        log.info("Service Action: Executing database fetch for all STO profiles.");
        return stoProfileRepository.findAll();
    }

    /**
     * Fetches all registered system users who possess the 'STO' administrator role
     * and maps them into secure data transfer objects.
     *
     * @return A list of UserResponse DTOs containing STO admin accounts.
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getAllStoAdmins() {
        log.info("Service Action: Executing database fetch and filtering for STO administrators.");
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.ROLE_STO)
                .map(dtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a global list of all registered vehicles across the platform.
     *
     * @return A list containing all Vehicle entities.
     */
    @Transactional(readOnly = true)
    public List<Vehicle> getAllVehicles() {
        log.info("Service Action: Executing database fetch for all registered vehicles.");
        return vehicleRepository.findAll();
    }

    /**
     * Retrieves a global list of all service requests within the platform,
     * mapping each internal entity into a detailed response representation.
     *
     * @return A list of ServiceRequestResponse DTOs mapping the complete lifecycle trail.
     */
    @Transactional(readOnly = true)
    public List<ServiceRequestResponse> getAllRequests() {
        log.info("Service Action: Executing database fetch for all service requests.");
        return requestRepository.findAll().stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList());
    }
}