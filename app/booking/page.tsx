"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { Calendar, Clock, Mail, Phone, Car, CheckCircle, ArrowLeft, Wrench, ShieldCheck, Smartphone, MessageSquare, Zap } from "lucide-react";

const serviceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Engine Repair",
  "Transmission Service",
  "Battery Replacement",
  "General Inspection",
  "Other",
];

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function BookingPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const prefill = {
    repairRequestId: typeof searchParams?.repairRequestId === "string" ? searchParams.repairRequestId : "",
    driverName: typeof searchParams?.driverName === "string" ? searchParams.driverName : "",
    driverPhone: typeof searchParams?.driverPhone === "string" ? searchParams.driverPhone : "",
    driverEmail: typeof searchParams?.driverEmail === "string" ? searchParams.driverEmail : "",
    vehicleInfo: typeof searchParams?.vehicleInfo === "string" ? searchParams.vehicleInfo : "",
    serviceType: typeof searchParams?.serviceType === "string" ? searchParams.serviceType : "",
  };

  const [formData, setFormData] = useState({
    customerName: prefill.driverName || "Alex Carter",
    customerEmail: prefill.driverEmail || "alex@example.com",
    customerPhone: prefill.driverPhone || "+1 (555) 123-4567",
    serviceType: prefill.serviceType || "",
    scheduledDate: "",
    scheduledTime: "",
    vehicleInfo: prefill.vehicleInfo || "2022 Ford F-150 • ABC-1234",
    notes: "",
    smsConsent: true,
    complianceAccepted: false,
  });
  const [linkedRequestId] = useState(prefill.repairRequestId);
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [submittedSnapshot, setSubmittedSnapshot] = useState<typeof formData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusChips = [
    { label: "Service", ready: Boolean(formData.serviceType) },
    { label: "Schedule", ready: Boolean(formData.scheduledDate && formData.scheduledTime) },
    { label: "Consent", ready: formData.complianceAccepted },
    { label: "Repair link", ready: Boolean(linkedRequestId) },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Comprehensive client-side validation before submitting
    const validationErrors: string[] = [];

    if (!formData.customerName || formData.customerName.trim().length === 0) {
      validationErrors.push("Customer name is required");
    }

    if (!formData.customerEmail || formData.customerEmail.trim().length === 0) {
      validationErrors.push("Email address is required");
    } else if (!formData.customerEmail.includes("@") || !formData.customerEmail.includes(".")) {
      validationErrors.push("Please provide a valid email address");
    }

    if (!formData.customerPhone || formData.customerPhone.trim().length === 0) {
      validationErrors.push("Phone number is required");
    } else if (formData.customerPhone.replace(/\D/g, "").length < 6) {
      validationErrors.push("Phone number must be at least 6 digits");
    }

    if (!formData.serviceType || formData.serviceType.trim().length === 0) {
      validationErrors.push("Service type is required");
    }

    if (!formData.scheduledDate || formData.scheduledDate.trim().length === 0) {
      validationErrors.push("Date is required");
    }

    if (!formData.scheduledTime || formData.scheduledTime.trim().length === 0) {
      validationErrors.push("Time is required");
    }

    if (!formData.complianceAccepted) {
      validationErrors.push("Please confirm SMS terms and compliance before booking");
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: formData.customerName.trim(),
          customerEmail: formData.customerEmail.trim(),
          customerPhone: formData.customerPhone.trim(),
          serviceType: formData.serviceType.trim(),
          scheduledDate: formData.scheduledDate.trim(),
          scheduledTime: formData.scheduledTime.trim(),
          vehicleInfo: formData.vehicleInfo?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          smsConsent: formData.smsConsent,
          complianceAccepted: formData.complianceAccepted,
          repairRequestId: linkedRequestId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed validation errors from server if available
        if (data.details) {
          const serverErrors = Object.entries(data.details)
            .map(([field, errors]: [string, any]) => {
              const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase();
              return Array.isArray(errors) ? errors.join(", ") : String(errors);
            })
            .join(". ");
          throw new Error(serverErrors || data.error || "Validation failed");
        }
        throw new Error(data.error || "Failed to create booking");
      }

      setBookingId(data.booking.id);
      setSubmittedSnapshot(formData);
      setSubmitted(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      setError(error instanceof Error ? error.message : "Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 soft-grid flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-700">Confirmed</p>
              <h1 className="text-2xl font-bold text-gray-900">Slot saved</h1>
              <p className="text-sm text-gray-600">SMS confirmation is on its way with HELP/STOP language.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Booking ID</p>
              <p className="font-mono font-semibold text-gray-900 break-all">{bookingId}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Service</p>
              <p className="font-semibold text-gray-900">{submittedSnapshot?.serviceType}</p>
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Schedule</p>
              <p className="font-semibold text-gray-900">
                {submittedSnapshot?.scheduledDate} • {submittedSnapshot?.scheduledTime}
              </p>
            </div>
          </div>

          {linkedRequestId && (
            <div className="rounded-2xl bg-primary-50 border border-primary-100 p-4">
              <p className="text-xs text-primary-700 font-semibold">Linked repair request</p>
              <p className="font-mono font-semibold text-primary-900 break-all">{linkedRequestId}</p>
            </div>
          )}

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              {submittedSnapshot?.customerName} ({submittedSnapshot?.customerEmail}) • {submittedSnapshot?.customerPhone}
            </p>
            {submittedSnapshot?.vehicleInfo && <p className="text-sm text-gray-600 mt-1">Vehicle: {submittedSnapshot.vehicleInfo}</p>}
            <p className="text-xs text-gray-500 mt-3">
              SMS consent: {submittedSnapshot?.smsConsent ? "opted in" : "declined"} • Compliance acknowledged
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back home
            </Link>
            <Link href="/compliance" className="inline-flex items-center text-gray-700 hover:text-gray-900 font-semibold">
              Read SMS compliance
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 soft-grid">
      <nav className="bg-white/80 backdrop-blur-md border-b border-primary-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900">FleetPro</span>
            </Link>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Link href="/compliance" className="text-gray-700 hover:text-primary-700">
                SMS Compliance
              </Link>
              <Link href="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md">
                ← Back home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <div className="pill">
              <ShieldCheck className="h-4 w-4 text-primary-700" />
              Consent-first booking
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Book service without friction</h1>
            <p className="text-gray-600">Short, mobile-ready form. We capture consent and ship a clear HELP/STOP SMS automatically.</p>
            {linkedRequestId && (
              <div className="inline-flex items-center gap-2 text-sm text-primary-800 bg-primary-50 border border-primary-100 px-3 py-2 rounded-xl">
                <Wrench className="h-4 w-4" />
                Linked to repair request {linkedRequestId.slice(0, 8)}...
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusChips.map(({ label, ready }) => (
              <span key={label} className={`pill ${ready ? "border-green-200 text-green-800 bg-green-50" : "border-slate-200 bg-white"}`}>
                <CheckCircle className={`h-4 w-4 ${ready ? "text-green-600" : "text-slate-400"}`} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="tile p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
                <Zap className="h-4 w-4 text-primary-600" />
                Lightning booking
              </div>
              <span className="pill bg-primary-50 border-primary-100 text-primary-800">
                <MessageSquare className="h-4 w-4" />
                SMS-ready copy
              </span>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold">Name</span>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Alex Carter"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    Email
                  </span>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    required
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="alex@example.com"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    Phone
                  </span>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    required
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="+1 (555) 123-4567"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Wrench className="h-4 w-4 text-primary-600" />
                    Service
                  </span>
                  <select
                    id="serviceType"
                    name="serviceType"
                    required
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select a service</option>
                    {serviceTypes.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {serviceTypes.slice(0, 4).map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => setFormData({ ...formData, serviceType: service })}
                        className={`text-xs px-3 py-2 rounded-lg border ${
                          formData.serviceType === service
                            ? "bg-primary-50 border-primary-200 text-primary-800"
                            : "border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Car className="h-4 w-4 text-primary-600" />
                    Vehicle
                  </span>
                  <input
                    type="text"
                    id="vehicleInfo"
                    name="vehicleInfo"
                    value={formData.vehicleInfo}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="2022 Ford F-150 • ABC-1234"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-primary-600" />
                    Date
                  </span>
                  <input
                    type="date"
                    id="scheduledDate"
                    name="scheduledDate"
                    required
                    value={formData.scheduledDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="input-field"
                  />
                </label>

                <label className="space-y-2 text-sm text-gray-700">
                  <span className="font-semibold inline-flex items-center gap-1">
                    <Clock className="h-4 w-4 text-primary-600" />
                    Time
                  </span>
                  <select
                    id="scheduledTime"
                    name="scheduledTime"
                    required
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="input-field mb-3"
                  >
                    <option value="">Select a time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setFormData({ ...formData, scheduledTime: time })}
                        className={`text-xs px-3 py-2 rounded-lg border ${
                          formData.scheduledTime === time
                            ? "bg-primary-50 border-primary-200 text-primary-800"
                            : "border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <label className="space-y-2 text-sm text-gray-700 block">
                <span className="font-semibold">Notes</span>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input-field resize-none"
                  placeholder="Quick context to keep the crew efficient..."
                />
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <input
                    id="smsConsent"
                    name="smsConsent"
                    type="checkbox"
                    checked={formData.smsConsent}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold">SMS updates</p>
                    <p className="text-gray-600">Reply STOP to opt out, HELP for help. Standard rates apply.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white">
                  <input
                    id="complianceAccepted"
                    name="complianceAccepted"
                    type="checkbox"
                    checked={formData.complianceAccepted}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded"
                    required
                  />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold">Consent and privacy</p>
                    <p className="text-gray-600">
                      We only send operational SMS. Read the{" "}
                      <Link href="/compliance" className="text-primary-700 font-semibold">
                        compliance note
                      </Link>
                      .
                    </p>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5" />
                    Book appointment
                  </>
                )}
              </button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="tile p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary-700" />
                <p className="text-sm font-semibold text-gray-900">Your snapshot</p>
              </div>
              <p className="text-sm text-gray-700">
                {formData.customerName || "Name pending"} • {formData.customerPhone || "Phone pending"}
              </p>
              <p className="text-sm text-gray-700">
                {formData.serviceType || "Service pending"} {formData.vehicleInfo && `• ${formData.vehicleInfo}`}
              </p>
              <p className="text-sm text-gray-700">
                {formData.scheduledDate || "Date"} {formData.scheduledTime && `• ${formData.scheduledTime}`}
              </p>
              <p className="text-xs text-gray-500">
                SMS: {formData.smsConsent ? "opted in" : "declined"} • Compliance: {formData.complianceAccepted ? "acknowledged" : "pending"}
              </p>
            </div>

            <div className="card-surface rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">What happens next</h3>
              <p className="text-sm text-gray-700">1) We text you confirmation.</p>
              <p className="text-sm text-gray-700">2) Admin assigns a mechanic and shares status.</p>
              <p className="text-sm text-gray-700">3) Reply to adjust timing anytime.</p>
            </div>

            <div className="card-surface rounded-2xl p-6 space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Need a rush slot?</h3>
              <p className="text-sm text-gray-700">Call dispatch with your booking ID after you submit.</p>
              <a href="tel:+15551234567" className="text-primary-700 font-semibold">
                +1 (555) 123-4567
              </a>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
