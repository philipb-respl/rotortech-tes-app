import type { HTMLAttributes } from 'react';
import { Corners } from './Corners';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  plain?: boolean; // opt out of the blueprint frame (rare — most cards are framed)
}

export function Card({ plain, className, children, ...rest }: CardProps) {
  const classes = ['card', plain ? '' : 'blueprint', className ?? ''].filter(Boolean).join(' ');
  return (
    <div className={classes} {...rest}>
      {!plain && <Corners />}
      {children}
    </div>
  );
}

export function CardKicker({ children }: { children: React.ReactNode }) {
  return <div className="card-kicker">{children}</div>;
}

export function CardTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card-title" style={style}>
      {children}
    </div>
  );
}
