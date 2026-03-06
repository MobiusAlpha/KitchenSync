import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Card, Form, Row, Col, Button, Modal } from 'react-bootstrap';
import type { Step, WallClockTime } from '@kitchensync/meal-model';
import { validateWallClockTime } from '@kitchensync/meal-model';
import { timingEngine } from '@kitchensync/timing-engine';
import { StepForm } from '../components/StepForm.js';
import { ScheduleView } from '../components/ScheduleView.js';
import { useSchedule } from '../hooks/useSchedule.js';
import { RecipeLibrary } from '../components/RecipeLibrary.js';
import { RecipeRepository } from '../storage/RecipeRepository.js';
import { ROUTES } from '../routes.js';

/**
 * US1: Single-dish reverse schedule planner.
 * Ad-hoc step entry + target time → reverse-calculated schedule.
 * Also supports loading a recipe (US2) and saving as recipe (US2).
 */
export function PlannerPage() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<readonly Step[]>([]);
  const [targetTimeStr, setTargetTimeStr] = useState('19:00');
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  const [recipes, setRecipes] = useState<Awaited<ReturnType<typeof RecipeRepository.getAll>>>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [recipeName, setRecipeName] = useState('');

  const targetTime: WallClockTime | null = (() => {
    const result = validateWallClockTime(timingEngine.parseWallClockTime(targetTimeStr) ?? undefined);
    return result.ok ? result.value : null;
  })();

  const schedule = useSchedule(steps, targetTime);

  const openRecipePicker = useCallback(async () => {
    const all = await RecipeRepository.getAll();
    setRecipes(all);
    setShowRecipePicker(true);
  }, []);

  const loadRecipe = useCallback((recipe: Parameters<typeof RecipeLibrary>[0]['recipes'][0]) => {
    setSteps([...recipe.steps]);
    setShowRecipePicker(false);
  }, []);

  const saveAsRecipe = useCallback(async () => {
    if (!recipeName.trim() || steps.length === 0) return;
    await RecipeRepository.create({ name: recipeName.trim(), steps });
    setSaveModalOpen(false);
    setRecipeName('');
    void navigate(ROUTES.RECIPES);
  }, [recipeName, steps, navigate]);

  const startTimer = useCallback(() => {
    if (schedule) {
      void navigate(ROUTES.TIMER, { state: { schedule } });
    }
  }, [schedule, navigate]);

  return (
    <div className="py-3">
      <h1 className="mb-4">Planner</h1>

      <Row className="g-3 mb-3">
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label>Ready by (target time)</Form.Label>
            <Form.Control
              type="time"
              value={targetTimeStr}
              onChange={e => setTargetTimeStr(e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col xs={12} md={8} className="d-flex align-items-end gap-2 flex-wrap">
          <Button variant="outline-secondary" onClick={() => void openRecipePicker()}>
            Load Recipe
          </Button>
          <Button
            variant="outline-success"
            disabled={steps.length === 0}
            onClick={() => setSaveModalOpen(true)}
          >
            Save as Recipe
          </Button>
          <Button
            variant="success"
            disabled={!schedule}
            onClick={startTimer}
          >
            Start Timer
          </Button>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header>Steps</Card.Header>
        <Card.Body>
          <StepForm steps={steps} onChange={setSteps} />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Schedule</Card.Header>
        <Card.Body>
          <ScheduleView schedule={schedule} />
        </Card.Body>
      </Card>

      {/* Recipe picker modal */}
      <Modal show={showRecipePicker} onHide={() => setShowRecipePicker(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Load Recipe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RecipeLibrary
            recipes={recipes}
            onSelect={loadRecipe}
            onDelete={async (id) => {
              await RecipeRepository.delete(id);
              setRecipes(recipes.filter(r => r.id !== id));
            }}
          />
        </Modal.Body>
      </Modal>

      {/* Save as recipe modal */}
      <Modal show={saveModalOpen} onHide={() => setSaveModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Save as Recipe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Recipe name</Form.Label>
            <Form.Control
              placeholder="e.g. Roast Chicken"
              value={recipeName}
              onChange={e => setRecipeName(e.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSaveModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            disabled={!recipeName.trim()}
            onClick={() => void saveAsRecipe()}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
