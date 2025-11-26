"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Car, CheckCircle, Gauge, Languages, MapPin, Phone, ShieldCheck, Upload, Wrench } from "lucide-react";
import { RepairRequest } from "@/types";

const dictionary = {
  en: {
    title: "Mobile repair request",
    subtitle: "Snap photos, describe the issue, and we'll triage with AI.",
    driverName: "Driver name",
    driverPhone: "Phone number",
    driverEmail: "Email (optional)",
    vehicleIdentifier: "License plate or VIN",
    location: "Location",
    odometer: "Odometer",
    description: "What happened?",
    urgency: "Urgency",
    photos: "Photos (up to 3)",
    submit: "Submit request",
    submitting: "Sending...",
    successTitle: "Request received",
    successBody: "We logged your repair. You'll get a booking link by SMS.",
    backHome: "Back home",
    openDash: "Open dashboards",
  },
  es: {
    title: "Solicitud de reparación",
    subtitle: "Toma fotos, describe el problema y lo clasificamos con IA.",
    driverName: "Nombre del conductor",
    driverPhone: "Número de teléfono",
    driverEmail: "Correo (opcional)",
    vehicleIdentifier: "Placa o VIN",
    location: "Ubicación",
    odometer: "Odómetro",
    description: "¿Qué sucedió?",
    urgency: "Urgencia",
    photos: "Fotos (máx. 3)",
    submit: "Enviar solicitud",
    submitting: "Enviando...",
    successTitle: "Solicitud recibida",
    successBody: "Guardamos tu reparación. Recibirás un enlace de cita por SMS.",
    backHome: "Volver",
    openDash: "Ver tableros",
  },
};

const urgencyOptions = [
  { value: "low", label: "🟢 Low" },
  { value: "medium", label: "🟡 Medium" },
  { value: "high", label: "🟠 High" },
  { value: "critical", label: "🔴 Critical" },
];

export default function RepairRequestPage() {
  const [language, setLanguage] = useState<"en" | "es">("en");
  const t = useMemo(() => dictionary[language], [language]);

  const [form, setForm] = useState({
    driverName: "",
    driverPhone: "",
    driverEmail: "",
    vehicleIdentifier: "",
    location: "",
    odometer: "",
    description: "",
    urgency: "medium",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<RepairRequest | null>(null);
  const [aiCategory, setAiCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setPhotos(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      fd.append("preferredLanguage", language);
      photos.forEach((file) => fd.append("photos", file));

      const res = await fetch("/api/repair-requests", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit");
      }
      setSubmitted(data.request);
      setAiCategory(data.ai?.category || null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit request");
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
              <p className="text-sm font-semibold text-green-700">{t.successTitle}</p>
              <h1 className="text-2xl font-bold text-gray-900">{submitted.id}</h1>
              <p className="text-sm text-gray-600">{t.successBody}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Driver</p>
              <p className="font-semibold text-gray-900">{submitted.driverName}</p>
              {submitted.driverPhone && <p className="text-xs text-gray-600">{submitted.driverPhone}</p>}
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Issue</p>
              <p className="font-semibold text-gray-900">{submitted.urgency}</p>
              {aiCategory && <p className="text-xs text-primary-700 mt-1">AI: {aiCategory}</p>}
            </div>
            <div className="card-surface rounded-2xl p-4">
              <p className="text-xs text-gray-500">Vehicle</p>
              <p className="font-semibold text-gray-900">{submitted.vehicleIdentifier || "Not provided"}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-sm text-gray-700">{submitted.description}</p>
            {submitted.photoUrls?.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {submitted.photoUrls.map((url) => (
                  <img key={url} src={url} alt="Uploaded" className="h-20 w-20 object-cover rounded-lg border" />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.backHome}
            </Link>
            <Link href="/login" className="inline-flex items-center text-gray-700 hover:text-gray-900 font-semibold">
              {t.openDash}
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
                <Wrench className="h-5 w-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Repair</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage("en")}
                className={`pill ${language === "en" ? "border-primary-200 text-primary-700 bg-primary-50" : ""}`}
              >
                <Languages className="h-4 w-4" /> EN
              </button>
              <button
                onClick={() => setLanguage("es")}
                className={`pill ${language === "es" ? "border-primary-200 text-primary-700 bg-primary-50" : ""}`}
              >
                <Languages className="h-4 w-4" /> ES
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-2">
          <div className="pill">
            <ShieldCheck className="h-4 w-4 text-primary-700" />
            AI triage + SMS booking
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-800">{t.driverName}</span>
              <input
                className="input-field"
                name="driverName"
                value={form.driverName}
                onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-800">{t.driverPhone}</span>
              <div className="relative">
                <Phone className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  className="input-field pl-9"
                  name="driverPhone"
                  value={form.driverPhone}
                  onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                  required
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-800">{t.driverEmail}</span>
              <input
                className="input-field"
                name="driverEmail"
                type="email"
                value={form.driverEmail}
                onChange={(e) => setForm({ ...form, driverEmail: e.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-800">{t.vehicleIdentifier}</span>
              <div className="relative">
                <Car className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  className="input-field pl-9"
                  name="vehicleIdentifier"
                  value={form.vehicleIdentifier}
                  onChange={(e) => setForm({ ...form, vehicleIdentifier: e.target.value })}
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-800">{t.location}</span>
              <div className="relative">
                <MapPin className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  className="input-field pl-9"
                  name="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-800">{t.odometer}</span>
              <div className="relative">
                <Gauge className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  className="input-field pl-9"
                  name="odometer"
                  value={form.odometer}
                  onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                />
              </div>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm font-semibold text-gray-800">{t.description}</span>
            <textarea
              className="input-field"
              rows={4}
              name="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder={language === "es" ? "Ejemplo: Fuga de aceite, olor a quemado..." : "Ex: Oil leak, burning smell..."}
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-800">{t.urgency}</span>
              <select
                className="input-field"
                name="urgency"
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                {urgencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Camera className="h-4 w-4" /> {t.photos}
              </span>
              <input className="input-field" type="file" multiple accept="image/*" onChange={handleFileChange} />
              {previews.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {previews.map((src) => (
                    <img key={src} src={src} alt="Preview" className="h-16 w-16 rounded-lg object-cover border" />
                  ))}
                </div>
              )}
            </label>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full justify-center flex items-center gap-2">
            {submitting ? (
              <>
                <Upload className="h-4 w-4 animate-pulse" />
                {t.submitting}
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4" />
                {t.submit}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
