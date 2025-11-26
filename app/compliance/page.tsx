'use client'

import Link from 'next/link'
import { ShieldCheck, MessageSquare, PhoneCall, Bell, FileText, ArrowLeft } from 'lucide-react'

const commitments = [
  'Plain-language consent at every opt-in moment',
  'Clear HELP/STOP instructions and easy opt-out',
  'No data reselling — only operational messaging',
  'Rate limits and quiet hours to avoid spam',
  'Traceable audit trail of bookings and consent',
]

const keywords = [
  { keyword: 'HELP', detail: 'Get support and learn how to manage messaging preferences.' },
  { keyword: 'STOP', detail: 'Immediately opts out of all non-essential SMS notifications.' },
  { keyword: 'START', detail: 'Re-enables SMS updates after an opt-out.' },
]

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <header className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center text-primary-700 hover:text-primary-800 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back home
          </Link>
          <span className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
            SMS Compliance & Consent
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8 items-start">
          <div className="glass rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="h-10 w-10 text-primary-600" />
              <div>
                <p className="text-sm text-primary-700 font-semibold uppercase tracking-wide">Trust first</p>
                <h1 className="text-3xl font-bold text-gray-900">SMS, done the compliant way</h1>
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              We follow Twilio and carrier best practices for A2P messaging. Every booking and status
              update is tied to explicit consent, with easy opt-out and clear retention rules.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {commitments.map((item) => (
                <div key={item} className="card-surface p-4 flex items-start gap-3 rounded-xl">
                  <div className="mt-1">
                    <ShieldCheck className="h-5 w-5 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-5 card-surface rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Opt-out keywords we honor</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {keywords.map(({ keyword, detail }) => (
                  <div key={keyword} className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="font-semibold text-gray-900 tracking-wide text-xs">{keyword}</p>
                    <p className="text-xs text-gray-600 mt-1 max-w-xs">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-surface p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <PhoneCall className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">What we send</h3>
              </div>
              <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                <li>Booking confirmations and schedule reminders</li>
                <li>Status updates during active service jobs</li>
                <li>Job completion receipts (when enabled)</li>
                <li>No promotions without separate marketing opt-in</li>
              </ul>
            </div>

            <div className="card-surface p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <Bell className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Consent rules</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>We collect explicit consent during booking.</li>
                <li>Every message includes HELP/STOP guidance.</li>
                <li>Opt-outs are respected instantly for non-critical SMS.</li>
                <li>Service-critical updates honor local quiet hours.</li>
              </ul>
            </div>

            <div className="card-surface p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900">Data handling</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>SMS logs kept only for operational auditing.</li>
                <li>No sharing or reselling of phone numbers.</li>
                <li>Encryption in transit via HTTPS for every API call.</li>
                <li>PII redaction in alerts and dashboards when possible.</li>
              </ul>
            </div>

            <div className="card-surface p-6 rounded-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Need help?</h3>
              <p className="text-sm text-gray-700 mb-4">
                Reach us for privacy inquiries or opt-out support:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Email: <a className="text-primary-700 font-semibold" href="mailto:support@fleetpro.com">support@fleetpro.com</a></li>
                <li>SMS keywords: HELP or STOP</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/booking"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700"
                >
                  Book with consent
                </Link>
                <a
                  href="https://www.twilio.com/legal/service-terms"
                  className="text-primary-700 hover:text-primary-800 font-semibold"
                  target="_blank"
                  rel="noreferrer"
                >
                  Twilio service terms →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
