import { useLayoutEffect } from "react";

/**
 * A hook that scrolls a container to the bottom whenever dependencies change
 * @param {Object} ref - Reference to the element to scroll into view
 * @param {Array} deps - Dependencies array that triggers scroll when changed
 */
const useScrollToBottom = (ref, deps = []) => {
  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView(false);

      setTimeout(() => {
        const container = document.querySelector(".messages-container");
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  }, deps);
};

export default useScrollToBottom;
