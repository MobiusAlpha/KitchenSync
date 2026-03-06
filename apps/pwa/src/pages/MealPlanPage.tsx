import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button, Card, Form, Row, Col } from 'react-bootstrap';
import type { MealPlan, Recipe } from '@kitchensync/meal-model';
import { scheduler } from '@kitchensync/scheduler';
import { MealPlanEditor } from '../components/MealPlanEditor.js';
import { ScheduleView } from '../components/ScheduleView.js';
import { MealPlanRepository } from '../storage/MealPlanRepository.js';
import { RecipeRepository } from '../storage/RecipeRepository.js';
import { ROUTES } from '../routes.js';
import { generateId } from '../utils/id.js';

function emptyMealPlan(): MealPlan {
  const now = Date.now();
  return {
    id: generateId(),
    name: '',
    targetTime: { hour: 19, minute: 0 },
    dishes: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * US3: Multi-dish meal plan editor + unified schedule view.
 * Save/load meal plans from IndexedDB. "Start Timer" navigates to TimerPage.
 */
export function MealPlanPage() {
  const navigate = useNavigate();
  const [mealPlan, setMealPlan] = useState<MealPlan>(emptyMealPlan());
  const [savedPlans, setSavedPlans] = useState<readonly MealPlan[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<readonly Recipe[]>([]);
  const [planName, setPlanName] = useState('');

  const now = (() => {
    const d = new Date();
    return { hour: d.getHours(), minute: d.getMinutes() };
  })();

  const schedule = mealPlan.dishes.length > 0
    ? (() => {
        try { return scheduler.scheduleMealPlan(mealPlan, now); }
        catch { return null; }
      })()
    : null;

  useEffect(() => {
    void Promise.all([
      MealPlanRepository.getAll().then(setSavedPlans),
      RecipeRepository.getAll().then(setSavedRecipes),
    ]);
  }, []);

  const savePlan = useCallback(async () => {
    const updated = { ...mealPlan, name: planName || 'My Meal Plan' };
    const existing = await MealPlanRepository.getById(updated.id);
    if (existing) {
      await MealPlanRepository.update(updated.id, { name: updated.name, dishes: updated.dishes, targetTime: updated.targetTime });
    } else {
      await MealPlanRepository.create({ name: updated.name, dishes: updated.dishes, targetTime: updated.targetTime });
    }
    const all = await MealPlanRepository.getAll();
    setSavedPlans(all);
  }, [mealPlan, planName]);

  const loadPlan = useCallback(async (id: string) => {
    const plan = await MealPlanRepository.getById(id);
    if (plan) {
      setMealPlan(plan);
      setPlanName(plan.name);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (schedule) {
      void navigate(ROUTES.TIMER, { state: { schedule } });
    }
  }, [schedule, navigate]);

  return (
    <div className="py-3">
      <h1 className="mb-4">Meal Plan</h1>

      <Row className="g-3 mb-3">
        <Col xs={12} md={5}>
          <Form.Control
            placeholder="Meal plan name"
            value={planName}
            onChange={e => setPlanName(e.target.value)}
          />
        </Col>
        <Col xs={12} md={7} className="d-flex gap-2 align-items-center flex-wrap">
          <Button variant="outline-success" onClick={() => void savePlan()}>
            Save Plan
          </Button>
          <Form.Select
            style={{ maxWidth: '220px' }}
            defaultValue=""
            onChange={e => { if (e.target.value) void loadPlan(e.target.value); }}
          >
            <option value="">Load saved plan…</option>
            {savedPlans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Form.Select>
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
        <Card.Header>Dishes</Card.Header>
        <Card.Body>
          <MealPlanEditor
            mealPlan={mealPlan}
            savedRecipes={savedRecipes}
            onChange={setMealPlan}
          />
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>Unified Schedule</Card.Header>
        <Card.Body>
          <ScheduleView schedule={schedule} />
        </Card.Body>
      </Card>
    </div>
  );
}
