#!/bin/bash
# Script to apply the booking_link_sent_at migration to Supabase

set -e

echo "🚀 Applying booking_link_sent_at Migration"
echo "==========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

# Check if project is linked
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Project not linked. Please run:"
    echo "   supabase link --project-ref kxcixjiafdohbpwijfmd"
    exit 1
fi

echo "✅ Supabase CLI found"
echo "✅ Project is linked"
echo ""

# Read the migration file
MIGRATION_FILE="supabase/add_booking_link_sent_at.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file: $MIGRATION_FILE"
echo ""

# Method 1: Using Supabase CLI db execute (if available)
echo "📋 Method 1: Using Supabase CLI"
echo "-------------------------------"
echo "Attempting to apply migration via CLI..."
echo ""

# Try to execute via CLI
if supabase db execute -f "$MIGRATION_FILE" 2>/dev/null; then
    echo "✅ Migration applied successfully via CLI!"
    exit 0
fi

# Method 2: Using SQL Editor (fallback)
echo "⚠️  CLI execution not available or requires authentication"
echo ""
echo "📋 Method 2: Apply via Supabase SQL Editor (Recommended)"
echo "--------------------------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new"
echo "2. Copy and paste the SQL from: $MIGRATION_FILE"
echo "3. Click 'Run' (or press Cmd/Ctrl + Enter)"
echo ""
echo "Migration SQL:"
echo "----------------------------------------"
cat "$MIGRATION_FILE"
echo "----------------------------------------"
echo ""
echo "✅ After applying, verify with:"
echo "   SELECT column_name FROM information_schema.columns WHERE table_name = 'repair_requests' AND column_name = 'booking_link_sent_at';"

