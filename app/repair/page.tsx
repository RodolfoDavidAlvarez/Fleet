"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle, Languages, Phone, ShieldCheck, Upload, Wrench } from "lucide-react";
import { RepairRequest } from "@/types";

const dictionary = {
  en: {
    title: "Repair Request Form",
    subtitle: "Please fill out the details below.",
    driverName: "Name *",
    driverPhone: "Phone Number *",
    makeModel: "Make and Model",
    vehicleIdentifier: "Vehicle Number",
    odometer: "Current mileage (if vehicle)",
    division: "Division *",
    vehicleType: "Type of vehicle *",
    isImmediate: "Requires immediate action?",
    description: "Describe the problem in detail",
    date: "Date",
    photos: "Take a photo of the problem",
    smsConsent: "I agree to receive SMS updates about my repair request",
    smsConsentRequired: "Please agree to SMS updates to submit",
    submit: "Submit",
    submitting: "Submitting...",
    successTitle: "Request received",
    successBody: "Thank you, we will be in contact soon.",
    backHome: "Back home",
    openDash: "Open dashboards",
    selectOne: "Please Select",
  },
  es: {
    title: "Solicitud de Reparación",
    subtitle: "Por favor complete los detalles a continuación.",
    driverName: "Nombre *",
    driverPhone: "Número de telefono *",
    makeModel: "Marca y modelo",
    vehicleIdentifier: "Numero del vehiculo",
    odometer: "Millas actuales (si aplica)",
    division: "Division *",
    vehicleType: "Tipo de vehiculo *",
    isImmediate: "¿Requiere acción inmediata?",
    description: "Describa el problema con lujo de detalles",
    date: "Fecha",
    photos: "Tome foto de el problema",
    smsConsent: "Acepto recibir actualizaciones por SMS sobre mi solicitud",
    smsConsentRequired: "Por favor acepte las actualizaciones por SMS",
    submit: "Enviar",
    submitting: "Enviando...",
    successTitle: "Solicitud recibida",
    successBody: "Gracias, estaremos en contacto pronto.",
    backHome: "Volver",
    openDash: "Ver tableros",
    selectOne: "Por favor seleccione",
  },
};

// Loading Screen Component with smooth fade transition
function LoadingScreen({ isExiting }: { isExiting: boolean }) {
  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center z-50 transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-8 animate-fade-in-up">
        {/* Logo - appears immediately */}
        <div className="relative">
          {/* Outer spinning ring - starts slow, speeds up */}
          <div className="absolute -inset-8 flex items-center justify-center">
            <div className="w-48 h-48 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute w-48 h-48 border-4 border-transparent border-t-indigo-600 border-r-purple-600 rounded-full animate-spin-accelerate"></div>
          </div>

          {/* Middle ring - accelerating reverse */}
          <div className="absolute -inset-6 flex items-center justify-center">
            <div className="w-40 h-40 border-2 border-purple-100 rounded-full"></div>
            <div className="absolute w-40 h-40 border-2 border-transparent border-b-purple-500 border-l-pink-500 rounded-full animate-spin-accelerate-reverse"></div>
          </div>

          {/* Better Systems AI Logo - sharp and clear */}
          <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-2xl ring-4 ring-indigo-100">
            <img
              src="/better-systems-ai-logo.png"
              alt="Better Systems AI"
              className="w-24 h-24 object-contain"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>

          {/* Glowing pulse effect */}
          <div className="absolute inset-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-pulse-glow"></div>
        </div>

        {/* Loading text */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
          <p className="text-lg font-semibold text-gray-700 mb-1">Loading</p>
          <p className="text-sm text-gray-500">Preparing your form...</p>
        </div>

        {/* Accelerating progress bar */}
        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden shadow-inner" style={{ animationDelay: '300ms' }}>
          <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 animate-loading-bar-accelerate rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

const divisionOptions = [
  "Construction",
  "Maintenance",
  "SSW",
  "UFE",
  "Tree",
  "Salvage",
  "Enhancements",
  "Development",
  "Office/Sales",
  "Misc. Use Vehicles/Fleet",
  "Tucson",
  "Farm",
  "Trash Can",
  "Not Applicable",
  "Other"
];

const vehicleTypeOptions = [
  "Truck",
  "Trailer",
  "Excavator",
  "Loader",
  "Van",
  "Sedan",
  "SUV",
  "Equipment",
  "Mower",
  "Gator/UTV",
  "Golf Cart",
  "Boat",
  "Other"
];

export default function RepairRequestPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const t = useMemo(() => dictionary[language], [language]);

  const [form, setForm] = useState({
    driverName: "",
    driverPhone: "",
    makeModel: "",
    vehicleIdentifier: "",
    odometer: "",
    division: "",
    vehicleType: "",
    isImmediate: "false",
    description: "",
    date: new Date().toISOString().split("T")[0],
    smsConsent: false,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<RepairRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fast loading optimization with smooth fade-out transition
  useEffect(() => {
    // Use requestAnimationFrame for optimal performance
    const timer = requestAnimationFrame(() => {
      // Show loading screen for 1800ms to let user see the logo and accelerating animation
      setTimeout(() => {
        // Trigger exit animation
        setIsExiting(true);
        // Wait for fade-out animation to complete (600ms), then hide loading screen
        setTimeout(() => setIsLoading(false), 600);
      }, 1800);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3);
    setPhotos(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require SMS consent if phone is provided
    if (form.driverPhone && !form.smsConsent) {
      setError(t.smsConsentRequired);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("driverName", form.driverName);
      fd.append("driverPhone", form.driverPhone);
      fd.append("makeModel", form.makeModel);
      fd.append("vehicleIdentifier", form.vehicleIdentifier);
      if (form.odometer.trim()) {
        fd.append("odometer", form.odometer.replace(/,/g, ""));
      }
      fd.append("division", form.division);
      fd.append("vehicleType", form.vehicleType);
      fd.append("isImmediate", form.isImmediate === "true" ? "true" : "false");
      fd.append("urgency", form.isImmediate === "true" ? "high" : "medium"); // Map to legacy urgency
      fd.append("description", form.description);
      fd.append("incidentDate", form.date);
      fd.append("preferredLanguage", language);
      fd.append("smsConsent", form.smsConsent ? "true" : "false");
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
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen isExiting={isExiting} />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 space-y-6 text-center">
          {/* Agave Logo */}
          <div className="flex justify-center mb-6">
            <img src="/images/AEC-Horizontal-Official-Logo-2020.png" alt="Agave" className="h-16 object-contain" />
          </div>

          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.successTitle}</h2>
          <p className="text-gray-600 mb-6">{t.successBody}</p>

          <div className="flex justify-center gap-4">
            <Link href="/" className="btn-secondary">
              {t.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden animate-slide-up">
        {/* Header with Logo */}
        <div className="bg-white p-6 border-b border-gray-100 flex flex-col items-center">
          <img src="/images/AEC-Horizontal-Official-Logo-2020.png" alt="Agave" className="h-20 object-contain mb-4" />

          <div className="text-center w-full">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
            <p className="text-gray-500">Bienvenido</p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Language / Idioma</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${language === "en" ? "bg-primary-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("es")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${language === "es" ? "bg-primary-600 text-white shadow-sm" : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"}`}
            >
              Español
            </button>
          </div>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t.title}</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.driverName}</span>
                <input
                  className="input"
                  name="driverName"
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.driverPhone}</span>
                <input
                  className="input"
                  name="driverPhone"
                  value={form.driverPhone}
                  onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                  required
                  placeholder="(000) 000-0000"
                />
              </label>
            </div>

            {/* Row 2: Make/Model & Vehicle Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.makeModel}</span>
                <input
                  className="input"
                  name="makeModel"
                  value={form.makeModel}
                  onChange={(e) => setForm({ ...form, makeModel: e.target.value })}
                  placeholder="Ex: 2500 Ram Dodge"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.vehicleIdentifier}</span>
                <input
                  className="input"
                  name="vehicleIdentifier"
                  value={form.vehicleIdentifier}
                  onChange={(e) => setForm({ ...form, vehicleIdentifier: e.target.value })}
                  placeholder={language === "es" ? 'Entra number "0" si no aplica' : 'Enter number "0" if not applicable'}
                />
              </label>
            </div>

            {/* Vehicle mileage (optional) */}
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-700">{t.odometer}</span>
              <input
                type="number"
                min={0}
                className="input"
                name="odometer"
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                placeholder={language === "es" ? "Ej: 42,500" : "e.g. 42,500"}
              />
              <span className="text-xs text-gray-500">
                {language === "es" ? "Opcional: ingrese solo si se trata de un vehículo." : "Optional: include if this request is for a vehicle."}
              </span>
            </label>

            {/* Row 3: Division & Vehicle Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.vehicleType}</span>
                <select
                  className="input select"
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
                  required
                >
                  <option value="">{t.selectOne}</option>
                  {vehicleTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.division}</span>
                <select
                  className="input select"
                  name="division"
                  value={form.division}
                  onChange={(e) => setForm({ ...form, division: e.target.value })}
                  required
                >
                  <option value="">{t.selectOne}</option>
                  {divisionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Immediate Action & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.isImmediate}</span>
                <select
                  className="input select"
                  name="isImmediate"
                  value={form.isImmediate}
                  onChange={(e) => setForm({ ...form, isImmediate: e.target.value })}
                >
                  <option value="false">NO</option>
                  <option value="true">YES</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.date}</span>
                <input type="date" className="input" name="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </label>
            </div>

            {/* Description */}
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-700">{t.description}</span>
              <textarea
                className="input textarea"
                rows={4}
                name="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </label>

            {/* Photos */}
            <label className="space-y-2 block">
              <span className="text-sm font-semibold text-gray-700 block">{t.photos}</span>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                <input
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-primary-600 font-medium">Browse Files</span>
                  <span className="text-sm text-gray-500 mt-1">Drag and drop files here</span>
                </div>
              </div>
              {previews.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4">
                  {previews.map((src) => (
                    <img key={src} src={src} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                  ))}
                </div>
              )}
            </label>

            {/* SMS Consent */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={form.smsConsent}
                onChange={(e) => setForm({ ...form, smsConsent: e.target.checked })}
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t.smsConsent}</span>
            </label>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full btn-lg">
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
