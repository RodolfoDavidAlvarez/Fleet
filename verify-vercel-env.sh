#!/bin/bash

# Script to verify Vercel environment variables are set correctly
# This script helps you check if all required credentials are configured

echo "🔍 Vercel Environment Variables Verification"
echo "=============================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI is not installed."
    echo "   Install it with: npm i -g vercel"
    echo ""
    echo "📋 Manual Verification Steps:"
    echo "   1. Go to: https://vercel.com/dashboard"
    echo "   2. Select project: fleet-management-system-c7t0cfntn"
    echo "   3. Go to: Settings → Environment Variables"
    echo "   4. Verify all required variables are set for PRODUCTION"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "NEXT_PUBLIC_APP_URL"
    "RESEND_API_KEY"
    "RESEND_FROM_EMAIL"
    "ENABLE_EMAIL"
)

OPTIONAL_VARS=(
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
    "TWILIO_PHONE_NUMBER"
    "ANTHROPIC_API_KEY"
    "AIRTABLE_API_KEY"
    "AIRTABLE_BASE_ID"
    "JWT_SECRET"
)

echo "📋 Checking required environment variables..."
echo ""

# Note: Vercel CLI doesn't directly expose env vars for security
# So we'll provide manual verification steps
echo "⚠️  Note: Vercel CLI doesn't expose environment variable values for security."
echo "   Use the Vercel Dashboard to verify values."
echo ""
echo "🔗 Quick Links:"
echo "   Dashboard: https://vercel.com/dashboard"
echo "   Project Settings: https://vercel.com/dashboard/[your-team]/fleet-management-system-c7t0cfntn/settings/environment-variables"
echo ""
echo "✅ Required Variables (must be set for PRODUCTION):"
for var in "${REQUIRED_VARS[@]}"; do
    echo "   - $var"
done
echo ""
echo "⚙️  Optional Variables (recommended):"
for var in "${OPTIONAL_VARS[@]}"; do
    echo "   - $var"
done
echo ""
echo "📝 Verification Checklist:"
echo "   [ ] All required variables are present"
echo "   [ ] All variables are set for PRODUCTION environment"
echo "   [ ] NEXT_PUBLIC_SUPABASE_URL = https://kxcixjiafdohbpwijfmd.supabase.co"
echo "   [ ] NEXT_PUBLIC_APP_URL = https://fleet-management-system-c7t0cfntn.vercel.app"
echo "   [ ] SUPABASE_SERVICE_ROLE_KEY is set (not placeholder)"
echo "   [ ] RESEND_API_KEY is valid"
echo "   [ ] ENABLE_EMAIL = true"
echo ""
echo "🚀 After verifying, redeploy your application:"
echo "   - Go to Deployments tab"
echo "   - Click 'Redeploy' on latest deployment"
echo "   - OR push a new commit to trigger deployment"
echo ""
