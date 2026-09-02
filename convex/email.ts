"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import nodemailer from "nodemailer";
import net from "node:net";
import tls from "node:tls";

/**
 * Transactional email over plain SMTP (Gmail for now).
 *
 * Like the Stripe secrets, these live on the CONVEX deployment — not in
 * .env.local and not on Vercel — because the sending happens inside a Convex
 * action. Set them with `npx convex env set NAME value` (add `--prod` for
 * production):
 *
 *   SMTP_USER      the Gmail address that authenticates, e.g. you@gmail.com
 *   SMTP_PASSWORD  a Google **App Password** (16 characters, spaces optional).
 *                  NOT your normal Google password — app passwords require
 *                  2-Step Verification to be switched on first, at
 *                  https://myaccount.google.com/apppasswords
 *   MAIL_TO        where contact-form notifications land. Optional, defaults
 *                  to SMTP_USER.
 *   MAIL_FROM      optional display From, e.g. "heycybercorp <you@gmail.com>".
 *                  Gmail will silently rewrite this to SMTP_USER unless the
 *                  address is a verified alias on that account, so leaving it
 *                  unset is usually the honest choice.
 *   SMTP_HOST      optional, defaults to smtp.gmail.com
 *   SMTP_PORT      optional, defaults to 465 (implicit TLS). Use 587 for
 *                  STARTTLS.
 *
 * Gmail caps a free account at roughly 500 recipients/day. That is plenty for
 * contact-form notifications to ourselves, and nowhere near enough for
 * customer-facing bulk mail — move to a real provider before sending campaigns.
 */

type MailConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  to: string;
};

/** Read + validate the mail settings, or null when they aren't configured. */
function mailConfig(): MailConfig | null {
  const user = process.env.SMTP_USER?.trim();
  // App passwords are shown as "abcd efgh ijkl mnop"; the spaces are cosmetic
  // and Google accepts either form, but nodemailer does not strip them.
  const password = process.env.SMTP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !password) return null;

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT?.trim() || 465);
  return {
    host,
    port,
    user,
    password,
    from: process.env.MAIL_FROM?.trim() || `heycybercorp <${user}>`,
    to: process.env.MAIL_TO?.trim() || user,
  };
}

function transport(cfg: MailConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades via STARTTLS.
    secure: cfg.port === 465,
    auth: { user: cfg.user, pass: cfg.password },
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Notify the team that someone used the contact / devis form.
 *
 * Scheduled (not awaited) by `messages.submit`, so a mail outage can never
 * cost us the message itself — that is already committed to the database by
 * the time this runs. Failures are logged and swallowed for the same reason:
 * retrying a scheduled action would not make Gmail any more reachable, and the
 * message is safe in /admin/messages regardless.
 */
type ContactPayload = {
  kind: "contact" | "devis";
  name: string;
  email: string;
  subject?: string;
  body: string;
};

type SendResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "send-failed" };

async function deliverContactNotification({
  kind,
  name,
  email,
  subject,
  body,
}: ContactPayload): Promise<SendResult> {
  {
    const cfg = mailConfig();
    if (!cfg) {
      console.error(
        "SMTP_USER / SMTP_PASSWORD absents de ce déploiement Convex — " +
          "message enregistré mais aucune notification envoyée.",
      );
      return { sent: false as const, reason: "not-configured" as const };
    }

    const label = kind === "devis" ? "Demande de devis" : "Message de contact";
    const title = subject?.trim() || label;

    try {
      await transport(cfg).sendMail({
        from: cfg.from,
        to: cfg.to,
        // Hitting "Reply" in the inbox answers the person who wrote in,
        // instead of mailing ourselves.
        replyTo: `${name} <${email}>`,
        subject: `[${label}] ${title}`,
        text: [
          `${label} — heycybercorp`,
          "",
          `Nom    : ${name}`,
          `Email  : ${email}`,
          subject?.trim() ? `Sujet  : ${subject.trim()}` : null,
          "",
          body,
          "",
          "—",
          "Répondez directement à cet email pour joindre l'expéditeur.",
        ]
          .filter((l) => l !== null)
          .join("\n"),
        html: `
          <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 16px">${escapeHtml(label)}</h2>
            <p style="margin:0 0 4px"><strong>Nom&nbsp;:</strong> ${escapeHtml(name)}</p>
            <p style="margin:0 0 4px"><strong>Email&nbsp;:</strong> ${escapeHtml(email)}</p>
            ${subject?.trim() ? `<p style="margin:0 0 4px"><strong>Sujet&nbsp;:</strong> ${escapeHtml(subject.trim())}</p>` : ""}
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
            <div style="white-space:pre-wrap">${escapeHtml(body)}</div>
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
            <p style="color:#666;font-size:13px;margin:0">
              Répondez directement à cet email pour joindre l'expéditeur.
            </p>
          </div>`,
      });
      return { sent: true as const };
    } catch (err) {
      console.error("Envoi SMTP échoué:", err);
      return { sent: false as const, reason: "send-failed" as const };
    }
  }
}

/** Scheduled by `messages.submit`; the work lives in the helper above. */
export const sendContactNotification = internalAction({
  args: {
    kind: v.union(v.literal("contact"), v.literal("devis")),
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
  },
  handler: async (_ctx, args): Promise<SendResult> => deliverContactNotification(args),
});

/**
 * Notify one side of an in-app conversation that the other side wrote.
 *
 * Scheduled by convex/conversations.ts after the message is committed, for the
 * same reason as the contact form: the thread is the record, email is only the
 * nudge that brings someone back to it. A failure is logged and swallowed.
 *
 * `to: "admins"` goes to MAIL_TO (the team inbox) with the student set as
 * Reply-To. `to: "student"` goes to that student's own address, and is only
 * scheduled when they have not switched email notifications off.
 */
export const sendConversationNotification = internalAction({
  args: {
    to: v.union(v.literal("admins"), v.literal("student")),
    studentEmail: v.optional(v.string()),
    subject: v.string(),
    body: v.string(),
    fromName: v.string(),
    fromEmail: v.optional(v.string()),
    link: v.string(),
  },
  handler: async (_ctx, args): Promise<SendResult> => {
    const cfg = mailConfig();
    if (!cfg) {
      console.error(
        "SMTP_USER / SMTP_PASSWORD absents de ce déploiement Convex — " +
          "message enregistré mais aucune notification envoyée.",
      );
      return { sent: false as const, reason: "not-configured" as const };
    }

    const recipient = args.to === "admins" ? cfg.to : args.studentEmail?.trim();
    if (!recipient) {
      console.error("Destinataire manquant pour la notification de conversation.");
      return { sent: false as const, reason: "not-configured" as const };
    }

    const url = `${(process.env.SITE_URL ?? "https://www.heycybercorp.fr").replace(/\/$/, "")}${args.link}`;
    const heading =
      args.to === "admins" ? "Nouveau message dans la messagerie" : "Réponse de heycybercorp";

    try {
      await transport(cfg).sendMail({
        from: cfg.from,
        to: recipient,
        // Answering the admin copy in the inbox reaches the student directly.
        replyTo: args.fromEmail ? `${args.fromName} <${args.fromEmail}>` : undefined,
        subject: `[Messagerie] ${args.subject}`,
        text: [
          heading,
          "",
          `De     : ${args.fromName}`,
          `Sujet  : ${args.subject}`,
          "",
          args.body,
          "",
          "—",
          `Répondre dans l'application : ${url}`,
        ].join("\n"),
        html: `
          <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6">
            <h2 style="margin:0 0 16px">${escapeHtml(heading)}</h2>
            <p style="margin:0 0 4px"><strong>De&nbsp;:</strong> ${escapeHtml(args.fromName)}</p>
            <p style="margin:0 0 4px"><strong>Sujet&nbsp;:</strong> ${escapeHtml(args.subject)}</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
            <div style="white-space:pre-wrap">${escapeHtml(args.body)}</div>
            <hr style="border:none;border-top:1px solid #ddd;margin:16px 0">
            <p style="margin:0">
              <a href="${escapeHtml(url)}" style="color:#08723d;font-weight:600">
                Répondre dans l'application
              </a>
            </p>
          </div>`,
      });
      return { sent: true as const };
    } catch (err) {
      console.error("Envoi SMTP échoué (messagerie):", err);
      return { sent: false as const, reason: "send-failed" as const };
    }
  },
});

/**
 * Connectivity + credential check, safe to run before any password exists.
 *
 * Step 1 opens a raw socket to the SMTP host and reads its greeting banner,
 * which answers the only question code review cannot: whether this runtime is
 * allowed to make outbound connections on a mail port at all. Step 2 only runs
 * once credentials are present, and performs a real AUTH handshake without
 * sending anything.
 *
 *   npx convex run email:diagnose
 */
export const diagnose = internalAction({
  args: {},
  handler: async () => {
    const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT?.trim() || 465);

    let greeting: string;
    try {
      greeting = await new Promise<string>((resolve, reject) => {
        const socket =
          port === 465
            ? tls.connect({ host, port, servername: host })
            : net.connect({ host, port });
        const timer = setTimeout(() => {
          socket.destroy();
          reject(new Error("timeout après 10s — port probablement bloqué"));
        }, 10_000);
        socket.once("data", (chunk: Buffer) => {
          clearTimeout(timer);
          socket.end();
          resolve(chunk.toString("utf8").trim());
        });
        socket.once("error", (err: Error) => {
          clearTimeout(timer);
          reject(err);
        });
      });
    } catch (err) {
      return {
        reachable: false,
        host,
        port,
        error: err instanceof Error ? err.message : String(err),
        credentials: mailConfig() ? "present" : "missing",
        authenticated: false,
      };
    }

    const cfg = mailConfig();
    if (!cfg) {
      return {
        reachable: true,
        host,
        port,
        greeting,
        credentials: "missing",
        authenticated: false,
      };
    }

    try {
      await transport(cfg).verify();
      return {
        reachable: true,
        host,
        port,
        greeting,
        credentials: "present",
        authenticated: true,
        from: cfg.from,
        to: cfg.to,
      };
    } catch (err) {
      return {
        reachable: true,
        host,
        port,
        greeting,
        credentials: "present",
        authenticated: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

/**
 * Send one real email to MAIL_TO, to confirm the whole chain end to end.
 *
 *   npx convex run email:sendTest
 */
export const sendTest = internalAction({
  args: {},
  handler: async (): Promise<{ sent: boolean; to?: string; reason?: string }> => {
    const cfg = mailConfig();
    if (!cfg) return { sent: false, reason: "not-configured" };
    // Reuse the exact path the contact form uses, so a passing test means the
    // real thing works — not merely that some email can be sent.
    const result = await deliverContactNotification({
      kind: "contact",
      name: "Test heycybercorp",
      email: cfg.to,
      subject: "Test de configuration SMTP",
      body:
        "Si vous lisez ceci, l'envoi d'emails depuis Convex fonctionne.\n" +
        "Ce message a emprunté exactement le même chemin que le formulaire de contact.",
    });
    return {
      sent: result.sent,
      to: cfg.to,
      reason: result.sent ? undefined : result.reason,
    };
  },
});

/**
 * Send a broadcast email to a single recipient.
 *
 * Called by `notifications.broadcast` (scheduled) so a mail outage can never
 * block the in-app notification — that is committed in the same transaction.
 * The recipient's email is passed in because internalAction has no db access;
 * the broadcast mutation looks it up before scheduling.
 */
export const sendBroadcastEmail = internalAction({
  args: { payload: v.object({ email: v.string(), title: v.string(), body: v.optional(v.string()) }) },
  handler: async (_ctx, { payload }) => {
    const cfg = mailConfig();
    if (!cfg) return { sent: false, reason: "not-configured" };
    if (!payload.email) return { sent: false, reason: "no-email" };

    const transportInstance = transport(cfg);
    const info = await transportInstance.sendMail({
      from: cfg.from,
      to: payload.email,
      subject: `[heycybercorp] ${payload.title}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
          <h2 style="margin: 0 0 12px; color: #08723d;">${escapeHtml(payload.title)}</h2>
          ${payload.body ? `<p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(payload.body)}</p>` : ""}
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">Vous recevez cet email car vous avez activé les notifications de diffusion dans votre profil.</p>
        </div>
      `,
    });
    return { sent: true, messageId: info.messageId };
  },
});
