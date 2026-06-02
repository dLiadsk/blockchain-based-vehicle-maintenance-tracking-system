package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestResponse;
import com.vehicle.service.vehicleserviceapi.dto.StoAdminRequest;
import com.vehicle.service.vehicleserviceapi.dto.StoProfileRequest;
import com.vehicle.service.vehicleserviceapi.dto.UserResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.service.AdminService;
import com.vehicle.service.vehicleserviceapi.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for high-level administrative operations.
 * Provides endpoints for global system monitoring and management.
 * Strict access control: Restricted exclusively to users with the 'ADMIN' role.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final DtoMapper dtoMapper;
    private final AuthService authService;
    private final AdminService adminService;

    // ============================================================================
    // STO MANAGEMENT ENDPOINTS
    // ============================================================================

    /**
     * Creates a new Service Station (STO) profile in the global system.
     *
     * @param request Data Transfer Object containing the STO's physical and operational details.
     * @return ResponseEntity containing the newly created StoProfile entity.
     */
    @PostMapping("/create-sto-profile")
    public ResponseEntity<StoProfile> createStoProfile(@RequestBody StoProfileRequest request) {
        log.info("Admin Action: Creating new STO profile with name: {}", request.getStationName());
        StoProfile profile = authService.createStoProfile(request);
        return ResponseEntity.ok(profile);
    }

    /**
     * Registers a new administrator account linked to a specific STO profile.
     *
     * @param request Data Transfer Object containing admin credentials and the target STO ID.
     * @return ResponseEntity containing the registered admin's safe response details.
     */
    @PostMapping("/register-sto-admin")
    public ResponseEntity<UserResponse> registerStoAdmin(@RequestBody StoAdminRequest request) {
        log.info("Admin Action: Registering new STO admin for email: {}", request.getEmail());
        User admin = authService.registerStoAdmin(request);
        return ResponseEntity.ok(dtoMapper.toUserResponse(admin));
    }

    /**
     * Retrieves a comprehensive list of all STO administrators in the system.
     *
     * @return ResponseEntity containing a list of STO admin response DTOs.
     */
    @GetMapping("/sto-admins")
    public ResponseEntity<List<UserResponse>> getAllStoAdmins() {
        log.info("Admin Action: Fetching all STO administrators.");
        List<UserResponse> admins = adminService.getAllStoAdmins();
        return ResponseEntity.ok(admins);
    }

    // ============================================================================
    // GLOBAL DATA ENDPOINTS
    // ============================================================================

    /**
     * Retrieves a global list of all registered vehicles across the platform.
     *
     * @return ResponseEntity containing a list of all Vehicle entities.
     */
    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        log.info("Admin Action: Fetching all registered vehicles.");
        List<Vehicle> vehicles = adminService.getAllVehicles();
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Retrieves a global list of all service requests, regardless of their current status or assigned STO.
     *
     * @return ResponseEntity containing a list of ServiceRequestResponse DTOs.
     */
    @GetMapping("/requests")
    public ResponseEntity<List<ServiceRequestResponse>> getAllRequests() {
        log.info("Admin Action: Fetching all service requests globally.");
        List<ServiceRequestResponse> requests = adminService.getAllRequests();
        return ResponseEntity.ok(requests);
    }
}