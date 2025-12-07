import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  LogIn,
  Shield,
  Wrench,
  Calendar,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Users,
  Clock,
  DollarSign,
  Smartphone,
  FileText,
  AlertCircle,
  Zap,
  BarChart3,
  Settings,
} from "lucide-react";

export default async function Home() {
  // Server-side redirect for faster performance
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check user profile
    const { data: profile } = await supabase.from("users").select("role, approval_status").eq("id", user.id).single();

    if (profile?.approval_status === "approved" && (profile.role === "admin" || profile.role === "mechanic")) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="relative w-52 h-14">
                <Image
                  src="/images/AEC-Horizontal-Official-Logo-2020.png"
                  alt="Agave Environmental Contracting"
                  fill
                  className="object-contain object-left"
                  priority
                />
              </div>
            </div>

            {/* Center Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 font-semibold transition-colors">
                Features
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-primary-600 font-semibold transition-colors">
                Benefits
              </a>
              <a href="#capabilities" className="text-gray-700 hover:text-primary-600 font-semibold transition-colors">
                Capabilities
              </a>
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-4">
              <Link
                href="/repair"
                className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-primary-700 hover:text-primary-800 font-semibold transition-colors"
              >
                <AlertCircle className="h-5 w-5" />
                Submit Repair
              </Link>
              <Link
                href="/login"
                className="btn btn-primary px-8 py-3 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <LogIn className="h-5 w-5" />
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-primary-50 py-24 lg:py-32 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-primary-200 rounded-full mb-8 shadow-sm">
                <Shield className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-semibold text-gray-900">Professional Fleet Management</span>
              </div>

              <h1 className="text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Agave<span className="text-primary-600">Fleet</span>
              </h1>

              <p className="text-2xl text-gray-700 font-semibold mb-4">Streamline Operations. Serve Clients Better.</p>

              <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Unified platform replacing Airtable, Calendly, and JotForms. Automated repair requests, smart scheduling, and real-time tracking for
                Agave Environmental Contracting.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                <Link
                  href="/login"
                  className="group btn btn-primary px-10 py-4 flex items-center justify-center gap-3 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                >
                  <LogIn className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  Access System
                </Link>

                <Link
                  href="/repair"
                  className="group btn bg-white border-2 border-primary-600 text-primary-700 hover:bg-primary-50 px-10 py-4 flex items-center justify-center gap-3 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
                >
                  <AlertCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  Submit Repair
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { icon: Clock, label: "Booking Time", value: "5 min", color: "text-blue-600" },
                  { icon: MessageSquare, label: "SMS Delivery", value: "99.4%", color: "text-green-600" },
                  { icon: Zap, label: "Automation", value: "100%", color: "text-orange-600" },
                  { icon: Users, label: "Languages", value: "EN/ES", color: "text-purple-600" },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                      <Icon className={`h-6 w-6 ${stat.color} mb-2`} />
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600 font-medium">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              {/* Main Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                <div className="aspect-[4/3] relative">
                  <Image
                    src="https://images.unsplash.com/photo-1580273916550-e323be2ed5fa?auto=format&fit=crop&q=80&w=1200"
                    alt="Fleet Management"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-900/80 to-gray-900/60" />

                  {/* Overlay Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 w-full max-w-md">
                      <Zap className="h-12 w-12 text-primary-400 mb-4 mx-auto" />
                      <h3 className="text-3xl font-bold mb-4 text-center">Modern Fleet Solutions</h3>
                      <div className="space-y-3">
                        {["AI-Powered Categorization", "Automated SMS Workflows", "Real-Time Job Tracking", "Cost Analytics Dashboard"].map(
                          (feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-primary-400 flex-shrink-0" />
                              <span className="text-white font-medium">{feature}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 hidden lg:block">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">Trusted</div>
                    <div className="text-sm text-gray-600">By Agave Environmental</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-primary-100 border border-primary-200 rounded-full mb-4">
              <span className="text-sm font-bold text-primary-900">FEATURES</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Built for Every Team Member</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Tailored experiences designed for drivers, mechanics, and administrators</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "For Drivers",
                icon: Smartphone,
                gradient: "from-blue-500 to-blue-600",
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
                features: ["Submit repairs with photos", "Instant SMS booking links", "Real-time repair status", "Bilingual support (EN/ES)"],
              },
              {
                title: "For Mechanics",
                icon: Wrench,
                gradient: "from-orange-500 to-orange-600",
                bgColor: "bg-orange-50",
                iconColor: "text-orange-600",
                features: ["Assigned jobs dashboard", "Update status & notes", "Track parts & labor costs", "Access vehicle history"],
              },
              {
                title: "For Admins",
                icon: BarChart3,
                gradient: "from-primary-500 to-primary-600",
                bgColor: "bg-primary-50",
                iconColor: "text-primary-600",
                features: ["Fleet overview & analytics", "Assign jobs to mechanics", "Cost tracking per vehicle", "Automated notifications"],
              },
            ].map((role, i) => {
              const Icon = role.icon;
              return (
                <div
                  key={i}
                  className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-primary-200 overflow-hidden"
                >
                  <div className={`${role.bgColor} p-8 border-b border-gray-100`}>
                    <div
                      className={`h-20 w-20 bg-gradient-to-br ${role.gradient} rounded-2xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{role.title}</h3>
                  </div>
                  <ul className="p-8 space-y-4">
                    {role.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-primary-100 border border-primary-200 rounded-full mb-4">
              <span className="text-sm font-bold text-primary-900">BENEFITS</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">How AgaveFleet Improves Client Service</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Replacing fragmented systems with a unified platform that automates workflows and provides complete visibility
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600",
                title: "Faster Response",
                description: "Automated booking links sent via SMS—no more back-and-forth emails",
                metric: "5-min avg",
              },
              {
                icon: DollarSign,
                iconBg: "bg-green-100",
                iconColor: "text-green-600",
                title: "Cost Control",
                description: "Track maintenance costs per vehicle and predict budget needs",
                metric: "Full visibility",
              },
              {
                icon: Users,
                iconBg: "bg-purple-100",
                iconColor: "text-purple-600",
                title: "Better Coordination",
                description: "Real-time updates keep drivers, mechanics, and admins aligned",
                metric: "Live status",
              },
              {
                icon: MessageSquare,
                iconBg: "bg-orange-100",
                iconColor: "text-orange-600",
                title: "Client Confidence",
                description: "Instant confirmations and reminders build trust and reliability",
                metric: "99.4% delivery",
              },
            ].map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group">
                  <div
                    className={`h-16 w-16 ${benefit.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-8 w-8 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{benefit.description}</p>
                  <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-full">
                    <span className="text-sm font-bold text-primary-700">{benefit.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* System Capabilities */}
      <section id="capabilities" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-primary-100 border border-primary-200 rounded-full mb-4">
              <span className="text-sm font-bold text-primary-900">CAPABILITIES</span>
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6">Complete Fleet Management</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to manage your fleet efficiently in one unified platform</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Wrench,
                title: "Repair Management",
                desc: "Submit, track, and complete repairs with automated workflows",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Calendar,
                title: "Smart Scheduling",
                desc: "Automated booking links and 24-hour appointment reminders",
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                icon: TrendingUp,
                title: "Fleet Analytics",
                desc: "Cost tracking, performance metrics, and maintenance insights",
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: MessageSquare,
                title: "SMS Notifications",
                desc: "Automated confirmations and reminders with 99.4% delivery",
                color: "text-orange-600",
                bg: "bg-orange-50",
              },
              {
                icon: FileText,
                title: "Reports & Export",
                desc: "Export data, track costs, and analyze fleet performance",
                color: "text-pink-600",
                bg: "bg-pink-50",
              },
              {
                icon: Clock,
                title: "Real-Time Updates",
                desc: "Live status tracking across all vehicles and jobs",
                color: "text-indigo-600",
                bg: "bg-indigo-50",
              },
            ].map((capability, i) => {
              const Icon = capability.icon;
              return (
                <div
                  key={i}
                  className="group flex items-start gap-5 p-6 rounded-2xl bg-white border-2 border-gray-100 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
                >
                  <div
                    className={`h-14 w-14 ${capability.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`h-7 w-7 ${capability.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{capability.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{capability.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-block p-3 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-2xl text-primary-100 mb-12 max-w-2xl mx-auto">Access the AgaveFleet system or submit a repair request today</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/login"
              className="group btn bg-white text-primary-700 hover:bg-gray-50 px-12 py-5 flex items-center justify-center gap-3 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
            >
              <LogIn className="h-7 w-7 group-hover:scale-110 transition-transform" />
              Access System
            </Link>
            <Link
              href="/repair"
              className="group btn bg-primary-900 text-white border-3 border-white/30 hover:bg-primary-950 px-12 py-5 flex items-center justify-center gap-3 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
            >
              <AlertCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
              Submit Repair Request
            </Link>
          </div>
        </div>
      </section>

      {/* Better Systems AI Attribution */}
      <div className="py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex justify-center">
          <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl shadow-sm">
            <Settings className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-semibold text-primary-900">Developed by</span>
            <span className="text-sm font-bold text-primary-700">Better Systems AI</span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
