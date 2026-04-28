interface Props {
  message?: string;
  id?: string;
}

/** Inline form error in BEITAK red. Renders nothing when empty. */
export function FieldError({ message, id }: Props) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium" style={{ color: "#E63030" }}>
      {message}
    </p>
  );
}
