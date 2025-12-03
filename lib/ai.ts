import Anthropic from "@anthropic-ai/sdk";
import { ContentBlockParam } from "@anthropic-ai/sdk/resources/messages";

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;

// Use Claude Haiku for efficiency - fast, cost-effective, and supports vision
const CLAUDE_MODEL = "claude-3-haiku-20240307";

type AnalysisInput = {
  description: string;
  vehicleIdentifier?: string;
  urgency?: string;
  preferredLanguage?: "en" | "es";
  photoUrls?: string[]; // URLs to images for vision analysis
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

/**
 * Fetch image from URL and convert to base64 for Claude API
 * Handles both absolute URLs (Supabase storage) and relative paths
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    // Supabase URLs are already absolute, but handle relative paths for local dev
    let url = imageUrl;
    if (!imageUrl.startsWith("http")) {
      let baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      if (!baseUrl && process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
      if (!baseUrl) {
        baseUrl = "http://localhost:3000";
      }
      url = `${baseUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
    }
    
    const response = await fetch(url, {
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch image from ${url}: ${response.statusText}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    
    // Determine content type from response or URL
    let contentType = response.headers.get("content-type");
    if (!contentType) {
      if (url.includes(".webp")) contentType = "image/webp";
      else if (url.includes(".png")) contentType = "image/png";
      else if (url.includes(".jpg") || url.includes(".jpeg")) contentType = "image/jpeg";
      else contentType = "image/jpeg"; // default
    }
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching image ${imageUrl}:`, error);
    return null;
  }
}

export async function analyzeRepairRequest(input: AnalysisInput): Promise<AnalysisResult> {
  // Validate input
  if (!input.description || input.description.trim().length < 3) {
    console.warn("Description too short, using fallback classification");
    return fallbackClassify(input);
  }

  if (!anthropic) {
    console.warn("ANTHROPIC_API_KEY not set, using fallback classification");
    return fallbackClassify(input);
  }

  try {
    const categoriesList = CATEGORY_OPTIONS.map((c) => `${c.key}: ${c.label}`).join("\n");
    const languageHint = input.preferredLanguage === "es" ? "Responde el resumen en español." : "Respond in English.";
    
    // Build content array with text and images
    // IMPORTANT: This is a VISION-FIRST analysis system - images are the primary input
    const hasImages = input.photoUrls && input.photoUrls.length > 0;
    
    const content: ContentBlockParam[] = [
      {
        type: "text",
        text: `You are a fleet repair triage agent specializing in VISUAL ANALYSIS of vehicle repair requests.

${hasImages ? 
`PRIMARY TASK: Analyze the provided PHOTOS/IMAGES visually to identify the vehicle problem. The images are the most important source of information.

VISUAL ANALYSIS INSTRUCTIONS:
- Carefully examine each photo for visible damage, issues, or problems
- Look for: leaks, cracks, dents, warning lights, tire issues, engine problems, electrical issues, body damage, etc.
- Identify what you can see in the images (e.g., "oil leak visible under engine", "flat tire", "dashboard warning light", "cracked windshield")
- Use visual evidence from the photos as the PRIMARY basis for categorization
- The text description is supplementary - trust what you see in the images when available

` : 
`NOTE: No images provided. Analyze based on text description only.
`}
Issue Description: ${input.description}
Vehicle: ${input.vehicleIdentifier || "unspecified"}
Urgency: ${input.urgency || "unspecified"}

Available Categories (you MUST pick exactly one):
${categoriesList}

${languageHint}

Return a JSON object with these exact keys:
- categoryLabel: The full label from the categories above (based on VISUAL evidence if images provided)
- categoryKey: The key from the categories above (e.g., "engine", "electrical", etc.)
- tags: Array of relevant tags (include the categoryKey and serviceType)
- summary: Brief 1-2 sentence summary describing what you SEE in the images (if provided) or the issue described, in ${input.preferredLanguage === "es" ? "Spanish" : "English"}
- confidence: Number between 0 and 1 indicating confidence (higher if visual evidence is clear)
- serviceType: The service type from the selected category

${hasImages ? "Focus on visual analysis - what can you see in the photos?" : "Analyze based on text description."}`,
      },
    ];

    // Add images if provided (limit to first 3 for efficiency and cost)
    // CRITICAL: Images are added BEFORE the text prompt so Claude sees them first
    if (input.photoUrls && input.photoUrls.length > 0) {
      const imagesToProcess = input.photoUrls.slice(0, 3); // Claude supports multiple images, limit for efficiency
      const imagePromises = imagesToProcess.map((url) => fetchImageAsBase64(url));
      const imageData = await Promise.all(imagePromises);
      
      let imagesAdded = 0;
      // Insert images at the beginning so they're analyzed first (vision-first approach)
      const imageContent: ContentBlockParam[] = [];
      
      for (const base64Image of imageData) {
        if (base64Image) {
          // Extract media type from data URL
          const allowedMediaTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/gif'] as const;
          const detectedMediaType = base64Image.match(/data:([^;]+);/)?.[1] || "image/jpeg";
          const mediaType = allowedMediaTypes.includes(detectedMediaType as any)
            ? (detectedMediaType as (typeof allowedMediaTypes)[number])
            : 'image/jpeg';
          const base64Data = base64Image.split(",")[1];
          
          // Validate base64 data exists
          if (!base64Data || base64Data.length === 0) {
            console.warn("Skipping image with empty base64 data");
            continue;
          }
          
          imageContent.push({
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Data,
            },
          });
          imagesAdded++;
        }
      }
      
      // Insert images BEFORE text prompt for vision-first analysis
      if (imageContent.length > 0) {
        content.unshift(...imageContent);
        console.log(`✅ Added ${imagesAdded} image(s) for PRIMARY vision analysis`);
      } else if (input.photoUrls.length > 0) {
        console.warn("⚠️  No images could be fetched for analysis (will use text-only)");
      }
    }

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    });

    const raw = message.content[0]?.type === "text" ? message.content[0].text : "{}";
    
    // Extract JSON from response (Claude may include markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : raw;
    
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Claude response as JSON:", jsonString.substring(0, 200));
      throw new Error("Invalid JSON response from Claude API");
    }
    
    const found = CATEGORY_OPTIONS.find((c) => c.key === parsed.categoryKey) || 
                  CATEGORY_OPTIONS.find((c) => c.label === parsed.categoryLabel);

    // Validate and sanitize confidence score
    let confidence = parsed.confidence ? Number(parsed.confidence) : 0.7;
    if (isNaN(confidence) || confidence < 0) confidence = 0.5;
    if (confidence > 1) confidence = 1;

    // Ensure tags is an array
    let tags = parsed.tags;
    if (!Array.isArray(tags)) {
      tags = found ? [found.key, found.serviceType] : [];
    }

    const result = {
      category: parsed.categoryLabel || found?.label || "General inspection",
      tags: tags,
      summary: parsed.summary || fallbackClassify(input).summary,
      confidence: confidence,
      serviceType: parsed.serviceType || found?.serviceType || "General inspection",
    };

    // Log successful analysis (in development)
    if (process.env.NODE_ENV === "development") {
      console.log(`✅ AI Analysis complete: ${result.category} (confidence: ${result.confidence.toFixed(2)})`);
    }

    return result;
  } catch (error) {
    console.error("Claude AI analysis failed, using fallback", error);
    // Log more details in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    return fallbackClassify(input);
  }
}
