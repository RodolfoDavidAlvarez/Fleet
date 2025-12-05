#!/bin/bash
# Script to apply the notify_on_repair column migration to Supabase

set -e

echo "🚀 Applying notify_on_repair Migration"
echo "========================================"
echo ""

MIGRATION_FILE="supabase/migrations/20251210000000_add_notify_on_repair_column.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📋 Migration file: $MIGRATION_FILE"
echo ""

# Method 1: Using Supabase CLI (if available)
if command -v supabase &> /dev/null; then
    echo "📋 Method 1: Using Supabase CLI"
    echo "-------------------------------"
    echo "Attempting to apply migration via CLI..."
    echo ""
    
    if supabase db execute -f "$MIGRATION_FILE" 2>/dev/null; then
        echo "✅ Migration applied successfully via CLI!"
        exit 0
    else
        echo "⚠️  CLI execution requires authentication or project linking"
        echo ""
    fi
fi

# Method 2: Using SQL Editor (recommended)
echo "📋 Method 2: Apply via Supabase SQL Editor (Recommended)"
echo "--------------------------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/kxcixjiafdohbpwijfmd/sql/new"
echo "2. Copy and paste the SQL below"
echo "3. Click 'Run' (or press Cmd/Ctrl + Enter)"
echo ""
echo "Migration SQL:"
echo "========================================"
cat "$MIGRATION_FILE"
echo "========================================"
echo ""
echo "✅ After applying, verify with:"
echo "   SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'notify_on_repair';"
