import "@testing-library/jest-dom";

// jsdom has no matchMedia — shim it so useTheme/useReducedMotion don't throw.
window.matchMedia = window.matchMedia || function matchMedia(query) {
  return {
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  };
};

// jsdom has no ResizeObserver — chart.js needs one to mount a chart.
window.ResizeObserver = window.ResizeObserver || class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
