package com.vehicle.service.vehicleserviceapi;

import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.UserRole;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class VehicleServiceApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehicleServiceApiApplication.class, args);
    }

    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Створюємо головного Адміна (якщо немає)
            if (userRepository.findByEmail("admin@system.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin@system.com");
                admin.setPassword(passwordEncoder.encode("supersecure"));
                admin.setRole(UserRole.ROLE_ADMIN);
                admin.setFirstName("System");
                admin.setLastName("Administrator");
                userRepository.save(admin);
                System.out.println(">>> Створено супер-адміна: admin@system.com / supersecure");
            }
        };
    }

}
