package com.vehicle.service.vehicleserviceapi.repository;

import com.vehicle.service.vehicleserviceapi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for User entities.
 * Manages authentication credentials and user profile data.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their unique email address.
     * Used primarily for authentication in UserDetailsService.
     *
     * @param email The email to search for.
     * @return An Optional containing the user if found.
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user already exists with the given phone number.
     *
     * @param phoneNumber The phone number to check.
     * @return true if the phone number is already registered.
     */
    boolean existsByPhoneNumber(String phoneNumber);
}