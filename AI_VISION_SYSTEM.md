# AI Vision System for Repair Request Analysis

## Overview

The repair request analysis system uses **Anthropic Claude** with **VISION-FIRST** analysis capabilities. This is a **visual analysis system** that prioritizes image analysis over text descriptions. When photos are provided, the AI analyzes the visual evidence in the images as the PRIMARY source of information for categorizing repair requests.

## Architecture

### AI Provider: Anthropic Claude
- **Model**: `claude-3-haiku-20240307`
- **Why Haiku?**: Fast, cost-effective, energy-efficient, and supports vision
- **API**: Anthropic Messages API with vision support

### Features

1. **Vision-First Analysis**: **PRIMARY** - Analyzes uploaded photos visually to identify problems
   - Images are the most important input
   - Visual evidence drives categorization
   - Text description is supplementary
2. **Visual Problem Detection**: Identifies visible issues like leaks, cracks, dents, warning lights, tire problems, etc.
3. **Predefined Categories**: Uses a fixed list of repair categories for consistency
4. **Historical Data**: Categories are stored for analytics and trend analysis
5. **Bilingual Support**: Summaries in English or Spanish based on user preference
6. **Fallback System**: If Claude API is unavailable, uses keyword-based classification

## Repair Categories

The system uses these predefined categories:

1. **Engine / Powertrain** - Engine issues, stalling, power problems, smoke, misfires
2. **Electrical / Battery** - Battery, electrical systems, lights, sensors, dashboard
3. **Tires / Brakes** - Tire issues, brakes, wheels, ABS, traction, alignment
4. **Fluids / Leaks** - Oil leaks, coolant, fluid drips, spills
5. **Warning lights** - Check engine, dashboard warnings, indicators
6. **Body / Glass** - Mirrors, doors, windows, windshield, dents
7. **Safety equipment** - Seatbelts, airbags, safety systems
8. **Other / Misc** - General inspection, miscellaneous issues

## How It Works

### 1. Repair Request Submission
When a driver submits a repair request with photos:

```typescript
// Photos are uploaded and stored
const stored = await optimizeAndStoreImages(validPhotos);

// AI analyzes description + images
const ai = await analyzeRepairRequest({
  description: parsed.data.description,
  vehicleIdentifier: parsed.data.vehicleIdentifier,
  urgency: parsed.data.urgency,
  preferredLanguage: parsed.data.preferredLanguage,
  photoUrls: stored.map((s) => s.url), // Vision analysis
});
```

### 2. AI Analysis Process (Vision-First)

1. **Image Fetching**: Downloads images from storage URLs (up to 3 images)
2. **Base64 Conversion**: Converts images to base64 for Claude API
3. **Vision Analysis** (PRIMARY): Claude visually analyzes the images first
   - Examines photos for visible damage, issues, problems
   - Identifies what can be seen (e.g., "oil leak visible", "flat tire", "dashboard warning")
   - Uses visual evidence as PRIMARY basis for categorization
4. **Text Analysis** (SUPPLEMENTARY): Text description used to supplement visual findings
5. **Categorization**: Matches visual evidence to predefined categories
6. **Result Storage**: Saves category, tags, summary (describing what was seen), and confidence

### 3. Data Storage

Results are stored in the `repair_requests` table:
- `ai_category`: The selected category label
- `ai_tags`: Array of relevant tags
- `ai_summary`: Brief summary in user's preferred language
- `ai_confidence`: Confidence score (0-1)

## Historical Data & Analytics

All repair requests are categorized and stored, enabling:

- **Trend Analysis**: See which categories are most common
- **Problem Patterns**: Identify recurring issues
- **Fleet Health**: Track vehicle maintenance patterns
- **Resource Planning**: Allocate mechanics based on problem types

## Configuration

### Environment Variable

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Model Selection

The system uses `claude-3-haiku-20240307` for:
- **Speed**: Fast response times
- **Cost**: Lower API costs
- **Efficiency**: Energy-efficient processing
- **Vision**: Full image analysis support

## Fallback System

If the Claude API is unavailable or fails:
- Uses keyword-based classification
- Matches description text to category cues
- Still provides categorization (lower accuracy)
- Ensures system continues working

## API Response Format

```typescript
{
  category: "Engine / Powertrain",
  tags: ["engine", "Engine diagnostic"],
  summary: "Engine stalling issue detected. Requires diagnostic inspection.",
  confidence: 0.85,
  serviceType: "Engine diagnostic"
}
```

## Vision-First Analysis Details

### How Visual Analysis Works

1. **Images are processed FIRST** - Images are inserted at the beginning of the content array
2. **Prompt emphasizes visual analysis** - Explicitly instructs Claude to:
   - Examine photos carefully for visible problems
   - Look for specific visual indicators (leaks, cracks, warning lights, etc.)
   - Trust what is seen in images over text description
   - Describe what is visible in the photos
3. **Higher confidence with images** - When clear visual evidence exists, confidence scores are higher
4. **Summary describes visual findings** - The AI summary describes what was seen in the images

### Example Visual Analysis

**Input**: Photo showing oil leak under engine
**AI Analysis**:
- **Category**: Fluids / Leaks
- **Summary**: "Oil leak visible under engine compartment. Dark fluid pooling indicates engine oil leak requiring immediate inspection."
- **Confidence**: 0.92 (high - clear visual evidence)

## Usage in UI

The AI category (based on visual analysis) is displayed throughout the application:
- **Repairs Page**: Shows category badge next to urgency
- **Dashboard**: Displays category in repair request cards
- **Service Reports**: Pre-fills service type from category
- **Bookings**: Uses category for service type selection

## Future Enhancements

Potential improvements:
- Custom category training based on historical data
- Multi-image analysis with priority ranking
- Confidence threshold alerts for manual review
- Category-specific routing to specialized mechanics
- Predictive maintenance suggestions

## Troubleshooting

### API Key Issues
- Verify `ANTHROPIC_API_KEY` is set in `.env.local`
- Restart dev server after adding key
- Check API key is valid at https://console.anthropic.com/

### Image Analysis Not Working
- Check image URLs are accessible
- Verify images are uploaded successfully
- Check network connectivity for image fetching
- Review console logs for fetch errors

### Fallback Being Used
- Check API key is correct
- Verify API quota/limits
- Review error logs for API failures
- System will automatically use fallback

---

**Last Updated**: December 2024
**Model**: Claude 3 Haiku (20240307)
**Status**: ✅ Active and configured

