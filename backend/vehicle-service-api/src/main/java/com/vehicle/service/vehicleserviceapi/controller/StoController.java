package com.vehicle.service.vehicleserviceapi.controller;

import com.vehicle.service.vehicleserviceapi.dto.ApproveRequest;
import com.vehicle.service.vehicleserviceapi.dto.ServiceRequestResponse;
import com.vehicle.service.vehicleserviceapi.mapper.DtoMapper;
import com.vehicle.service.vehicleserviceapi.model.*;
import com.vehicle.service.vehicleserviceapi.repository.*;
import com.vehicle.service.vehicleserviceapi.service.BlockchainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sto")
@PreAuthorize("hasRole('STO')")
@RequiredArgsConstructor
@Slf4j
public class StoController {

    private final ServiceRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final BlockchainService blockchainService;
    private final DtoMapper dtoMapper;

    @GetMapping("/requests")
    public ResponseEntity<?> getMyStationRequests(Principal principal) {
        User currentUser = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Адміна не знайдено"));

        List<ServiceRequest> requests = requestRepository.findAllByStoProfileId(currentUser.getStoProfile().getId());

        // 3. Мапимо список сутностей у список чистих DTO
        List<ServiceRequestResponse> responseList = requests.stream()
                .map(dtoMapper::toServiceRequestResponse) // Використовуємо метод конвертації
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseList);
    }

    @PostMapping("/approve/{requestId}")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long requestId,
            @RequestBody ApproveRequest approveDto, // Приймаємо коментар
            Principal principal) {
        try {
            ServiceRequest serviceRequest = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Заявку не знайдено"));

            User currentUser = userRepository.findByEmail(principal.getName()).get();

            // Перевірка власності заявки
            if (!serviceRequest.getStoProfile().getId().equals(currentUser.getStoProfile().getId())) {
                return ResponseEntity.status(403).body("Це не ваша заявка");
            }

            String txHash = blockchainService.adminApprove(serviceRequest.getBlockchainJobId());

            serviceRequest.setStatus("AcceptedByAdmin");
            serviceRequest.setBlockchainTxHash(txHash);

            String fullInstructions = "Адреса СТО: " + serviceRequest.getStoProfile().getAddress() +
                    ". Коментар: " + approveDto.getMessage();

            serviceRequest.setArrivalInstructions(fullInstructions);

            requestRepository.save(serviceRequest);

            return ResponseEntity.ok("Заявку підтверджено. Клієнт отримав інструкції.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/mark-arrival/{requestId}")
    public ResponseEntity<?> markArrival(@PathVariable Long requestId, Principal principal) {
        try {
            ServiceRequest serviceRequest = requestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Заявку не знайдено"));

            User currentUser = userRepository.findByEmail(principal.getName()).get();
            if (!serviceRequest.getStoProfile().getId().equals(currentUser.getStoProfile().getId())) {
                return ResponseEntity.status(403).body("Ви не можете фіксувати прибуття на чужу станцію");
            }

            // Перевірка поточного статусу в БД (логічно фіксувати приїзд тільки після підтвердження)
            if (!"AcceptedByAdmin".equals(serviceRequest.getStatus())) {
                return ResponseEntity.badRequest().body("Заявка ще не підтверджена або вже в роботі");
            }

            String txHash = blockchainService.markArrival(serviceRequest.getBlockchainJobId());

            serviceRequest.setStatus("VehicleArrived");
            serviceRequest.setBlockchainTxHash(txHash);
            requestRepository.save(serviceRequest);

            log.info("Автомобіль для заявки {} прибув. Tx: {}", requestId, txHash);
            return ResponseEntity.ok("Прибуття автомобіля успішно зафіксовано.");
        } catch (Exception e) {
            log.error("Помилка фіксації прибуття: ", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

}