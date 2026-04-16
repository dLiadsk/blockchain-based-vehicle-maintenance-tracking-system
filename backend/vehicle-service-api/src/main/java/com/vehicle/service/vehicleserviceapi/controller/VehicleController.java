package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.VehicleRequest;
import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import com.vehicle.service.vehicleserviceapi.repository.VehicleRepository;
import com.vehicle.service.vehicleserviceapi.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Slf4j
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final BlockchainService blockchainService;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerVehicle(@RequestBody VehicleRequest request, Principal principal) {
        try {
            log.info("Реєстрація авто для користувача: {}", principal.getName());

            // 1. Шукаємо користувача в базі за email (який ми витягли з токена)
            User currentUser = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

            // 2. Записуємо в блокчейн
            String txHash = blockchainService.registerVehicle(request.getVin(), "PASSPORT_HASH_" + request.getVin());

            // 3. Створюємо об'єкт Vehicle зі зв'язком на власника
            Vehicle vehicle = new Vehicle();
            vehicle.setVin(request.getVin());
            vehicle.setBrand(request.getBrand());
            vehicle.setModel(request.getModel());
            vehicle.setOwner(currentUser); // Тепер власник — це той, хто залогінився
            vehicle.setBlockchainTxHash(txHash);

            vehicleRepository.save(vehicle);

            log.info("Авто успішно закріплено за власником: {}", currentUser.getEmail());
            return ResponseEntity.ok(vehicle);

        } catch (Exception e) {
            log.error("Помилка реєстрації: ", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}