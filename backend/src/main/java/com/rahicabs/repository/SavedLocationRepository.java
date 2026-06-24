package com.rahicabs.repository;

import com.rahicabs.entity.Customer;
import com.rahicabs.entity.SavedLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedLocationRepository extends JpaRepository<SavedLocation, Long> {
    List<SavedLocation> findByCustomerOrderByCreatedAtDesc(Customer customer);
    void deleteByIdAndCustomer(Long id, Customer customer);
}
