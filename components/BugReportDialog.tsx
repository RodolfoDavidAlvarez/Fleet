"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, AlertCircle, CheckCircle, Loader, Clock, PlayCircle, Eye, Send, FileText, Image as ImageIcon } from "lucide-react";

interface BugReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  description: string;
  screenshot: File | null;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  created_at: string;
  screenshot_url?: string;
}

export default function BugReportDialog({ isOpen, onClose, onSuccess }: BugReportDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    screenshot: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [openTickets, setOpenTickets] = useState<BugReport[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchOpenTickets();
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    // Create preview URL for uploaded image
    if (formData.screenshot) {
      const url = URL.createObjectURL(formData.screenshot);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.screenshot]);

  const fetchOpenTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await fetch("/api/bug-reports");
      const data = await response.json();
      if (response.ok) {
        // Filter for open tickets (not resolved or closed)
        const open = (data.reports || []).filter((r: BugReport) => r.status === "pending" || r.status === "in_progress");
        setOpenTickets(open);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({ ...prev, screenshot: file }));
      } else {
        setError("Please upload an image file (PNG, JPG, etc.)");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({ ...prev, screenshot: file }));
      } else {
        setError("Please upload an image file (PNG, JPG, etc.)");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate
      if (!formData.title.trim()) {
        throw new Error("Please provide a title");
      }
      if (!formData.description.trim()) {
        throw new Error("Please provide a description");
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      if (formData.screenshot) {
        submitData.append("screenshot", formData.screenshot);
      }

      const response = await fetch("/api/bug-reports", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit bug report");
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        setFormData({ title: "", description: "", screenshot: null });
        setSuccess(false);
        setShowPreview(false);
        onClose();
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bug report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ title: "", description: "", screenshot: null });
      setError(null);
      setSuccess(false);
      setShowPreview(false);
      onClose();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-600" />;
      case "in_progress":
        return <PlayCircle className="h-3 w-3 text-blue-600" />;
      case "resolved":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${classes[status as keyof typeof classes] || classes.pending}`}
      >
        {getStatusIcon(status)}
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    }
  };

  const dialogContent = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity animate-fade-in" onClick={handleClose} />

      {/* Sidebar Container - Slides in from right */}
      <div className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl animate-slide-in-right">
        <div className="bg-white h-full shadow-2xl flex flex-col overflow-hidden relative">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Report an Issue</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <strong className="text-orange-600">Important:</strong> Submit one ticket per error for faster resolution
                </p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/50 rounded-lg transition-colors" disabled={isSubmitting}>
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content - Two Column Layout */}
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Left Column - Form */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 border-r border-gray-200 min-w-0">
              {!showPreview ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setShowPreview(true);
                  }}
                  className="space-y-5"
                >
                  {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-fade-in">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-red-800 text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Issue Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 transition-all"
                      placeholder="Brief summary of the issue"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 transition-all resize-none"
                      placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior..."
                      rows={8}
                      required
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Screenshot (Optional)</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
                        isDragging ? "border-primary-500 bg-primary-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"
                      }`}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                      {formData.screenshot ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{formData.screenshot.name}</p>
                                <p className="text-xs text-gray-500">{(formData.screenshot.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, screenshot: null }))}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                          {previewUrl && (
                            <img src={previewUrl} alt="Preview" className="w-full rounded-lg border border-gray-200 max-h-48 object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Drag and drop your screenshot here</p>
                          <p className="text-xs text-gray-500 mb-3">or</p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                          >
                            Browse Files
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Preview Button */}
                  <button
                    type="submit"
                    className="w-full px-4 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    disabled={!formData.title.trim() || !formData.description.trim()}
                  >
                    <Eye className="h-4 w-4" />
                    Preview & Submit
                  </button>
                </form>
              ) : (
                // Preview Mode
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between sticky top-0 bg-white pb-4 border-b border-gray-200 z-10">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Preview Your Report
                    </h3>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                      disabled={isSubmitting || success}
                    >
                      Edit
                    </button>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-fade-in">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-red-800 text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg animate-fade-in">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                        <p className="text-green-800 text-sm font-medium">Bug report submitted successfully!</p>
                      </div>
                    </div>
                  )}

                  {/* Preview Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Title</p>
                      <h4 className="text-xl font-bold text-gray-900 break-words">{formData.title}</h4>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Description</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{formData.description}</p>
                    </div>

                    {previewUrl && (
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-2 flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          Screenshot
                        </p>
                        <div className="relative w-full rounded-lg border-2 border-gray-300 shadow-sm overflow-hidden bg-gray-100">
                          <img src={previewUrl} alt="Screenshot preview" className="w-full h-auto max-h-96 object-contain" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSubmit}
                      className="w-full px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      disabled={isSubmitting || success}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="animate-spin h-4 w-4" />
                          Submitting...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Submitted!
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Open Tickets */}
            <div className="w-full lg:w-96 bg-gray-50 p-4 sm:p-6 overflow-y-auto flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Your Open Tickets</h3>
                <p className="text-xs text-gray-600">Track your pending and in-progress issues</p>
              </div>

              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="h-6 w-6 text-primary-600 animate-spin" />
                </div>
              ) : openTickets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">No open tickets</p>
                  <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 flex-1">{ticket.title}</h4>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                      <p className="text-xs text-gray-500">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDate(ticket.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(dialogContent, document.body);
}
