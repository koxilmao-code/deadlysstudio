import { useState, type FormEvent } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { supabase } from "@/integrations/supabase/client";
import { firstIssue, reviewSchema } from "@/lib/publicForms";

const inputs = "h-12 rounded-none border-border bg-card px-4 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0";

export default function GameReview() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const parsed = reviewSchema.safeParse({
      studio_name: form.get("studio_name"), contact_email: form.get("contact_email"), game_url: form.get("game_url"),
      game_stage: form.get("game_stage"), primary_goal: form.get("primary_goal"), context: form.get("context") || undefined,
    });
    if (!parsed.success) { setError(firstIssue(parsed.error)); return; }
    setStatus("sending");
    const { error: requestError } = await supabase.from("game_review_submissions").insert(parsed.data);
    if (requestError) { setError("We couldn’t send your request. Please try again."); setStatus("idle"); return; }
    setStatus("sent");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <main>
        <section className="studio-shell grid min-h-[78vh] gap-12 pb-20 pt-32 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:pb-28">
          <div>
            <p className="section-index">Free game review / 01</p>
            <h1 className="mt-6 max-w-5xl text-6xl font-medium leading-[0.9] md:text-8xl lg:text-9xl">Your next move,<br /><span className="text-muted-foreground">made clearer.</span></h1>
          </div>
          <div className="max-w-lg border-t border-border pt-6 lg:justify-self-end">
            <p className="text-lg leading-relaxed">Submit your Roblox experience for a complimentary strategic review from our production and growth team.</p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">We review positioning, retention, monetization, acquisition, and live operations. If there’s a strong fit, we’ll contact you with practical next steps.</p>
          </div>
        </section>

        <section className="border-t border-border py-20 md:py-28">
          <div className="studio-shell grid gap-12 lg:grid-cols-[0.55fr_1fr]">
            <div><p className="section-index">Submission / 02</p><h2 className="mt-4 text-4xl font-medium md:text-5xl">Send us the build.</h2></div>
            {status === "sent" ? (
              <div className="flex min-h-80 flex-col justify-between border border-border bg-card p-7 md:p-10" role="status">
                <Check className="h-8 w-8" />
                <div><h3 className="text-3xl font-medium">Review requested.</h3><p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">Your game is now with the studio team. We’ll use the contact email you provided if we see a useful path forward.</p></div>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-6" noValidate>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Studio or developer" name="studio_name"><Input id="studio_name" name="studio_name" maxLength={100} required className={inputs} placeholder="Your name or studio" /></Field>
                  <Field label="Contact email" name="contact_email"><Input id="contact_email" name="contact_email" type="email" maxLength={254} required className={inputs} placeholder="you@studio.com" /></Field>
                </div>
                <Field label="Roblox experience link" name="game_url"><Input id="game_url" name="game_url" type="url" maxLength={500} required className={inputs} placeholder="https://www.roblox.com/games/..." /></Field>
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Current stage" name="game_stage"><select id="game_stage" name="game_stage" className={`${inputs} w-full text-sm`} defaultValue="live"><option value="concept">Concept</option><option value="alpha">Alpha</option><option value="beta">Beta</option><option value="live">Live</option></select></Field>
                  <Field label="Primary goal" name="primary_goal"><select id="primary_goal" name="primary_goal" className={`${inputs} w-full text-sm`} defaultValue="overall-strategy"><option value="retention">Retention</option><option value="monetization">Monetization</option><option value="acquisition">Acquisition</option><option value="live-ops">Live operations</option><option value="overall-strategy">Overall strategy</option></select></Field>
                </div>
                <Field label="Context (optional)" name="context"><Textarea id="context" name="context" maxLength={2000} className="min-h-36 rounded-none border-border bg-card p-4 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-0" placeholder="What is working, what feels stuck, and what would make this review valuable?" /></Field>
                {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
                <Button type="submit" disabled={status === "sending"} className="h-14 justify-between rounded-none px-5">{status === "sending" ? "Sending…" : "Request free review"}<ArrowRight className="h-4 w-4" /></Button>
              </form>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function Field({ label, name, children }: { label: string; name: string; children: React.ReactNode }) {
  return <div className="grid gap-2"><Label htmlFor={name} className="text-xs uppercase text-muted-foreground">{label}</Label>{children}</div>;
}