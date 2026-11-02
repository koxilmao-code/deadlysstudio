// Canvas renderer for Icon Update Studio. Hourglass is drawn in a 60x100 unit box.
import { EXPORTS, FONTS, type ExportFormat, type IconDesign } from "./iconStudio";

export interface Source { img: CanvasImageSource; w: number; h: number }

function rr(p: Path2D, x: number, y: number, w: number, h: number, r: number) {
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
  p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
  p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath();
}

const caps = () => { const p = new Path2D(); rr(p, 0, 0, 60, 10, 3); rr(p, 0, 90, 60, 10, 3); return p; };
const SIDES = "M9 9C9 32 27 40 27 50C27 60 9 68 9 91M51 9C51 32 33 40 33 50C33 60 51 68 51 91";
const BODY = "M5 9C5 34 24 42 24 50C24 58 5 66 5 91L55 91C55 66 36 58 36 50C36 42 55 34 55 9Z" +
  "M13 12L47 12C47 30 32 40 30 46C28 40 13 30 13 12Z M30 54C32 60 47 70 47 88L13 88C13 70 28 60 30 54Z";
const SAND = {
  outline: "M19 30L41 30Q33 40 30 45Q27 40 19 30Z M13 88Q15 72 30 66Q45 72 47 88Z",
  solid: "M22 33L38 33Q32 40 30 45Q28 40 22 33Z M15 87Q17 72 30 66Q43 72 45 87Z",
};

let layerCache: HTMLCanvasElement | null = null;
function layer(size: number) {
  const c = layerCache ?? (layerCache = document.createElement("canvas"));
  c.width = size; c.height = size;
  return c.getContext("2d")!;
}

function drawGlass(ctx: CanvasRenderingContext2D, d: IconDesign, color: string, sand: string, extra: number) {
  const style = d.glass === "solid" ? "solid" : "outline";
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.fillStyle = color; ctx.strokeStyle = color;
  const fillStroke = (p: Path2D, rule: CanvasFillRule = "nonzero") => {
    if (extra > 0) { ctx.lineWidth = extra * 2; ctx.stroke(p); }
    ctx.fill(p, rule);
  };
  if (style === "outline") {
    ctx.lineWidth = 6 + extra * 2; ctx.stroke(new Path2D(SIDES));
    if (!extra) { ctx.lineWidth = 1.4; ctx.strokeStyle = sand; ctx.stroke(new Path2D("M30 47L30 66")); }
  } else fillStroke(new Path2D(BODY), "evenodd");
  fillStroke(caps());
  ctx.fillStyle = extra ? color : sand; ctx.strokeStyle = extra ? color : sand;
  fillStroke(new Path2D(SAND[style]));
}

function composite(ctx: CanvasRenderingContext2D, d: IconDesign, size: number, src: HTMLCanvasElement) {
  ctx.save();
  if (d.shadowBlur > 0 || d.shadowOffset > 0) {
    ctx.shadowColor = d.shadowColor; ctx.shadowBlur = (d.shadowBlur / 100) * size;
    ctx.shadowOffsetX = 0; ctx.shadowOffsetY = (d.shadowOffset / 100) * size;
  }
  ctx.drawImage(src, 0, 0);
  ctx.restore();
}

/** Draws the full icon (source cropped to a centered square, dim, hourglass, text) at `size` px. */
export function renderIcon(canvas: HTMLCanvasElement, source: Source | null, d: IconDesign, size: number) {
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  if (source) {
    const s = Math.min(source.w, source.h);
    ctx.drawImage(source.img, (source.w - s) / 2, (source.h - s) / 2, s, s, 0, 0, size, size);
  } else {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, "#1f6f8b"); g.addColorStop(1, "#3c8d4a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  }
  if (d.dim > 0) { ctx.globalAlpha = d.dim / 100; ctx.fillStyle = d.dimColor; ctx.fillRect(0, 0, size, size); ctx.globalAlpha = 1; }
  const outline = (d.outlineWidth / 100) * size;

  if (d.glass !== "none") {
    const l = layer(size);
    const k = (d.glassSize / 100) * size / 100;
    l.setTransform(k, 0, 0, k, (d.glassX / 100) * size - 30 * k, (d.glassY / 100) * size - 50 * k);
    if (outline > 0) drawGlass(l, d, d.outlineColor, d.outlineColor, outline / k);
    drawGlass(l, d, d.glassColor, d.sandColor, 0);
    composite(ctx, d, size, l.canvas);
  }

  if (d.text) {
    const l = layer(size);
    const f = FONTS[d.font];
    let px = (d.textSize / 100) * size;
    const font = () => `${f.weight} ${px}px "${f.family}", "Arial Black", sans-serif`;
    l.font = font();
    const max = size * 0.94 - outline * 2;
    const w = l.measureText(d.text).width;
    if (w > max) { px *= max / w; l.font = font(); }
    l.textAlign = "center"; l.textBaseline = "middle"; l.lineJoin = "round"; l.miterLimit = 2;
    const x = (d.textX / 100) * size, y = (d.textY / 100) * size;
    if (outline > 0) { l.lineWidth = outline * 2; l.strokeStyle = d.outlineColor; l.strokeText(d.text, x, y); }
    l.fillStyle = d.textColor; l.fillText(d.text, x, y);
    composite(ctx, d, size, l.canvas);
  }
}

/** Renders and encodes; throws when the browser can't encode the requested format (e.g. WEBP on older Safari). */
export async function exportIcon(source: Source, d: IconDesign, size: number, fmt: ExportFormat): Promise<Blob> {
  const c = document.createElement("canvas");
  renderIcon(c, source, d, size);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, EXPORTS[fmt], 0.92));
  if (!blob) throw new Error("Export failed");
  if (blob.type !== EXPORTS[fmt]) throw new Error(`This browser can't save ${fmt.toUpperCase()} files. Try PNG or JPEG.`);
  return blob;
}
