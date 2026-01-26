"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Wrench } from "lucide-react";

/**
 * OUTDATED BOOKING PAGE
 * This page is no longer in use. The actual booking flow is:
 * 1. Driver submits repair request at /repair-request
 * 2. Admin triages and sends booking link via SMS
 * 3. Driver books via /booking-link/[id]
 *
 * Keeping this page as a redirect to avoid 404s from old links.
 */
export default function OutdatedBookingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Page Outdated</h1>
          <p className="text-gray-600">
            This booking page is no longer in use. Please use the repair request system instead.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <p className="text-sm text-amber-800 font-medium mb-2">How booking works now:</p>
          <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
            <li>Submit a repair request</li>
            <li>Receive a booking link via SMS</li>
            <li>Book your appointment through that link</li>
          </ol>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/repair-request"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-flex items-center justify-center gap-2 font-semibold"
          >
            <Wrench className="h-5 w-5" />
            Submit Repair Request
          </Link>
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 inline-flex items-center justify-center gap-2 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
