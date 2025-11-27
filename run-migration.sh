#!/bin/bash
# Helper script to run the booking_link_sent_at migration

echo "🚀 Applying booking_link_sent_at Migration"
echo "=========================================="
echo ""

# Check if password is provided as argument
if [ -z "$1" ]; then
    echo "Usage: ./run-migration.sh YOUR_DATABASE_PASSWORD"
    echo ""
    echo "Or set it as environment variable:"
    echo "  export SUPABASE_DB_PASSWORD='your_password'"
    echo "  supabase db push"
    echo ""
    echo "Get your password from:"
    echo "  https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/settings/database"
    exit 1
fi

echo "✅ Applying migration..."
supabase db push --password "$1"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration applied successfully!"
    echo ""
    echo "Verify with:"
    echo "  SELECT column_name FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'booking_link_sent_at';"
else
    echo ""
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

