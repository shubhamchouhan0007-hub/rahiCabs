package com.rahicabs.service;

import com.rahicabs.entity.Booking;
import com.rahicabs.entity.DriverProfile;
import com.rahicabs.repository.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SmsService sms;
    private final EmailService email;
    private final DriverProfileRepository driverProfileRepository;

    @Value("${app.admin.phone:}")
    private String adminPhone;

    @Value("${app.admin.email:}")
    private String adminEmail;

    // ── Helpers to extract user contact ──────────────────────────────────────

    private String userPhone(Booking b) {
        if (b.getCustomer()  != null) return b.getCustomer().getPhoneNumber();
        if (b.getClient()    != null) return b.getClient().getPhone();
        return b.getGuestPhone();
    }

    private String userEmail(Booking b) {
        if (b.getCustomer()  != null) return b.getCustomer().getEmail();
        if (b.getClient()    != null) return b.getClient().getEmail();
        return b.getGuestEmail();
    }

    private String userName(Booking b) {
        if (b.getCustomer()  != null) return b.getCustomer().getFullName();
        if (b.getClient()    != null) return b.getClient().getName();
        return b.getGuestName() != null ? b.getGuestName() : "Customer";
    }

    private String fmt(Double fare) {
        return fare != null ? String.format("%.0f", fare) : "0";
    }

    // ── Event: New booking created ────────────────────────────────────────────

    public void onBookingCreated(Booking b) {
        String name  = userName(b);
        String phone = userPhone(b);
        String svc   = b.getServiceType() != null ? b.getServiceType().name().replace('_', ' ') : "";

        // → Admin SMS
        if (adminPhone != null && !adminPhone.isBlank()) {
            sms.send(adminPhone,
                "New RahiCab Booking #" + b.getId() +
                " | " + name + " (" + phone + ")" +
                " | " + b.getPickupLocation() + " to " + b.getDropLocation() +
                " | " + svc + " | Rs." + fmt(b.getFare()));
        }

        // → Admin Email
        String adminBody = "<p>A new booking has been received:</p>"
            + "<div class='row'><span>Booking ID</span><span>#" + b.getId() + "</span></div>"
            + "<div class='row'><span>Customer</span><span>" + name + "</span></div>"
            + "<div class='row'><span>Phone</span><span>" + phone + "</span></div>"
            + "<div class='row'><span>Service</span><span>" + svc + "</span></div>"
            + "<div class='row'><span>Pickup</span><span>" + b.getPickupLocation() + "</span></div>"
            + "<div class='row'><span>Drop</span><span>" + b.getDropLocation() + "</span></div>"
            + "<div class='row'><span>Fare</span><span>Rs." + fmt(b.getFare()) + "</span></div>"
            + "<div class='row'><span>Status</span><span><span class='chip chip-warning'>" + b.getStatus() + "</span></span></div>";
        email.send(adminEmail, "New Booking #" + b.getId() + " — " + name,
            EmailService.wrap("New Booking Received", adminBody));

        // → User SMS confirmation
        if (phone != null) {
            sms.send(phone,
                "Hi " + name + ", your RahiCab booking #" + b.getId() +
                " for " + b.getPickupLocation() + " to " + b.getDropLocation() +
                " is received. We will confirm shortly.");
        }
    }

    // ── Event: Payment confirmed ──────────────────────────────────────────────

    public void onPaymentConfirmed(Booking b) {
        String name    = userName(b);
        String phone   = userPhone(b);
        String uEmail  = userEmail(b);
        String advance = fmt(b.getAdvanceAmount());
        String remain  = fmt(b.getRemainingAmount());
        String total   = fmt(b.getFare());

        // → User SMS
        if (phone != null) {
            sms.send(phone,
                "Payment of Rs." + advance + " confirmed for RahiCab booking #" + b.getId() +
                ". Remaining Rs." + remain + " to be paid on arrival. Thank you!");
        }

        // → User Email receipt
        if (uEmail != null && !uEmail.isBlank()) {
            String body = "<p>Hi " + name + ", your advance payment has been received.</p>"
                + "<div class='row'><span>Booking ID</span><span>#" + b.getId() + "</span></div>"
                + "<div class='row'><span>Route</span><span>" + b.getPickupLocation() + " → " + b.getDropLocation() + "</span></div>"
                + "<div class='row'><span>Total Fare</span><span>Rs." + total + "</span></div>"
                + "<div class='row'><span>Paid Now (15%)</span><span><b>Rs." + advance + "</b></span></div>"
                + "<div class='row'><span>Pay on Arrival</span><span>Rs." + remain + "</span></div>"
                + "<div class='msg-box'>A driver will be assigned to you soon. You'll receive an SMS when your driver is on the way.</div>";
            email.send(uEmail, "Payment Confirmed — RahiCab Booking #" + b.getId(),
                EmailService.wrap("Payment Received ✓", body));
        }
    }

    // ── Event: Driver assigned ────────────────────────────────────────────────

    public void onDriverAssigned(Booking b) {
        String phone  = userPhone(b);
        String uEmail = userEmail(b);
        String name   = userName(b);
        if (b.getDriver() == null) return;

        String driverName  = b.getDriver().getName();
        String driverPhone = b.getDriver().getPhone();
        String vehicleNum  = "N/A";

        Optional<DriverProfile> profile = driverProfileRepository.findByUser(b.getDriver());
        if (profile.isPresent()) vehicleNum = profile.get().getVehicleNumber();

        // → User SMS
        if (phone != null) {
            sms.send(phone,
                "Your RahiCab driver is assigned! " +
                driverName + " | Vehicle: " + vehicleNum +
                " | Call: " + driverPhone +
                " | Booking #" + b.getId());
        }

        // → User Email
        if (uEmail != null && !uEmail.isBlank()) {
            String finalVehicleNum = vehicleNum;
            String body = "<p>Hi " + name + ", your driver has been assigned for booking #" + b.getId() + ".</p>"
                + "<div class='row'><span>Driver Name</span><span><b>" + driverName + "</b></span></div>"
                + "<div class='row'><span>Vehicle Number</span><span>" + finalVehicleNum + "</span></div>"
                + "<div class='row'><span>Driver Phone</span><span>" + driverPhone + "</span></div>"
                + "<div class='row'><span>Pickup</span><span>" + b.getPickupLocation() + "</span></div>"
                + "<div class='row'><span>Drop</span><span>" + b.getDropLocation() + "</span></div>"
                + "<div class='msg-box'>You can call your driver directly. Please be ready at your pickup location on time.</div>";
            email.send(uEmail, "Driver Assigned — RahiCab Booking #" + b.getId(),
                EmailService.wrap("Your Driver is on the Way", body));
        }
    }

    // ── Event: Ride started ───────────────────────────────────────────────────

    public void onRideStarted(Booking b) {
        String phone = userPhone(b);
        String name  = userName(b);
        if (phone != null) {
            sms.send(phone,
                "Hi " + name + ", your RahiCab ride #" + b.getId() +
                " has started! Sit back and enjoy the journey.");
        }
    }

    // ── Event: Ride completed ─────────────────────────────────────────────────

    public void onRideCompleted(Booking b) {
        String phone  = userPhone(b);
        String uEmail = userEmail(b);
        String name   = userName(b);
        String total  = fmt(b.getFare());
        String remain = fmt(b.getRemainingAmount());

        // → User SMS
        if (phone != null) {
            sms.send(phone,
                "Ride complete! Booking #" + b.getId() +
                " | Total fare: Rs." + total +
                " | Pay Rs." + remain + " to driver. Thank you for choosing RahiCab!");
        }

        // → User Email receipt
        if (uEmail != null && !uEmail.isBlank()) {
            String driverName = b.getDriver() != null ? b.getDriver().getName() : "—";
            String body = "<p>Hi " + name + ", thank you for riding with RahiCab!</p>"
                + "<div class='row'><span>Booking ID</span><span>#" + b.getId() + "</span></div>"
                + "<div class='row'><span>Route</span><span>" + b.getPickupLocation() + " → " + b.getDropLocation() + "</span></div>"
                + "<div class='row'><span>Driver</span><span>" + driverName + "</span></div>"
                + "<div class='row'><span>Total Fare</span><span><b>Rs." + total + "</b></span></div>"
                + "<div class='row'><span>Advance Paid</span><span>Rs." + fmt(b.getAdvanceAmount()) + "</span></div>"
                + "<div class='row'><span>Paid to Driver</span><span>Rs." + remain + "</span></div>"
                + "<div class='row'><span>Status</span><span><span class='chip chip-success'>COMPLETED</span></span></div>"
                + "<div class='msg-box'>We hope you had a great experience! Book again anytime at rahicab.com</div>";
            email.send(uEmail, "Ride Receipt — RahiCab Booking #" + b.getId(),
                EmailService.wrap("Ride Completed ✓", body));
        }

        // → Admin SMS
        if (adminPhone != null && !adminPhone.isBlank()) {
            sms.send(adminPhone,
                "Booking #" + b.getId() + " completed. Rs." + total + " earned. Customer: " + name);
        }
    }

    // ── Event: Booking cancelled ──────────────────────────────────────────────

    public void onBookingCancelled(Booking b) {
        String phone  = userPhone(b);
        String uEmail = userEmail(b);
        String name   = userName(b);

        // → User SMS
        if (phone != null) {
            sms.send(phone,
                "Your RahiCab booking #" + b.getId() + " has been cancelled. " +
                "For queries call us or WhatsApp. Sorry for the inconvenience.");
        }

        // → User Email
        if (uEmail != null && !uEmail.isBlank()) {
            String body = "<p>Hi " + name + ", your booking has been cancelled.</p>"
                + "<div class='row'><span>Booking ID</span><span>#" + b.getId() + "</span></div>"
                + "<div class='row'><span>Route</span><span>" + b.getPickupLocation() + " → " + b.getDropLocation() + "</span></div>"
                + "<div class='row'><span>Status</span><span><span class='chip chip-warning'>CANCELLED</span></span></div>"
                + "<div class='msg-box'>If you paid an advance and it was cancelled by us, a refund will be processed within 5-7 business days. Contact support for queries.</div>";
            email.send(uEmail, "Booking Cancelled — RahiCab #" + b.getId(),
                EmailService.wrap("Booking Cancelled", body));
        }
    }
}
