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
 * Controller for high-level administrative operations.
 * Restricted to users with the 'ADMIN' role.
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

    /**
     * Creates a new Service Station (STO) profile in the system.
     *
     * @param request Data transfer object containing STO details.
     * @return The created StoProfile entity.
     */
    @PostMapping("/create-sto-profile")
    public ResponseEntity<StoProfile> createStoProfile(@RequestBody StoProfileRequest request) {
        log.info("Admin Action: Creating new STO profile with name: {}", request.getStationName());
        StoProfile profile = authService.createStoProfile(request);
        return ResponseEntity.ok(profile);
    }

    /**
     * Registers a new administrator for a specific STO profile.
     *
     * @param request Data transfer object containing admin credentials and STO ID.
     * @return UserResponse containing the registered admin's details.
     */
    @PostMapping("/register-sto-admin")
    public ResponseEntity<UserResponse> registerStoAdmin(@RequestBody StoAdminRequest request) {
        log.info("Admin Action: Registering new STO admin for email: {}", request.getEmail());
        User admin = authService.registerStoAdmin(request);
        return ResponseEntity.ok(dtoMapper.toUserResponse(admin));
    }

    @GetMapping("/sto-admins")
    public ResponseEntity<List<UserResponse>> getAllStoAdmins() {
        return ResponseEntity.ok(adminService.getAllStoAdmins());
    }

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(adminService.getAllVehicles());
    }

    @GetMapping("/requests")
    public ResponseEntity<List<ServiceRequestResponse>> getAllRequests() {
        return ResponseEntity.ok(adminService.getAllRequests());
    }
}