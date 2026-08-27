import type { Metadata } from "next";
import PublicShell from "@/components/PublicShell";
import Icon from "@/components/Icon";
import LiveForm from "@/components/LiveForm";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact | heycybercorp",
  description:
    "Une question sur nos formations en cybersécurité, une demande entreprise ou un partenariat ? Contactez l'équipe heycybercorp.",
  path: "/contact",
});

const inputClass =
  "w-full bg-field border border-outline-variant text-on-surface px-4 py-3 rounded-sm focus:ring-1 focus:ring-secondary focus:border-secondary transition-all outline-none";
const labelClass = "font-label-mono text-label-mono text-on-surface-variant uppercase";

const CHANNELS = [
  { icon: "mail", color: "text-primary", label: "Email", value: CONTACT_EMAIL },
  { icon: "call", color: "text-secondary", label: "Téléphone", value: "+33 1 84 80 00 00" },
  { icon: "location_on", color: "text-primary", label: "Bureaux", value: "Paris · Douala" },
];

export default function ContactPage() {
  return (
    <PublicShell>
      <section className="pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto cyber-grid-dots min-h-screen">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary font-label-mono text-label-mono mb-6 rounded-sm uppercase tracking-widest">
            Canal Sécurisé
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-background mb-6">
            Établir une <span className="text-primary glow-text-primary">Connexion</span>
          </h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg max-w-2xl mx-auto">
            Une question sur nos formations, nos certifications ou un partenariat ? Transmettez votre
            message, notre équipe répond sous 24 heures.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* Channels */}
          <div className="lg:col-span-2 space-y-6">
            {CHANNELS.map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-4 glass-card p-6 rounded-sm"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-surface-container-high border border-outline-variant rounded-sm">
                  <Icon name={c.icon} className={c.color} />
                </div>
                <div>
                  <div className={`font-label-mono text-label-mono uppercase ${c.color}`}>
                    {c.label}
                  </div>
                  <div className="text-on-surface">{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <LiveForm
              kind="contact"
              className="glass-card p-8 md:p-12 rounded-sm space-y-6"
              submitLabel="Envoyer le message"
              submitIcon="send"
              submitClassName="w-full bg-secondary text-on-secondary font-bold py-4 rounded-sm hover:brightness-110 cyber-glow-secondary transition-all flex items-center justify-center gap-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Nom</label>
                  <input name="nom" className={inputClass} placeholder="Jean Dupont" type="text" required />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Email</label>
                  <input name="email" className={inputClass} placeholder="jean@email.com" type="email" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Sujet</label>
                <input
                  name="sujet"
                  className={inputClass}
                  placeholder="Objet de votre message"
                  type="text"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Message</label>
                <textarea
                  name="message"
                  className={inputClass}
                  placeholder="Écrivez votre message ici..."
                  rows={6}
                  required
                  minLength={10}
                />
              </div>
            </LiveForm>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
