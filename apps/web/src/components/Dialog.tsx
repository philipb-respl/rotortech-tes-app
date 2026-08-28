import type { ReactNode } from 'react';
import { Corners } from './Corners';

export function Dialog({
  title,
  children,
  actions,
  zIndex = 210,
}: {
  title: string;
  children: ReactNode;
  actions: ReactNode;
  zIndex?: number;
}) {
  return (
    <div className="dialog-backdrop" style={{ zIndex }}>
      <div className="dialog blueprint elev-lg">
        <Corners />
        <div className="dialog-title">{title}</div>
        <div className="dialog-body">{children}</div>
        <div className="dialog-actions">{actions}</div>
      </div>
    </div>
  );
}
