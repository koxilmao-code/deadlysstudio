import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Upload, RotateCcw, Columns2, Download, Package, Trash2 } from "lucide-react";
import { useSession, type Tier } from "@/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { PageHead, Panel, tierName } from "./kit";
import {
  applyPreset, BASE, COUNTDOWN_STAGES, EXPORTS, EXPORT_SIZES, exportName, FONT_CSS, FONTS, iconStudioAccess, LIMITS,
  normalizeDesign, PRESETS, TEXT_MAX, type ExportFormat, type FontId, type GlassStyle, type IconDesign, type Preset,
} from "@/lib/iconStudio";
import { exportIcon, renderIcon, type Source } from "@/lib/iconRender";
import { deliverFile } from "@/lib/download";

const NEXT = "/exchange/creative/icon-studio";
const MAX_BYTES = 15 * 1024 * 1024;
const SAVED_KEY = "outrun.iconPresets";
const MAX_SAVED = 8;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

let fontsP: Promise<unknown> | null = null;
function loadFonts() {
  return (fontsP ??= new Promise<void>((res) => {
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = FONT_CSS; l.onload = () => res(); l.onerror = () => res();
    document.head.appendChild(l);
  }).then(() => Promise.all(Object.values(FONTS).map((f) => document.fonts.load(`${f.weight} 48px "${f.family}"`).catch(() => null)))));
}
function useFontsVersion() {
  const [v, setV] = useState(0);
  useEffect(() => { let on = true; loadFonts().then(() => on && setV(1)); return () => { on = false; }; }, []);
  return v;
}

function IconCanvas({ source, design, size, className, fontsV }: { source: Source | null; design: IconDesign; size: number; className?: string; fontsV: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) renderIcon(ref.current, source, design, size); }, [source, design, size, fontsV]);
  return <canvas ref={ref} className={className} aria-hidden />;
}

export default function IconStudio() {
  const { tier, ready, session } = useSession();
  const access = iconStudioAccess(tier);
  return (
    <>
      <PageHead index="05.1 / Creative Studio" title="Icon Update Studio" desc="Add hourglass and countdown overlays to your game icon for update hype, then export every stage.">
        <Link to="/exchange/creative" className="text-xs text-muted-foreground hover:text-foreground">← Creative Studio</Link>
      </PageHead>
      {!ready ? <p className="text-sm text-muted-foreground">Loading…</p>
        : access === "locked" ? <LockedPreview tier={tier} signedIn={!!session} />
        : <Editor advanced={access === "advanced"} />}
    </>
  );
}

function LockedPreview({ tier, signedIn }: { tier: Tier; signedIn: boolean }) {
  const fontsV = useFontsVersion();
  const demos: [string, Preset][] = [["24 HOURS", PRESETS[0]], ["1 HOUR", PRESETS[2]], ["NOW!", PRESETS[1]]];
  return (
    <Panel>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {demos.map(([t, p]) => <IconCanvas key={t} source={null} design={applyPreset(p, t)} size={320} fontsV={fontsV} className="aspect-square w-full border border-border" />)}
      </div>
      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4" /> Requires Starter or above</p>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Icon Update Studio is included with Starter, Premium and Scale. You are on {tierName(tier)}.
            Upload your icon, add hourglass and countdown overlays, compare before and after, and export PNG, JPEG or WEBP.
          </p>
        </div>
        <div className="flex gap-2">
          {!signedIn && <Button asChild variant="outline" className="rounded-none"><Link to={`/auth?next=${encodeURIComponent(NEXT)}`}>Sign in</Link></Button>}
          <Button asChild className="rounded-none"><Link to="/exchange/subscription">Upgrade to Starter</Link></Button>
        </div>
      </div>
    </Panel>
  );
}

type Tab = "countdown" | "hourglass" | "text" | "effects" | "presets" | "export";
const TABS: [Tab, string][] = [["countdown", "Countdown"], ["hourglass", "Hourglass"], ["text", "Text"], ["effects", "Effects"], ["presets", "Presets"], ["export", "Export"]];

function readSaved(): { name: string; design: IconDesign }[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.slice(0, MAX_SAVED).map((x) => ({ name: String(x?.name ?? "Preset").slice(0, 30), design: normalizeDesign(x?.design) })) : [];
  } catch { return []; }
}

function Editor({ advanced }: { advanced: boolean }) {
  const fontsV = useFontsVersion();
  const [d, setD] = useState<IconDesign>(BASE);
  const [source, setSource] = useState<(Source & { url: string }) | null>(null);
  const [compare, setCompare] = useState(false);
  const [pos, setPos] = useState(50);
  const [tab, setTab] = useState<Tab>("countdown");
  const [fmt, setFmt] = useState<ExportFormat>("png");
  const [size, setSize] = useState(512);
  const [busy, setBusy] = useState(false);
  const [pack, setPack] = useState<Blob | null>(null);
  const [saved, setSaved] = useState(readSaved);
  const [presetName, setPresetName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  useEffect(() => setPack(null), [d, source, fmt, size]);

  const set = <K extends keyof IconDesign>(k: K, v: IconDesign[K]) => setD((p) => ({ ...p, [k]: v }));

  const onFile = async (file?: File | null) => {
    if (!file) return;
    if (!(Object.values(EXPORTS) as string[]).includes(file.type)) return toast.error("Upload a PNG, JPEG or WEBP image.");
    if (file.size > MAX_BYTES) return toast.error("Image must be under 15 MB.");
    const url = URL.createObjectURL(file);
    const img = new Image(); img.src = url;
    try { await img.decode(); } catch { URL.revokeObjectURL(url); return toast.error("That image couldn't be read."); }
    if (img.naturalWidth < 64 || img.naturalHeight < 64) { URL.revokeObjectURL(url); return toast.error("Image must be at least 64×64 px."); }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    setSource({ img, w: img.naturalWidth, h: img.naturalHeight, url });
  };

  const usePreset = (p: Preset) => {
    if (p.advanced && !advanced) return toast.error("This preset is included with Premium and Scale.");
    setD(applyPreset(p, d.text));
  };
  const savePreset = () => {
    if (!advanced) return;
    const name = presetName.trim().slice(0, 30) || `Preset ${saved.length + 1}`;
    const next = [{ name, design: normalizeDesign(d) }, ...saved].slice(0, MAX_SAVED);
    setSaved(next); setPresetName("");
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    toast.success(`Saved "${name}"`);
  };
  const removeSaved = (i: number) => {
    const next = saved.filter((_, j) => j !== i);
    setSaved(next); localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const exportOne = async () => {
    if (!source) return toast.error("Upload your icon first.");
    const s = advanced ? size : 512;
    setBusy(true);
    try { await deliverFile(await exportIcon(source, d, s, fmt), exportName(d.text, fmt)); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };
  const buildPack = async () => {
    if (!advanced || !source) return;
    setBusy(true); setPack(null);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const [i, t] of COUNTDOWN_STAGES.entries()) zip.file(exportName(t, fmt, i), await exportIcon(source, { ...d, text: t }, size, fmt));
      setPack(await zip.generateAsync({ type: "blob", compression: "STORE" }));
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div
          className="relative mx-auto aspect-square w-full max-w-[34rem] select-none overflow-hidden border border-border bg-muted"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
        >
          {compare && source && <img src={source.url} alt="Original icon" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
          <div className="absolute inset-0" style={compare && source ? { clipPath: `inset(0 0 0 ${pos}%)` } : undefined}>
            <IconCanvas source={source} design={d} size={512} fontsV={fontsV} className="h-full w-full" />
          </div>
          {!source && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 border border-border bg-background/85 px-4 py-3 text-sm backdrop-blur">
              <Upload className="h-4 w-4" /> Upload your game icon (or drop it here)
            </button>
          )}
          {compare && source && (
            <>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${pos}%` }} />
              <span className="pointer-events-none absolute left-3 top-3 bg-background/70 px-2 py-1 text-xs">Before</span>
              <span className="pointer-events-none absolute right-3 top-3 bg-background/70 px-2 py-1 text-xs">After</span>
              <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
                aria-label="Drag to compare before and after" className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0" />
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
          onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <div className="mx-auto mt-3 flex max-w-[34rem] flex-wrap gap-2">
          <Button size="sm" variant="outline" className="rounded-none" onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-3.5 w-3.5" />{source ? "Replace icon" : "Upload icon"}</Button>
          <Button size="sm" variant={compare ? "default" : "outline"} className="rounded-none" disabled={!source} onClick={() => setCompare((c) => !c)} aria-pressed={compare}>
            <Columns2 className="mr-1 h-3.5 w-3.5" />Before / after
          </Button>
          <Button size="sm" variant="ghost" className="rounded-none" onClick={() => setD({ ...BASE, text: d.text })}><RotateCcw className="mr-1 h-3.5 w-3.5" />Reset design</Button>
        </div>
      </div>

      <section className="border border-border bg-card">
        <div role="tablist" className="flex overflow-x-auto border-b border-border">
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`whitespace-nowrap px-3 py-3 text-xs ${tab === id ? "border-b border-foreground text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{label}</button>
          ))}
        </div>
        <div className="space-y-5 p-4">
          {tab === "countdown" && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {COUNTDOWN_STAGES.map((s) => (
                  <button key={s} type="button" onClick={() => set("text", s)}
                    className={`border px-2 py-2 font-mono text-[11px] ${d.text === s ? "border-foreground bg-secondary" : "border-border text-muted-foreground hover:text-foreground"}`}>{s}</button>
                ))}
              </div>
              <label className="block text-xs text-muted-foreground">Custom text
                <Input value={d.text} maxLength={TEXT_MAX} placeholder="e.g. UPDATE SOON"
                  onChange={(e) => set("text", e.target.value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, TEXT_MAX))} className="mt-1 rounded-none" />
              </label>
            </>
          )}
          {tab === "hourglass" && (
            <>
              <Segmented label="Style" value={d.glass} onChange={(v) => set("glass", v as GlassStyle)} options={[["outline", "Outline"], ["solid", "Solid"], ["none", "Off"]]} />
              {d.glass !== "none" && (
                <>
                  <div className="grid grid-cols-2 gap-3"><Color label="Glass" value={d.glassColor} onChange={(v) => set("glassColor", v)} /><Color label="Sand" value={d.sandColor} onChange={(v) => set("sandColor", v)} /></div>
                  <Range label="Size" k="glassSize" d={d} set={set} />
                  <Range label="Horizontal position" k="glassX" d={d} set={set} />
                  <Range label="Vertical position" k="glassY" d={d} set={set} />
                </>
              )}
            </>
          )}
          {tab === "text" && (
            <>
              <Segmented label="Font" value={d.font} onChange={(v) => set("font", v as FontId)} options={Object.entries(FONTS).map(([k, f]) => [k, f.label])} />
              <Color label="Text color" value={d.textColor} onChange={(v) => set("textColor", v)} />
              <Range label="Size" k="textSize" d={d} set={set} />
              <Range label="Horizontal position" k="textX" d={d} set={set} />
              <Range label="Vertical position" k="textY" d={d} set={set} />
              <p className="text-[11px] text-muted-foreground">Long text shrinks automatically to stay inside the icon.</p>
            </>
          )}
          {tab === "effects" && (
            <>
              <Group title="Outline"><Color label="Color" value={d.outlineColor} onChange={(v) => set("outlineColor", v)} /><Range label="Thickness" k="outlineWidth" d={d} set={set} step={0.1} /></Group>
              <Group title="Shadow"><Color label="Color" value={d.shadowColor} onChange={(v) => set("shadowColor", v)} /><Range label="Blur" k="shadowBlur" d={d} set={set} step={0.1} /><Range label="Drop" k="shadowOffset" d={d} set={set} step={0.1} /></Group>
              <Group title="Darken image"><Color label="Color" value={d.dimColor} onChange={(v) => set("dimColor", v)} /><Range label="Amount" k="dim" d={d} set={set} /></Group>
            </>
          )}
          {tab === "presets" && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                {PRESETS.map((p) => {
                  const locked = p.advanced && !advanced;
                  return (
                    <button key={p.id} type="button" onClick={() => usePreset(p)} disabled={locked}
                      className="group border border-border text-left disabled:cursor-not-allowed disabled:opacity-50 hover:border-foreground">
                      <IconCanvas source={source} design={applyPreset(p, d.text || "NOW!")} size={192} fontsV={fontsV} className="aspect-square w-full" />
                      <span className="flex items-center justify-between gap-1 px-2 py-1.5 text-[11px]">{p.name}{locked && <span className="flex items-center gap-1 text-muted-foreground"><Lock className="h-3 w-3" />Premium</span>}</span>
                    </button>
                  );
                })}
              </div>
              <Group title="Your presets">
                {advanced ? (
                  <>
                    <div className="flex gap-2">
                      <Input value={presetName} maxLength={30} placeholder="Preset name" onChange={(e) => setPresetName(e.target.value)} className="rounded-none" />
                      <Button size="sm" className="rounded-none" onClick={savePreset}>Save</Button>
                    </div>
                    {saved.length === 0 ? <p className="text-xs text-muted-foreground">Save the current look to reuse it on future updates.</p> : (
                      <ul className="divide-y divide-border border border-border">
                        {saved.map((s, i) => (
                          <li key={`${s.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-xs">
                            <button type="button" className="hover:underline" onClick={() => setD({ ...s.design, text: d.text })}>{s.name}</button>
                            <button type="button" aria-label={`Delete ${s.name}`} onClick={() => removeSaved(i)} className="text-muted-foreground hover:text-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : <PremiumNote>Save your own presets with Premium or Scale.</PremiumNote>}
              </Group>
            </>
          )}
          {tab === "export" && (
            <>
              <Segmented label="Format" value={fmt} onChange={(v) => setFmt(v as ExportFormat)} options={[["png", "PNG"], ["jpeg", "JPEG"], ["webp", "WEBP"]]} />
              <Segmented label="Size" value={String(advanced ? size : 512)} onChange={(v) => setSize(Number(v))}
                options={EXPORT_SIZES.advanced.map((s) => [String(s), `${s}×${s}${!advanced && s > 512 ? " · Premium" : ""}`])}
                disabled={(v) => !advanced && Number(v) > 512} />
              <Button className="w-full rounded-none" disabled={!source || busy} onClick={exportOne}>
                <Download className="mr-2 h-4 w-4" />{source ? `Download ${exportName(d.text, fmt)}` : "Upload your icon to export"}
              </Button>
              <Group title="Full countdown pack">
                {advanced ? (
                  <>
                    <p className="text-xs text-muted-foreground">All 12 stages (24 HOURS → NOW!) with this design, in one ZIP.</p>
                    {pack ? (
                      <Button className="w-full rounded-none" onClick={() => deliverFile(pack, `outrun-countdown-pack-${fmt}.zip`)}><Download className="mr-2 h-4 w-4" />Download pack (12 icons)</Button>
                    ) : (
                      <Button variant="outline" className="w-full rounded-none" disabled={!source || busy} onClick={buildPack}><Package className="mr-2 h-4 w-4" />{busy ? "Building…" : "Build countdown pack"}</Button>
                    )}
                  </>
                ) : <PremiumNote>Export all 12 countdown stages at once, plus 1024×1024 exports, with Premium or Scale.</PremiumNote>}
              </Group>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>{children}</div>;
}

function PremiumNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border border-dashed border-border p-3 text-xs text-muted-foreground">
      <span className="flex gap-2"><Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />{children}</span>
      <Link to="/exchange/subscription" className="whitespace-nowrap text-foreground underline">Upgrade</Link>
    </div>
  );
}

function Segmented({ label, value, options, onChange, disabled }: { label: string; value: string; options: (readonly [string, string])[] | [string, string][]; onChange: (v: string) => void; disabled?: (v: string) => boolean }) {
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map(([v, l]) => (
          <button key={v} type="button" onClick={() => onChange(v)} disabled={disabled?.(v)} aria-pressed={value === v}
            className={`border px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${value === v ? "border-foreground bg-secondary" : "border-border text-muted-foreground hover:text-foreground"}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      {label}
      <span className="flex items-center gap-2">
        <span className="font-mono">{value.toUpperCase()}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer border border-border bg-transparent" />
      </span>
    </label>
  );
}

type RangeKey = keyof typeof LIMITS;
function Range({ label, k, d, set, step = 1 }: { label: string; k: RangeKey; d: IconDesign; set: <K extends keyof IconDesign>(k: K, v: IconDesign[K]) => void; step?: number }) {
  const [min, max] = LIMITS[k];
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>{label}</span><span className="font-mono">{Number(d[k]).toFixed(step < 1 ? 1 : 0)}</span></div>
      <Slider min={min} max={max} step={step} value={[d[k] as number]} onValueChange={([v]) => set(k, v as IconDesign[typeof k])} aria-label={label} />
    </div>
  );
}
