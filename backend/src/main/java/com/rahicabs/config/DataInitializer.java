package com.rahicabs.config;

import com.rahicabs.entity.Role;
import com.rahicabs.entity.User;
import com.rahicabs.repository.AppSettingRepository;
import com.rahicabs.repository.UserRepository;
import com.rahicabs.service.AppSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import static java.util.Map.entry;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppSettingService appSettingService;
    private final AppSettingRepository appSettingRepository;

    @Value("${app.admin.owner-password:Rahi@Admin2026}")
    private String ownerAdminPassword;

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

        if (!userRepository.existsByEmail("shubhamchouhan0007@gmail.com")) {
            User owner = new User();
            owner.setName("Shubham Chouhan");
            owner.setEmail("shubhamchouhan0007@gmail.com");
            owner.setPassword(passwordEncoder.encode(ownerAdminPassword));
            owner.setPhone("9999999999");
            owner.setRole(Role.ADMIN);
            owner.setCreatedAt(LocalDateTime.now());
            userRepository.save(owner);
            log.info("Owner admin created: shubhamchouhan0007@gmail.com / Rahi@Admin2026");
        }

        Map<String, String> defaults = Map.ofEntries(
            entry("fare.per_km",        "11.0"),
            entry("fare.minimum",       "150.0"),
            entry("fare.advance_pct",   "15.0"),
            entry("stats.happy_riders", "5000"),
            entry("stats.drivers",      "150"),
            entry("stats.cities",       "20"),
            entry("contact.phone",      "+91 99999 99999"),
            entry("contact.email",      "info@rahicab.com"),
            entry("banner.enabled",     "false"),
            entry("banner.text",        ""),
            entry("areas",              "Patna,Muzaffarpur,Samastipur,Sitamarhi,Darbhanga,Supaul,Saharsa,Madhepura,Purnia,Araria,Katihar,Kishanganj,Bhagalpur,Gaya,Motihari,Begusarai,Munger,Nalanda")
        );

        defaults.forEach((k, v) -> {
            if (!appSettingRepository.existsById(k)) {
                appSettingService.set(k, v);
            }
        });
    }
}
