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
            // One-way / round-trip distance slabs (₹/km)
            entry("fare.slab1",         "12"),
            entry("fare.slab2",         "11"),
            entry("fare.slab3",         "10"),
            // Flat service charge + GST added to one-way, round-trip & hourly fares
            entry("fare.service_gst",   "148"),
            // Outstation base + per-km, by vehicle class
            entry("fare.outstation.sedan_base",  "1500"),
            entry("fare.outstation.sedan_perkm", "11"),
            entry("fare.outstation.suv_base",    "2000"),
            entry("fare.outstation.suv_perkm",   "14"),
            // Hourly rental: per-minute (<12h), reduced hourly (12h+), fuel ₹/km
            entry("fare.hourly.mini_permin",     "1.5"),
            entry("fare.hourly.mini_reducedhr",  "80"),
            entry("fare.hourly.mini_fuel",       "11"),
            entry("fare.hourly.sedan_permin",    "2"),
            entry("fare.hourly.sedan_reducedhr", "100"),
            entry("fare.hourly.sedan_fuel",      "12"),
            entry("fare.hourly.suv_permin",      "3"),
            entry("fare.hourly.suv_reducedhr",   "160"),
            entry("fare.hourly.suv_fuel",        "14"),
            // Airport transfer per-km bands (≤30, 30-50, 50-100, 100-150, 150-200, 200+)
            entry("fare.airport.b1",    "33"),
            entry("fare.airport.b2",    "30"),
            entry("fare.airport.b3",    "27"),
            entry("fare.airport.b4",    "24"),
            entry("fare.airport.b5",    "22"),
            entry("fare.airport.b6",    "20"),
            entry("stats.happy_riders", "5000"),
            entry("stats.drivers",      "150"),
            entry("stats.cities",       "20"),
            entry("contact.phone",      "+91 99999 99999"),
            entry("contact.whatsapp",   ""),
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
