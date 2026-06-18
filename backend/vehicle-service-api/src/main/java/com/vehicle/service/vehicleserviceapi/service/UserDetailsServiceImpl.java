package com.vehicle.service.vehicleserviceapi.service;

import com.vehicle.service.vehicleserviceapi.model.User;
import com.vehicle.service.vehicleserviceapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Custom implementation of Spring Security's UserDetailsService.
 * Responsible for retrieving user authentication data from the database by email.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Loads a user by their email address to perform authentication.
     *
     * @param email The email address of the user.
     * @return UserDetails object containing credentials and authorities.
     * @throws UsernameNotFoundException if the user is not found in the repository.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Loading user details for authentication: {}", email);

        // Fetch the user from the repository using their email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Authentication failed: User with email {} not found", email);
                    return new UsernameNotFoundException("User with email " + email + " not found");
                });

        // Map the custom User entity to Spring Security's UserDetails implementation
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(user.getRole().toString()))
        );
    }
}