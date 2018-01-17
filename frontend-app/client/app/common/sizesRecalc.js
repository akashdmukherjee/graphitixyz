import { currentStaticLeftMenuWidth, topMenuHeight, bottomFooterBar } from './vars';
import store from '../store';
import { changeObject, changeObjectResizableSizes } from '../components/Object/ObjectActions';
import { setMainSizes, setCanvasSizes } from '../components/Home/HomeActions';

export const sizesRecalc = (() => {
  const adjust = (lcmWidth, rcmWidth) => {
    const timelineContainerHeight = store.getState().timelineContainerHeight;

    let width = window.innerWidth - currentStaticLeftMenuWidth - lcmWidth - rcmWidth;
    let height = window.innerHeight - topMenuHeight - timelineContainerHeight - bottomFooterBar;
    const prevCanvasSizes = store.getState().canvasSizes;
    const prevBoxes = store.getState().object;
    const viewRatio = store.getState().viewRatio;
    const viewRatioX = viewRatio && viewRatio.split('/')[0];
    const viewRatioY = viewRatio && viewRatio.split('/')[1];
    const isFullScreen = store.getState().fullScreen;

    // TODO top and bottom sidebars should be also parametrized
    if (isFullScreen) {
      width = window.innerWidth;
      height = window.innerHeight;
    }

    store.dispatch(setMainSizes({ width, height }));

    let canvasWidth = width;
    let canvasHeight = canvasWidth * parseFloat(viewRatioY) / parseFloat(viewRatioX);
    if (canvasHeight > height) {
      canvasHeight = height;
      canvasWidth = canvasHeight * parseFloat(viewRatioX) / parseFloat(viewRatioY);
    }
    store.dispatch(setCanvasSizes({ width: canvasWidth, height: canvasHeight }));
    prevBoxes.forEach(box => {
      const prevBox = prevBoxes.find(b => b.id === box.id);
      const prevBoxWidth = prevBox && prevBox.width;
      const prevBoxHeight = prevBox && prevBox.height;
      const prevBoxLeftPosition = prevBox && prevBox.left;
      const prevBoxTopPosition = prevBox && prevBox.top;
      let prevCanvasWidth = prevCanvasSizes.width;
      let prevCanvasHeight = prevCanvasSizes.height;
      if (prevCanvasSizes.width === '100%') {
        prevCanvasWidth = canvasWidth;
      }
      if (prevCanvasSizes.height === '100%') {
        prevCanvasHeight = canvasHeight;
      }

      store.dispatch(changeObject({
        id: box.id,
        width: (prevBoxWidth * canvasWidth) / prevCanvasWidth,
        height: (prevBoxHeight * canvasHeight) / prevCanvasHeight,
        left: (prevBoxLeftPosition * canvasHeight) / prevCanvasHeight,
        top: (prevBoxTopPosition * canvasHeight) / prevCanvasHeight,
      }));
      store.dispatch(changeObjectResizableSizes({
        boxId: box.id,
        width: (prevBoxWidth * canvasWidth) / prevCanvasWidth - 2,
        height: (prevBoxHeight * canvasHeight) / prevCanvasHeight - 2,
        top: 0,
        left: 0,
      }));
    });
  };
  return {
    adjust,
  };
})();
