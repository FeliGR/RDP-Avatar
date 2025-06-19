import { useLayoutEffect } from "react";

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
  }, [ref, ...deps]);
};

export default useScrollToBottom;
