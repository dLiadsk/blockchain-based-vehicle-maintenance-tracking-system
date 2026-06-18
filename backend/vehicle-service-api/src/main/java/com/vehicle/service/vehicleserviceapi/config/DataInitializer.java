package com.vehicle.service.vehicleserviceapi.config;

import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.UserRole;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Configuration class responsible for initial database seeding.
 * Ensures that essential data, like the system administrator, exists on startup.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Seeds the database with default records if they are missing.
     * Use this to set up the initial environment for the application.
     */
    @Bean
    public CommandLineRunner initDatabase() {
        return args -> {
            seedSystemAdmin();
        };
    }

    private void seedSystemAdmin() {
        String adminEmail = "admin@system.com";

        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            log.info("Seeding process: Creating default system administrator...");

            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("supersecure"))
                    .role(UserRole.ROLE_ADMIN)
                    .firstName("System")
                    .lastName("Administrator")
                    .build();

            userRepository.save(admin);
            log.info(">>> Default administrator created: {} / supersecure", adminEmail);
        } else {
            log.debug("Seeding skipped: System administrator already exists.");
        }
    }
}