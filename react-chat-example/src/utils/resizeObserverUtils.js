// utils/resizeObserverUtils.js - Utilities for handling ResizeObserver issues

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function calls to once per interval
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Safe ResizeObserver implementation with error handling
 * @param {Function} callback - Callback function for resize events
 * @returns {ResizeObserver|null} ResizeObserver instance or null
 */
export const createSafeResizeObserver = (callback) => {
  if (typeof ResizeObserver === 'undefined') {
    console.warn('ResizeObserver not supported in this environment');
    return null;
  }

  const debouncedCallback = debounce((entries, observer) => {
    try {
      callback(entries, observer);
    } catch (error) {
      if (!error.message.includes('ResizeObserver loop')) {
        console.error('ResizeObserver callback error:', error);
      }
    }
  }, 16); // Debounce to ~60fps

  return new ResizeObserver(debouncedCallback);
};

/**
 * Suppress ResizeObserver errors globally
 */
export const suppressResizeObserverErrors = () => {
  // Suppress ResizeObserver loop exceeded errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0]?.includes?.('ResizeObserver loop limit exceeded') ||
      args[0]?.includes?.('ResizeObserver loop completed with undelivered notifications')
    ) {
      return; // Suppress these specific errors
    }
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('ResizeObserver')) {
      event.preventDefault();
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    if (event.error?.message?.includes('ResizeObserver')) {
      event.preventDefault();
    }
  });
};

/**
 * Smooth scroll with requestAnimationFrame to prevent layout thrashing
 * @param {HTMLElement} element - Element to scroll into view
 * @param {Object} options - Scroll options
 */
export const smoothScrollIntoView = (element, options = {}) => {
  if (!element) return;

  const defaultOptions = {
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
    ...options
  };

  // Use requestAnimationFrame to ensure smooth rendering
  requestAnimationFrame(() => {
    try {
      element.scrollIntoView(defaultOptions);
    } catch (error) {
      // Fallback for older browsers or when scrollIntoView options aren't supported
      console.warn('ScrollIntoView with options not supported, using fallback:', error.message);
      element.scrollIntoView(false);
    }
  });
};
