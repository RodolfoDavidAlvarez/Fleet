# Complete Notifications Catalog

This document lists all SMS and Email notifications in the Fleet Management System with their content previews.

---

## 📧 EMAIL NOTIFICATIONS

### 1. Booking Confirmation Email
**Trigger:** When a new booking is created  
**Recipients:** Customer  
**Location:** `lib/email.ts` → `sendBookingConfirmationEmail()`

**Subject:** `Booking Confirmed - {bookingId}`

**Content:**
```
Hello {customerName},

Your service booking has been confirmed. Here are the details:

Booking ID: {bookingId}
Service: {serviceType}
Date: {date}
Time: {time}
Vehicle: {vehicleInfo} (if provided)
Notes: {notes} (if provided)

We look forward to serving you!
If you have any questions or need to make changes, please contact us.

Thank you for choosing FleetPro!
```

---

### 2. Booking Reminder Email
**Trigger:** Reminder sent before appointment  
**Recipients:** Customer  
**Location:** `lib/email.ts` → `sendBookingReminderEmail()`

**Subject:** `Reminder: Service Appointment Tomorrow - {date}`

**Content:**
```
Hello {customerName},

This is a reminder that you have a service appointment tomorrow:

Service: {serviceType}
Date: {date}
Time: {time}
Booking ID: {bookingId}

We look forward to seeing you!

Thank you for choosing FleetPro!
```

---

### 3. Booking Status Update Email
**Trigger:** When booking status changes  
**Recipients:** Customer  
**Location:** `lib/email.ts` → `sendStatusUpdateEmail()`

**Subject:** `Booking Status Updated - {statusLabel}`

**Content:**
```
Hello {customerName},

Your booking status has been updated:

Booking ID: {bookingId}
Service: {serviceType} (if provided)
New Status: {statusLabel} (Pending/Confirmed/In Progress/Completed/Cancelled)

Check your booking for more details.

Thank you for choosing FleetPro!
```

---

### 4. Job Completion Email
**Trigger:** When a job is marked as completed with total cost  
**Recipients:** Customer  
**Location:** `lib/email.ts` → `sendJobCompletionEmail()`

**Subject:** `Service Completed - {bookingId}`

**Content:**
```
Hello {customerName},

Your service has been completed successfully. Here are the details:

Service: {serviceType}
Booking ID: {bookingId}
Total Cost: ${totalCost}

Thank you for your business!

Thank you for choosing FleetPro!
```

---

### 5. Repair Request Submission Email
**Trigger:** When a repair request is submitted  
**Recipients:** Driver (if email provided)  
**Supports:** English and Spanish  
**Location:** `lib/email.ts` → `sendRepairSubmissionEmail()`

**Subject (EN):** `Repair Request Received - #{requestId}`  
**Subject (ES):** `Solicitud de Reparación Recibida - #{requestId}`

**Content (English):**
```
Hello {driverName},

We have received your repair request:

Request ID: {requestId}
Summary: {summary}
Urgency: {urgency}

We will contact you soon.

Thank you for using FleetPro!
```

**Content (Spanish):**
```
Hola {driverName},

Hemos recibido su solicitud de reparación:

ID de Solicitud: {requestId}
Resumen: {summary}
Urgencia: {urgency}

Nos pondremos en contacto con usted pronto.

Gracias por usar FleetPro!
```

---

### 6. Repair Booking Link Email
**Trigger:** When a repair request is scheduled and booking link is generated  
**Recipients:** Driver (if email provided)  
**Supports:** English and Spanish  
**Location:** `lib/email.ts` → `sendRepairBookingLinkEmail()`

**Subject (EN):** `Schedule Your Repair - #{requestId}`  
**Subject (ES):** `Agendar Reparación - #{requestId}`

**Content (English):**
```
Hello {driverName},

Please schedule your repair using the following link:

Request ID: {requestId}
Issue: {issueSummary}
Suggested Time: {suggestedSlot} (if provided)

[Schedule Now Button] → {link}

Or copy and paste this link into your browser:
{link}

Thank you for using FleetPro!
```

**Content (Spanish):**
```
Hola {driverName},

Por favor, agende su reparación usando el siguiente enlace:

ID de Solicitud: {requestId}
Motivo: {issueSummary}
Sugerencia: {suggestedSlot} (if provided)

[Agendar Ahora Button] → {link}

O copie y pegue este enlace en su navegador:
{link}

Gracias por usar FleetPro!
```

---

### 7. Repair Completion Email
**Trigger:** When a repair is completed and report is submitted  
**Recipients:** Driver (if email provided)  
**Supports:** English and Spanish  
**Location:** `lib/email.ts` → `sendRepairCompletionEmail()`

**Subject (EN):** `Repair Completed - #{requestId}`  
**Subject (ES):** `Reparación Completada - #{requestId}`

**Content (English):**
```
Hello {driverName},

Your repair has been completed:

Request ID: {requestId}
Summary: {summary}
Total Cost: ${totalCost} (if provided)

Thank you for using FleetPro!
```

**Content (Spanish):**
```
Hola {driverName},

Su reparación ha sido completada:

ID de Solicitud: {requestId}
Resumen: {summary}
Total: ${totalCost} (if provided)

Gracias por usar FleetPro!
```

---

### 8. Admin Notification - New Booking
**Trigger:** When a new booking is created  
**Recipients:** Admin (configured via `ADMIN_EMAIL`)  
**Location:** `lib/email.ts` → `notifyAdminNewBooking()`

**Subject:** `New Booking: {bookingId}`

**Content:**
```
A new booking has been created:

Booking ID: {bookingId}
Customer: {customerName}
Email: {customerEmail} (or "Not provided")
Phone: {customerPhone}
Service: {serviceType}
Date: {date}
Time: {time}
Vehicle: {vehicleInfo} (if provided)

Please review and assign a mechanic if needed.

FleetPro Management System
```

---

### 9. Admin Notification - New Repair Request
**Trigger:** When a repair request is submitted  
**Recipients:** Admins/Mechanics with `notify_on_repair=true` (or fallback to `ADMIN_EMAIL`)  
**Location:** `lib/email.ts` → `notifyAdminNewRepairRequest()`

**Subject:** `[{Urgency}] New Repair Request: {requestId}`

**Content:**
```
A new repair request has been submitted:

Request ID: {requestId}
Driver: {driverName}
Phone: {driverPhone} (if provided)
Email: {driverEmail} (if provided)
Urgency: {urgency}
Vehicle: {vehicleIdentifier} (if provided)
Summary: {summary}

Please review and schedule as needed.

FleetPro Management System
```

---

### 10. Mechanic Assignment Email
**Trigger:** When a job is assigned to a mechanic  
**Recipients:** Mechanic  
**Location:** `lib/email.ts` → `notifyMechanicAssignment()`

**Subject:** `New Job Assignment - {jobId}`

**Content:**
```
Hello {mechanicName},

You have been assigned a new job:

Job ID: {jobId}
Booking ID: {bookingId}
Customer: {customerName}
Service: {serviceType}
Date: {date}
Time: {time}
Priority: {priority}
Vehicle: {vehicleInfo} (if provided)

Please log in to your dashboard to view full details and update the job status.

FleetPro Management System
```

---

### 11. Password Reset Email
**Trigger:** When password reset is requested  
**Recipients:** User requesting reset  
**Location:** `lib/email.ts` → `sendPasswordResetEmail()`

**Subject:** `Password Reset Request - FleetPro`

**Content:**
```
Hello {userName},

We received a request to reset your password. Click the button below to reset it:

[Reset Password Button] → {resetLink}

Or copy and paste this link into your browser:
{resetLink}

⚠️ This link will expire in 1 hour. If you didn't request this, please ignore this email.

If the button doesn't work, copy and paste the link above into your browser.

FleetPro Management System
If you didn't request this, you can safely ignore this email.
```

---

### 12. Invitation Email (Admin Onboarding)
**Trigger:** When admin sends onboarding invitation  
**Recipients:** New admin  
**Location:** `lib/email.ts` → `sendInvitationEmail()`

**Subject:** `Invitation to join FleetPro`

**Content:**
```
Hello,

You have been invited to join FleetPro Management System as an {role}.

After creating your account, it will remain Pending Approval until an administrator reviews and activates it.

Please click the button below to create your account:

[Create Account Button] → {registerLink}

Or copy and paste this link into your browser:
{registerLink}

FleetPro Management System
```

---

### 13. Account Approved Email
**Trigger:** When admin approves a user account  
**Recipients:** Approved user  
**Location:** `lib/email.ts` → `sendAccountApprovedEmail()`

**Subject:** `Account Approved - FleetPro`

**Content:**
```
Hello {name},

Your account has been approved! You can now access the FleetPro Management System as a {role}.

[Log In Button] → {loginLink}

FleetPro Management System
```

---

## 📱 SMS NOTIFICATIONS

### 1. Booking Confirmation SMS
**Trigger:** When a new booking is created  
**Recipients:** Customer (if SMS consent given)  
**Location:** `lib/twilio.ts` → `sendBookingConfirmation()`

**Message:**
```
Your booking has been confirmed!

Service: {serviceType}
Date: {date}
Time: {time}
Booking ID: {bookingId}

Thank you for choosing FleetPro!
```

---

### 2. Booking Reminder SMS
**Trigger:** Reminder sent before appointment  
**Recipients:** Customer  
**Location:** `lib/twilio.ts` → `sendBookingReminder()`

**Message:**
```
Reminder: You have a service appointment tomorrow!

Service: {serviceType}
Date: {date}
Time: {time}

See you soon!
```

---

### 3. Booking Status Update SMS
**Trigger:** When booking status changes  
**Recipients:** Customer  
**Location:** `lib/twilio.ts` → `sendStatusUpdate()`

**Message:**
```
Your booking status has been updated!

Booking ID: {bookingId}
Status: {status}

Check your booking for more details.
```

---

### 4. Job Completion SMS
**Trigger:** When a job is marked as completed  
**Recipients:** Customer  
**Location:** `lib/twilio.ts` → `sendJobCompletion()`

**Message:**
```
Your service is complete!

Service: {serviceType}
Total Cost: ${totalCost}
Booking ID: {bookingId}

Thank you for your business!
```

---

### 5. Repair Request Submission SMS (Driver)
**Trigger:** When a repair request is submitted  
**Recipients:** Driver  
**Supports:** English and Spanish  
**Location:** `lib/twilio.ts` → `sendRepairSubmissionNotice()`

**Message (English):**
```
Repair request received (#{requestId}). Your request has been submitted and will be reviewed soon.
```

**Message (Spanish):**
```
Solicitud de reparación recibida (#{requestId}). Su solicitud ha sido enviada y será revisada pronto.
```

---

### 6. Admin Notification SMS (Repair Request)
**Trigger:** When a repair request is submitted  
**Recipients:** Admins/Mechanics with `notify_on_repair=true` (or fallback to `ADMIN_PHONE_NUMBER`)  
**Location:** `lib/twilio.ts` → `notifyAdminOfRepair()`

**Message:**
```
New repair request #{requestId}
Driver: {driverName} ({driverPhone})
Urgency: {urgency}.
```

---

### 7. Repair Booking Link SMS
**Trigger:** When a repair request is scheduled and booking link is generated  
**Recipients:** Driver  
**Supports:** English and Spanish  
**Location:** `lib/twilio.ts` → `sendRepairBookingLink()`

**Message (English):**
```
Book your repair (#{requestId}): {link}
Issue: {issueSummary}
Suggested: {suggestedSlot} (if provided)
```

**Message (Spanish):**
```
Agenda tu reparación (#{requestId}): {link}
Motivo: {issueSummary}
Sugerencia: {suggestedSlot} (if provided)
```

---

### 8. Repair Completion SMS
**Trigger:** When a repair is completed  
**Recipients:** Driver  
**Supports:** English and Spanish  
**Location:** `lib/twilio.ts` → `sendRepairCompletion()`

**Message (English):**
```
Repair completed (#{requestId}). {summary}
Total: ${totalCost} (if provided)
```

**Message (Spanish):**
```
Reparación completada (#{requestId}). {summary}
Total: ${totalCost} (if provided)
```

---

### 9. Service Record Status Update SMS
**Trigger:** When service record status is updated with notification  
**Recipients:** Driver (linked to repair request)  
**Supports:** English and Spanish  
**Location:** `app/api/service-records/route.ts`

**Message (English):**
```
{driverName}, your repair request is completed and ready for pickup.
```
(Other statuses: "is completed", "is on hold", "is waiting for parts")

**Message (Spanish):**
```
{driverName}, su solicitud de reparación está completada y lista para recoger.
```
(Other statuses: "está completada", "está en espera", "está esperando repuestos")

---

## 📊 SUMMARY STATISTICS

**Total Email Notifications:** 13  
**Total SMS Notifications:** 9  
**Bilingual Support:** 5 notifications (Repair-related)  
**Admin Notifications:** 2 emails, 1 SMS  
**Customer/Driver Notifications:** 11 emails, 8 SMS

---

## 🔧 CONFIGURATION

### Email (Resend)
- **API Key:** `RESEND_API_KEY`
- **From:** `RESEND_FROM_EMAIL` (default: `ralvarez@bettersystems.ai`)
- **Enable:** `ENABLE_EMAIL` (default: true)

### SMS (Twilio)
- **Account SID:** `TWILIO_ACCOUNT_SID`
- **Auth Token:** `TWILIO_AUTH_TOKEN`
- **Phone Number:** `TWILIO_PHONE_NUMBER`
- **Admin Phone:** `ADMIN_PHONE_NUMBER`
- **Enable:** `ENABLE_SMS` (default: false)

