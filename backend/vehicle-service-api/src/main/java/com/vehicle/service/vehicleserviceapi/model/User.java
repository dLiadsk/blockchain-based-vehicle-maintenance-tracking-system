package com.vehicle.service.vehicleserviceapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a system user.
 * Stores personal information, credentials, and role-based access data.
 */
@Entity

@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /** Primary key for the user */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique email address used for login */
    @Column(unique = true, nullable = false)
    private String email;

    /** Hashed password. Ignored in JSON responses for security. */
    @Column(nullable = false)
    @JsonIgnore
    private String password;

    /** Contact phone number */
    private String phoneNumber;

    /** User's given name */
    private String firstName;

    /** User's family name */
    private String lastName;

    /** Security role assigned to the user */
    @Enumerated(EnumType.STRING)
    private UserRole role;

    /**
     * Link to a Service Station profile.
     * Only populated if the user has ROLE_STO.
     */
    @ManyToOne
    @JoinColumn(name = "sto_profile_id")
    private StoProfile stoProfile;
}