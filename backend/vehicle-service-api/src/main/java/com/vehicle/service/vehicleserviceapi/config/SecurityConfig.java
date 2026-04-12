package com.vehicle.service.vehicleserviceapi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Вимикаємо CSRF (критично для роботи POST-запитів у REST API)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Налаштовуємо доступ
                .authorizeHttpRequests(auth -> auth
                        // Дозволяємо абсолютно всі запити до нашого API
                        .requestMatchers("/api/**").permitAll()
                        // Всі інші запити (якщо будуть) — залишаємо закритими
                        .anyRequest().authenticated()
                );

        return http.build();
    }
}