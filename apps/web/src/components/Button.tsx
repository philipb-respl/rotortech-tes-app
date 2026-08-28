import type { ButtonHTMLAttributes } from 'react';
import { Corners } from './Corners';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: boolean;
  block?: boolean;
}

/** Primary/secondary buttons wear the blueprint frame + corner marks, per
 *  the Industry design system; ghost (text) buttons don't. */
export function Button({ variant = 'secondary', icon, block, className, children, ...rest }: ButtonProps) {
  const framed = variant === 'primary' || variant === 'secondary';
  const classes = [
    'btn',
    `btn-${variant}`,
    icon ? 'btn-icon' : '',
    block ? 'btn-block' : '',
    framed ? 'blueprint' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} {...rest}>
      {framed && <Corners />}
      {children}
    </button>
  );
}
