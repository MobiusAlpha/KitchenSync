import { useState } from 'react';
import { Button, Card, Form, ListGroup, Modal } from 'react-bootstrap';
import type { Dish, MealPlan, Recipe, Step, WallClockTime } from '@kitchensync/meal-model';
import { validateWallClockTime } from '@kitchensync/meal-model';
import { timingEngine } from '@kitchensync/timing-engine';
import { StepForm } from './StepForm.js';
import { RecipeLibrary } from './RecipeLibrary.js';
import { generateId } from '../utils/id.js';

interface MealPlanEditorProps {
  readonly mealPlan: MealPlan;
  readonly savedRecipes: readonly Recipe[];
  readonly onChange: (mealPlan: MealPlan) => void;
}

/**
 * Full editor for a MealPlan: target time, dish list (add from library or ad-hoc),
 * rename, and remove.
 */
export function MealPlanEditor({ mealPlan, savedRecipes, onChange }: MealPlanEditorProps) {
  const [targetTimeStr, setTargetTimeStr] = useState(
    timingEngine.formatWallClockTime(mealPlan.targetTime),
  );
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);

  function updateTargetTime(str: string) {
    setTargetTimeStr(str);
    const parsed = timingEngine.parseWallClockTime(str);
    if (!parsed) return;
    const result = validateWallClockTime(parsed);
    if (result.ok) {
      onChange({ ...mealPlan, targetTime: result.value });
    }
  }

  function addDishFromRecipe(recipe: Recipe) {
    const newDish: Dish = {
      id: generateId(),
      displayName: recipe.name,
      sourceRecipeId: recipe.id,
      steps: [...recipe.steps],
    };
    onChange({ ...mealPlan, dishes: [...mealPlan.dishes, newDish] });
    setShowRecipePicker(false);
  }

  function addAdHocDish() {
    const newDish: Dish = {
      id: generateId(),
      displayName: `Dish ${String(mealPlan.dishes.length + 1)}`,
      sourceRecipeId: null,
      steps: [],
    };
    onChange({ ...mealPlan, dishes: [...mealPlan.dishes, newDish] });
    setEditingDishId(newDish.id);
  }

  function removeDish(id: string) {
    onChange({ ...mealPlan, dishes: mealPlan.dishes.filter(d => d.id !== id) });
    if (editingDishId === id) setEditingDishId(null);
  }

  function renameDish(id: string, name: string) {
    onChange({
      ...mealPlan,
      dishes: mealPlan.dishes.map(d => (d.id === id ? { ...d, displayName: name } : d)),
    });
  }

  function updateDishSteps(id: string, steps: readonly Step[]) {
    onChange({
      ...mealPlan,
      dishes: mealPlan.dishes.map(d => (d.id === id ? { ...d, steps } : d)),
    });
  }

  const editingDish = mealPlan.dishes.find(d => d.id === editingDishId) ?? null;

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label>Ready by (target time)</Form.Label>
        <Form.Control
          type="time"
          value={targetTimeStr}
          onChange={e => updateTargetTime(e.target.value)}
          style={{ maxWidth: '180px' }}
        />
      </Form.Group>

      <div className="d-flex gap-2 mb-3">
        <Button variant="outline-primary" onClick={() => setShowRecipePicker(true)}>
          + Add from Recipe
        </Button>
        <Button variant="outline-secondary" onClick={addAdHocDish}>
          + Add Ad-hoc Dish
        </Button>
      </div>

      <ListGroup className="mb-3">
        {mealPlan.dishes.length === 0 && (
          <ListGroup.Item className="text-muted text-center">No dishes yet — add one above.</ListGroup.Item>
        )}
        {mealPlan.dishes.map(dish => (
          <ListGroup.Item
            key={dish.id}
            className="d-flex align-items-center gap-2"
          >
            <span className="flex-grow-1">
              <strong>{dish.displayName}</strong>
              <span className="ms-2 text-muted">{dish.steps.length} steps</span>
            </span>
            <Button
              size="sm"
              variant="outline-secondary"
              onClick={() => setEditingDishId(editingDishId === dish.id ? null : dish.id)}
            >
              {editingDishId === dish.id ? 'Collapse' : 'Edit'}
            </Button>
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => removeDish(dish.id)}
            >
              Remove
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>

      {editingDish && (
        <Card className="mb-3">
          <Card.Header>
            <Form.Control
              value={editingDish.displayName}
              onChange={e => renameDish(editingDish.id, e.target.value)}
              className="fw-bold border-0 bg-transparent p-0"
            />
          </Card.Header>
          <Card.Body>
            <StepForm
              steps={editingDish.steps}
              onChange={steps => updateDishSteps(editingDish.id, steps)}
            />
          </Card.Body>
        </Card>
      )}

      <Modal show={showRecipePicker} onHide={() => setShowRecipePicker(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Dish from Recipe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RecipeLibrary
            recipes={savedRecipes}
            onSelect={addDishFromRecipe}
            onDelete={() => undefined}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export type { MealPlanEditorProps, WallClockTime };
