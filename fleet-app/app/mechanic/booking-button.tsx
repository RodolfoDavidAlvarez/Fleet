'use client';

import { updateRequestStatus } from '../actions';
import { useState } from 'react';

export default function BookingButton({ requestId }: { requestId: number }) {
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    setLoading(true);
    // 1. Update status
    await updateRequestStatus(requestId, 'PENDING_BOOKING');
    
    // 2. Mock sending link (simulated by alert)
    const mockLink = `https://calendly.com/mechanic/repair-${requestId}`;
    alert(`Booking Link Generated!\n\nSend this to driver:\n${mockLink}`);
    setLoading(false);
  };

  return (
    <button 
      onClick={handleBooking}
      disabled={loading}
      className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm fw-bold"
    >
      {loading ? (
        <span>⏳ Sending...</span>
      ) : (
        <span>📅 Send Booking Link</span>
      )}
    </button>
  );
}
