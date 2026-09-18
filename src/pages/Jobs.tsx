import { useState, type FormEvent } from "react";
import { ArrowRight, Check, MoveDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { supabase } from "@/integrations/supabase/client";
import { applicationSchema, firstIssue } from "@/lib/publicForms";

const roles = [
  { slug: "acquisition-executive", title: "Acquisition Executive", team: "Growth & Partnerships", location: "Remote", summary: "Source and evaluate promising Roblox experiences, build founder relationships, and move qualified opportunities through a clear acquisition pipeline.", traits: ["Roblox market fluency", "Commercial judgment", "Clear founder communication"] },
  { slug: "live-operations", title: "Live Operations", team: "Production", location: "Remote", summary: "Own release cadence, event planning, and performance follow-through across a portfolio of active Roblox experiences.", traits: ["Live game experience", "Metrics-led planning", "Cross-team execution"] },
] as const;

const perks = [
  ["01", "Modern workspace", "A practical setup budget for focused, high-quality work."],
  ["02", "Gym stipend", "Monthly support for training, movement, and long-term health."],
  ["03", "High ownership", "Small teams, direct access, and room to shape how we operate."],
  ["04", "Game-first culture", "Work alongside people who understand Roblox and play what they build."],
];

const inputClass = "h-12 rounded-none border-border bg-background px-4 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0";

export default function Jobs() {
  const [selectedRole, setSelectedRole] = useState<(typeof roles)[number] | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  function chooseRole(role: (typeof roles)[number]) {
    setSelectedRole(role); setStatus("idle"); setError("");
    window.setTimeout(() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" }), 0);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRole) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const parsed = applicationSchema.safeParse({ role_slug: selectedRole.slug, applicant_name: form.get("applicant_name"), contact_email: form.get("contact_email"), profile_url: form.get("profile_url"), note: form.get("note") });
    if (!parsed.success) { setError(firstIssue(parsed.error)); return; }
    setStatus("sending");
    const { error: requestError } = await supabase.from("job_applications").insert(parsed.data);
    if (requestError) { setError("We couldn’t send your application. Please try again."); setStatus("idle"); return; }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>
        <section className="studio-shell flex min-h-[72vh] flex-col justify-end pb-16 pt-32 md:pb-24">
          <p className="section-index">Careers / Deadly’s Studio</p>
          <h1 className="mt-7 max-w-6xl text-6xl font-medium leading-[0.88] md:text-8xl lg:text-9xl">Do your best work.<br /><span className="text-muted-foreground">Build what lasts.</span></h1>
          <div className="mt-12 flex items-end justify-between border-t border-border pt-5 md:mt-20"><p className="max-w-lg text-sm leading-relaxed text-muted-foreground">Join a focused team turning ambitious Roblox experiences into durable, growing businesses.</p><MoveDownRight className="hidden h-5 w-5 md:block" /></div>
        </section>

        <section className="border-y border-border">
          <div className="studio-shell grid md:grid-cols-2 lg:grid-cols-4">
            {perks.map(([number, title, copy], index) => <article key={title} className={`py-8 md:px-6 md:py-10 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}><p className="text-xs text-muted-foreground">{number}</p><h2 className="mt-8 text-xl font-medium">{title}</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy}</p></article>)}
          </div>
        </section>

        <section className="studio-shell py-24 md:py-36">
          <div className="mb-12 border-b border-border pb-5"><p className="section-index">Open positions / 02</p><h2 className="mt-3 text-4xl font-medium md:text-6xl">Find your seat.</h2></div>
          <div>
            {roles.map((role, index) => (
              <article key={role.slug} className="grid gap-6 border-b border-border py-9 lg:grid-cols-[3rem_1fr_1.2fr_auto] lg:items-start">
                <span className="text-xs text-muted-foreground">0{index + 1}</span>
                <div><h3 className="text-2xl font-medium">{role.title}</h3><p className="mt-2 text-xs uppercase text-muted-foreground">{role.team} · {role.location}</p></div>
                <div><p className="text-sm leading-relaxed text-muted-foreground">{role.summary}</p><div className="mt-4 flex flex-wrap gap-2">{role.traits.map((trait) => <span key={trait} className="border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground">{trait}</span>)}</div></div>
                <Button onClick={() => chooseRole(role)} variant="outline" className="rounded-none">Apply <ArrowRight /></Button>
              </article>
            ))}
          </div>
        </section>

        {selectedRole && <section id="apply" className="border-t border-border bg-card py-20 md:py-28">
          <div className="studio-shell grid gap-12 lg:grid-cols-[0.6fr_1fr]">
            <div><p className="section-index">Application / {selectedRole.team}</p><h2 className="mt-4 text-4xl font-medium md:text-5xl">{selectedRole.title}</h2></div>
            {status === "sent" ? <div className="flex min-h-72 flex-col justify-between border border-border p-8" role="status"><Check className="h-8 w-8" /><div><h3 className="text-3xl font-medium">Application received.</h3><p className="mt-3 text-sm text-muted-foreground">Thanks for reaching out. We’ll review your work and contact you if the fit is right.</p></div></div> :
            <form onSubmit={submit} className="grid gap-6" noValidate>
              <div className="grid gap-6 md:grid-cols-2"><Field label="Full name" name="applicant_name"><Input id="applicant_name" name="applicant_name" maxLength={100} required className={inputClass} /></Field><Field label="Contact email" name="contact_email"><Input id="contact_email" name="contact_email" type="email" maxLength={254} required className={inputClass} /></Field></div>
              <Field label="Portfolio or profile link" name="profile_url"><Input id="profile_url" name="profile_url" type="url" maxLength={500} required className={inputClass} placeholder="https://" /></Field>
              <Field label="Why you" name="note"><Textarea id="note" name="note" minLength={20} maxLength={2000} required className="min-h-40 rounded-none border-border bg-background p-4 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0" placeholder="Tell us what you have done, what you care about, and why this role fits." /></Field>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" disabled={status === "sending"} className="h-14 justify-between rounded-none px-5">{status === "sending" ? "Sending…" : "Submit application"}<ArrowRight className="h-4 w-4" /></Button>
            </form>}
          </div>
        </section>}
      </main>
      <PublicFooter />
    </div>
  );
}

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label htmlFor={name} className="text-xs uppercase text-muted-foreground">{label}</Label>{children}</div>; }