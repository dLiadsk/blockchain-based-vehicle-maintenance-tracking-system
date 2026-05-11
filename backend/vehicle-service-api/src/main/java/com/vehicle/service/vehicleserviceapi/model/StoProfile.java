package com.vehicle.service.vehicleserviceapi.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "sto_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String stationName;

    /** General information about the station's expertise and history */
    @Column(columnDefinition = "TEXT")
    private String description;

    /** * List of services offered (e.g., "Engine Repair", "Tire Service", "Diagnostics").
     * Stored in a separate collection table.
     */
    @ElementCollection
    @CollectionTable(name = "sto_services", joinColumns = @JoinColumn(name = "sto_id"))
    @Column(name = "service_type")
    private List<String> serviceTypes;

    private String region;
    private String city;
    private String address;

    @OneToMany(mappedBy = "stoProfile")
    private List<User> admins;
}