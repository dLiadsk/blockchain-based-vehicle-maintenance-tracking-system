package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestDTO;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.*;
import com.vehicle.service.vehicleserviceapi.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/service-requests")
@RequiredArgsConstructor
public class ServiceRequestController {

    private final ServiceRequestRepository requestRepository;
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final BlockchainService blockchainService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> createRequest(@RequestBody ServiceRequestDTO dto, Principal principal) {
        try {
            User customer = userRepository.findByEmail(principal.getName()).get();
            Vehicle vehicle = vehicleRepository.findByVin(dto.getVin())
                    .orElseThrow(() -> new RuntimeException("Авто не знайдено"));

            // Перевірка власності
            if (!vehicle.getOwner().getId().equals(customer.getId())) {
                return ResponseEntity.status(403).body("Це не ваше авто");
            }

            // Обираємо СТО (наприклад, наше sto_main)
            User sto = userRepository.findById(dto.getStoId())
                    .orElseThrow(() -> new RuntimeException("СТО не знайдено"));

            // 1. Блокчейн
            String txHash = blockchainService.createServiceRequest(dto.getVin(), dto.getDescription());

            // 2. База даних
            ServiceRequest request = new ServiceRequest();
            request.setVehicle(vehicle);
            request.setCustomer(customer);
            request.setSto(sto);
            request.setDescription(dto.getDescription());
            request.setStatus("RequestCreated"); // Відповідає Status.RequestCreated у Solidity
            request.setCreatedAt(LocalDateTime.now());
            request.setBlockchainTxHash(txHash);

            return ResponseEntity.ok(requestRepository.save(request));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Помилка: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getMyRequests(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).get();
        return ResponseEntity.ok(requestRepository.findAllByCustomerId(user.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'STO')")
    public ResponseEntity<?> getRequestDetails(@PathVariable Long id, Principal principal) {
        ServiceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Заявку не знайдено"));

        // Перевірка: або ти власник цієї заявки, або ти СТО, якому вона призначена
        boolean isOwner = request.getCustomer().getEmail().equals(principal.getName());
        boolean isTargetSto = request.getSto().getEmail().equals(principal.getName());

        if (isOwner || isTargetSto) {
            return ResponseEntity.ok(request);
        }

        return ResponseEntity.status(403).body("У вас немає доступу до цієї заявки");
    }
}