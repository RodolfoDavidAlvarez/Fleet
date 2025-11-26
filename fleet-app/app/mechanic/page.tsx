import { getRepairRequests } from '../actions';
import Link from 'next/link';
import BookingButton from './booking-button';

export default async function MechanicPage() {
  const requests = await getRepairRequests();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-warning bg-opacity-10 text-warning border border-warning';
      case 'PENDING_BOOKING': return 'bg-info bg-opacity-10 text-info border border-info';
      case 'BOOKED': return 'bg-primary bg-opacity-10 text-primary border border-primary';
      case 'COMPLETED': return 'bg-success bg-opacity-10 text-success border border-success';
      default: return 'bg-secondary bg-opacity-10 text-secondary border border-secondary';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-danger text-white shadow-sm';
      case 'HIGH': return 'bg-warning text-dark';
      case 'MEDIUM': return 'bg-info text-white';
      default: return 'bg-light text-dark border';
    }
  };

  return (
    <div className="container py-5 min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="fw-bold mb-1">Mechanic Dashboard</h1>
          <p className="text-muted">Manage repair requests and bookings</p>
        </div>
        <Link href="/" className="btn btn-outline-secondary rounded-pill px-4">
          &larr; Logout
        </Link>
      </div>

      <div className="card shadow border-0 overflow-hidden">
        <div className="card-header bg-white py-4 px-4 border-0 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="display-6 me-3">🔧</span>
            <h5 className="mb-0 fw-bold">Incoming Requests</h5>
          </div>
          <span className="badge bg-secondary rounded-pill">{requests.length} Total</span>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold">ID</th>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold">Vehicle</th>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold">Driver</th>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold">Urgency</th>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold">Description</th>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold">Status</th>
                <th className="px-4 py-3 text-secondary text-uppercase small fw-bold text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5">
                    <div className="py-5">
                      <p className="display-1 text-muted opacity-25 mb-3">✓</p>
                      <h4 className="text-muted fw-normal">All caught up!</h4>
                      <p className="text-muted small">No active repair requests found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 text-muted">#{req.id}</td>
                    <td className="px-4 fw-bold">{req.vehicleId}</td>
                    <td className="px-4">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-secondary bg-opacity-10 p-2 me-2 text-secondary small" style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                          {req.driver.name.charAt(0)}
                        </div>
                        {req.driver.name}
                      </div>
                    </td>
                    <td className="px-4">
                      <span className={`badge rounded-pill ${getUrgencyBadge(req.urgency)}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-4" style={{ maxWidth: '300px' }}>
                      <div className="text-truncate text-muted" title={req.description}>
                        {req.description}
                      </div>
                    </td>
                    <td className="px-4">
                      <span className={`badge rounded-pill px-3 py-2 ${getStatusBadge(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 text-end">
                      {req.status === 'OPEN' ? (
                        <BookingButton requestId={req.id} />
                      ) : (
                        <span className="text-muted small fst-italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
