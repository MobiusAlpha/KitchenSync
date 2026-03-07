import { Card, Button, Badge } from 'react-bootstrap';
import type { Step } from '@kitchensync/meal-model';
import { StepForm } from '../StepForm.js';

/**
 * Prop interface for BlockExpansion.
 * Inline panel for expanding a single-block Dish into named stages (FR-033).
 */
export interface BlockExpansionProps {
  /** Display name of the dish being expanded (shown as the panel title). */
  readonly dishName: string;
  /**
   * The original single-block estimate in minutes. Used to compute the diff label.
   * Must be > 0.
   */
  readonly originalEstimateMinutes: number;
  /**
   * Current draft stages being entered (controlled).
   * Starts empty; the parent initialises to [] when the panel opens.
   */
  readonly draftSteps: readonly Step[];
  /** Called as the user adds, edits, or removes draft stages. */
  readonly onDraftChange: (steps: readonly Step[]) => void;
  /**
   * Called when the user confirms the expansion.
   * The confirmed steps replace the single-block step in the parent Dish.
   */
  readonly onExpand: (steps: readonly Step[]) => void;
  /** Called when the user cancels the expansion without saving. */
  readonly onCancel: () => void;
}

/**
 * Inline panel for expanding a single-block dish entry into named stages.
 * Shows a running diff label vs. the original estimate (informational only — no constraint).
 */
export function BlockExpansion({
  dishName,
  originalEstimateMinutes,
  draftSteps,
  onDraftChange,
  onExpand,
  onCancel,
}: BlockExpansionProps) {
  const draftSum = draftSteps.reduce((acc, s) => acc + s.durationMinutes, 0);
  const diff = draftSum - originalEstimateMinutes;

  const diffLabel = (() => {
    if (diff === 0) return `= original estimate (${originalEstimateMinutes} min)`;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff} min vs. original estimate (${originalEstimateMinutes} min)`;
  })();

  const diffVariant = diff > 0 ? 'warning' : diff < 0 ? 'info' : 'secondary';

  return (
    <Card border="primary" className="mt-3">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <strong>Expand: {dishName}</strong>
        <Badge bg={diffVariant} className="ms-2">
          {diffLabel}
        </Badge>
      </Card.Header>
      <Card.Body>
        <StepForm steps={draftSteps} onChange={onDraftChange} />
      </Card.Body>
      <Card.Footer className="d-flex justify-content-end gap-2">
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={draftSteps.length === 0}
          onClick={() => onExpand([...draftSteps])}
        >
          Confirm Expansion
        </Button>
      </Card.Footer>
    </Card>
  );
}
