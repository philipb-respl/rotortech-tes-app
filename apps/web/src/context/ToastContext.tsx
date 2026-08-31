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

/** The end-of-flow confirmation is a modal, not a transient snackbar — it's
 *  the app's acknowledgement that the settlement really landed, so it stays
 *  until dismissed. `path`/`driveUrl` are filled in only when a PDF actually
 *  exists in Drive, which is not the case until the upload is ported to an
 *  Edge Function; until then the modal just confirms the settlement. */
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
