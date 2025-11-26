#!/bin/bash
# Quick script to add your Airtable API key to .env.local

echo "🔑 Setting up Airtable credentials..."
echo ""
echo "1. Go to: https://airtable.com/create/tokens"
echo "2. Click 'Create new token'"
echo "3. Name it: 'Fleet Management Import'"
echo "4. Grant access to your base (appms3yBT9I2DEGl3)"
echo "5. Copy the token (starts with 'pat...')"
echo ""

read -p "Enter your Airtable API key: " AIRTABLE_KEY

if [[ $AIRTABLE_KEY == pat* ]]; then
    echo "" >> .env.local
    echo "# Airtable Configuration" >> .env.local
    echo "AIRTABLE_API_KEY=$AIRTABLE_KEY" >> .env.local
    echo "AIRTABLE_BASE_ID=appms3yBT9I2DEGl3" >> .env.local
    
    echo "✅ Airtable credentials added to .env.local"
    echo ""
    echo "Next: Run the Airtable exploration to see available tables:"
    echo "curl -X GET 'http://localhost:3000/api/airtable/explore?action=tables'"
else
    echo "❌ Invalid token format. Should start with 'pat...'"
    exit 1
fi