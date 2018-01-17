export const CHANGE_CANVAS_GRID_STEP = 'CHANGE_CANVAS_GRID_STEP';

export function changeCanvasGridStep(gridStep) {
  return {
    type: CHANGE_CANVAS_GRID_STEP,
    gridStep,
  };
}
