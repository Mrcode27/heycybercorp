"use client";

import { useState } from "react";
import Icon from "./Icon";

type DemoFormProps = {
  children: React.ReactNode;
  className?: string;
  submitLabel: string;
  submitClassName: string;
  submitIcon?: string;
};

/** Client form wrapper: prevents real submission and shows a success banner. */
export default function DemoForm({
  children,
  className = "",
  submitLabel,
  submitClassName,
  submitIcon,
}: DemoFormProps) {
  const [sent, setSent] = useState(false);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      {children}
      <button type="submit" className={submitClassName}>
        {submitLabel}
        {submitIcon && <Icon name={submitIcon} />}
      </button>
      {sent && (
        <p className="font-code-sm text-code-sm text-primary flex items-center gap-2">
          <Icon name="check_circle" className="text-sm" fill />
          Requête transmise — nos experts vous répondront sous 24h.
        </p>
      )}
    </form>
  );
}
