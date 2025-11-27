#!/bin/bash
# Script to save database password and run migration

if [ -z "$1" ]; then
    echo "Usage: ./save-password-and-migrate.sh 'your_database_password'"
    exit 1
fi

PASSWORD="$1"
ENV_FILE=".env.local"

echo "🔐 Saving password to .env.local..."

# Check if SUPABASE_DB_PASSWORD already exists
if grep -q "SUPABASE_DB_PASSWORD" "$ENV_FILE"; then
    # Update existing password
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|SUPABASE_DB_PASSWORD=.*|SUPABASE_DB_PASSWORD='$PASSWORD'|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|SUPABASE_DB_PASSWORD=.*|SUPABASE_DB_PASSWORD='$PASSWORD'|" "$ENV_FILE"
    fi
    echo "✅ Updated SUPABASE_DB_PASSWORD in .env.local"
else
    # Add new password
    echo "" >> "$ENV_FILE"
    echo "# Supabase Database Password (for CLI migrations)" >> "$ENV_FILE"
    echo "SUPABASE_DB_PASSWORD='$PASSWORD'" >> "$ENV_FILE"
    echo "✅ Added SUPABASE_DB_PASSWORD to .env.local"
fi

echo ""
echo "🚀 Applying migration..."
export SUPABASE_DB_PASSWORD="$PASSWORD"
supabase db push --password "$PASSWORD"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "✅ Password saved to .env.local for future use"
    echo ""
    echo "Verify with:"
    echo "  SELECT column_name FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'booking_link_sent_at';"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

