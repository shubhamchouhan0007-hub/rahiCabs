package com.rahicabs.repository;

import com.rahicabs.entity.DriverProfile;
import com.rahicabs.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {
    Optional<DriverProfile> findByUser(User user);
    List<DriverProfile> findByIsAvailableTrue();
}
