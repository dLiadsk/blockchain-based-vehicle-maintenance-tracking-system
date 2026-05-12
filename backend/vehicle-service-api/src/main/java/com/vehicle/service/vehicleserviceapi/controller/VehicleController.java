package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestResponse;
import com.vehicle.service.vehicleserviceapi.dto.VehicleRequest;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.ServiceRequest;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for vehicle management.
 * Provides endpoints for users to register and view their vehicles.
 */
@Slf4j
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final DtoMapper dtoMapper;

    /**
     * Registers a vehicle to the currently authenticated user.
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Vehicle> registerVehicle(@RequestBody VehicleRequest request, Principal principal) {
        log.debug("REST request to register vehicle: {}", request.getVin());
        try {
            Vehicle vehicle = vehicleService.registerNewVehicle(request, principal.getName());
            return ResponseEntity.ok(vehicle);
        } catch (Exception e) {
            log.error("Failed to register vehicle: ", e);
            // In professional apps, we would use an ExceptionHandler for this.
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Returns a list of vehicles owned by the current user.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Vehicle>> getMyVehicles(Principal principal) {
        log.debug("REST request to fetch my vehicles: {}", principal.getName());
        List<Vehicle> vehicles = vehicleService.getVehiclesByOwner(principal.getName());
        return ResponseEntity.ok(vehicles);
    }
    /**
     * Retrieves general vehicle information.
     */
    @GetMapping("/{vin}")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<Vehicle> getVehicleDetails(@PathVariable String vin) {
        return ResponseEntity.ok(vehicleService.getVehicleByVin(vin));
    }

    /**
     * Retrieves the full maintenance and repair history for a specific vehicle.
     * Essential for verifying service records via blockchain-backed audit trail.
     */
    @GetMapping("/{vin}/history")
    @PreAuthorize("hasAnyRole('USER', 'STO', 'ADMIN')")
    public ResponseEntity<List<ServiceRequestResponse>> getVehicleHistory(@PathVariable String vin) {
        List<ServiceRequest> history = vehicleService.getVehicleServiceHistory(vin);
        return ResponseEntity.ok(history.stream()
                .map(dtoMapper::toServiceRequestResponse)
                .collect(Collectors.toList()));
    }
}