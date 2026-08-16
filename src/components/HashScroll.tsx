import { useEffect } from "react";

export function HashScroll() {
  useEffect(() => {
    let firstFrame = 0;
    let secondFrame = 0;

    const scrollToCurrentHash = () => {
      const encodedId = window.location.hash.slice(1);
      if (!encodedId) return;

      let id = encodedId;
      try {
        id = decodeURIComponent(encodedId);
      } catch {
        // Use the literal hash when it contains invalid percent encoding.
      }

      document.getElementById(id)?.scrollIntoView({ block: "start" });
    };

    const scheduleScroll = () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(scrollToCurrentHash);
      });
    };

    scheduleScroll();
    window.addEventListener("hashchange", scheduleScroll);
    window.addEventListener("pageshow", scheduleScroll);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.removeEventListener("hashchange", scheduleScroll);
      window.removeEventListener("pageshow", scheduleScroll);
    };
  }, []);

  return null;
}
