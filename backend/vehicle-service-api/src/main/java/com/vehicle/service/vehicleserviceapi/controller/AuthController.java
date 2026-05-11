package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.JwtResponse;
import com.vehicle.service.vehicleserviceapi.dto.LoginRequest;
import com.vehicle.service.vehicleserviceapi.dto.RegisterRequest;
import com.vehicle.service.vehicleserviceapi.dto.UserResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for public authentication and registration endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final DtoMapper dtoMapper;

    /**
     * Endpoint for user registration.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        log.debug("REST request to register user: {}", request.getEmail());
        User user = authService.registerUser(request);
        return ResponseEntity.ok(dtoMapper.toUserResponse(user));
    }

    /**
     * Endpoint for user login. Returns a JWT if successful.
     */
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@RequestBody LoginRequest request) {
        log.debug("REST request to login: {}", request.getEmail());
        JwtResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}