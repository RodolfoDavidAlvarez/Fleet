"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, Save, MessageSquare, Users, Bell, Mail, Calendar, Edit2, Trash2, Copy, Eye, Search, X } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject?: string;
  message_en: string;
  message_es?: string;
  type: "email" | "sms" | "both";
  category: string;
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "mechanic" | "driver" | "customer";
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeView, setActiveView] = useState<"compose" | "templates">("compose");
  const [messageType, setMessageType] = useState<"email" | "sms" | "both">("email");
  const [sendType, setSendType] = useState<"onetime" | "template">("onetime");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [customRecipients, setCustomRecipients] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberSearch, setShowMemberSearch] = useState(false);

  const [formData, setFormData] = useState({
    templateName: "",
    subject: "",
    message: "",
    category: "announcement",
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    if (parsedUser.approval_status !== "approved") {
      router.push("/dashboard");
      return;
    }
    setUser(parsedUser);
    loadTemplates();
    loadMembers();
  }, [router]);

  const loadTemplates = async () => {
    try {
      const res = await fetch("/api/admin/message-templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading members:", err);
    }
  };

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query) || (member.phone && member.phone.includes(query));
  });

  const handleToggleMember = (member: Member) => {
    const isSelected = selectedMembers.some((m) => m.id === member.id);
    if (isSelected) {
      setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const handleSendMessage = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate
      if (recipients.length === 0 && selectedMembers.length === 0 && !customRecipients.trim()) {
        throw new Error("Please select at least one recipient");
      }
      if (!formData.message.trim()) {
        throw new Error("Please enter a message");
      }
      if (messageType === "email" && !formData.subject.trim()) {
        throw new Error("Email subject is required");
      }

      // Build recipient lists
      const individualRecipients = selectedMembers.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        phone: m.phone,
      }));

      const res = await fetch("/api/admin/send-announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: messageType,
          recipientGroups: recipients,
          individualRecipients,
          customRecipients: customRecipients.trim() ? customRecipients.split(",").map((r) => r.trim()) : [],
          subject: formData.subject,
          messageEn: formData.message,
          messageEs: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setSuccess(`Message sent successfully to ${data.sentCount} recipient(s)`);

      // Reset form if one-time send
      if (sendType === "onetime") {
        setFormData({
          templateName: "",
          subject: "",
          message: "",
          category: "announcement",
        });
        setRecipients([]);
        setSelectedMembers([]);
        setCustomRecipients("");
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!formData.templateName.trim()) {
        throw new Error("Template name is required");
      }
      if (!formData.message.trim()) {
        throw new Error("Message content is required");
      }

      const res = await fetch("/api/admin/message-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.templateName,
          subject: formData.subject,
          messageEn: formData.message,
          messageEs: "",
          type: messageType,
          category: formData.category,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save template");

      setSuccess("Template saved successfully");
      loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = (template: Template) => {
    setFormData({
      templateName: template.name,
      subject: template.subject || "",
      message: template.message_en,
      category: template.category,
    });
    setMessageType(template.type);
    setSelectedTemplate(template);
    setActiveView("compose");
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/admin/message-templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete template");
      setSuccess("Template deleted successfully");
      loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  const recipientGroups = [
    { id: "all_admins", label: "All Admins", icon: Users, count: "5" },
    { id: "all_mechanics", label: "All Mechanics", icon: Users, count: "12" },
    { id: "all_drivers", label: "All Drivers", icon: Users, count: "48" },
    { id: "pending_users", label: "Pending Approval", icon: Users, count: "3" },
  ];

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userName={user.name} userRole={user.role} userEmail={user.email} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements & Messaging</h1>
              <p className="text-gray-600">Send one-time messages or create reusable templates</p>
            </div>

            {/* View Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveView("compose")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === "compose"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Compose Message</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveView("templates")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeView === "templates"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Save className="w-5 h-5" />
                    <span>Saved Templates ({templates.length})</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            {/* Compose View */}
            {activeView === "compose" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Settings */}
                <div className="space-y-6">
                  {/* Message Type */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Type</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          checked={messageType === "email"}
                          onChange={() => setMessageType("email")}
                          className="w-4 h-4 text-primary-600"
                        />
                        <Mail className="w-5 h-5 ml-3 mr-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Email Only</span>
                      </label>
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          checked={messageType === "sms"}
                          onChange={() => setMessageType("sms")}
                          className="w-4 h-4 text-primary-600"
                        />
                        <MessageSquare className="w-5 h-5 ml-3 mr-2 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">SMS Only</span>
                      </label>
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          checked={messageType === "both"}
                          onChange={() => setMessageType("both")}
                          className="w-4 h-4 text-primary-600"
                        />
                        <Bell className="w-5 h-5 ml-3 mr-2 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Email & SMS</span>
                      </label>
                    </div>
                  </div>

                  {/* Send Type */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Action</h3>
                    <div className="space-y-3">
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          checked={sendType === "onetime"}
                          onChange={() => setSendType("onetime")}
                          className="w-4 h-4 text-primary-600"
                        />
                        <Send className="w-5 h-5 ml-3 mr-2 text-blue-600" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 block">Send One-Time</span>
                          <span className="text-xs text-gray-500">Send now, don't save</span>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          checked={sendType === "template"}
                          onChange={() => setSendType("template")}
                          className="w-4 h-4 text-primary-600"
                        />
                        <Save className="w-5 h-5 ml-3 mr-2 text-green-600" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900 block">Save as Template</span>
                          <span className="text-xs text-gray-500">Save for future use</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Recipients */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recipients</h3>
                      {(messageType === "sms" || messageType === "both") && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          SMS
                        </span>
                      )}
                    </div>

                    {/* Group Selection */}
                    <div className="space-y-2 mb-4">
                      {recipientGroups.map((group) => (
                        <label key={group.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={recipients.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRecipients([...recipients, group.id]);
                              } else {
                                setRecipients(recipients.filter((r) => r !== group.id));
                              }
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                          />
                          <group.icon className="w-4 h-4 ml-3 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-900 flex-1">{group.label}</span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{group.count}</span>
                        </label>
                      ))}
                    </div>

                    {/* Search Members */}
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowMemberSearch(!showMemberSearch)}
                        className="w-full flex items-center justify-between p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors mb-3"
                      >
                        <span className="text-sm font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Search & Select Members
                        </span>
                        <span className="text-xs bg-primary-200 px-2 py-1 rounded-full">{selectedMembers.length} selected</span>
                      </button>

                      {showMemberSearch && (
                        <div className="mb-4 border border-gray-200 rounded-lg p-3 bg-gray-50">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-3 bg-white transition-colors"
                          />
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {filteredMembers.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">No members found</p>
                            ) : (
                              filteredMembers.map((member) => {
                                const isSelected = selectedMembers.some((m) => m.id === member.id);
                                const hasPhone = member.phone && member.phone.trim();
                                const showWarning = (messageType === "sms" || messageType === "both") && !hasPhone;

                                return (
                                  <label
                                    key={member.id}
                                    className={`flex items-start p-2 rounded-lg cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-primary-100 border-2 border-primary-300"
                                        : "bg-white hover:bg-gray-50 border-2 border-transparent"
                                    } ${showWarning ? "opacity-50" : ""}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleToggleMember(member)}
                                      disabled={showWarning}
                                      className="w-4 h-4 text-primary-600 rounded mt-0.5"
                                    />
                                    <div className="ml-3 flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                            member.role === "admin"
                                              ? "bg-purple-100 text-purple-700"
                                              : member.role === "mechanic"
                                                ? "bg-blue-100 text-blue-700"
                                                : member.role === "driver"
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-gray-100 text-gray-700"
                                          }`}
                                        >
                                          {member.role}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 truncate">{member.email}</p>
                                      {(messageType === "sms" || messageType === "both") && (
                                        <div className="flex items-center gap-1 mt-1">
                                          {hasPhone ? (
                                            <>
                                              <MessageSquare className="w-3 h-3 text-green-600" />
                                              <p className="text-xs text-green-700 font-medium">{member.phone}</p>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-xs text-red-600 font-medium">⚠️ No phone number</span>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Selected Members Display */}
                      {selectedMembers.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-blue-900">Selected Members ({selectedMembers.length})</h4>
                            <button onClick={() => setSelectedMembers([])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {selectedMembers.map((member) => (
                              <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                                  {(messageType === "sms" || messageType === "both") && member.phone ? (
                                    <p className="text-xs text-green-700 flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {member.phone}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-600 truncate">{member.email}</p>
                                  )}
                                </div>
                                <button onClick={() => handleToggleMember(member)} className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Recipients
                        {(messageType === "sms" || messageType === "both") && (
                          <span className="ml-2 text-xs text-green-600 font-normal">(Phone numbers for SMS)</span>
                        )}
                      </label>
                      <textarea
                        value={customRecipients}
                        onChange={(e) => setCustomRecipients(e.target.value)}
                        placeholder={
                          messageType === "sms"
                            ? "Enter phone numbers, comma-separated (e.g., +1234567890, +0987654321)"
                            : "Enter emails or phone numbers, comma-separated"
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {messageType === "sms" ? "For SMS: +1234567890, +0987654321" : "e.g., user@example.com, +1234567890"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Message Composer */}
                <div className="lg:col-span-2 space-y-6">
                  {/* SMS Mode Banner */}
                  {(messageType === "sms" || messageType === "both") && (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">SMS Messaging Active</h4>
                          <p className="text-sm text-green-50">
                            {messageType === "both"
                              ? "Messages will be sent via both Email & SMS. Ensure recipients have phone numbers."
                              : "Messages will be sent via SMS. Only recipients with phone numbers will receive messages."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="mb-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">Compose Your Message</h3>
                      <p className="text-sm text-gray-600">Create your announcement or notification</p>
                    </div>

                    <div className="space-y-5">
                      {/* Template Name (only if saving) */}
                      {sendType === "template" && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Template Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.templateName}
                            onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                            placeholder="e.g., Weekly Update Template"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          />
                        </div>
                      )}

                      {/* Category (only if saving) */}
                      {sendType === "template" && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          >
                            <option value="announcement">Announcement</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="urgent">Urgent</option>
                            <option value="reminder">Reminder</option>
                            <option value="update">Update</option>
                          </select>
                        </div>
                      )}

                      {/* Subject (for email) */}
                      {(messageType === "email" || messageType === "both") && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Subject <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Enter email subject"
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          />
                        </div>
                      )}

                      {/* Message */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="Enter your message..."
                          rows={12}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          {formData.message.length} characters
                          {messageType !== "email" && formData.message.length > 160 && (
                            <span className="text-orange-600 ml-2">⚠️ SMS may be split into multiple messages</span>
                          )}
                        </p>
                      </div>

                      {/* Preview Button */}
                      <button
                        onClick={() => setShowPreview(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Preview Message
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {sendType === "onetime" ? (
                        <button
                          onClick={handleSendMessage}
                          disabled={sending || !formData.message.trim()}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          <Send className="w-5 h-5" />
                          {sending ? "Sending..." : "Send Now"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handleSaveTemplate}
                            disabled={saving || !formData.templateName.trim() || !formData.message.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            <Save className="w-5 h-5" />
                            {saving ? "Saving..." : "Save Template"}
                          </button>
                          <button
                            onClick={handleSendMessage}
                            disabled={sending || !formData.message.trim()}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all"
                          >
                            <Send className="w-5 h-5" />
                            {sending ? "Sending..." : "Save & Send"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Templates View */}
            {activeView === "templates" && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {templates.length === 0 ? (
                  <div className="p-12 text-center">
                    <Save className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
                    <p className="text-gray-600 mb-6">Create your first message template to get started</p>
                    <button
                      onClick={() => setActiveView("compose")}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                    >
                      Create Template
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {templates.map((template) => (
                      <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">{template.category}</span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  template.type === "email"
                                    ? "bg-blue-100 text-blue-800"
                                    : template.type === "sms"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {template.type === "both" ? "Email & SMS" : template.type.toUpperCase()}
                              </span>
                            </div>
                            {template.subject && <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>}
                            <p className="text-sm text-gray-700 line-clamp-2">{template.message_en}</p>
                            <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(template.updated_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleLoadTemplate(template)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Use template"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete template"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Message Preview</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {(messageType === "email" || messageType === "both") && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Email Preview</h4>
                  </div>
                  {formData.subject && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-600">Subject: </span>
                      <span className="text-sm text-gray-900">{formData.subject}</span>
                    </div>
                  )}
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.message}</p>
                  </div>
                </div>
              )}
              {(messageType === "sms" || messageType === "both") && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">SMS Preview</h4>
                  </div>
                  <div className="max-w-xs bg-green-100 p-4 rounded-2xl rounded-tl-none">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{formData.message}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
