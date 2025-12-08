"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle, Languages, Phone, ShieldCheck, Upload, Wrench, X } from "lucide-react";
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

// Title Screen Component - shows after loading
function TitleScreen({ isExiting }: { isExiting: boolean }) {
  return (
    <div
      className={`fixed inset-0 bg-white flex items-center justify-center z-50 transition-all duration-400 ${
        isExiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
    >
      <div className="text-center space-y-6 max-w-4xl px-8 animate-fade-in-up">
        {/* Agave Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/images/AEC-Horizontal-Official-Logo-2020.png"
            alt="Agave Fleet"
            className="h-24 object-contain opacity-0 animate-fade-in"
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
          Repair Request
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 opacity-0 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
          Professional Fleet Maintenance
        </p>

        {/* Decorative line */}
        <div className="flex justify-center opacity-0 animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// Loading Screen Component with smooth fade transition
function LoadingScreen({ isExiting }: { isExiting: boolean }) {
  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center z-50 transition-all duration-400 ${
        isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center gap-12 animate-fade-in-up">
        {/* Logo with epic spinning effects */}
        <div className="relative">
          {/* Outermost orbital ring with gradient */}
          <div className="absolute -inset-12 flex items-center justify-center">
            <div className="w-56 h-56 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
            <div className="absolute w-56 h-56 rounded-full border-4 border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-spin-accelerate" style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)'
            }}></div>
          </div>

          {/* Outer spinning ring with dots */}
          <div className="absolute -inset-8 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-indigo-200 animate-spin-slow"></div>
            {/* Spinning orb on the outer ring */}
            <div className="absolute w-48 h-48 animate-spin-accelerate">
              <div className="absolute top-0 left-1/2 -ml-2 -mt-2 w-4 h-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/50"></div>
            </div>
          </div>

          {/* Middle ring - solid gradient spin */}
          <div className="absolute -inset-6 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-[3px] border-purple-100"></div>
            <div className="absolute w-40 h-40 rounded-full border-[3px] border-transparent border-t-purple-500 border-r-pink-500 animate-spin-accelerate-reverse shadow-lg"></div>
            {/* Counter-spinning orb */}
            <div className="absolute w-40 h-40 animate-spin-accelerate-reverse" style={{ animationDirection: 'reverse' }}>
              <div className="absolute bottom-0 left-1/2 -ml-1.5 -mb-1.5 w-3 h-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full shadow-md shadow-pink-500/50"></div>
            </div>
          </div>

          {/* Inner glowing ring */}
          <div className="absolute -inset-3 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 animate-pulse-glow blur-sm"></div>
          </div>

          {/* Better Systems AI Logo - sharp and clear */}
          <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-2xl ring-2 ring-indigo-100/50 backdrop-blur-sm">
            <img
              src="/better-systems-ai-logo.png"
              alt="Better Systems AI"
              className="w-24 h-24 object-contain"
              style={{ imageRendering: '-webkit-optimize-contrast' }}
            />
          </div>

          {/* Particle effects around logo */}
          <div className="absolute -inset-10 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-indigo-400 rounded-full animate-particle-float"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  animationDelay: `${i * 0.2}s`,
                  opacity: 0.6,
                }}
              ></div>
            ))}
          </div>
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
  const [showTitleScreen, setShowTitleScreen] = useState(false);
  const [titleScreenExiting, setTitleScreenExiting] = useState(false);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Multi-stage loading: Loading → Title Screen → Form
  useEffect(() => {
    // Use requestAnimationFrame for optimal performance
    const timer = requestAnimationFrame(() => {
      // Stage 1: Show loading screen for 1500ms
      setTimeout(() => {
        // Trigger exit animation
        setIsExiting(true);
        // Quick fade-out (400ms)
        setTimeout(() => {
          setIsLoading(false);
          setShowTitleScreen(true); // Show title screen

          // Stage 2: Show title screen for 1300ms, then transition to form
          setTimeout(() => {
            setTitleScreenExiting(true);
            setTimeout(() => setShowTitleScreen(false), 400);
          }, 1300);
        }, 400);
      }, 1500);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const combinedFiles = [...photos, ...newFiles].slice(0, 3);
    setPhotos(combinedFiles);

    // Clean up old previews
    previews.forEach(url => URL.revokeObjectURL(url));
    setPreviews(combinedFiles.map((file) => URL.createObjectURL(file)));

    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    // Clean up the preview URL
    URL.revokeObjectURL(previews[index]);

    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setPhotos(newPhotos);
    setPreviews(newPreviews);
  };

  // Helper to get input class with error state
  const getInputClass = (fieldName: string) => {
    return fieldErrors[fieldName]
      ? "input border-red-300 focus:border-red-500 focus:ring-red-500"
      : "input";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setError(null);
    setFieldErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};

    if (!form.driverName.trim()) {
      errors.driverName = "Name is required";
    }
    if (!form.driverPhone.trim()) {
      errors.driverPhone = "Phone number is required";
    }
    if (!form.division) {
      errors.division = "Division is required";
    }
    if (!form.vehicleType) {
      errors.vehicleType = "Vehicle type is required";
    }
    if (!form.description.trim()) {
      errors.description = "Description is required";
    }

    // Require SMS consent if phone is provided
    if (form.driverPhone && !form.smsConsent) {
      errors.smsConsent = t.smsConsentRequired;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(language === "es" ? "Por favor complete todos los campos requeridos" : "Please complete all required fields");

      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the field after scroll
        setTimeout(() => {
          if (element instanceof HTMLElement) {
            element.focus();
          }
        }, 500);
      }

      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("driverName", form.driverName.trim());
      fd.append("driverPhone", form.driverPhone.trim());

      // Only append non-empty optional fields
      if (form.makeModel.trim()) {
        fd.append("makeModel", form.makeModel.trim());
      }
      if (form.vehicleIdentifier.trim()) {
        fd.append("vehicleIdentifier", form.vehicleIdentifier.trim());
      }
      if (form.odometer.trim()) {
        fd.append("odometer", form.odometer.replace(/,/g, ""));
      }

      fd.append("division", form.division);
      fd.append("vehicleType", form.vehicleType);
      fd.append("isImmediate", form.isImmediate === "true" ? "true" : "false");
      fd.append("urgency", form.isImmediate === "true" ? "high" : "medium");
      fd.append("description", form.description.trim());
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
        // Handle validation errors from API
        if (data.details && typeof data.details === 'object') {
          const apiErrors: Record<string, string> = {};
          Object.keys(data.details).forEach(key => {
            const messages = data.details[key];
            if (Array.isArray(messages) && messages.length > 0) {
              apiErrors[key] = messages[0];
            }
          });
          setFieldErrors(apiErrors);
          setError(data.error || "Validation failed");

          // Scroll to first error field
          const firstErrorField = Object.keys(apiErrors)[0];
          const element = document.querySelector(`[name="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          throw new Error(data.error || "Failed to submit");
        }
        return;
      }

      setSubmitted(data.request);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to submit request");
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading screen first
  if (isLoading) {
    return <LoadingScreen isExiting={isExiting} />;
  }

  // Show title screen after loading
  if (showTitleScreen) {
    return <TitleScreen isExiting={titleScreenExiting} />;
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
                  className={getInputClass("driverName")}
                  name="driverName"
                  value={form.driverName}
                  onChange={(e) => {
                    setForm({ ...form, driverName: e.target.value });
                    if (fieldErrors.driverName) {
                      setFieldErrors({ ...fieldErrors, driverName: "" });
                    }
                  }}
                  required
                />
                {fieldErrors.driverName && (
                  <span className="text-sm text-red-600">{fieldErrors.driverName}</span>
                )}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.driverPhone}</span>
                <input
                  className={getInputClass("driverPhone")}
                  name="driverPhone"
                  value={form.driverPhone}
                  onChange={(e) => {
                    setForm({ ...form, driverPhone: e.target.value });
                    if (fieldErrors.driverPhone) {
                      setFieldErrors({ ...fieldErrors, driverPhone: "" });
                    }
                  }}
                  required
                  placeholder="(000) 000-0000"
                />
                {fieldErrors.driverPhone && (
                  <span className="text-sm text-red-600">{fieldErrors.driverPhone}</span>
                )}
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
                  className={getInputClass("vehicleType")}
                  name="vehicleType"
                  value={form.vehicleType}
                  onChange={(e) => {
                    setForm({ ...form, vehicleType: e.target.value });
                    if (fieldErrors.vehicleType) {
                      setFieldErrors({ ...fieldErrors, vehicleType: "" });
                    }
                  }}
                  required
                >
                  <option value="">{t.selectOne}</option>
                  {vehicleTypeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldErrors.vehicleType && (
                  <span className="text-sm text-red-600">{fieldErrors.vehicleType}</span>
                )}
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-gray-700">{t.division}</span>
                <select
                  className={getInputClass("division")}
                  name="division"
                  value={form.division}
                  onChange={(e) => {
                    setForm({ ...form, division: e.target.value });
                    if (fieldErrors.division) {
                      setFieldErrors({ ...fieldErrors, division: "" });
                    }
                  }}
                  required
                >
                  <option value="">{t.selectOne}</option>
                  {divisionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {fieldErrors.division && (
                  <span className="text-sm text-red-600">{fieldErrors.division}</span>
                )}
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
                className={getInputClass("description")}
                rows={4}
                name="description"
                value={form.description}
                onChange={(e) => {
                  setForm({ ...form, description: e.target.value });
                  if (fieldErrors.description) {
                    setFieldErrors({ ...fieldErrors, description: "" });
                  }
                }}
                required
              />
              {fieldErrors.description && (
                <span className="text-sm text-red-600">{fieldErrors.description}</span>
              )}
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
                  {previews.map((src, index) => (
                    <div key={src} className="relative group">
                      <img src={src} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title={language === "es" ? "Eliminar foto" : "Remove photo"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 3 && photos.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {language === "es"
                    ? `${photos.length} de 3 fotos seleccionadas. Puede agregar ${3 - photos.length} más.`
                    : `${photos.length} of 3 photos selected. You can add ${3 - photos.length} more.`}
                </p>
              )}
            </label>

            {/* SMS Consent */}
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 cursor-pointer p-4 rounded-lg border transition-colors ${
                  fieldErrors.smsConsent
                    ? 'bg-red-50 border-red-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  name="smsConsent"
                  checked={form.smsConsent}
                  onChange={(e) => {
                    setForm({ ...form, smsConsent: e.target.checked });
                    if (fieldErrors.smsConsent) {
                      setFieldErrors({ ...fieldErrors, smsConsent: "" });
                    }
                  }}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{t.smsConsent}</span>
              </label>
              {fieldErrors.smsConsent && (
                <span className="text-sm text-red-600 block">{fieldErrors.smsConsent}</span>
              )}
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full btn-lg">
              {submitting ? t.submitting : t.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
