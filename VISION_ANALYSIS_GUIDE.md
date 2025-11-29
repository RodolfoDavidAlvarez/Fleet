# Vision-First Analysis System Guide

## 🎯 Core Principle: **VISUAL ANALYSIS IS PRIMARY**

This system is designed as a **vision-first analysis tool**. When photos are provided, the AI analyzes what it **SEES** in the images as the primary method of categorizing repair requests.

## How It Works

### 1. Image Priority

- **Images are processed FIRST** before text
- Images are inserted at the beginning of the content array
- Claude sees and analyzes images before reading the text description

### 2. Visual Analysis Instructions

The AI is explicitly instructed to:

- **Examine photos carefully** for visible damage, issues, or problems
- **Look for specific visual indicators**:
  - Leaks (oil, coolant, fluid)
  - Cracks (windshield, body panels)
  - Dents and body damage
  - Warning lights (dashboard indicators)
  - Tire issues (flat, worn, damaged)
  - Engine problems (smoke, visible damage)
  - Electrical issues (visible wiring problems)
  - Safety equipment issues

### 3. Visual Evidence as Primary Source

- **Trust what you see** in images over text description
- Use visual evidence as the PRIMARY basis for categorization
- Text description is supplementary context only

### 4. Output Describes Visual Findings

- Summary describes **what was seen** in the images
- Higher confidence scores when visual evidence is clear
- Categories are based on visual evidence when available

## Example Workflows

### Scenario 1: Photo Shows Oil Leak

**Input**:

- Photo: Oil pooling under engine
- Text: "Something leaking"

**AI Analysis**:

- **Visual**: "Dark fluid visible pooling under engine compartment"
- **Category**: Fluids / Leaks
- **Confidence**: 0.95 (very high - clear visual evidence)
- **Summary**: "Engine oil leak visible in photo. Dark fluid pooling indicates oil leak requiring immediate inspection."

### Scenario 2: Photo Shows Flat Tire

**Input**:

- Photo: Flat tire, rim visible
- Text: "Can't drive"

**AI Analysis**:

- **Visual**: "Tire completely deflated, rim in contact with ground"
- **Category**: Tires / Brakes
- **Confidence**: 0.98 (very high - obvious visual problem)
- **Summary**: "Flat tire visible in photo. Tire is completely deflated requiring immediate replacement."

### Scenario 3: Dashboard Warning Light

**Input**:

- Photo: Dashboard showing check engine light
- Text: "Warning light on"

**AI Analysis**:

- **Visual**: "Check engine warning light illuminated on dashboard"
- **Category**: Warning lights
- **Confidence**: 0.90 (high - clear visual indicator)
- **Summary**: "Check engine warning light visible in dashboard photo. Requires diagnostic scan to identify issue."

## Best Practices

### For Drivers Submitting Requests

1. **Take clear photos** of the problem
2. **Multiple angles** help (up to 3 photos)
3. **Good lighting** improves analysis accuracy
4. **Focus on the problem area** (close-up if safe)
5. **Include context** (wider shot showing location)

### For System Administrators

1. **Encourage photo uploads** - Visual analysis is more accurate
2. **Monitor confidence scores** - Lower scores may need manual review
3. **Review categories** - Ensure visual analysis is working correctly
4. **Track patterns** - Use historical data to improve categories

## Technical Details

### Image Processing

- Maximum 3 images per request (for efficiency)
- Images converted to base64 for Claude API
- 10-second timeout per image fetch
- Supports: JPEG, PNG, WebP formats

### Prompt Structure

```
1. Images (if provided) - PROCESSED FIRST
2. Text prompt with visual analysis instructions
3. Category list
4. Response format requirements
```

### Confidence Scoring

- **0.9-1.0**: Very clear visual evidence
- **0.7-0.9**: Good visual evidence
- **0.5-0.7**: Some visual evidence or unclear
- **<0.5**: Limited visual evidence, relying on text

## Troubleshooting

### Issue: Low confidence scores

**Possible causes**:

- Images are unclear or blurry
- Problem not visible in photos
- Multiple possible issues in images

**Solution**: Encourage better photos or manual review

### Issue: Category doesn't match visual evidence

**Possible causes**:

- Image quality too low
- Problem not clearly visible
- Ambiguous visual evidence

**Solution**: Review the specific case, may need manual categorization

### Issue: Images not being analyzed

**Check**:

1. Images uploaded successfully?
2. Image URLs accessible?
3. API logs show image processing?
4. Check for fetch errors in logs

## Future Enhancements

1. **Image quality scoring** - Warn if images are too blurry
2. **Multi-angle analysis** - Better analysis with multiple views
3. **Problem area highlighting** - Identify specific problem locations
4. **Visual comparison** - Compare with "normal" vehicle state
5. **Augmented reality** - Real-time visual analysis

---

**Remember**: This is a **VISION-FIRST** system. The images are the primary source of truth for categorization.
