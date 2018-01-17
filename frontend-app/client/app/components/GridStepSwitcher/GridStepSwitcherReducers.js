import { CHANGE_CANVAS_GRID_STEP } from './GridStepSwitcherActions';

export function canvasGridStep(state = 20, action) {
  switch (action.type) {
    case CHANGE_CANVAS_GRID_STEP:
      return action.gridStep;
    default:
      return state;
  }
}
