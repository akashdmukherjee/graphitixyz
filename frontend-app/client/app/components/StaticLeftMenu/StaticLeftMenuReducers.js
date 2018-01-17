import { SWITCH_LEFT_MENU, TOGGLE_STRETCH_LEFTMENU } from './StaticLeftMenuActions';

export function leftMenu(state = 'blocks', action) {
  switch (action.type) {
    case SWITCH_LEFT_MENU:
      return action.activeMenu;
    default:
      return state;
  }
}

export function staticLeftMenuStretched(state = false, action) {
  switch (action.type) {
    case TOGGLE_STRETCH_LEFTMENU:
      return action.staticLeftMenuStretched;
    default:
      return state;
  }
}
