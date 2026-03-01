/**
 * @kitchensync/scheduler
 *
 * Reverse-timing scheduler. Converts Dish or MealPlan + target time into
 * a chronologically-ordered Schedule of StepEvents.
 */
export { scheduleDish } from './schedule-dish.js';
export { scheduleMealPlan } from './schedule-meal-plan.js';
import { scheduleDish } from './schedule-dish.js';
import { scheduleMealPlan } from './schedule-meal-plan.js';
/** Scheduler facade. */
export const scheduler = {
    scheduleDish,
    scheduleMealPlan,
};
//# sourceMappingURL=index.js.map