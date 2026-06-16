package com.rahicabs.config;

import com.rahicabs.entity.Role;
import com.rahicabs.entity.User;
import com.rahicabs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!userRepository.existsByEmail("admin@rahicabs.com")) {
            User admin = new User();
            admin.setName("Admin");
            admin.setEmail("admin@rahicabs.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setPhone("9999999999");
            admin.setRole(Role.ADMIN);
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);
            log.info("Default admin created: admin@rahicabs.com / admin123");
        }
    }
}
