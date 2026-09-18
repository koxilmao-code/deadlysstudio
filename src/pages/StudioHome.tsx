import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/PublicChrome";
import { readProjects, team, type PortfolioProject } from "@/data/portfolio";

const metrics = [
  ["50+", "Games Scaled"],
  ["1 Billion+", "Impressions"],
  ["24/7", "Active Operations"],
];

export default function StudioHome() {
  const [projects, setProjects] = useState<PortfolioProject[]>(readProjects);

  useEffect(() => {
    const sync = () => setProjects(readProjects());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />

      <main>
        <section className="studio-shell flex min-h-[88vh] flex-col justify-end pb-10 pt-32 md:pb-16">
          <p className="mb-8 text-xs uppercase text-muted-foreground">Independent game development studio · Roblox</p>
          <h1 className="max-w-6xl text-[clamp(3.5rem,10vw,9.5rem)] font-semibold leading-[0.86]">
            We build games.<br /><span className="text-muted-foreground">Then scale them.</span>
          </h1>
          <div className="mt-12 flex items-end justify-between border-t border-border pt-5 md:mt-20">
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Strategy, production, and growth systems for experiences built to last.</p>
            <a href="#work" className="hidden items-center gap-2 text-xs uppercase md:flex">Selected work <ArrowDown className="h-4 w-4" /></a>
          </div>
        </section>

        <section className="border-y border-border" aria-label="Studio metrics">
          <div className="studio-shell grid md:grid-cols-3">
            {metrics.map(([value, label], index) => (
              <div key={label} className={`py-8 md:py-10 ${index > 0 ? "border-t border-border md:border-l md:border-t-0 md:pl-8" : ""}`}>
                <p className="text-4xl font-medium md:text-5xl">{value}</p>
                <p className="mt-2 text-xs uppercase text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="studio-shell py-24 md:py-36">
          <div className="mb-12 flex items-end justify-between border-b border-border pb-5 md:mb-16">
            <div><p className="section-index">01 / Selected work</p><h2 className="mt-3 text-4xl font-medium md:text-6xl">Built to perform.</h2></div>
            <p className="hidden text-xs text-muted-foreground md:block">{String(projects.length).padStart(2, "0")} EXPERIENCES</p>
          </div>
          <div className="grid gap-x-5 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <article key={project.id} className="project-card group">
                <a href={project.url} target="_blank" rel="noreferrer" className="block overflow-hidden bg-card" aria-label={`Launch ${project.title}`}>
                  <div className="aspect-[16/10] overflow-hidden">
                    <img src={project.image} alt={`${project.title} game artwork`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" loading={index > 2 ? "lazy" : "eager"} />
                  </div>
                </a>
                <div className="border-t border-border pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="text-xl font-medium leading-tight">{project.title}</h3><p className="mt-1 text-xs text-muted-foreground">by {project.studio}</p></div>
                    <span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">{project.tags.map(tag => <span key={tag} className="border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground">{tag}</span>)}</div>
                  <p className="mt-5 min-h-10 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
                  <Button asChild variant="outline" className="mt-6 w-full rounded-none border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background">
                    <a href={project.url} target="_blank" rel="noreferrer">Launch Experience <ArrowUpRight /></a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="team" className="border-t border-border py-24 md:py-36">
          <div className="studio-shell">
            <div className="mb-12 border-b border-border pb-5 md:mb-16"><p className="section-index">02 / The studio</p><h2 className="mt-3 text-4xl font-medium md:text-6xl">Small team. Full force.</h2></div>
            <div className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member, index) => (
                <article key={member.name} className="group">
                  <div className="aspect-[4/5] overflow-hidden bg-card">
                    {member.image ? <img src={member.image} alt={`${member.name}, ${member.role}`} className="h-full w-full object-cover object-center saturate-0 transition duration-500 group-hover:scale-[1.02] group-hover:saturate-100" loading="lazy" /> : <div className="flex h-full flex-col justify-between p-6"><span className="text-xs uppercase text-muted-foreground">Portrait pending</span><span className="text-8xl font-medium text-border">O.</span></div>}
                  </div>
                  <div className="flex justify-between border-t border-border pt-4"><div><h3 className="text-lg font-medium">{member.name}</h3><p className="mt-1 text-xs uppercase text-muted-foreground">{member.role}</p></div><span className="text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span></div>
                  <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">“{member.description}”</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border py-24 md:py-36">
          <div className="studio-shell grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="section-index">03 / Next move</p><h2 className="mt-4 max-w-4xl text-5xl font-medium leading-[0.95] md:text-8xl">Have a game worth scaling?</h2></div>
            <Button asChild className="h-14 rounded-none px-7">
              <a href="mailto:hello@deadlystudio.dev">Talk to the studio <ArrowUpRight /></a>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}