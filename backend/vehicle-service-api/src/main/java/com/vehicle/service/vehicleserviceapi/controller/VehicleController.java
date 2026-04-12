package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.VehicleRequest;
import com.vehicle.service.vehicleserviceapi.model.Vehicle;
import com.vehicle.service.vehicleserviceapi.repository.VehicleRepository;
import com.vehicle.service.vehicleserviceapi.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final BlockchainService blockchainService;
    private final VehicleRepository vehicleRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerVehicle(@RequestBody VehicleRequest request) {
        try {
            log.info("Отримано запит на реєстрацію авто: {}", request.getVin());

            // 1. Записуємо в блокчейн (отримуємо хеш транзакції)
            // Як passportHash поки що передамо просто VIN або хеш від моделі
            String txHash = blockchainService.registerVehicle(request.getVin(), "PASSPORT_HASH_" + request.getVin());

            // 2. Створюємо об'єкт для бази даних
            Vehicle vehicle = new Vehicle();
            vehicle.setVin(request.getVin());
            vehicle.setBrand(request.getBrand());
            vehicle.setModel(request.getModel());
            vehicle.setOwnerName(request.getOwnerName());
            vehicle.setBlockchainTxHash(txHash);

            // 3. Зберігаємо в PostgreSQL
            Vehicle savedVehicle = vehicleRepository.save(vehicle);

            log.info("Авто успішно збережено в БД та Блокчейн. ID: {}", savedVehicle.getId());
            return ResponseEntity.ok(savedVehicle);

        } catch (Exception e) {
            log.error("Помилка при реєстрації авто: ", e);
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }
}