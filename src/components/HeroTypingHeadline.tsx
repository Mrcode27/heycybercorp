"use client";

import { useEffect, useState } from "react";

const PREFIX = "Maîtrisez l'Art de la";
const ACCENT = "Cyberdéfense";
const FULL_TITLE = `${PREFIX} ${ACCENT}`;

function HeadingText({ length }: { length: number }) {
  const typed = FULL_TITLE.slice(0, length);
  const prefix = typed.slice(0, PREFIX.length);
  const accent = length > PREFIX.length ? typed.slice(PREFIX.length + 1) : "";

  return (
    <>
      {prefix}
      {length > PREFIX.length && " "}
      {accent && <span className="landing-cyber-word italic">{accent}</span>}
    </>
  );
}

/** Types the complete promise once while an invisible copy preserves layout. */
export default function HeroTypingHeadline({ className }: { className: string }) {
  const [length, setLength] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        setLength(FULL_TITLE.length);
        setComplete(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (length >= FULL_TITLE.length) {
      const doneTimer = window.setTimeout(() => setComplete(true), 650);
      return () => window.clearTimeout(doneTimer);
    }

    const delay = length === 0 ? 320 : length === PREFIX.length ? 170 : 46;
    const typeTimer = window.setTimeout(() => {
      setLength((current) => Math.min(FULL_TITLE.length, current + 1));
    }, delay);

    return () => window.clearTimeout(typeTimer);
  }, [length]);

  return (
    <h1
      className={`${className} hero-typed-heading`}
      aria-label={FULL_TITLE}
      data-cyber-reveal
    >
      <span className="hero-typed-heading-ghost" aria-hidden="true">
        {PREFIX} <span className="landing-cyber-word italic">{ACCENT}</span>
      </span>
      <span className="hero-typed-heading-live" aria-hidden="true">
        <HeadingText length={length} />
        <i
          className={`hero-heading-caret${complete ? " hero-heading-caret-complete" : ""}`}
        />
      </span>
    </h1>
  );
}
