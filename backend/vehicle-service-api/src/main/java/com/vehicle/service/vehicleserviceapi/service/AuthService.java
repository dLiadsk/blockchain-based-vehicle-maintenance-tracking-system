package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.dto.RegisterRequest;
import com.vehicle.service.vehicleserviceapi.dto.StoAdminRequest;
import com.vehicle.service.vehicleserviceapi.dto.StoProfileRequest;
import com.vehicle.service.vehicleserviceapi.model.StoProfile;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.UserRole;
import com.vehicle.service.vehicleserviceapi.repository.StoProfileRepository;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final StoProfileRepository stoProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User registerUser(RegisterRequest request) {
        // Перевірка унікальності пошти
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Користувач з такою поштою вже існує");
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new RuntimeException("Цей номер телефону вже використовується");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(UserRole.ROLE_USER);
        user.setStoProfile(null);       

        return userRepository.save(user);
    }

    public StoProfile createStoProfile(StoProfileRequest request) {
        StoProfile profile = new StoProfile();
        profile.setStationName(request.getStationName());
        profile.setAddress(request.getAddress());
        return stoProfileRepository.save(profile);
    }

    public User registerStoAdmin(StoAdminRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Адміністратор з такою поштою вже існує");
        }

        StoProfile profile = stoProfileRepository.findById(request.getStoId())
                .orElseThrow(() -> new RuntimeException("Профіль СТО не знайдено"));

        User admin = new User();
        admin.setEmail(request.getEmail());
        admin.setPassword(passwordEncoder.encode(request.getPassword()));
        admin.setRole(UserRole.ROLE_STO);
        admin.setStoProfile(profile); // Прив'язка до СТО

        return userRepository.save(admin);
    }
}