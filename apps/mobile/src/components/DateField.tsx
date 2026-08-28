import { Field, Input } from './Field';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidIsoDate(v: string): boolean {
  return ISO_DATE_RE.test(v);
}

/** A plain YYYY-MM-DD text field standing in for `<input type="date">` —
 *  deliberately not the native date-picker module, whose imperative
 *  Android API vs. inline iOS API differ enough to be worth avoiding here
 *  rather than risk shipping unverified against the current API. */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <Input value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />
    </Field>
  );
}
