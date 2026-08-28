"use client";

import { useEffect, type ReactNode } from "react";
import Icon from "../Icon";

export default function AdminModal({ title, eyebrow, icon, onClose, children, wide = false, escapeCloses = true }: {
  title: string;
  eyebrow: string;
  icon: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  escapeCloses?: boolean;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    if (escapeCloses) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      if (escapeCloses) window.removeEventListener("keydown", onKey);
    };
  }, [escapeCloses, onClose]);

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`w-full ${wide ? "max-w-[1500px]" : "max-w-6xl"} max-h-[94vh] flex flex-col overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-2xl`}>
        <header className="h-18 shrink-0 flex items-center gap-4 px-5 md:px-7 border-b border-outline-variant/30 bg-surface-container-high/85">
          <div className="w-10 h-10 rounded-xl grid place-items-center border border-primary/20 bg-primary/10 text-primary">
            <Icon name={icon} fill />
          </div>
          <div className="min-w-0">
            <p className="font-label-mono text-label-mono uppercase tracking-[0.18em] text-primary mb-1">{eyebrow}</p>
            <h2 className="font-headline-lg-mobile text-on-surface truncate">{title}</h2>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {escapeCloses && <span className="hidden md:inline font-code-sm text-code-sm text-on-surface-variant">ESC pour fermer</span>}
            <button type="button" onClick={onClose} aria-label="Fermer" className="w-10 h-10 grid place-items-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">
              <Icon name="close" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto no-scrollbar">{children}</div>
      </div>
    </div>
  );
}
