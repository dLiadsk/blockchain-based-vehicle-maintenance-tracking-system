package com.vehicle.service.vehicleserviceapi;

import com.vehicle.service.vehicleserviceapi.model.User;
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
            if (userRepository.findByEmail("sto@service.com").isEmpty()) {
                User sto = new User();
                sto.setEmail("sto@service.com");
                sto.setPhoneNumber("+380123456789");
                sto.setFirstName("Головний");
                sto.setLastName("Сервіс");
                sto.setPassword(passwordEncoder.encode("sto12345"));
                sto.setRole("ROLE_STO");
                userRepository.save(sto);
                System.out.println(">>> СТО за замовчуванням створено: sto@service.com / sto12345");
            }
        };
    }

}
