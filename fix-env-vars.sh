#!/bin/bash

# Script to add missing Supabase environment variables to .env.local

ENV_FILE=".env.local"

echo "=== Fixing Environment Variables ==="
echo ""

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating $ENV_FILE..."
    touch "$ENV_FILE"
fi

# Add Supabase variables if they don't exist
echo "Adding Supabase configuration..."

# Check and add NEXT_PUBLIC_SUPABASE_URL
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE"; then
    echo "" >> "$ENV_FILE"
    echo "# Supabase Configuration" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://kxcixjiafdohbpwijfmd.supabase.co" >> "$ENV_FILE"
    echo "✅ Added NEXT_PUBLIC_SUPABASE_URL"
else
    echo "✓ NEXT_PUBLIC_SUPABASE_URL already exists"
fi

# Check and add NEXT_PUBLIC_SUPABASE_ANON_KEY
if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ENV_FILE"; then
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4Y2l4amlhZmRvaGJwd2lqZm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMzc3NTAsImV4cCI6MjA3OTcxMzc1MH0.KWXHkYzRWBgbBbKreSGLLVAkfg_LsaaO0_cNI8GzdQs" >> "$ENV_FILE"
    echo "✅ Added NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
    echo "✓ NEXT_PUBLIC_SUPABASE_ANON_KEY already exists"
fi

# Check and add SUPABASE_SERVICE_ROLE_KEY placeholder
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" "$ENV_FILE"; then
    echo "SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE" >> "$ENV_FILE"
    echo "✅ Added SUPABASE_SERVICE_ROLE_KEY (NEEDS TO BE FILLED IN)"
    echo ""
    echo "⚠️  IMPORTANT: You need to get your SUPABASE_SERVICE_ROLE_KEY from:"
    echo "   1. Go to: https://kxcixjiafdohbpwijfmd.supabase.co"
    echo "   2. Navigate to: Settings > API"
    echo "   3. Copy the 'service_role' key (keep it secret!)"
    echo "   4. Replace 'YOUR_SERVICE_ROLE_KEY_HERE' in $ENV_FILE"
else
    echo "✓ SUPABASE_SERVICE_ROLE_KEY already exists"
    if grep -q "YOUR_SERVICE_ROLE_KEY_HERE" "$ENV_FILE"; then
        echo "⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY still has placeholder value!"
    fi
fi

echo ""
echo "=== Environment Variables Status ==="
echo ""
echo "Current $ENV_FILE contents:"
echo "---"
cat "$ENV_FILE"
echo "---"
echo ""
echo "Next steps:"
echo "1. If SUPABASE_SERVICE_ROLE_KEY has a placeholder, replace it with your actual key"
echo "2. Restart your dev server: npm run dev"
echo "3. Test the connection: node test-db-connection.js"







