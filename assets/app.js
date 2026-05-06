// Shared utilities for the Hindsight perf dashboard.
// Pure ES module, no build step. Loaded via <script type="module">.
// Styling via Tailwind Play CDN (loaded in each HTML page).

export const HINDSIGHT_REPO = 'vectorize-io/hindsight';
export const SUITES = ['retain', 'recall', 'recall-with-observations', 'consolidation'];

export const SUITE_LABELS = {
  'retain': 'Retain',
  'recall': 'Recall',
  'recall-with-observations': 'Recall (with observations)',
  'consolidation': 'Consolidation',
};

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

const cacheBuster = () => 'ts=' + Date.now();

export async function loadManifest() {
  const r = await fetch(`data/index.json?${cacheBuster()}`);
  if (!r.ok) throw new Error('Failed to load data/index.json');
  return r.json();
}

export async function loadRun(dataFile) {
  const r = await fetch(`${dataFile}?${cacheBuster()}`);
  if (!r.ok) throw new Error('Failed to load ' + dataFile);
  return r.json();
}

// Returns { manifest, runs } where runs[0] is newest. Empty array if nothing yet.
export async function loadRecentRuns(limit = 50) {
  const manifest = await loadManifest();
  if (!manifest.runs || manifest.runs.length === 0) {
    return { manifest, runs: [] };
  }
  const slice = manifest.runs.slice(0, limit);
  const runs = await Promise.all(slice.map(e => loadRun(e.data_file)));
  return { manifest, runs };
}

// ---------------------------------------------------------------------------
// Metric extraction
// ---------------------------------------------------------------------------

export function getSuite(run, suiteName) {
  return run.suites?.find(s => s.name === suiteName) ?? null;
}

// Map suite name → list of metrics (label, accessor, unit, biggerIsBetter).
export const SUITE_METRICS = {
  'retain': [
    { key: 'throughput', label: 'Throughput',  unit: 'items/s', biggerIsBetter: true,
      get: s => s.retain?.throughput_items_per_sec },
    { key: 'duration',   label: 'Duration',     unit: 's',       biggerIsBetter: false,
      get: s => s.retain?.total_duration_seconds },
  ],
  'recall': [
    { key: 'p95',        label: 'p95 latency',  unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.p95 },
    { key: 'mean',       label: 'Mean latency', unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.mean },
    { key: 'p50',        label: 'p50 latency',  unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.p50 },
    { key: 'p99',        label: 'p99 latency',  unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.p99 },
    { key: 'throughput', label: 'Throughput',   unit: 'queries/s', biggerIsBetter: true,
      get: s => s.recall?.throughput_queries_per_sec },
  ],
  'recall-with-observations': [
    { key: 'p95',        label: 'p95 latency',  unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.p95 },
    { key: 'mean',       label: 'Mean latency', unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.mean },
    { key: 'p50',        label: 'p50 latency',  unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.p50 },
    { key: 'p99',        label: 'p99 latency',  unit: 's',       biggerIsBetter: false,
      get: s => s.recall?.latency?.p99 },
    { key: 'throughput', label: 'Throughput',   unit: 'queries/s', biggerIsBetter: true,
      get: s => s.recall?.throughput_queries_per_sec },
  ],
  'consolidation': [
    { key: 'throughput', label: 'Throughput',   unit: 'memories/s', biggerIsBetter: true,
      get: s => s.consolidation?.throughput_memories_per_sec },
    { key: 'duration',   label: 'Duration',     unit: 's',          biggerIsBetter: false,
      get: s => s.consolidation?.total_duration_seconds },
  ],
};

export const SUITE_HEADLINE = {
  'retain': SUITE_METRICS['retain'][0],
  'recall': SUITE_METRICS['recall'][0],
  'recall-with-observations': SUITE_METRICS['recall-with-observations'][0],
  'consolidation': SUITE_METRICS['consolidation'][0],
};

// Per-suite chart layout: each entry becomes one chart on the detail page.
// Multi-series charts (e.g. recall latency p50/p95/p99/mean) put trend
// patterns on a single axis so they're easier to read together.
export const SUITE_CHARTS = {
  'retain': [
    { title: 'Throughput', unit: 'items/s', biggerIsBetter: true,
      series: [{ label: 'items/s', get: s => s.retain?.throughput_items_per_sec }] },
    { title: 'Duration', unit: 's', biggerIsBetter: false,
      series: [{ label: 'duration', get: s => s.retain?.total_duration_seconds }] },
  ],
  'recall': [
    { title: 'Latency', unit: 's', biggerIsBetter: false,
      series: [
        { label: 'p99',  get: s => s.recall?.latency?.p99 },
        { label: 'p95',  get: s => s.recall?.latency?.p95 },
        { label: 'mean', get: s => s.recall?.latency?.mean },
        { label: 'p50',  get: s => s.recall?.latency?.p50 },
      ] },
    { title: 'Throughput', unit: 'queries/s', biggerIsBetter: true,
      series: [{ label: 'queries/s', get: s => s.recall?.throughput_queries_per_sec }] },
  ],
  'recall-with-observations': [
    { title: 'Latency', unit: 's', biggerIsBetter: false,
      series: [
        { label: 'p99',  get: s => s.recall?.latency?.p99 },
        { label: 'p95',  get: s => s.recall?.latency?.p95 },
        { label: 'mean', get: s => s.recall?.latency?.mean },
        { label: 'p50',  get: s => s.recall?.latency?.p50 },
      ] },
    { title: 'Throughput', unit: 'queries/s', biggerIsBetter: true,
      series: [{ label: 'queries/s', get: s => s.recall?.throughput_queries_per_sec }] },
  ],
  'consolidation': [
    { title: 'Throughput', unit: 'memories/s', biggerIsBetter: true,
      series: [{ label: 'memories/s', get: s => s.consolidation?.throughput_memories_per_sec }] },
    { title: 'Duration', unit: 's', biggerIsBetter: false,
      series: [{ label: 'duration', get: s => s.consolidation?.total_duration_seconds }] },
  ],
};

// Build chart points (oldest → newest) for a given suite + metric accessor.
// x is the run's *index* in the series so points are evenly spaced — this
// makes trend shapes readable regardless of how dense or sparse the run
// cadence is. Date and commit info are carried on the point's `run` field
// for tooltips and tick callbacks.
export function timeSeries(runs, suiteName, accessor) {
  const ordered = runs.slice().reverse(); // oldest → newest
  return ordered
    .map((run, i) => {
      const suite = getSuite(run, suiteName);
      if (!suite || !suite.success) return null;
      const value = accessor(suite);
      if (value == null) return null;
      return { x: i, y: value, run };
    })
    .filter(Boolean);
}

// Trailing moving average of a series of {x, y, run} points.
// Returns points with the same x but averaged y. Skips the first
// (window-1) points so the line starts where the average is well-defined.
export function movingAverage(points, window = 5) {
  if (points.length < window) return [];
  const out = [];
  for (let i = window - 1; i < points.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += points[j].y;
    out.push({ x: points[i].x, y: sum / window, run: points[i].run });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function fmtNumber(n, digits = 3) {
  if (n == null || Number.isNaN(n)) return '—';
  if (Math.abs(n) >= 100) return n.toFixed(1);
  if (Math.abs(n) >= 10)  return n.toFixed(2);
  return n.toFixed(digits);
}

export function deltaPct(curr, prev) {
  if (prev == null || prev === 0 || curr == null) return null;
  return ((curr - prev) / prev) * 100;
}

// Render a delta as a coloured Tailwind pill. biggerIsBetter inverts the
// good/bad sense for metrics where smaller is better.
export function renderDelta(curr, prev, biggerIsBetter) {
  const d = deltaPct(curr, prev);
  if (d == null) {
    return '<span class="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500 tabular-nums">—</span>';
  }
  const sign = d >= 0 ? '+' : '';
  let cls = 'bg-gray-100 text-gray-500';
  if (Math.abs(d) >= 0.5) {
    cls = (d > 0) === biggerIsBetter
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-red-100 text-red-700';
  }
  return `<span class="text-xs font-medium px-2 py-0.5 rounded tabular-nums ${cls}">${sign}${d.toFixed(1)}%</span>`;
}

// ---------------------------------------------------------------------------
// Header / nav
// ---------------------------------------------------------------------------

export const HINDSIGHT_PERF_WORKFLOW_URL =
  `https://github.com/${HINDSIGHT_REPO}/actions/workflows/perf-test.yml`;

export function renderHeader(activePage = '') {
  const pages = [
    { href: 'index.html',                       label: 'Overview',      id: 'overview' },
    { href: 'retain.html',                      label: 'Retain',        id: 'retain' },
    { href: 'recall.html',                      label: 'Recall',        id: 'recall' },
    { href: 'recall-with-observations.html',    label: 'Recall + obs',  id: 'recall-with-observations' },
    { href: 'consolidation.html',               label: 'Consolidation', id: 'consolidation' },
    { href: 'locomo.html',                      label: 'LoComo',        id: 'locomo' },
    { href: 'compare.html',                     label: 'Compare',       id: 'compare' },
  ];
  const link = (p) => {
    const base = 'text-sm px-2.5 py-1.5 rounded-md no-underline transition-colors';
    const cls = p.id === activePage
      ? 'text-indigo-700 bg-indigo-50 font-medium'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
    return `<a href="${p.href}" class="${base} ${cls}">${p.label}</a>`;
  };
  return `
    <div class="max-w-7xl mx-auto flex items-center gap-6 flex-wrap">
      <a href="index.html" class="flex items-center gap-2 no-underline text-gray-900">
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
        <h1 class="text-[15px] font-semibold tracking-tight m-0">Hindsight Performance</h1>
      </a>
      <nav class="flex gap-0.5 flex-wrap">
        ${pages.map(link).join('')}
      </nav>
      <div class="ml-auto flex items-center gap-3">
        <a href="${HINDSIGHT_PERF_WORKFLOW_URL}" target="_blank"
           class="text-xs text-gray-500 hover:text-gray-900 inline-flex items-center gap-1.5 no-underline">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Workflow runs
        </a>
        <a href="https://github.com/${HINDSIGHT_REPO}" target="_blank"
           class="text-xs text-gray-500 hover:text-gray-900 no-underline">${HINDSIGHT_REPO}</a>
      </div>
    </div>
  `;
}

export function renderLatestBanner(run) {
  if (!run) return '';
  const c = run.commit ?? {};
  const w = run.workflow_run ?? {};
  const prLink = c.pr_url
    ? `<a href="${c.pr_url}" target="_blank" class="text-indigo-600 hover:underline">#${c.pr_number}</a>`
    : '<span class="text-gray-400">—</span>';
  const runLink = w.url
    ? `<a href="${w.url}" target="_blank" class="text-indigo-600 hover:underline">view ↗</a>`
    : '<span class="text-gray-400">—</span>';
  const cell = (label, value) => `
    <div class="min-w-0">
      <div class="text-[10px] uppercase tracking-[0.08em] text-gray-400 font-medium mb-0.5">${label}</div>
      <div class="text-[13px] truncate">${value}</div>
    </div>
  `;
  return `
    <div class="bg-white border border-gray-200 rounded-xl px-5 py-3.5 mb-6 grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-3">
      ${cell('Latest run', fmtDateTime(run.timestamp))}
      ${cell('Commit', `<a href="${c.url ?? '#'}" target="_blank" class="font-mono text-indigo-600 hover:underline">${c.short_sha ?? '—'}</a> <span class="text-gray-400">${c.author ? '· ' + escapeHtml(c.author) : ''}</span>`)}
      ${cell('Subject', `<span title="${escapeHtml(c.subject ?? '')}">${escapeHtml(c.subject ?? '—')}</span>`)}
      ${cell('PR', prLink)}
      ${cell('Run', runLink)}
      ${cell('Scale', escapeHtml(run.scale ?? '—'))}
    </div>
  `;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

// Tailwind 500-weight family — modern, balanced contrast on white.
const PALETTE = [
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

// Linear x-axis indexed by run order. Tick labels show the run's short_sha
// (looked up from the first dataset's points), full date+commit go in the
// tooltip. Evenly-spaced ticks keep trend shapes consistent regardless of
// how often runs land.
export function lineChart(canvas, datasets, opts = {}) {
  // Build an x → run lookup from whichever dataset has the most points.
  const allPoints = datasets.reduce((best, d) => d.data.length > best.length ? d.data : best, []);
  const runByX = new Map();
  allPoints.forEach(p => { if (p.run) runByX.set(p.x, p.run); });

  const fontStack = "'Inter var', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const monoStack = "'JetBrains Mono', 'SF Mono', Menlo, monospace";

  return new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false, axis: 'x' },
      layout: { padding: { top: 4, right: 8, bottom: 0, left: 0 } },
      scales: {
        x: {
          type: 'linear',
          display: !opts.compact,
          ticks: {
            stepSize: 1,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            callback: v => {
              const r = runByX.get(v);
              return r?.commit?.short_sha ?? '';
            },
            font: { size: 11, family: monoStack, weight: '400' },
            color: '#9ca3af',
            padding: 8,
          },
          grid: { display: false },
          border: { display: false },
        },
        y: {
          beginAtZero: opts.beginAtZero ?? true,
          display: !opts.compact,
          title: opts.yLabel && !opts.compact
            ? { display: true, text: opts.yLabel,
                font: { size: 11, family: fontStack, weight: '500' },
                color: '#6b7280', padding: { bottom: 8 } }
            : undefined,
          grid: { color: '#f3f4f6', drawTicks: false },
          border: { display: false },
          ticks: {
            font: { size: 11, family: fontStack, weight: '400' },
            color: '#6b7280',
            padding: 8,
            maxTicksLimit: 6,
          },
        },
      },
      plugins: {
        legend: {
          display: opts.legend ?? true,
          position: 'top', align: 'end',
          labels: {
            boxWidth: 8, boxHeight: 8,
            font: { size: 11, family: fontStack, weight: '500' },
            color: '#374151',
            padding: 14,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#f9fafb',
          titleFont: { size: 12, family: fontStack, weight: '600' },
          bodyColor: '#e5e7eb',
          bodyFont: { size: 12, family: fontStack, weight: '400' },
          footerColor: '#9ca3af',
          footerFont: { size: 11, family: fontStack, weight: '400', style: 'italic' },
          padding: 10,
          cornerRadius: 6,
          displayColors: true,
          boxPadding: 4,
          caretSize: 4,
          callbacks: {
            title: items => {
              const r = items[0].raw.run;
              const sha = r?.commit?.short_sha ?? '';
              const date = r ? fmtDateTime(r.commit?.author_date ?? r.timestamp) : '';
              return `${sha}  ·  ${date}`;
            },
            label: item => {
              const v = item.raw.y;
              return `  ${item.dataset.label}: ${fmtNumber(v)} ${opts.unit ?? ''}`;
            },
            footer: items => {
              const r = items[0].raw.run;
              return r?.commit?.subject ?? '';
            },
          },
        },
      },
      elements: {
        point: {
          radius: 0,
          hoverRadius: 5,
          hoverBorderWidth: 2,
          hoverBackgroundColor: '#fff',
        },
        line: { tension: 0.35, borderWidth: 2 },
      },
      onClick: opts.onClick,
    },
  });
}

export function makeDataset(label, points, colorIdx = 0, opts = {}) {
  const color = PALETTE[colorIdx % PALETTE.length];
  return {
    label,
    data: points,
    borderColor: opts.borderColor ?? color,
    backgroundColor: (opts.borderColor ?? color) + '22',
    fill: false,
    spanGaps: true,
    borderDash: opts.borderDash,
    borderWidth: opts.borderWidth ?? 2,
    pointRadius: opts.pointRadius,
    order: opts.order,
  };
}

// "Need more runs to chart" placeholder used when N < 2 datapoints exist
// for a given metric — a single dot doesn't communicate a trend.
export function emptyChartPlaceholder(label) {
  return `
    <div class="flex flex-col items-center justify-center h-full text-center text-gray-400">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mb-2">
        <polyline points="3 17 9 11 13 15 21 7"/>
        <polyline points="14 7 21 7 21 14"/>
      </svg>
      <div class="text-sm">Need 2+ runs to plot ${escapeHtml(label)}</div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Recent runs table
// ---------------------------------------------------------------------------

export function renderRunsTable(manifestEntries, runsByFile, suiteName = null) {
  const rows = manifestEntries.map((entry, idx) => {
    const run = runsByFile[entry.data_file];
    const prevEntry = manifestEntries[idx + 1];
    const compareLink = prevEntry
      ? `<a class="text-blue-600 hover:underline" href="compare.html?a=${prevEntry.short_sha}&b=${entry.short_sha}">vs prev</a>`
      : '<span class="text-gray-400">—</span>';

    let metricCells = '';
    if (suiteName && run) {
      const suite = getSuite(run, suiteName);
      const metrics = SUITE_METRICS[suiteName] ?? [];
      metricCells = metrics.map(m => {
        const v = suite ? m.get(suite) : null;
        return `<td class="px-3 py-2 text-right font-mono tabular-nums whitespace-nowrap">${fmtNumber(v)}</td>`;
      }).join('');
    }

    const status = run?.suites?.every(s => s.success)
      ? '<span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60">pass</span>'
      : '<span class="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 ring-1 ring-rose-200/60">fail</span>';

    const prCell = entry.pr_url
      ? `<a href="${entry.pr_url}" target="_blank" class="text-indigo-600 hover:underline">#${entry.pr_url.split('/').pop()}</a>`
      : '<span class="text-gray-300">—</span>';

    const runCell = entry.run_url
      ? `<a href="${entry.run_url}" target="_blank" class="text-indigo-600 hover:underline" title="View workflow run">↗</a>`
      : '<span class="text-gray-300">—</span>';

    return `
      <tr class="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
        <td class="px-3 py-2.5 whitespace-nowrap text-gray-600">${fmtDate(entry.author_date)}</td>
        <td class="px-3 py-2.5 font-mono whitespace-nowrap"><a href="${entry.commit_url}" target="_blank" class="text-indigo-600 hover:underline">${entry.short_sha}</a></td>
        <td class="px-3 py-2.5 max-w-[28rem] truncate" title="${escapeHtml(entry.subject)}">${escapeHtml(entry.subject)}</td>
        <td class="px-3 py-2.5 whitespace-nowrap">${prCell}</td>
        <td class="px-3 py-2.5 whitespace-nowrap text-center">${runCell}</td>
        <td class="px-3 py-2.5 whitespace-nowrap text-gray-600">${escapeHtml(entry.scale ?? '—')}</td>
        <td class="px-3 py-2.5 whitespace-nowrap">${status}</td>
        ${metricCells}
        <td class="px-3 py-2.5 whitespace-nowrap">${compareLink}</td>
      </tr>
    `;
  }).join('');

  const metricHeaders = suiteName
    ? (SUITE_METRICS[suiteName] ?? []).map(m =>
        `<th class="px-3 py-2.5 text-right text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400">${m.label}<br><span class="text-gray-300 font-normal normal-case tracking-normal">${m.unit}</span></th>`).join('')
    : '';

  return `
    <div class="bg-white border border-gray-200 rounded-xl overflow-x-auto">
      <table class="min-w-full text-[13px]">
        <thead class="bg-gray-50/80 text-[10px] uppercase tracking-[0.08em] text-gray-400">
          <tr>
            <th class="px-3 py-2.5 text-left font-medium">Date</th>
            <th class="px-3 py-2.5 text-left font-medium">Commit</th>
            <th class="px-3 py-2.5 text-left font-medium">Subject</th>
            <th class="px-3 py-2.5 text-left font-medium">PR</th>
            <th class="px-3 py-2.5 text-center font-medium">Run</th>
            <th class="px-3 py-2.5 text-left font-medium">Scale</th>
            <th class="px-3 py-2.5 text-left font-medium">Status</th>
            ${metricHeaders}
            <th class="px-3 py-2.5 text-left font-medium"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Per-suite page renderer (charts + table)
// ---------------------------------------------------------------------------

export async function renderSuitePage(suiteName, container) {
  const { manifest, runs } = await loadRecentRuns(60);
  if (runs.length === 0) {
    container.innerHTML = '<div class="text-center py-16 text-gray-500">No runs yet.</div>';
    return;
  }

  const metrics = SUITE_METRICS[suiteName];
  if (!metrics) {
    container.innerHTML = `<div class="text-center py-16 text-gray-500">Unknown suite ${escapeHtml(suiteName)}</div>`;
    return;
  }

  const latest = runs[0];
  const prev = runs[1] ?? null;
  const latestSuite = getSuite(latest, suiteName);
  const prevSuite = prev ? getSuite(prev, suiteName) : null;

  // Metric summary cards
  const cardsHtml = metrics.map(m => {
    const curr = latestSuite ? m.get(latestSuite) : null;
    const previous = prevSuite ? m.get(prevSuite) : null;
    return `
      <div class="bg-white border border-gray-200 rounded-lg p-5 min-w-0">
        <h3 class="text-xs uppercase tracking-wide text-gray-500 font-semibold m-0 mb-2">${m.label}</h3>
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="text-3xl font-semibold tabular-nums">${fmtNumber(curr)}</span>
          <span class="text-gray-500 text-sm">${m.unit}</span>
          ${renderDelta(curr, previous, m.biggerIsBetter)}
        </div>
      </div>
    `;
  }).join('');

  // Multi-series charts (e.g. recall p50/p95/p99/mean on one chart).
  const charts = SUITE_CHARTS[suiteName] ?? [];
  const chartsHtml = charts.map((chart, i) => `
    <div class="bg-white border border-gray-200 rounded-lg p-5 min-w-0">
      <h3 class="text-xs uppercase tracking-wide text-gray-500 font-semibold m-0 mb-2">${chart.title} <span class="text-gray-400 normal-case tracking-normal">(${chart.unit})</span></h3>
      <div class="chart-container large" id="chart-host-${i}"><canvas id="chart-${i}"></canvas></div>
    </div>
  `).join('');

  // Phase breakdown for recall suites (latest only)
  let phasesHtml = '';
  if (latestSuite?.recall?.phase_timings) {
    const phases = Object.entries(latestSuite.recall.phase_timings)
      .sort(([, a], [, b]) => b.mean - a.mean);
    phasesHtml = `
      <div class="bg-white border border-gray-200 rounded-lg p-5 mt-6">
        <h3 class="text-xs uppercase tracking-wide text-gray-500 font-semibold m-0 mb-3">Latest run · phase breakdown</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Phase</th>
                <th class="px-3 py-2 text-right font-medium">Mean</th>
                <th class="px-3 py-2 text-right font-medium">p50</th>
                <th class="px-3 py-2 text-right font-medium">p95</th>
                <th class="px-3 py-2 text-right font-medium">p99</th>
              </tr>
            </thead>
            <tbody>
              ${phases.map(([name, ps]) => `
                <tr class="border-t border-gray-100">
                  <td class="px-3 py-2 font-mono">${escapeHtml(name)}</td>
                  <td class="px-3 py-2 text-right font-mono tabular-nums">${fmtNumber(ps.mean)}</td>
                  <td class="px-3 py-2 text-right font-mono tabular-nums">${fmtNumber(ps.p50)}</td>
                  <td class="px-3 py-2 text-right font-mono tabular-nums">${fmtNumber(ps.p95)}</td>
                  <td class="px-3 py-2 text-right font-mono tabular-nums">${fmtNumber(ps.p99)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Build runs-by-file index for the table
  const runsByFile = {};
  manifest.runs.slice(0, runs.length).forEach((entry, i) => {
    runsByFile[entry.data_file] = runs[i];
  });

  // Pick a card-grid column count based on number of metrics
  const cardCols = metrics.length >= 4 ? 'lg:grid-cols-4' : metrics.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  container.innerHTML = `
    ${renderLatestBanner(latest)}
    <div class="grid grid-cols-1 sm:grid-cols-2 ${cardCols} gap-6">${cardsHtml}</div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">${chartsHtml}</div>
    ${phasesHtml}
    <h2 class="text-base font-semibold mt-8 mb-3">Runs</h2>
    ${renderRunsTable(manifest.runs.slice(0, runs.length), runsByFile, suiteName)}
  `;

  charts.forEach((chart, i) => {
    const seriesPoints = chart.series.map(s => timeSeries(runs, suiteName, s.get));
    const maxPoints = Math.max(...seriesPoints.map(p => p.length));
    if (maxPoints < 2) {
      const host = document.getElementById(`chart-host-${i}`);
      host.innerHTML = emptyChartPlaceholder(chart.title.toLowerCase());
      return;
    }

    const datasets = chart.series.map((s, j) => makeDataset(s.label, seriesPoints[j], j));

    // Moving-average overlay (only meaningful with ≥5 points). For
    // multi-series charts we average the *first* series since that's what
    // headlines the panel (e.g. p99 for latency).
    if (chart.series.length === 1 && seriesPoints[0].length >= 5) {
      datasets.push(makeDataset(`${chart.series[0].label} · 5-run MA`, movingAverage(seriesPoints[0], 5), 0, {
        borderColor: PALETTE[0],
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        order: -1,
      }));
    }

    const canvas = document.getElementById(`chart-${i}`);
    lineChart(canvas, datasets, {
      yLabel: chart.unit,
      legend: chart.series.length > 1,
      unit: chart.unit,
    });
  });
}
