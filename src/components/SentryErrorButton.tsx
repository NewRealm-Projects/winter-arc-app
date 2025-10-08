import { useState } from 'react';
import * as Sentry from '@sentry/react';

interface SentryErrorButtonProps {
  readonly label: string;
  readonly errorMessage: string;
  readonly className?: string;
}

export function SentryErrorButton({ label, errorMessage, className }: SentryErrorButtonProps) {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    const error = new Error(errorMessage);
    Sentry.captureException(error);
    throw error;
  }

  return (
    <button type="button" onClick={() => { setShouldThrow(true); }} className={className}>
      {label}
    </button>
  );
}

export default SentryErrorButton;
