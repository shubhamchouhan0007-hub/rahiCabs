package com.rahicabs.entity;

public enum BookingStatus {
    PENDING_PAYMENT,
    PENDING,
    CONFIRMED,     // paid / ready, awaiting driver assignment
    ASSIGNED,      // admin assigned a driver — awaiting driver accept/reject
    ACCEPTED,      // driver accepted — awaiting ride start (OTP)
    IN_PROGRESS,   // ride started (start OTP verified)
    COMPLETED,
    CANCELLED
}
