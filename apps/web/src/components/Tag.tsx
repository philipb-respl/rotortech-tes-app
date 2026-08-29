type TagVariant = 'accent' | 'accent-2' | 'neutral' | 'outline';

export function Tag({ variant = 'neutral', children }: { variant?: TagVariant; children: React.ReactNode }) {
  return <span className={`tag tag-${variant}`}>{children}</span>;
}
