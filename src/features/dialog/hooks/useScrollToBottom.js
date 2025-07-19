import { useLayoutEffect } from "react";

const useScrollToBottom = (ref, dependencies = []) => {
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
  }, [ref, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useScrollToBottom;
