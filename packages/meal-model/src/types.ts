/** All valid step categories in a recipe or timing session. */
export type StepType = 'prep' | 'cook' | 'rest' | 'cooldown';

/** Tuple of all valid StepType values for runtime validation. */
export const STEP_TYPES: readonly StepType[] = ['prep', 'cook', 'rest', 'cooldown'];
