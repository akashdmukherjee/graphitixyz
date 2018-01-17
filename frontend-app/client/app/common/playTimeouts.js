import shortid from 'shortid';

export const playTimeouts = (() => {
  const eventTimeouts = {};
  const set = (timeoutFn, time) => {
    const i = shortid.generate();
    eventTimeouts[i] = setTimeout(() => {
      timeoutFn();
      clearTimeout(i);
    }, time);
  };
  const clear = () => {
    Object.keys(eventTimeouts).forEach(key => {
      clearTimeout(eventTimeouts[key]);
    });
  };
  return {
    set,
    clearAll: clear,
  };
})();
