import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Dialog } from '../components/Dialog';
import { Button } from '../components/Button';

export interface ToastPayload {
  title: string;
  message: string;
  path?: string;
  driveUrl?: string;
}

interface ToastContextValue {
  showToast: (t: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** The prototype's "Saved to Google Drive" confirmation is a modal, not a
 *  transient snackbar — it's the moment the app tells you the PDF really
 *  landed in Drive, so it stays until acknowledged. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const showToast = useCallback((t: ToastPayload) => setToast(t), []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Dialog
          title={toast.title}
          zIndex={220}
          actions={
            <Button variant="primary" onClick={() => setToast(null)}>
              Done
            </Button>
          }
        >
          {toast.message}
          <br />
          {toast.path && (
            <span className="text-muted" style={{ fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
              {toast.path}
            </span>
          )}
          {toast.driveUrl && (
            <div style={{ marginTop: 8 }}>
              <a href={toast.driveUrl} target="_blank" rel="noreferrer">
                Open in Google Drive →
              </a>
            </div>
          )}
        </Dialog>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
