"use client";

import { useEffect } from "react";

/**
 * Small progressive-enhancement layer for the public homepage.
 * The page stays fully visible without JavaScript; this only adds pointer depth
 * and intersection-based entrances when motion is appropriate for the visitor.
 */
export default function LandingMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const hero = document.querySelector<HTMLElement>("[data-cyber-hero]");
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>("[data-cyber-reveal]"),
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      reveals.forEach((item) => item.classList.add("cyber-in-view"));
      return;
    }

    root.classList.add("landing-motion-ready");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("cyber-in-view");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    reveals.forEach((item) => observer.observe(item));

    let animationFrame = 0;
    let clickTimer = 0;
    const updatePointer = (event: PointerEvent) => {
      if (!hero) return;
      hero.classList.add("landing-user-active");
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const bounds = hero.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));

        hero.style.setProperty("--hero-pointer-x", `${(x * 100).toFixed(2)}%`);
        hero.style.setProperty("--hero-pointer-y", `${(y * 100).toFixed(2)}%`);
        hero.style.setProperty("--hero-tilt-x", `${((0.5 - y) * 3).toFixed(2)}deg`);
        hero.style.setProperty("--hero-tilt-y", `${((x - 0.5) * 4).toFixed(2)}deg`);
        hero.style.setProperty("--eye-offset-x", `${((x - 0.5) * 8).toFixed(2)}px`);
        hero.style.setProperty("--eye-offset-y", `${((y - 0.5) * 5).toFixed(2)}px`);
        hero.style.setProperty("--code-shift-x", `${((x - 0.5) * 18).toFixed(2)}px`);
        hero.style.setProperty("--code-shift-y", `${((y - 0.5) * 12).toFixed(2)}px`);
      });
    };

    const pulsePointer = (event: PointerEvent) => {
      if (!hero) return;
      updatePointer(event);
      window.clearTimeout(clickTimer);
      hero.classList.remove("landing-user-clicked");
      void hero.offsetWidth;
      hero.classList.add("landing-user-clicked");
      clickTimer = window.setTimeout(() => {
        hero.classList.remove("landing-user-clicked");
      }, 720);
    };

    const resetPointer = () => {
      if (!hero) return;
      hero.classList.remove("landing-user-active", "landing-user-clicked");
      hero.style.setProperty("--hero-pointer-x", "68%");
      hero.style.setProperty("--hero-pointer-y", "38%");
      hero.style.setProperty("--hero-tilt-x", "0deg");
      hero.style.setProperty("--hero-tilt-y", "0deg");
      hero.style.setProperty("--eye-offset-x", "0px");
      hero.style.setProperty("--eye-offset-y", "0px");
      hero.style.setProperty("--code-shift-x", "0px");
      hero.style.setProperty("--code-shift-y", "0px");
    };

    hero?.addEventListener("pointermove", updatePointer, { passive: true });
    hero?.addEventListener("pointerdown", pulsePointer, { passive: true });
    hero?.addEventListener("pointerleave", resetPointer);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(clickTimer);
      hero?.removeEventListener("pointermove", updatePointer);
      hero?.removeEventListener("pointerdown", pulsePointer);
      hero?.removeEventListener("pointerleave", resetPointer);
      root.classList.remove("landing-motion-ready");
    };
  }, []);

  return null;
}
