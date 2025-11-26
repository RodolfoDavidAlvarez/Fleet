import OpenAI from "openai";

const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

type AnalysisInput = {
  description: string;
  vehicleIdentifier?: string;
  urgency?: string;
  preferredLanguage?: "en" | "es";
};

export type AnalysisResult = {
  category: string;
  tags: string[];
  summary: string;
  confidence: number;
  serviceType: string;
};

const CATEGORY_OPTIONS = [
  { key: "engine", label: "Engine / Powertrain", cues: ["engine", "stall", "power", "smoke", "misfire"], serviceType: "Engine diagnostic" },
  { key: "electrical", label: "Electrical / Battery", cues: ["battery", "electrical", "light", "sensor", "dash", "radio"], serviceType: "Electrical diagnostic" },
  { key: "tires_brakes", label: "Tires / Brakes", cues: ["tire", "brake", "wheel", "abs", "traction", "alignment"], serviceType: "Brake or tire service" },
  { key: "fluids", label: "Fluids / Leaks", cues: ["leak", "oil", "coolant", "fluid", "drip", "spill"], serviceType: "Leak inspection" },
  { key: "warning_lights", label: "Warning lights", cues: ["check engine", "warning", "indicator", "light"], serviceType: "Dashboard warning diagnosis" },
  { key: "body_glass", label: "Body / Glass", cues: ["mirror", "door", "window", "glass", "windshield", "dent"], serviceType: "Body or glass repair" },
  { key: "safety", label: "Safety equipment", cues: ["seatbelt", "airbag", "safety"], serviceType: "Safety system check" },
  { key: "other", label: "Other / Misc", cues: [], serviceType: "General inspection" },
];

function fallbackClassify(input: AnalysisInput): AnalysisResult {
  const normalized = input.description.toLowerCase();
  let match = CATEGORY_OPTIONS.find((c) => c.cues.some((cue) => normalized.includes(cue))) || CATEGORY_OPTIONS.find((c) => c.key === "other")!;

  // Slightly boost confidence if urgency is high
  const confidence = ["high", "critical"].includes((input.urgency || "").toLowerCase()) ? 0.76 : 0.62;
  const summary =
    input.preferredLanguage === "es"
      ? `Clasificación rápida: ${match.label}. Se recomienda revisión prioritaria si la urgencia es alta.`
      : `Quick triage: ${match.label}. If urgency is high, prioritize scheduling.`;

  return {
    category: match.label,
    tags: [match.key, match.serviceType],
    summary,
    confidence,
    serviceType: match.serviceType,
  };
}

export async function analyzeRepairRequest(input: AnalysisInput): Promise<AnalysisResult> {
  if (!openai) {
    return fallbackClassify(input);
  }

  try {
    const categoriesList = CATEGORY_OPTIONS.map((c) => `${c.key}: ${c.label}`).join("\n");
    const languageHint = input.preferredLanguage === "es" ? "Responde el resumen en español." : "Respond in English.";
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a fleet repair triage agent. Pick one category and return JSON with keys: categoryLabel, categoryKey, tags (array), summary, confidence (0-1), serviceType. Be concise.",
        },
        {
          role: "user",
          content: `Issue: ${input.description}\nVehicle: ${input.vehicleIdentifier || "unspecified"}\nUrgency: ${input.urgency || "unspecified"}\nCategories:\n${categoriesList}\n${languageHint}`,
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    const found = CATEGORY_OPTIONS.find((c) => c.key === parsed.categoryKey) || CATEGORY_OPTIONS.find((c) => c.label === parsed.categoryLabel);

    return {
      category: parsed.categoryLabel || found?.label || "General inspection",
      tags: parsed.tags || (found ? [found.key] : []),
      summary: parsed.summary || fallbackClassify(input).summary,
      confidence: parsed.confidence ? Number(parsed.confidence) : 0.7,
      serviceType: parsed.serviceType || found?.serviceType || "General inspection",
    };
  } catch (error) {
    console.error("AI analysis failed, using fallback", error);
    return fallbackClassify(input);
  }
}
