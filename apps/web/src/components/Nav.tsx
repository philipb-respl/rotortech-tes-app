import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export function Nav({ label }: { label: string }) {
  return (
    <nav className="nav">
      <img src="/rotortech-logo.png" alt="Rotortech" style={{ height: 20, marginRight: 'auto' }} />
      <span style={{ fontSize: 13, opacity: 0.6 }}>{label}</span>
      <a href="#" onClick={(e) => { e.preventDefault(); signOut(auth); }}>
        Sign out
      </a>
    </nav>
  );
}
