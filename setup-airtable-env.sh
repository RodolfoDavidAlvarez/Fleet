#!/bin/bash

# Script to set up Airtable environment variables
# Run this script: bash setup-airtable-env.sh

ENV_FILE=".env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE file..."
    touch "$ENV_FILE"
fi

# Add Airtable configuration if not already present
if ! grep -q "AIRTABLE_API_KEY" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# Airtable Configuration" >> "$ENV_FILE"
    echo "AIRTABLE_API_KEY=your_airtable_api_key_here" >> "$ENV_FILE"
    echo "AIRTABLE_BASE_ID=your_airtable_base_id_here" >> "$ENV_FILE"
    echo "✅ Airtable credentials added to $ENV_FILE"
else
    echo "⚠️  AIRTABLE_API_KEY already exists in $ENV_FILE"
    echo "Please update it manually if needed."
fi

echo ""
echo "Setup complete! You can now run: npm run dev"
echo "Then visit: http://localhost:3000/api/airtable/explore?action=tables"

