package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.*;
import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.UserRole;
import com.vehicle.service.vehicleserviceapi.repository.StoProfileRepository;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service responsible for user authentication, registration,
 * and management of STO profiles and their administrators.
 * Part of the "Blockchain-based Vehicle Maintenance Tracking System".
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtCore jwtCore;
    private final StoProfileRepository stoProfileRepository;

    /**
     * Authenticates a user and generates a JWT.
     *
     * @param request Login credentials (email and password).
     * @return JwtResponse containing the generated access token.
     */
    public JwtResponse login(LoginRequest request) {
        log.info("Authentication attempt for email: {}", request.getEmail());

        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = jwtCore.generateToken(auth);
        log.info("User {} successfully authenticated", request.getEmail());

        return new JwtResponse(token);
    }

    /**
     * Registers a new regular user (Driver) in the system.
     *
     * @param request Registration details.
     * @return The saved User entity.
     */
    @Transactional
    public User registerUser(RegisterRequest request) {
        log.info("Attempting to register new user: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Registration failed: Email {} is already taken", request.getEmail());
            throw new RuntimeException("Email already registered");
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            log.warn("Registration failed: Phone number {} is already in use", request.getPhoneNumber());
            throw new RuntimeException("Phone number already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(UserRole.ROLE_USER)
                .build();

        return userRepository.save(user);
    }

    /**
     * Creates a new Service Station (STO) profile.
     *
     * @param request STO profile details.
     * @return The saved StoProfile entity.
     */
    @Transactional
    public StoProfile createStoProfile(StoProfileRequest request) {
        log.info("Creating new STO profile: {}", request.getStationName());

        StoProfile profile = StoProfile.builder()
                .stationName(request.getStationName())
                .address(request.getAddress())
                .city(request.getCity())
                .region(request.getRegion())
                .description(request.getDescription())
                .serviceTypes(request.getServiceTypes())
                .build();

        return stoProfileRepository.save(profile);
    }

    /**
     * Registers a new administrator and links them to a specific STO profile.
     *
     * @param request Admin credentials and associated STO ID.
     * @return The saved administrator User entity.
     */
    @Transactional
    public User registerStoAdmin(StoAdminRequest request) {
        log.info("Registering STO admin for station ID: {}", request.getStoId());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.error("Admin registration failed: Email {} already exists", request.getEmail());
            throw new RuntimeException("Administrator with this email already exists");
        }

        StoProfile profile = stoProfileRepository.findById(request.getStoId())
                .orElseThrow(() -> {
                    log.error("Admin registration failed: STO profile ID {} not found", request.getStoId());
                    return new RuntimeException("STO profile not found");
                });

        User admin = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.ROLE_STO)
                .stoProfile(profile)
                .build();

        return userRepository.save(admin);
    }
}