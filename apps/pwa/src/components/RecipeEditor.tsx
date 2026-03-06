import { useState } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import type { Recipe, Step } from '@kitchensync/meal-model';
import { validateRecipe } from '@kitchensync/meal-model';
import { StepForm } from './StepForm.js';
import { generateId } from '../utils/id.js';

interface RecipeEditorProps {
  readonly recipe: Recipe | null;
  readonly onSave: (recipe: Recipe) => void;
  readonly onCancel: () => void;
}

/**
 * Form for creating or editing a named Recipe.
 * In edit mode (recipe !== null) the form is pre-filled.
 * In create mode (recipe === null) the form is blank.
 */
export function RecipeEditor({ recipe, onSave, onCancel }: RecipeEditorProps) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [steps, setSteps] = useState<readonly Step[]>(recipe?.steps ?? []);
  const [errors, setErrors] = useState<string[]>([]);

  function handleSave() {
    const now = Date.now();
    const raw = {
      id: recipe?.id ?? generateId(),
      name,
      description: description || undefined,
      steps,
      createdAt: recipe?.createdAt ?? now,
      updatedAt: now,
    };
    const result = validateRecipe(raw);
    if (!result.ok) {
      setErrors(result.errors.map(e => e.message));
      return;
    }
    setErrors([]);
    onSave(result.value);
  }

  return (
    <div>
      {errors.length > 0 && (
        <Alert variant="danger">
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </Alert>
      )}
      <Form.Group className="mb-3">
        <Form.Label>Recipe name</Form.Label>
        <Form.Control
          placeholder="e.g. Roast Chicken"
          value={name}
          onChange={e => setName(e.target.value)}
          aria-label="Recipe name"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Description (optional)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          aria-label="Recipe description"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Steps</Form.Label>
        <StepForm steps={steps} onChange={setSteps} />
      </Form.Group>
      <div className="d-flex gap-2 justify-content-end">
        <Button variant="outline-secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSave}>
          {recipe ? 'Save Changes' : 'Create Recipe'}
        </Button>
      </div>
    </div>
  );
}
