import { useState } from 'react';
import { Button, Form, ListGroup, Badge, Row, Col } from 'react-bootstrap';
import type { Step } from '@kitchensync/meal-model';
import { validateStep } from '@kitchensync/meal-model';
import { generateId } from '../utils/id.js';

interface StepFormProps {
  readonly steps: readonly Step[];
  readonly onChange: (steps: readonly Step[]) => void;
  readonly disabled?: boolean;
}

interface StepDraft {
  name: string;
  type: Step['type'];
  durationMinutes: number | '';
}

const STEP_TYPES: Step['type'][] = ['prep', 'cook', 'rest', 'cooldown'];

const emptyDraft = (): StepDraft => ({ name: '', type: 'prep', durationMinutes: '' });

/**
 * Controlled list editor for an ordered set of Steps.
 * Renders add / edit / remove / reorder interactions with inline validation.
 */
export function StepForm({ steps, onChange, disabled = false }: StepFormProps) {
  const [draft, setDraft] = useState<StepDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function validateAndSave() {
    const raw = {
      id: editingId ?? generateId(),
      name: draft.name,
      type: draft.type,
      durationMinutes: draft.durationMinutes === '' ? 0 : draft.durationMinutes,
    };
    const result = validateStep(raw);
    if (!result.ok) {
      setErrors(result.errors.map(e => e.message));
      return;
    }
    if (editingId) {
      onChange(steps.map(s => (s.id === editingId ? result.value : s)));
      setEditingId(null);
    } else {
      onChange([...steps, result.value]);
    }
    setDraft(emptyDraft());
    setErrors([]);
  }

  function startEdit(step: Step) {
    setEditingId(step.id);
    setDraft({ name: step.name, type: step.type, durationMinutes: step.durationMinutes });
    setErrors([]);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft());
    setErrors([]);
  }

  function removeStep(id: string) {
    onChange(steps.filter(s => s.id !== id));
    if (editingId === id) cancelEdit();
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const newSteps = [...steps];
    const target = newSteps[idx + dir];
    const current = newSteps[idx];
    if (!current || !target) return;
    newSteps[idx] = target;
    newSteps[idx + dir] = current;
    onChange(newSteps);
  }

  return (
    <div>
      <ListGroup className="mb-3">
        {steps.length === 0 && (
          <ListGroup.Item className="text-muted text-center">No steps yet — add one below.</ListGroup.Item>
        )}
        {steps.map((step, idx) => (
          <ListGroup.Item key={step.id} className="d-flex align-items-center gap-2">
            <div className="flex-grow-1">
              <strong>{step.name}</strong>
              <Badge bg="secondary" className="ms-2">{step.type}</Badge>
              <span className="ms-2 text-muted">{step.durationMinutes} min</span>
            </div>
            <div className="d-flex gap-1">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => moveStep(idx, -1)}
                disabled={disabled || idx === 0}
                aria-label="Move up"
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => moveStep(idx, 1)}
                disabled={disabled || idx === steps.length - 1}
                aria-label="Move down"
              >
                ↓
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => startEdit(step)}
                disabled={disabled}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => removeStep(step.id)}
                disabled={disabled}
              >
                ✕
              </Button>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>

      <div className="border rounded p-3 bg-light">
        <h6 className="mb-3">{editingId ? 'Edit Step' : 'Add Step'}</h6>
        {errors.length > 0 && (
          <div className="alert alert-danger py-2 mb-2">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
        <Row className="g-2">
          <Col xs={12} md={5}>
            <Form.Control
              placeholder="Step name"
              value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              disabled={disabled}
              aria-label="Step name"
            />
          </Col>
          <Col xs={6} md={3}>
            <Form.Select
              value={draft.type}
              onChange={e => setDraft({ ...draft, type: e.target.value as Step['type'] })}
              disabled={disabled}
              aria-label="Step type"
            >
              {STEP_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Form.Select>
          </Col>
          <Col xs={6} md={2}>
            <Form.Control
              type="number"
              placeholder="Min"
              min={1}
              max={1440}
              value={draft.durationMinutes}
              onChange={e =>
                setDraft({
                  ...draft,
                  durationMinutes: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                })
              }
              disabled={disabled}
              aria-label="Duration in minutes"
            />
          </Col>
          <Col xs={12} md={2} className="d-flex gap-2">
            <Button
              variant="success"
              className="flex-grow-1"
              onClick={validateAndSave}
              disabled={disabled}
            >
              {editingId ? 'Save' : 'Add'}
            </Button>
            {editingId && (
              <Button variant="outline-secondary" onClick={cancelEdit} disabled={disabled}>
                Cancel
              </Button>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
