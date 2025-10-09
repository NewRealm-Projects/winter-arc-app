import { useState } from 'react';
import { captureException } from '../services/sentryService';

interface SentryErrorButtonProps {
  readonly label: string;
  readonly errorMessage: string;
  readonly className?: string;
}

export function SentryErrorButton({ label, errorMessage, className }: SentryErrorButtonProps) {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    const error = new Error(errorMessage);
    captureException(error);
    throw error;
  }

  return (
    <button type="button" onClick={() => { setShouldThrow(true); }} className={className}>
      {label}
    </button>
  );
}

export default SentryErrorButton;
