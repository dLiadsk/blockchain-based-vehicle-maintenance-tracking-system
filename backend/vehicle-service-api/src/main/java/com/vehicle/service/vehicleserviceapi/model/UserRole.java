package com.vehicle.service.vehicleserviceapi.model;

/**
 * Enumeration representing the possible roles for users within the system.
 * These roles determine access levels in SecurityConfig.
 */
public enum UserRole {
    /** Regular vehicle owner (Driver) */
    ROLE_USER,

    /** Employee or manager of a Service Station (STO) */
    ROLE_STO,

    /** System administrator with high-level management access */
    ROLE_ADMIN
}