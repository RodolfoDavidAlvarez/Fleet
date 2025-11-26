import { getUsers } from './actions';
import Link from 'next/link';

export default async function Home() {
  const users = await getUsers();

  return (
    <main className="container min-vh-100 d-flex flex-column justify-content-center py-5">
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3 text-gradient">
          Fleet Management System
        </h1>
        <p className="lead text-muted fs-4">Select your role to continue</p>
      </div>

      <div className="row justify-content-center gap-4">
        {users.map((user) => (
          <div key={user.id} className="col-md-5 col-lg-4">
            <Link 
              href={user.role === 'DRIVER' ? `/driver?userId=${user.id}` : `/mechanic?userId=${user.id}`}
              className="text-decoration-none"
            >
              <div className="card h-100 shadow-sm hover-shadow border-0">
                <div className="card-body text-center p-5">
                  <div className="mb-4 d-inline-block p-4 rounded-circle bg-light bg-opacity-50">
                    {user.role === 'DRIVER' ? (
                      <span className="display-3">🚛</span>
                    ) : (
                      <span className="display-3">🔧</span>
                    )}
                  </div>
                  <h3 className="card-title mb-2 fw-bold text-dark">{user.name}</h3>
                  <div className="badge bg-secondary bg-opacity-10 text-secondary mb-4 px-3 py-2 rounded-pill">
                    {user.role}
                  </div>
                  <button className={`btn btn-lg w-100 rounded-pill ${user.role === 'DRIVER' ? 'btn-primary' : 'btn-outline-dark'}`}>
                    Enter Portal &rarr;
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}