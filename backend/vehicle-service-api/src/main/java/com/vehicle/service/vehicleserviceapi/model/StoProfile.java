package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "sto_profiles")
@Data
public class StoProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String stationName;
    private String address;

    @OneToMany(mappedBy = "stoProfile")
    private List<User> admins; // Список всіх працівників цього СТО
}