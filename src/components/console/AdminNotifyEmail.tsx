"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Icon from "../Icon";
import { cleanConvexError } from "@/lib/errors";

/**
 * Chooses where contact-form and quote notifications are emailed.
 *
 * This lives in the database rather than in an environment variable so an
 * admin can change it without a deploy, a terminal or a developer. Leaving it
 * empty falls back to the deployment's MAIL_TO, then to the SMTP account —
 * which means clearing the field is always a safe undo.
 */
export default function AdminNotifyEmail() {
  const current = useQuery(api.settings.adminNotifyEmail, {});
  const save = useMutation(api.settings.setNotifyEmail);

  // `draft` is null until the field is touched, so the displayed value simply
  // falls back to the server's. No effect, no state to keep in sync, and no way
  // for a late query result to overwrite what someone is typing.
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loaded = current !== undefined;
  const value = draft ?? current ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await save({ notifyEmail: value });
      setSaved(true);
    } catch (err) {
      setError(cleanConvexError(err, "Enregistrement impossible."));
    } finally {
      setBusy(false);
    }
  }

  const usingFallback = loaded && value.trim() === "";

  return (
    <form onSubmit={submit} className="glass-card rounded-xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-2">
        <Icon name="forward_to_inbox" className="text-secondary" fill />
        <h3 className="font-headline-lg-mobile text-on-surface">
          Destinataire des notifications
        </h3>
      </div>
      <p className="text-on-surface-variant text-sm mb-5">
        L&apos;adresse qui reçoit un email à chaque message de contact, demande de devis
        ou nouveau message dans la messagerie. Les messages restent de toute façon
        consultables ici.
      </p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
          placeholder="contact@votre-domaine.fr"
          spellCheck={false}
          autoComplete="off"
          disabled={!loaded}
          className="flex-1 bg-field border border-outline-variant text-on-surface px-3 py-2.5 rounded text-sm outline-none focus:border-primary transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !loaded}
          className="px-6 py-2.5 rounded-lg font-bold bg-primary text-on-primary hover:brightness-110 transition-all disabled:opacity-60"
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <div className="mt-3 space-y-1.5">
        {usingFallback && (
          <p className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1.5">
            <Icon name="info" className="text-sm" />
            Champ vide : l&apos;adresse configurée sur le serveur est utilisée.
          </p>
        )}
        {saved && (
          <p className="font-code-sm text-code-sm text-primary flex items-center gap-1.5">
            <Icon name="check_circle" className="text-sm" fill />
            Enregistré. Les prochaines notifications partiront vers cette adresse.
          </p>
        )}
        {error && (
          <p className="font-code-sm text-code-sm text-error flex items-center gap-1.5">
            <Icon name="error" className="text-sm" />
            {error}
          </p>
        )}
        <p className="font-code-sm text-code-sm text-on-surface-variant/70">
          Videz le champ pour revenir à la configuration du serveur.
        </p>
      </div>
    </form>
  );
}
