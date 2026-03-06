import { Routes, Route } from 'react-router';
import { AppShell } from './components/AppShell.js';
import { PlannerPage } from './pages/PlannerPage.js';
import { RecipesPage } from './pages/RecipesPage.js';
import { MealPlanPage } from './pages/MealPlanPage.js';
import { TimerPage } from './pages/TimerPage.js';
import { AlarmSettingsPage } from './pages/AlarmSettingsPage.js';
import { ROUTES } from './routes.js';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path={ROUTES.PLANNER} element={<PlannerPage />} />
        <Route path={ROUTES.RECIPES} element={<RecipesPage />} />
        <Route path={ROUTES.MEAL} element={<MealPlanPage />} />
        <Route path={ROUTES.TIMER} element={<TimerPage />} />
        <Route path={ROUTES.SETTINGS} element={<AlarmSettingsPage />} />
      </Routes>
    </AppShell>
  );
}
