"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  Gauge,
  Wrench,
  AlertTriangle,
  Droplets,
  Lightbulb,
  Shield,
  Fuel,
  Camera,
  X,
  Truck,
  Search,
  ArrowRight,
  Loader2,
  User,
} from "lucide-react";

/* ─── i18n ─── */
const dictionary = {
  en: {
    welcome: "Vehicle Inspection",
    welcomeSub: "Quick check-in for your assigned vehicle.",
    poweredBy: "Powered by",
    enterVehicle: "Enter your vehicle number",
    vehiclePlaceholder: "e.g. 3333",
    lookingUp: "Looking up vehicle...",
    vehicleFound: "Vehicle Found",
    vehicleNotFound: "Vehicle not found in system",
    vehicleNotFoundSub: "You can still continue with the inspection.",
    continueBtn: "Continue",
    tryAgain: "Try Another Number",
    skipVehicle: "Continue Without Vehicle Number",
    driverName: "Your Name",
    driverPhone: "Phone Number",
    mileage: "Current Mileage",
    sectionMaintenance: "Maintenance History",
    lastOilDate: "Last Oil Change Date",
    lastOilMileage: "Oil Change Mileage",
    lastMaintDate: "Last Maintenance Date",
    lastMaintType: "Type of Maintenance",
    sectionCondition: "Vehicle Condition",
    tires: "Tires",
    brakes: "Brakes",
    lights: "All Lights Working?",
    fluids: "Fluid Levels",
    body: "Body / Exterior",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    critical: "Critical",
    yes: "Yes",
    no: "No",
    warningLights: "Any Warning Lights On?",
    warningDesc: "Which warning lights?",
    sectionFuel: "Fuel Log (Optional)",
    fuelEntry: "Logging a fuel fill-up?",
    fuelGallons: "Gallons Filled",
    notes: "Additional Notes",
    photos: "Photos (optional)",
    submit: "Submit Inspection",
    submitting: "Submitting...",
    successTitle: "Inspection Submitted",
    successBody: "Thank you for keeping the fleet safe.",
    backHome: "Done",
    required: "Required",
  },
  es: {
    welcome: "Inspección de Vehículo",
    welcomeSub: "Revisión rápida de su vehículo asignado.",
    poweredBy: "Desarrollado por",
    enterVehicle: "Ingrese su número de vehículo",
    vehiclePlaceholder: "ej. 3333",
    lookingUp: "Buscando vehículo...",
    vehicleFound: "Vehículo Encontrado",
    vehicleNotFound: "Vehículo no encontrado en el sistema",
    vehicleNotFoundSub: "Puede continuar con la inspección.",
    continueBtn: "Continuar",
    tryAgain: "Intentar Otro Número",
    skipVehicle: "Continuar Sin Número de Vehículo",
    driverName: "Su Nombre",
    driverPhone: "Número de Teléfono",
    mileage: "Millaje Actual",
    sectionMaintenance: "Historial de Mantenimiento",
    lastOilDate: "Último Cambio de Aceite",
    lastOilMileage: "Millaje del Cambio",
    lastMaintDate: "Último Mantenimiento",
    lastMaintType: "Tipo de Mantenimiento",
    sectionCondition: "Condición del Vehículo",
    tires: "Llantas",
    brakes: "Frenos",
    lights: "¿Todas las Luces Funcionan?",
    fluids: "Nivel de Fluidos",
    body: "Carrocería / Exterior",
    good: "Bien",
    fair: "Regular",
    poor: "Mal",
    critical: "Crítico",
    yes: "Sí",
    no: "No",
    warningLights: "¿Luces de Advertencia Encendidas?",
    warningDesc: "¿Cuáles luces de advertencia?",
    sectionFuel: "Combustible (Opcional)",
    fuelEntry: "¿Registrando carga de combustible?",
    fuelGallons: "Galones Cargados",
    notes: "Notas Adicionales",
    photos: "Fotos (opcional)",
    submit: "Enviar Inspección",
    submitting: "Enviando...",
    successTitle: "Inspección Enviada",
    successBody: "Gracias por mantener la flota segura.",
    backHome: "Listo",
    required: "Requerido",
  },
};

type ConditionRating = "good" | "fair" | "poor" | "critical";

interface VehicleInfo {
  id: string;
  vehicle_number: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  status: string;
  department: string | null;
  vin: string | null;
  assigned_driver: string | null;
}

/* ─── Components ─── */

function ConditionSelector({
  value,
  onChange,
  labels,
}: {
  value: ConditionRating;
  onChange: (v: ConditionRating) => void;
  labels: { good: string; fair: string; poor: string; critical: string };
}) {
  const options: { key: ConditionRating; color: string }[] = [
    { key: "good", color: "bg-green-500" },
    { key: "fair", color: "bg-yellow-500" },
    { key: "poor", color: "bg-orange-500" },
    { key: "critical", color: "bg-red-500" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
            value === opt.key
              ? `${opt.color} text-white shadow-lg scale-105`
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {labels[opt.key]}
        </button>
      ))}
    </div>
  );
}

function YesNoSelector({
  value,
  onChange,
  labels,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  labels: { yes: string; no: string };
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
          value
            ? "bg-green-500 text-white shadow-lg scale-105"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {labels.yes}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
          !value
            ? "bg-red-500 text-white shadow-lg scale-105"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        {labels.no}
      </button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function InspectPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign");

  const [language, setLanguage] = useState<"en" | "es">("en");
  const t = useMemo(() => dictionary[language], [language]);

  // Steps: "vehicle" → "form"
  const [step, setStep] = useState<"vehicle" | "form">("vehicle");

  // Vehicle lookup
  const [vehicleInput, setVehicleInput] = useState("");
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);

  // Form data
  const [form, setForm] = useState({
    driverName: "",
    driverPhone: "",
    vehicleNumber: "",
    currentMileage: "",
    lastOilChangeDate: "",
    lastOilChangeMileage: "",
    lastMaintenanceDate: "",
    lastMaintenanceType: "",
    warningLightsDescription: "",
    notes: "",
    fuelGallons: "",
  });

  const [tireCondition, setTireCondition] = useState<ConditionRating>("good");
  const [brakeCondition, setBrakeCondition] = useState<ConditionRating>("good");
  const [lightsWorking, setLightsWorking] = useState(true);
  const [fluidLevels, setFluidLevels] = useState<ConditionRating>("good");
  const [bodyCondition, setBodyCondition] = useState<ConditionRating>("good");
  const [warningLightsOn, setWarningLightsOn] = useState(false);
  const [isFuelEntry, setIsFuelEntry] = useState(false);

  const [mileageNA, setMileageNA] = useState(false);

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  /* ─── Vehicle Lookup ─── */
  const lookupVehicle = useCallback(async () => {
    const num = vehicleInput.trim();
    if (!num) return;

    setLookupState("loading");
    try {
      const res = await fetch(`/api/vehicles/lookup?number=${encodeURIComponent(num)}`);
      const data = await res.json();

      if (data.vehicle) {
        setVehicleInfo(data.vehicle);
        setLookupState("found");
        // Pre-fill form with vehicle data + assigned driver
        setForm((prev) => ({
          ...prev,
          vehicleNumber: data.vehicle.vehicle_number,
          currentMileage: data.vehicle.mileage ? String(data.vehicle.mileage) : "",
          driverName: data.vehicle.assigned_driver || prev.driverName,
        }));
      } else {
        setVehicleInfo(null);
        setLookupState("not_found");
        setForm((prev) => ({ ...prev, vehicleNumber: num }));
      }
    } catch {
      setLookupState("not_found");
      setForm((prev) => ({ ...prev, vehicleNumber: num }));
    }
  }, [vehicleInput]);

  const handleVehicleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupVehicle();
    }
  };

  const proceedToForm = () => {
    setStep("form");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const skipVehicle = () => {
    setForm((prev) => ({ ...prev, vehicleNumber: "" }));
    setStep("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetLookup = () => {
    setLookupState("idle");
    setVehicleInfo(null);
    setVehicleInput("");
  };

  /* ─── File handling ─── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const combinedFiles = [...photos, ...newFiles].slice(0, 3);
    setPhotos(combinedFiles);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(combinedFiles.map((file) => URL.createObjectURL(file)));
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ─── Submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.driverName.trim() || (!mileageNA && !form.currentMileage.trim())) {
      setError(
        language === "es"
          ? "Nombre y millaje son requeridos"
          : "Name and mileage are required"
      );
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        driverName: form.driverName.trim(),
        driverPhone: form.driverPhone.trim() || null,
        preferredLanguage: language,
        vehicleNumber: form.vehicleNumber.trim() || null,
        currentMileage: mileageNA ? "0" : form.currentMileage.replace(/,/g, ""),
        lastOilChangeDate: form.lastOilChangeDate || null,
        lastOilChangeMileage: form.lastOilChangeMileage ? form.lastOilChangeMileage.replace(/,/g, "") : null,
        lastMaintenanceDate: form.lastMaintenanceDate || null,
        lastMaintenanceType: form.lastMaintenanceType || null,
        tireCondition,
        brakeCondition,
        lightsWorking,
        fluidLevels,
        bodyCondition,
        warningLightsOn,
        warningLightsDescription: warningLightsOn ? form.warningLightsDescription : null,
        notes: form.notes || null,
        photoUrls: [],
        isFuelEntry,
        fuelGallons: isFuelEntry && form.fuelGallons ? form.fuelGallons : null,
        campaignId: campaignId || null,
      };

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Success Screen ─── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="flex justify-center mb-4">
            <img
              src="/images/AEC-Horizontal-Official-Logo-2020.png"
              alt="Agave"
              className="h-16 object-contain"
            />
          </div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{t.successTitle}</h2>
          <p className="text-lg text-gray-600">{t.successBody}</p>
          {vehicleInfo && (
            <p className="text-sm text-gray-400">
              {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} &middot; #{vehicleInfo.vehicle_number}
            </p>
          )}
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            {t.backHome}
          </Link>
          <p className="text-[11px] text-gray-300 mt-4">
            {t.poweredBy} Better Systems AI
          </p>
        </div>
      </div>
    );
  }

  const conditionLabels = {
    good: t.good,
    fair: t.fair,
    poor: t.poor,
    critical: t.critical,
  };

  /* ─── Step 1: Vehicle Number Lookup ─── */
  if (step === "vehicle") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
            <img
              src="/images/AEC-Horizontal-Official-Logo-2020.png"
              alt="Agave Fleet"
              className="h-14 object-contain mx-auto"
            />

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.welcome}</h1>
              <p className="text-gray-500 text-sm mt-1">{t.welcomeSub}</p>
            </div>

            {/* Language Toggle */}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  language === "en"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  language === "es"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                Espa&ntilde;ol
              </button>
            </div>
          </div>

          {/* Vehicle Number Input */}
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              <Truck className="inline h-4 w-4 mr-1.5 -mt-0.5" />
              {t.enterVehicle}
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={vehicleInput}
                onChange={(e) => {
                  setVehicleInput(e.target.value);
                  if (lookupState !== "idle") setLookupState("idle");
                }}
                onKeyDown={handleVehicleKeyDown}
                placeholder={t.vehiclePlaceholder}
                autoFocus
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 text-lg font-medium text-center tracking-widest focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={lookupVehicle}
                disabled={!vehicleInput.trim() || lookupState === "loading"}
                className="px-5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-all flex items-center justify-center"
              >
                {lookupState === "loading" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Loading State */}
            {lookupState === "loading" && (
              <div className="flex items-center justify-center gap-2 py-3 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{t.lookingUp}</span>
              </div>
            )}

            {/* Vehicle Found */}
            {lookupState === "found" && vehicleInfo && (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        {t.vehicleFound}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-0.5">
                        {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                        <span>#{vehicleInfo.vehicle_number}</span>
                        {vehicleInfo.mileage > 0 && (
                          <span>{vehicleInfo.mileage.toLocaleString()} mi</span>
                        )}
                        {vehicleInfo.department && (
                          <span>{vehicleInfo.department}</span>
                        )}
                      </div>
                      {vehicleInfo.assigned_driver && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <User className="h-3 w-3" />
                          <span>
                            {language === "es" ? "Conductor asignado" : "Assigned driver"}:{" "}
                            <span className="font-semibold text-gray-700">{vehicleInfo.assigned_driver}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={proceedToForm}
                  className="w-full py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-base"
                >
                  {t.continueBtn}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Vehicle Not Found */}
            {lookupState === "not_found" && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-amber-800">{t.vehicleNotFound}</p>
                  <p className="text-xs text-amber-600 mt-1">{t.vehicleNotFoundSub}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={resetLookup}
                    className="py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all text-sm"
                  >
                    {t.tryAgain}
                  </button>
                  <button
                    type="button"
                    onClick={proceedToForm}
                    className="py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 text-sm"
                  >
                    {t.continueBtn}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skip link */}
          {lookupState === "idle" && (
            <button
              type="button"
              onClick={skipVehicle}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              {t.skipVehicle}
            </button>
          )}

          {/* Branding */}
          <p className="text-center text-[11px] text-gray-300">
            {t.poweredBy} Better Systems AI
          </p>
        </div>
      </div>
    );
  }

  /* ─── Step 2: Inspection Form ─── */
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4" style={{ WebkitOverflowScrolling: "touch" }}>
      <div className="max-w-lg mx-auto w-full overflow-hidden">
        {/* Header with vehicle info */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 mb-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <img
              src="/images/AEC-Horizontal-Official-Logo-2020.png"
              alt="Agave Fleet"
              className="h-10 object-contain"
            />
            {/* Language Toggle */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  language === "en"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  language === "es"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                ES
              </button>
            </div>
          </div>

          {/* Vehicle badge */}
          {vehicleInfo ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">
                  {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                </p>
                <p className="text-xs text-gray-500">
                  #{vehicleInfo.vehicle_number}
                  {vehicleInfo.mileage > 0 && ` \u00b7 ${vehicleInfo.mileage.toLocaleString()} mi`}
                </p>
              </div>
            </div>
          ) : form.vehicleNumber ? (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Vehicle #{form.vehicleNumber}</p>
                <p className="text-xs text-gray-400">Not registered in system</p>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Driver Info + Mileage */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 overflow-hidden">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.driverName} <span className="text-red-400 text-xs">*</span>
              </label>
              <input
                name="driverName"
                value={form.driverName}
                onChange={(e) => update("driverName", e.target.value)}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.driverPhone}
              </label>
              <input
                name="driverPhone"
                type="tel"
                value={form.driverPhone}
                onChange={(e) => update("driverPhone", e.target.value)}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
              />
            </div>

            {/* Vehicle number (hidden if already set, shown if skipped) */}
            {!vehicleInfo && !form.vehicleNumber && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.enterVehicle}
                </label>
                <input
                  name="vehicleNumber"
                  value={form.vehicleNumber}
                  onChange={(e) => update("vehicleNumber", e.target.value)}
                  className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">
                  <Gauge className="inline h-4 w-4 mr-1" />
                  {t.mileage} {!mileageNA && <span className="text-red-400 text-xs">*</span>}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMileageNA(!mileageNA);
                    if (!mileageNA) update("currentMileage", "0");
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                    mileageNA
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  N/A
                </button>
              </div>
              {mileageNA ? (
                <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-400 bg-gray-50">
                  {language === "es" ? "No aplica (remolque/equipo)" : "Not applicable (trailer/equipment)"}
                </div>
              ) : (
                <input
                  name="currentMileage"
                  type="number"
                  inputMode="numeric"
                  value={form.currentMileage}
                  onChange={(e) => update("currentMileage", e.target.value)}
                  className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
                />
              )}
            </div>
          </div>

          {/* Maintenance History */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {t.sectionMaintenance}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t.lastOilDate}
              </label>
              <input
                type="date"
                value={form.lastOilChangeDate}
                onChange={(e) => update("lastOilChangeDate", e.target.value)}
                style={{ maxWidth: "100%" }}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border appearance-none bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t.lastOilMileage}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={form.lastOilChangeMileage}
                onChange={(e) => update("lastOilChangeMileage", e.target.value)}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t.lastMaintDate}
              </label>
              <input
                type="date"
                value={form.lastMaintenanceDate}
                onChange={(e) => update("lastMaintenanceDate", e.target.value)}
                style={{ maxWidth: "100%" }}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border appearance-none bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {t.lastMaintType}
              </label>
              <input
                value={form.lastMaintenanceType}
                onChange={(e) => update("lastMaintenanceType", e.target.value)}
                placeholder={language === "es" ? "ej: Llantas, Frenos" : "e.g. Tires, Brakes"}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
              />
            </div>
          </div>

          {/* Vehicle Condition */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 space-y-5 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.sectionCondition}
            </h3>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.tires}</label>
              <ConditionSelector value={tireCondition} onChange={setTireCondition} labels={conditionLabels} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.brakes}</label>
              <ConditionSelector value={brakeCondition} onChange={setBrakeCondition} labels={conditionLabels} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Lightbulb className="inline h-4 w-4 mr-1" />
                {t.lights}
              </label>
              <YesNoSelector value={lightsWorking} onChange={setLightsWorking} labels={{ yes: t.yes, no: t.no }} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Droplets className="inline h-4 w-4 mr-1" />
                {t.fluids}
              </label>
              <ConditionSelector value={fluidLevels} onChange={setFluidLevels} labels={conditionLabels} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.body}</label>
              <ConditionSelector value={bodyCondition} onChange={setBodyCondition} labels={conditionLabels} />
            </div>

            {/* Warning Lights */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                {t.warningLights}
              </label>
              <YesNoSelector
                value={warningLightsOn}
                onChange={setWarningLightsOn}
                labels={{ yes: t.yes, no: t.no }}
              />
              {warningLightsOn && (
                <input
                  value={form.warningLightsDescription}
                  onChange={(e) => update("warningLightsDescription", e.target.value)}
                  placeholder={t.warningDesc}
                  className="w-full mt-3 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              )}
            </div>
          </div>

          {/* Fuel Log */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              {t.sectionFuel}
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t.fuelEntry}</label>
              <YesNoSelector value={isFuelEntry} onChange={setIsFuelEntry} labels={{ yes: t.yes, no: t.no }} />
            </div>
            {isFuelEntry && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.fuelGallons}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={form.fuelGallons}
                  onChange={(e) => update("fuelGallons", e.target.value)}
                  className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none box-border"
                />
              </div>
            )}
          </div>

          {/* Notes & Photos */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 overflow-hidden">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.notes}</label>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                className="w-full min-w-0 border border-gray-200 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none resize-none box-border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="inline h-4 w-4 mr-1" />
                {t.photos}
              </label>
              <div className="flex gap-2 flex-wrap">
                {previews.map((url, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 3 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors">
                    <Camera className="h-6 w-6 text-gray-400" />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-gray-900 text-white font-bold text-lg rounded-2xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg"
          >
            {submitting ? t.submitting : t.submit}
          </button>

          {/* Branding */}
          <p className="text-center text-[11px] text-gray-300 pb-6">
            {t.poweredBy} Better Systems AI
          </p>
        </form>
      </div>
    </div>
  );
}
