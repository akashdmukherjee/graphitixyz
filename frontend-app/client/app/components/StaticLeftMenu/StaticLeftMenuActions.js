export const SWITCH_LEFT_MENU = 'SWITCH_LEFT_MENU';
export const TOGGLE_STRETCH_LEFTMENU = 'TOGGLE_STRETCH_LEFTMENU';

export function switchLeftMenu(activeMenu) {
  return {
    type: SWITCH_LEFT_MENU,
    activeMenu,
  };
}

export function toggleStaticLeftMenuStretched(staticLeftMenuStretched) {
  return {
    type: TOGGLE_STRETCH_LEFTMENU,
    staticLeftMenuStretched,
  };
}
