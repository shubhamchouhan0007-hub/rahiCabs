package com.rahicabs.service;

import com.rahicabs.dto.*;
import com.rahicabs.entity.*;
import com.rahicabs.repository.*;
import com.rahicabs.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SavedLocationRepository savedLocationRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final OtpService otpService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public CustomerJwtResponse loginWithOtp(String phoneNumber, String otp) {
        // Verify OTP
        ApiResponse otpVerifyResult = otpService.verifyOtp(phoneNumber, otp);
        if (!otpVerifyResult.isSuccess()) {
            throw new RuntimeException(otpVerifyResult.getMessage());
        }

        // Check if customer exists
        Customer customer = customerRepository.findByPhoneNumber(phoneNumber).orElse(null);
        boolean isNewUser = false;

        if (customer == null) {
            // Create new customer
            customer = Customer.builder()
                    .phoneNumber(phoneNumber)
                    .fullName("Customer") // Will be updated later
                    .authType(AuthType.OTP)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();
            customerRepository.save(customer);
            isNewUser = true;
        }

        // Update last login
        customer.setLastLogin(LocalDateTime.now());
        customerRepository.save(customer);

        // Generate JWT token
        String token = jwtTokenProvider.generateCustomerToken(customer);

        // Invalidate OTP
        otpService.invalidateOtp(phoneNumber);

        return new CustomerJwtResponse(
                token,
                customer.getId(),
                customer.getFullName(),
                customer.getPhoneNumber(),
                customer.getEmail(),
                isNewUser
        );
    }

    @Transactional
    public Customer getOrCreateCustomer(String phoneNumber, String fullName, String email) {
        Customer customer = customerRepository.findByPhoneNumber(phoneNumber).orElse(null);

        if (customer == null) {
            customer = Customer.builder()
                    .phoneNumber(phoneNumber)
                    .fullName(fullName)
                    .email(email)
                    .authType(AuthType.OTP)
                    .accountStatus(AccountStatus.ACTIVE)
                    .build();
            customerRepository.save(customer);
        } else {
            // Update customer details if they changed
            boolean updated = false;
            if (fullName != null && !fullName.equals(customer.getFullName())) {
                customer.setFullName(fullName);
                updated = true;
            }
            if (email != null && !email.equals(customer.getEmail())) {
                customer.setEmail(email);
                updated = true;
            }
            if (updated) {
                customerRepository.save(customer);
            }
        }

        return customer;
    }

    public Map<String, Object> getCustomerProfile(Customer customer) {
        long totalBookings = bookingRepository.findByCustomerOrderByCreatedAtDesc(customer).size();
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", customer.getId());
        profile.put("customerCode", customer.getCustomerCode());
        profile.put("fullName", customer.getFullName());
        profile.put("phoneNumber", customer.getPhoneNumber());
        profile.put("email", customer.getEmail());
        profile.put("authType", customer.getAuthType());
        profile.put("accountStatus", customer.getAccountStatus());
        profile.put("createdAt", customer.getCreatedAt());
        profile.put("lastLogin", customer.getLastLogin());
        profile.put("totalBookings", totalBookings);
        
        return profile;
    }

    @Transactional
    public ApiResponse updateProfile(Customer customer, String fullName, String email) {
        if (fullName != null && !fullName.isBlank()) {
            customer.setFullName(fullName);
        }
        if (email != null && !email.isBlank()) {
            customer.setEmail(email);
        }
        customerRepository.save(customer);
        return ApiResponse.ok("Profile updated successfully");
    }

    // Saved Locations
    public List<SavedLocation> getSavedLocations(Customer customer) {
        return savedLocationRepository.findByCustomerOrderByCreatedAtDesc(customer);
    }

    @Transactional
    public SavedLocation addSavedLocation(Customer customer, SavedLocationRequest request) {
        SavedLocation location = SavedLocation.builder()
                .customer(customer)
                .label(request.getLabel())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .build();
        return savedLocationRepository.save(location);
    }

    @Transactional
    public ApiResponse deleteSavedLocation(Long locationId, Customer customer) {
        savedLocationRepository.deleteByIdAndCustomer(locationId, customer);
        return ApiResponse.ok("Location deleted successfully");
    }

    // Booking History
    public List<BookingResponse> getBookingHistory(Customer customer) {
        return bookingRepository.findByCustomerOrderByCreatedAtDesc(customer)
                .stream()
                .map(BookingResponse::from)
                .collect(Collectors.toList());
    }

    // Payment History
    public List<Payment> getPaymentHistory(Customer customer) {
        return paymentRepository.findByCustomerOrderByCreatedAtDesc(customer);
    }
}
