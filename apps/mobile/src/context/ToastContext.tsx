import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform, Text } from 'react-native';
import { Dialog } from '../components/Dialog';
import { Button } from '../components/Button';
import { colors, fonts } from '../theme';

export interface ToastPayload {
  title: string;
  message: string;
  /** Drive path of the saved PDF, shown only once one actually exists. */
  path?: string;
  driveUrl?: string;
}

interface ToastContextValue {
  showToast: (t: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** The prototype's "Saved to Google Drive" confirmation is a modal, not a
 *  transient snackbar — it's the moment the app confirms the PDF really
 *  landed in Drive, so it stays until acknowledged. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const value = useMemo(() => ({ showToast: (t: ToastPayload) => setToast(t) }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <Dialog
          title={toast.title}
          actions={
            <Button variant="primary" onPress={() => setToast(null)}>
              Done
            </Button>
          }
        >
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.text, opacity: 0.85 }}>{toast.message}</Text>
          {toast.path && (
            <Text
              style={{
                fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: undefined }),
                fontSize: 11,
                color: colors.text,
                opacity: 0.55,
                marginTop: 4,
              }}
            >
              {toast.path}
            </Text>
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
