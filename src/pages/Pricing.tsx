import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { PlanGrid } from "@/components/PlanGrid";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="studio-shell pb-24 pt-32">
        <p className="section-index">Pricing</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-medium leading-[0.95] md:text-7xl">Analytics for everyone. Human craft when you're ready.</h1>
        <p className="mt-6 max-w-xl text-sm text-muted-foreground">Every thumbnail and trailer is made by a real artist in Blender or a real editor — never generated. Cancel anytime.</p>
        <div className="mt-14"><PlanGrid /></div>
        <p className="mt-4 text-xs text-muted-foreground">Payments are handled securely by Stripe. Creative slots are limited each month so every order gets full attention.</p>
      </main>
      <PublicFooter />
    </div>
  );
}
