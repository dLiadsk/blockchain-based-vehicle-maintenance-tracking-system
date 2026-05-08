package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.JwtResponse;
import com.vehicle.service.vehicleserviceapi.dto.LoginRequest;
import com.vehicle.service.vehicleserviceapi.dto.RegisterRequest;
import com.vehicle.service.vehicleserviceapi.dto.UserResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.service.AuthService;
import com.vehicle.service.vehicleserviceapi.service.JwtCore;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    // Нам знадобиться AuthenticationManager для логіну, налаштуємо його в SecurityConfig
    private final AuthenticationManager authenticationManager;
    private final JwtCore jwtCore;
    private final DtoMapper dtoMapper;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@RequestBody RegisterRequest request) {
        User user = authService.registerUser(request);
        return ResponseEntity.ok(dtoMapper.toUserResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Тут Spring сам перевірить пароль і роль, незалежно від того, як юзер потрапив у БД
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtCore.generateToken(auth);
        return ResponseEntity.ok(new JwtResponse(token));
    }
}