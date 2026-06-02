package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import com.vehicle.service.vehicleserviceapi.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST Controller for shared Service Station (STO) data retrieval.
 * Provides public or authenticated endpoints that do not require specific high-level roles.
 * Primarily used for populating STO catalogs and dropdown menus for drivers.
 */
@RestController
@RequestMapping("/api/stos")
@RequiredArgsConstructor
@Slf4j
public class StoProfileController {

    private final AdminService adminService;

    // ============================================================================
    // CATALOG & DROPDOWN ENDPOINTS
    // ============================================================================

    /**
     * Retrieves a complete list of all registered Service Station (STO) profiles.
     * This endpoint is typically consumed by the frontend to render the STO catalog
     * or to populate selection dropdowns during the service request creation process.
     *
     * @return ResponseEntity containing a list of StoProfile entities.
     */
    @GetMapping
    public ResponseEntity<List<StoProfile>> getAllStos() {
        log.info("Action: Fetching all STO profiles for catalog or dropdown display.");
        return ResponseEntity.ok(adminService.getAllStos());
    }
}