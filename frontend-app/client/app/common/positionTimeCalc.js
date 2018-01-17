export const positionTimeCalc = (() => {
  let itemsMargin;
  const calculatePosition = (startsAt) => {
    const multiplier = startsAt / 1000;
    if (itemsMargin && multiplier) {
      return (itemsMargin + 1) * multiplier;
    }
    return 0;
  };
  const calculateStartsAt = (position) => {
    if (itemsMargin && position) {
      return (position / (itemsMargin + 1)) * 1000;
    }
    return 0;
  };
  return {
    get: () => itemsMargin,
    set: (value) => {
      itemsMargin = value;
    },
    position: calculatePosition,
    startsAt: calculateStartsAt,
  };
})();
