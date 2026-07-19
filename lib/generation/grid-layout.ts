/**
 * Grid-DSL Layout Engine
 * ============================================================================
 * Converts a small, model-friendly grid-DSL object into full pixel-perfect
 * PPTElement[] the renderer expects. This moves ALL pixel math, height lookup,
 * centering, spacing and SVG path generation out of the LLM and into code —
 * so a 4B local model only emits {template, slots:[{role, text}]}.
 *
 * CONTRACT: outputs conform to packages/@gyaan/dsl PPTElement shapes. The
 * caller (scene-generator) still runs fixElementDefaults + id/rotate overwrite
 * afterwards, so we emit clean elements without id/rotate (those are assigned
 * by nanoid in the existing pipeline).
 * ============================================================================
 */

import type {
  PPTElement,
  PPTTextElement,
  PPTShapeElement,
  PPTChartElement,
  PPTTableElement,
  PPTLatexElement,
  ChartType,
  ChartData,
  TableCell,
} from '@/lib/types/slides';

// ── Canvas (matches scene-builder.ts viewportSize:1000, ratio 0.5625) ──────
export const CANVAS_W = 1000;
export const CANVAS_H = 562.5;
const MARGIN = 50;
const CONTENT_W = CANVAS_W - MARGIN * 2; // 900

// ── Model-facing grid-DSL types (what the 4B emits) ────────────────────────
export type SlideTemplate =
  | 'title-bullets'
  | 'title-shapes'
  | 'two-column'
  | 'card-grid-3'
  | 'title-image'
  | 'section-divider'
  | 'quote'
  | 'comparison'
  | 'title-chart'
  | 'title-table';

export type SlotRole =
  | 'title'
  | 'subtitle'
  | 'bullet'
  | 'callout'
  | 'column-left'
  | 'column-right'
  | 'card'
  | 'quote'
  | 'caption'
  | 'image'
  | 'chart'
  | 'table'
  | 'formula'
  | 'shape';

export interface GridSlot {
  role: SlotRole;
  text?: string;
  level?: 'h1' | 'h2' | 'h3' | 'body' | 'small';
  kind?: 'text' | 'formula' | 'note';
  // chart slot
  chartType?: ChartType;
  labels?: string[];
  legends?: string[];
  series?: number[][];
  // table slot
  columns?: string[];
  rows?: string[][];
  // image slot
  imageId?: string;
  // shape slot — a labeled visual element
  shape?: NamedShape;
  color?: string;
  label?: string;
}

export interface GridSlide {
  template: SlideTemplate;
  background?: 'solid' | 'soft' | 'paper';
  theme?: 'warm' | 'cool' | 'mono' | 'nature' | 'tech' | 'sunset';
  accent?: string; // hex override
  density?: 'sparse' | 'normal' | 'dense';
  slots: GridSlot[];
}

// ── Theme palettes (token-cheap model choice → real colors) ────────────────
interface Palette {
  bg: string;
  card: string;
  title: string;
  body: string;
  muted: string;
  accent: string;
  accentSoft: string;
  border: string;
}

const THEMES: Record<NonNullable<GridSlide['theme']>, Palette> = {
  warm:   { bg: '#f5ede0', card: '#faf3e7', title: '#1a1814', body: '#3a322a', muted: '#6b5d4f', accent: '#ff8c42', accentSoft: '#fff0e6', border: '#e2d5c0' },
  cool:   { bg: '#f0f4f8', card: '#f7fafc', title: '#0f1c2e', body: '#2a3a52', muted: '#5a6b85', accent: '#3b82f6', accentSoft: '#e0ecff', border: '#d0dae8' },
  mono:   { bg: '#fafafa', card: '#ffffff', title: '#0a0a0a', body: '#2a2a2a', muted: '#6a6a6a', accent: '#1a1a1a', accentSoft: '#eeeeee', border: '#e0e0e0' },
  nature: { bg: '#f2f7f0', card: '#f8fbf6', title: '#14200f', body: '#2d3a26', muted: '#5a6b50', accent: '#4a9d5f', accentSoft: '#e1f0e4', border: '#d2e0cc' },
  tech:   { bg: '#f4f5f7', card: '#ffffff', title: '#0b1020', body: '#26304a', muted: '#586280', accent: '#6366f1', accentSoft: '#e8e9ff', border: '#d8dce8' },
  sunset: { bg: '#fbf3ee', card: '#fff8f3', title: '#231410', body: '#3d241c', muted: '#735245', accent: '#ef6c4d', accentSoft: '#ffe6db', border: '#ecd6c8' },
};

// ── Font sizes by level ────────────────────────────────────────────────────
const FONT_SIZE: Record<NonNullable<GridSlot['level']>, number> = {
  h1: 36, h2: 28, h3: 22, body: 18, small: 15,
};

// ── Density → spacing multiplier ───────────────────────────────────────────
const DENSITY_GAP: Record<NonNullable<GridSlide['density']>, number> = {
  sparse: 1.4, normal: 1.0, dense: 0.7,
};

// ── Height lookup (lifted verbatim from slide-content prompt) ──────────────
// line-height=1.5, 10px padding each side. Keyed by font size.
const HEIGHT_TABLE: Record<number, number[]> = {
  // index = line count (1..5)
  14: [43, 64, 85, 106, 127],
  16: [46, 70, 94, 118, 142],
  18: [49, 76, 103, 130, 157],
  20: [52, 82, 112, 142, 172],
  24: [58, 94, 130, 166, 202],
  28: [64, 106, 148, 190, 232],
  32: [70, 118, 166, 214, 262],
  36: [76, 130, 184, 238, 292],
};

/**
 * Auto-compute text element height from content length + font size + width.
 * Replaces the model's height-arithmetic burden with deterministic code.
 */
export function autoHeight(text: string, fontSize: number, width: number): number {
  const table = HEIGHT_TABLE[fontSize] ?? HEIGHT_TABLE[18];
  const charPerLine = Math.max(1, Math.floor((width - 20) / (fontSize * 0.55)));
  // Count lines: paragraphs split on \n, then wrap by charPerLine
  const paragraphs = (text || '').split('\n');
  let totalLines = 0;
  for (const p of paragraphs) {
    const len = p.length || 1;
    totalLines += Math.max(1, Math.ceil(len / charPerLine));
  }
  totalLines = Math.min(totalLines, 5); // clamp to table
  return table[Math.max(0, totalLines - 1)] ?? table[0];
}

// ── Named shapes library (model says "rect"/"arrow", code emits SVG) ───────
export type NamedShape = 'rect' | 'rounded' | 'circle' | 'arrow' | 'underline' | 'divider';

const SHAPE_PATHS: Record<NamedShape, { path: string; viewBox: [number, number] }> = {
  rect:     { path: 'M 0 0 L 1 0 L 1 1 L 0 1 Z', viewBox: [1, 1] },
  rounded:  { path: 'M 0.1 0 L 0.9 0 Q 1 0 1 0.1 L 1 0.9 Q 1 1 0.9 1 L 0.1 1 Q 0 1 0 0.9 L 0 0.1 Q 0 0 0.1 0 Z', viewBox: [1, 1] },
  circle:   { path: 'M 1 0.5 A 0.5 0.5 0 1 1 0 0.5 A 0.5 0.5 0 1 1 1 0.5 Z', viewBox: [1, 1] },
  arrow:    { path: 'M 0 0.35 L 0.7 0.35 L 0.7 0.1 L 1 0.5 L 0.7 0.9 L 0.7 0.65 L 0 0.65 Z', viewBox: [1, 1] },
  underline:{ path: 'M 0 0 L 1 0 L 1 1 L 0 1 Z', viewBox: [1, 1] },
  divider:  { path: 'M 0 0 L 1 0 L 1 1 L 0 1 Z', viewBox: [1, 1] },
};

function makeShape(
  shape: NamedShape,
  left: number, top: number, width: number, height: number,
  fill: string,
  id = '',
): PPTShapeElement {
  const def = SHAPE_PATHS[shape] ?? SHAPE_PATHS.rect;
  return {
    type: 'shape',
    id,
    left, top, width, height, rotate: 0,
    viewBox: def.viewBox,
    path: def.path,
    fill,
    fixedRatio: false,
  };
}

function makeText(
  text: string, left: number, top: number, width: number,
  fontSize: number, color: string, opts: { id?: string; bold?: boolean; align?: 'left' | 'center' | 'right'; fill?: string } = {},
): PPTTextElement {
  const height = autoHeight(text, fontSize, width);
  const escaped = (text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const styleParts = [`font-size: ${fontSize}px`];
  if (opts.bold) styleParts.push('font-weight: 700');
  if (opts.align) styleParts.push(`text-align: ${opts.align}`);
  return {
    type: 'text',
    id: opts.id ?? '',
    left, top, width, height, rotate: 0,
    content: `<p style="${styleParts.join('; ')};">${escaped}</p>`,
    defaultFontName: '',
    defaultColor: color,
    fill: opts.fill,
  };
}

function makeLatex(latex: string, left: number, top: number, width: number, height: number, color: string, id = ''): PPTLatexElement {
  return {
    type: 'latex',
    id,
    left, top, width, height, rotate: 0,
    latex,
    color,
    fixedRatio: true,
  } as PPTLatexElement;
}

function makeChart(
  chartType: ChartType, data: ChartData, themeColors: string[],
  left: number, top: number, width: number, height: number,
  id = '',
): PPTChartElement {
  return {
    type: 'chart',
    id,
    left, top, width, height, rotate: 0,
    chartType,
    data,
    themeColors,
  };
}

function makeTable(
  columns: string[], rows: string[][], colWidths: number[],
  left: number, top: number, width: number, height: number,
  accent: string,
  id = '',
): PPTTableElement {
  const cellData: TableCell[][] = [];
  // header row
  cellData.push(columns.map((c, i) => ({
    id: `th${i}`, colspan: 1, rowspan: 1, text: c, style: { bold: true, align: 'center' as const, backcolor: accent, color: '#ffffff' },
  })));
  // body rows
  for (const row of rows) {
    cellData.push(row.map((c, i) => ({
      id: `td${i}`, colspan: 1, rowspan: 1, text: c,
    })));
  }
  return {
    type: 'table',
    id,
    left, top, width, height, rotate: 0,
    outline: { width: 1, style: 'solid', color: '#e0d8cc' },
    colWidths,
    cellMinHeight: 36,
    data: cellData,
  };
}

// ── Template renderers ─────────────────────────────────────────────────────
// Each takes (slide, palette, gapMultiplier) and returns PPTElement[].
type TemplateFn = (slide: GridSlide, p: Palette, gap: number) => PPTElement[];

const titleBullets: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  let cursor = MARGIN;
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const subSlot = slide.slots.find(s => s.role === 'subtitle');
  const bullets = slide.slots.filter(s => s.role === 'bullet');
  const callout = slide.slots.find(s => s.role === 'callout');

  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { id: 'title', bold: true, align: 'left' }));
    // accent underline
    els.push(makeShape('underline', MARGIN, cursor + autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + 6, 80, 4, p.accent));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(24 * gap);
  }
  if (subSlot?.text) {
    els.push(makeText(subSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h3, p.muted, { id: 'subtitle', align: 'left' }));
    cursor += autoHeight(subSlot.text, FONT_SIZE.h3, CONTENT_W) + Math.round(28 * gap);
  }
  const bulletFont = FONT_SIZE.body;
  let bulletIdx = 0;
  for (const b of bullets) {
    if (!b.text) continue;
    const bid = `bullet_${bulletIdx}`;
    bulletIdx++;
    // bullet dot
    els.push(makeShape('circle', MARGIN, cursor + 10, 10, 10, p.accent, `${bid}_dot`));
    els.push(makeText(b.text, MARGIN + 26, cursor, CONTENT_W - 26, bulletFont, p.body, { id: bid, align: 'left' }));
    cursor += autoHeight(b.text, bulletFont, CONTENT_W - 26) + Math.round(16 * gap);
  }
  if (callout?.text) {
    const ch = autoHeight(callout.text, FONT_SIZE.body, CONTENT_W - 40);
    els.push(makeShape('rounded', MARGIN, cursor + Math.round(12 * gap), CONTENT_W, ch + 28, p.accentSoft, 'callout_bg'));
    els.push(makeShape('underline', MARGIN, cursor + Math.round(12 * gap), 4, ch + 28, p.accent, 'callout_bar'));
    els.push(makeText(callout.text, MARGIN + 20, cursor + Math.round(12 * gap) + 14, CONTENT_W - 40, FONT_SIZE.body, p.body, { id: 'callout', align: 'left' }));
  }
  return els;
};

const twoColumn: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const left = slide.slots.filter(s => s.role === 'column-left');
  const right = slide.slots.filter(s => s.role === 'column-right');
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { id: 'title', bold: true, align: 'left' }));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(28 * gap);
  }
  const colW = (CONTENT_W - 40) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + 40;
  // column header bars
  els.push(makeShape('underline', leftX, cursor, colW, 3, p.accent, 'col_left_bar'));
  els.push(makeShape('underline', rightX, cursor, colW, 3, p.muted, 'col_right_bar'));
  let lY = cursor + 16;
  let rY = cursor + 16;
  let li = 0;
  let ri = 0;
  for (const s of left) {
    if (!s.text) continue;
    els.push(makeText(s.text, leftX, lY, colW, FONT_SIZE.body, p.body, { id: `col_left_${li}`, align: 'left' }));
    li++;
    lY += autoHeight(s.text, FONT_SIZE.body, colW) + Math.round(14 * gap);
  }
  for (const s of right) {
    if (!s.text) continue;
    els.push(makeText(s.text, rightX, rY, colW, FONT_SIZE.body, p.body, { id: `col_right_${ri}`, align: 'left' }));
    ri++;
    rY += autoHeight(s.text, FONT_SIZE.body, colW) + Math.round(14 * gap);
  }
  return els;
};

const cardGrid3: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const cards = slide.slots.filter(s => s.role === 'card').slice(0, 3);
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { bold: true, align: 'center' }));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(36 * gap);
  }
  const gapW = 30;
  const cardW = (CONTENT_W - gapW * 2) / 3;
  const cardH = 200;
  const accents = [p.accent, '#5b9bd5', '#4a9d5f'];
  cards.forEach((c, i) => {
    const x = MARGIN + i * (cardW + gapW);
    els.push(makeShape('rounded', x, cursor, cardW, cardH, p.card, `card_${i}_bg`));
    els.push(makeShape('underline', x, cursor, cardW, 5, accents[i] ?? p.accent, `card_${i}_bar`));
    if (c.text) {
      els.push(makeText(c.text, x + 20, cursor + 24, cardW - 40, FONT_SIZE.h3, p.title, { id: `card_${i}`, bold: true, align: 'center' }));
    }
  });
  return els;
};

const titleImage: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const imgSlot = slide.slots.find(s => s.role === 'image');
  const capSlot = slide.slots.find(s => s.role === 'caption');
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { bold: true, align: 'left' }));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(24 * gap);
  }
  // placeholder image area (real image resolved by resolveImageIds downstream)
  if (imgSlot) {
    const imgH = 280;
    els.push(makeShape('rounded', MARGIN, cursor, CONTENT_W, imgH, p.accentSoft));
    // image element placeholder — downstream resolveImageIds handles src
    els.push({
      type: 'image', id: '', left: MARGIN, top: cursor, width: CONTENT_W, height: imgH, rotate: 0,
      src: imgSlot.imageId ?? '', fixedRatio: true,
    } as PPTElement);
    cursor += imgH + Math.round(14 * gap);
  }
  if (capSlot?.text) {
    els.push(makeText(capSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.small, p.muted, { align: 'center' }));
  }
  return els;
};

const sectionDivider: TemplateFn = (slide, p, _gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const subSlot = slide.slots.find(s => s.role === 'subtitle');
  els.push(makeShape('rect', 0, 0, CANVAS_W, CANVAS_H, p.bg));
  // centered accent bar
  els.push(makeShape('underline', CANVAS_W / 2 - 60, CANVAS_H / 2 - 70, 120, 5, p.accent));
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, CANVAS_H / 2 - 40, CONTENT_W, FONT_SIZE.h1, p.title, { bold: true, align: 'center' }));
  }
  if (subSlot?.text) {
    els.push(makeText(subSlot.text, MARGIN, CANVAS_H / 2 + 20, CONTENT_W, FONT_SIZE.h3, p.muted, { align: 'center' }));
  }
  return els;
};

const quote: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const qSlot = slide.slots.find(s => s.role === 'quote');
  const titleSlot = slide.slots.find(s => s.role === 'title');
  let cursor = MARGIN + 40;
  els.push(makeShape('underline', MARGIN, cursor, 4, 180, p.accent));
  if (qSlot?.text) {
    els.push(makeText(`"${qSlot.text}"`, MARGIN + 24, cursor, CONTENT_W - 48, FONT_SIZE.h2, p.body, { align: 'left' }));
  }
  if (titleSlot?.text) {
    els.push(makeText(`— ${titleSlot.text}`, MARGIN + 24, cursor + 180 + Math.round(16 * gap), CONTENT_W - 48, FONT_SIZE.body, p.muted, { align: 'left' }));
  }
  return els;
};

const comparison: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const cols = slide.slots.filter(s => s.role === 'card').slice(0, 2);
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { bold: true, align: 'center' }));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(28 * gap);
  }
  const colW = (CONTENT_W - 40) / 2;
  cols.forEach((c, i) => {
    const x = i === 0 ? MARGIN : MARGIN + colW + 40;
    els.push(makeShape('rounded', x, cursor, colW, 260, i === 0 ? p.accentSoft : p.card));
    els.push(makeShape('underline', x, cursor, colW, 5, i === 0 ? p.accent : p.muted));
    if (c.text) {
      els.push(makeText(c.text, x + 20, cursor + 24, colW - 40, FONT_SIZE.body, p.body, { align: 'left' }));
    }
  });
  return els;
};

const titleShapes: TemplateFn = (slide, p, _gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const shapes = slide.slots.filter(s => s.role === 'shape');
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { id: 'title', bold: true, align: 'center' }));
    els.push(makeShape('underline', CANVAS_W / 2 - 60, cursor + autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + 6, 120, 4, p.accent, 'title_bar'));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(40 * (_gap));
  }
  // Render shapes in a centered row with labels beneath each.
  const n = shapes.length;
  if (n > 0) {
    const shapeSize = 110;
    const gapW = 40;
    const totalW = n * shapeSize + (n - 1) * gapW;
    const startX = (CANVAS_W - totalW) / 2;
    const shapeY = cursor + 20;
    shapes.forEach((s, i) => {
      const x = startX + i * (shapeSize + gapW);
      const shapeName = s.shape ?? 'circle';
      const fill = s.color ?? p.accent;
      // the visual shape
      els.push(makeShape(shapeName, x, shapeY, shapeSize, shapeSize, fill, `shape_${i}`));
      // label under it
      if (s.label || s.text) {
        els.push(makeText(
          s.label ?? s.text ?? '',
          x - 20, shapeY + shapeSize + 12, shapeSize + 40, FONT_SIZE.body, p.body,
          { id: `shape_${i}_label`, align: 'center' },
        ));
      }
    });
  }
  return els;
};

const titleChart: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const chartSlot = slide.slots.find(s => s.role === 'chart');
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { bold: true, align: 'left' }));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(24 * gap);
  }
  if (chartSlot?.labels && chartSlot.series) {
    els.push(makeChart(
      chartSlot.chartType ?? 'bar',
      { labels: chartSlot.labels, legends: chartSlot.legends ?? ['Series'], series: chartSlot.series },
      [p.accent, '#5b9bd5', '#4a9d5f', p.muted],
      MARGIN, cursor, CONTENT_W, 300,
    ));
  }
  return els;
};

const titleTable: TemplateFn = (slide, p, gap) => {
  const els: PPTElement[] = [];
  const titleSlot = slide.slots.find(s => s.role === 'title');
  const tableSlot = slide.slots.find(s => s.role === 'table');
  let cursor = MARGIN;
  if (titleSlot?.text) {
    els.push(makeText(titleSlot.text, MARGIN, cursor, CONTENT_W, FONT_SIZE.h1, p.title, { bold: true, align: 'left' }));
    cursor += autoHeight(titleSlot.text, FONT_SIZE.h1, CONTENT_W) + Math.round(24 * gap);
  }
  if (tableSlot?.columns && tableSlot.rows) {
    const numCols = tableSlot.columns.length;
    const colWidths = Array(numCols).fill(1 / numCols);
    els.push(makeTable(tableSlot.columns, tableSlot.rows, colWidths, MARGIN, cursor, CONTENT_W, 280, p.accent));
  }
  return els;
};

const TEMPLATES: Record<SlideTemplate, TemplateFn> = {
  'title-bullets': titleBullets,
  'title-shapes': titleShapes,
  'two-column': twoColumn,
  'card-grid-3': cardGrid3,
  'title-image': titleImage,
  'section-divider': sectionDivider,
  'quote': quote,
  'comparison': comparison,
  'title-chart': titleChart,
  'title-table': titleTable,
};

// ── Public entry: resolve a GridSlide into PPTElement[] ────────────────────
// ── Light pastel background cycle (per slide index) ────────────────────────
// Each slide gets a soft, non-boring tint so the deck isn't one flat color.
const PASTEL_BG = ['#fbeef0', '#eef4fb', '#eef7f0', '#fbf5ea', '#f4eefb', '#eef7fb'];

export function resolveSlide(slide: GridSlide, index = 0): { background: { type: string; color: string }; elements: PPTElement[] } {
  const palette = THEMES[slide.theme ?? 'warm'];
  const p: Palette = slide.accent ? { ...palette, accent: slide.accent, accentSoft: slide.accent + '20' } : palette;
  const gap = DENSITY_GAP[slide.density ?? 'normal'];

  const fn = TEMPLATES[slide.template] ?? titleBullets;
  const elements = fn(slide, p, gap);

  // Cycle through light pastel colors per slide index. Only the explicit
  // 'soft'/'paper' background flags override the cycle.
  const bgColor =
    slide.background === 'soft' ? p.accentSoft
    : slide.background === 'paper' ? p.card
    : PASTEL_BG[index % PASTEL_BG.length];
  return {
    background: { type: 'solid', color: bgColor },
    elements,
  };
}

// ── Validation guard (lightweight) ─────────────────────────────────────────
export function isGridSlide(obj: unknown): obj is GridSlide {
  if (!obj || typeof obj !== 'object') return false;
  const s = obj as Record<string, unknown>;
  return typeof s.template === 'string' && Array.isArray(s.slots);
}
