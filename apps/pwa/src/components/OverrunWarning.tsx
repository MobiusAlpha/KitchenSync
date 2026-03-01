import { Alert } from 'react-bootstrap';

interface OverrunWarningProps {
  readonly overrunMinutes: number;
}

/**
 * Prominent banner displayed when the earliest scheduled step falls in the past.
 */
export function OverrunWarning({ overrunMinutes }: OverrunWarningProps) {
  return (
    <Alert variant="warning" className="d-flex align-items-center gap-2">
      <span>⚠️</span>
      <span>
        You&apos;re <strong>{overrunMinutes} minute{overrunMinutes !== 1 ? 's' : ''}</strong> behind
        schedule. Consider starting immediately or adjusting your target time.
      </span>
    </Alert>
  );
}
