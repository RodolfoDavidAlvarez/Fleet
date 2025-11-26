'use client'

import { useState } from 'react';
import Link from 'next/link';

export default function DriverPage({
  searchParams,
}: {
  searchParams: { userId: string };
}) {
  const { userId } = searchParams;
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: userId || formData.get('driverId')?.toString(),
          vehicleId: formData.get('vehicleId')?.toString(),
          urgency: formData.get('urgency')?.toString(),
          description: formData.get('description')?.toString(),
        }),
      });
      
      if (response.ok) {
        alert('Repair request submitted successfully!');
        e.currentTarget.reset();
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5 min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold mb-1">Driver Portal</h1>
          <p className="text-muted">Welcome back, manage your vehicle reports</p>
        </div>
        <Link href="/" className="btn btn-outline-secondary rounded-pill px-4">
          &larr; Logout
        </Link>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow border-0">
            <div className="card-header bg-white py-4 px-4 border-0 pb-0">
              <div className="d-flex align-items-center">
                <span className="display-6 me-3">🚛</span>
                <h4 className="mb-0 fw-bold">Report an Issue</h4>
              </div>
            </div>
            <div className="card-body p-4 pt-3">
              <p className="text-muted mb-4 small">
                Please provide detailed information about the vehicle issue to help our mechanics diagnose it quickly.
              </p>
              <form onSubmit={handleSubmit}>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="mb-3 mb-md-0">
                      <label htmlFor="vehicleId" className="form-label small fw-bold text-uppercase text-secondary">
                        Vehicle ID
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        id="vehicleId"
                        name="vehicleId"
                        placeholder="e.g. TRUCK-001"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3 mb-md-0">
                      <label htmlFor="urgency" className="form-label small fw-bold text-uppercase text-secondary">
                        Urgency Level
                      </label>
                      <select
                        className="form-select form-select-lg"
                        id="urgency"
                        name="urgency"
                        defaultValue="MEDIUM"
                      >
                        <option value="LOW">🟢 Low - Routine</option>
                        <option value="MEDIUM">🟡 Medium - Attention</option>
                        <option value="HIGH">🟠 High - Urgent</option>
                        <option value="CRITICAL">🔴 Critical - Breakdown</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="description" className="form-label small fw-bold text-uppercase text-secondary">
                    Issue Description
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows={5}
                    placeholder="Describe the problem in detail (e.g. strange noise when braking, engine overheating...)"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  className="btn btn-primary btn-lg w-100 rounded-pill py-3 fw-bold shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
