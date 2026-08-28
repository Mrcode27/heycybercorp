"use client";

import { useEffect, useRef, useState } from "react";
import { runCommand, complete, type Line, type ShellConfig } from "@/lib/shell";

/**
 * The terminal UI. Rendering only — every behaviour lives in `@/lib/shell`, so
 * the homepage hero and a case's `terminal` artifact stay identical in
 * behaviour while differing in configuration.
 */
export default function Terminal({
  config,
  motd = [],
  title,
  height = "h-[340px]",
  className = "",
}: {
  config: ShellConfig;
  motd?: Line[];
  title?: string;
  height?: string;
  className?: string;
}) {
  const [history, setHistory] = useState<Line[]>(motd);
  const [input, setInput] = useState("");
  const [cmdLog, setCmdLog] = useState<string[]>([]);
  const [logIndex, setLogIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The working copy of the case's filesystem. Lazy state, not a memo: commands
  // that write must persist across renders, and React may discard a memo at any
  // time. Never reassigned — the object is mutated in place by the shell.
  const [files] = useState(() => ({ ...config.files }));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  function run(raw: string) {
    const { lines, clear } = runCommand(config, files, cmdLog, raw);
    if (clear) {
      setHistory([]);
    } else if (lines.length) {
      setHistory((h) => [...h, ...lines]);
    }
    if (raw.trim()) setCmdLog((l) => [...l, raw.trim()]);
    setLogIndex(-1);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      run(input);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const r = complete(config, files, input);
      if (r.input !== undefined) setInput(r.input);
      if (r.suggestions) {
        setHistory((h) => [...h, { type: "system", text: r.suggestions!.join("   ") }]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdLog.length === 0) return;
      const next = logIndex < 0 ? cmdLog.length - 1 : Math.max(0, logIndex - 1);
      setLogIndex(next);
      setInput(cmdLog[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (logIndex < 0) return;
      const next = logIndex + 1;
      if (next >= cmdLog.length) {
        setLogIndex(-1);
        setInput("");
      } else {
        setLogIndex(next);
        setInput(cmdLog[next]);
      }
    }
  }

  const prompt = `${config.user}@${config.host}:~$`;

  return (
    <div
      className={`terminal-container rounded-lg p-1 shadow-2xl overflow-hidden border border-outline-variant ${className}`}
    >
      <div className="bg-terminal-bar px-4 py-2 flex items-center gap-2 border-b border-outline-variant/40">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error" />
          <div className="w-3 h-3 rounded-full bg-secondary" />
          <div className="w-3 h-3 rounded-full bg-primary" />
        </div>
        <div className="flex-1 text-center font-label-mono text-xs text-on-terminal opacity-70">
          {title ?? `${config.user}@${config.host} — hccsh 2.1.0`}
        </div>
        <div className="flex items-center gap-1.5 font-label-mono text-[10px] text-on-terminal opacity-60">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          LIVE
        </div>
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus()}
        className={`terminal-scanlines terminal-sweep relative p-6 font-code-sm text-code-sm text-primary-fixed-dim bg-terminal ${height} overflow-y-auto no-scrollbar cursor-text`}
      >
        {history.map((line, i) => {
          if (line.type === "input") {
            return (
              <p key={i} className="mb-1 whitespace-pre-wrap break-words">
                <span className="text-secondary">{prompt}</span> {line.text}
              </p>
            );
          }
          const tone =
            line.type === "system"
              ? "text-on-terminal/70 italic"
              : line.type === "error"
                ? "text-error"
                : line.type === "success"
                  ? "text-primary"
                  : "";
          return (
            <p key={i} className={`mb-2 whitespace-pre-wrap break-words ${tone}`}>
              {line.text}
            </p>
          );
        })}

        <div className="flex items-center relative z-10">
          <span className="text-secondary shrink-0">{prompt}</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            aria-label="Terminal interactif"
            className="flex-1 ml-2 bg-transparent border-none outline-none text-primary-fixed-dim font-code-sm text-code-sm"
          />
        </div>
      </div>
    </div>
  );
}
