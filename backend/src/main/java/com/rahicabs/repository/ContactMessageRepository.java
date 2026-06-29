package com.rahicabs.repository;

import com.rahicabs.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    List<ContactMessage> findAllByOrderBySentAtDesc();
    long countByIsReadFalse();
}
