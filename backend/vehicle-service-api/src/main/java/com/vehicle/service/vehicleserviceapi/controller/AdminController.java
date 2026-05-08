package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.StoAdminRequest;
import com.vehicle.service.vehicleserviceapi.dto.StoProfileRequest;
import com.vehicle.service.vehicleserviceapi.dto.UserResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final DtoMapper dtoMapper;
    private final AuthService authService;

    // Створення нової точки СТО (фізичної локації)
    @PostMapping("/create-sto-profile")
    public ResponseEntity<?> createStoProfile(@RequestBody StoProfileRequest request) {
        return ResponseEntity.ok(authService.createStoProfile(request));
    }

    @PostMapping("/register-sto-admin")
    public ResponseEntity<UserResponse> registerStoAdmin(@RequestBody StoAdminRequest request) {
        User admin = authService.registerStoAdmin(request);
        return ResponseEntity.ok(dtoMapper.toUserResponse(admin));
    }
}
