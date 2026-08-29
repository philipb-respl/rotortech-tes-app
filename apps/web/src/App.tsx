import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Login } from './routes/Login';
import { Pending } from './routes/Pending';
import { EmployeeNotice } from './routes/EmployeeNotice';
import { Approver } from './routes/Approver';
import { Accounts } from './routes/Accounts';
import { Admin } from './routes/Admin';

function roleHome(role: string | undefined): string {
  switch (role) {
    case 'approver':
      return '/approver';
    case 'accounts':
      return '/accounts';
    case 'admin':
      return '/admin';
    default:
      return '/employee';
  }
}

export function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="center-screen">Loading…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (!profile || !profile.active) {
    return (
      <Routes>
        <Route path="*" element={<Pending />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/employee" element={<EmployeeNotice />} />
      <Route path="/approver" element={profile.role === 'approver' ? <Approver /> : <Navigate to={roleHome(profile.role)} replace />} />
      <Route path="/accounts" element={profile.role === 'accounts' ? <Accounts /> : <Navigate to={roleHome(profile.role)} replace />} />
      <Route path="/admin" element={profile.role === 'admin' ? <Admin /> : <Navigate to={roleHome(profile.role)} replace />} />
      <Route path="*" element={<Navigate to={roleHome(profile.role)} replace />} />
    </Routes>
  );
}
