package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import com.vehicle.service.vehicleserviceapi.service.AdminService;
import com.vehicle.service.vehicleserviceapi.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api/stos")
@RequiredArgsConstructor
@Slf4j
public class StoProfileController {

    private final AdminService adminService;

    @GetMapping
    public ResponseEntity<List<StoProfile>> getAllStos() {
        log.debug("REST request to get all STOs for dropdown");
        return ResponseEntity.ok(adminService.getAllStos());
    }
}