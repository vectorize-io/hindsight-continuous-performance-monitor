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

// Build chart points (oldest → newest) for a given suite + metric accessor.
// x is a numeric ms timestamp so Chart.js can plot without re-parsing strings.
export function timeSeries(runs, suiteName, accessor) {
  return runs.slice().reverse()
    .map(run => {
      const suite = getSuite(run, suiteName);
      if (!suite || !suite.success) return null;
      const value = accessor(suite);
      if (value == null) return null;
      const iso = run.commit?.author_date ?? run.timestamp;
      return { x: new Date(iso).getTime(), y: value, run };
    })
    .filter(Boolean);
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

export function renderHeader(activePage = '') {
  const pages = [
    { href: 'index.html',                       label: 'Overview',     id: 'overview' },
    { href: 'retain.html',                      label: 'Retain',       id: 'retain' },
    { href: 'recall.html',                      label: 'Recall',       id: 'recall' },
    { href: 'recall-with-observations.html',    label: 'Recall+obs',   id: 'recall-with-observations' },
    { href: 'consolidation.html',               label: 'Consolidation', id: 'consolidation' },
    { href: 'compare.html',                     label: 'Compare',      id: 'compare' },
  ];
  const link = (p) => {
    const base = 'text-sm px-2 py-1 rounded no-underline transition-colors';
    const cls = p.id === activePage
      ? 'text-blue-700 bg-blue-50'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
    return `<a href="${p.href}" class="${base} ${cls}">${p.label}</a>`;
  };
  return `
    <div class="max-w-7xl mx-auto flex items-center gap-6 flex-wrap">
      <h1 class="text-base font-semibold m-0">Hindsight perf dashboard</h1>
      <nav class="flex gap-1 flex-wrap">
        ${pages.map(link).join('')}
      </nav>
    </div>
  `;
}

export function renderLatestBanner(run) {
  if (!run) return '';
  const c = run.commit ?? {};
  const prLink = c.pr_url
    ? `<a href="${c.pr_url}" target="_blank" class="text-blue-600 hover:underline">#${c.pr_number}</a>`
    : '<span class="text-gray-400">—</span>';
  const cell = (label, value) => `
    <div class="min-w-0">
      <div class="text-[11px] uppercase tracking-wide text-gray-500 font-medium">${label}</div>
      <div class="text-sm truncate">${value}</div>
    </div>
  `;
  return `
    <div class="bg-white border border-gray-200 rounded-lg px-5 py-3 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
      ${cell('Latest run', fmtDateTime(run.timestamp))}
      ${cell('Commit', `<a href="${c.url ?? '#'}" target="_blank" class="font-mono text-blue-600 hover:underline">${c.short_sha ?? '—'}</a> <span class="text-gray-400">${c.author ? '· ' + escapeHtml(c.author) : ''}</span>`)}
      ${cell('Subject', `<span title="${escapeHtml(c.subject ?? '')}">${escapeHtml(c.subject ?? '—')}</span>`)}
      ${cell('PR', prLink)}
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

const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#0891b2'];

export function lineChart(canvas, datasets, opts = {}) {
  return new Chart(canvas, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      scales: {
        x: {
          type: 'time',
          time: { unit: 'day', tooltipFormat: 'PPpp' },
          ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 },
          grid: { display: false },
        },
        y: {
          beginAtZero: opts.beginAtZero ?? true,
          title: opts.yLabel ? { display: true, text: opts.yLabel } : undefined,
          grid: { color: '#f0f0f0' },
        },
      },
      plugins: {
        legend: { display: opts.legend ?? true, position: 'top', align: 'end',
                  labels: { boxWidth: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            title: items => fmtDateTime(items[0].raw.x),
            label: item => {
              const v = item.raw.y;
              const r = item.raw.run;
              const sha = r?.commit?.short_sha ?? '';
              return `${item.dataset.label}: ${fmtNumber(v)} ${opts.unit ?? ''} (${sha})`;
            },
            footer: items => {
              const r = items[0].raw.run;
              return r?.commit?.subject ?? '';
            },
          },
        },
      },
      elements: {
        point: { radius: 3, hoverRadius: 6 },
        line: { tension: 0.2, borderWidth: 2 },
      },
      onClick: opts.onClick,
    },
  });
}

export function makeDataset(label, points, colorIdx = 0) {
  const color = PALETTE[colorIdx % PALETTE.length];
  return {
    label,
    data: points,
    borderColor: color,
    backgroundColor: color + '22',
    fill: false,
    spanGaps: true,
  };
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
      ? '<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">pass</span>'
      : '<span class="inline-block px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">fail</span>';

    const prCell = entry.pr_url
      ? `<a href="${entry.pr_url}" target="_blank" class="text-blue-600 hover:underline">#${entry.pr_url.split('/').pop()}</a>`
      : '<span class="text-gray-400">—</span>';

    return `
      <tr class="border-t border-gray-100 hover:bg-gray-50">
        <td class="px-3 py-2 whitespace-nowrap">${fmtDate(entry.author_date)}</td>
        <td class="px-3 py-2 font-mono whitespace-nowrap"><a href="${entry.commit_url}" target="_blank" class="text-blue-600 hover:underline">${entry.short_sha}</a></td>
        <td class="px-3 py-2 max-w-[28rem] truncate" title="${escapeHtml(entry.subject)}">${escapeHtml(entry.subject)}</td>
        <td class="px-3 py-2 whitespace-nowrap">${prCell}</td>
        <td class="px-3 py-2 whitespace-nowrap">${escapeHtml(entry.scale ?? '—')}</td>
        <td class="px-3 py-2 whitespace-nowrap">${status}</td>
        ${metricCells}
        <td class="px-3 py-2 whitespace-nowrap">${compareLink}</td>
      </tr>
    `;
  }).join('');

  const metricHeaders = suiteName
    ? (SUITE_METRICS[suiteName] ?? []).map(m =>
        `<th class="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">${m.label}<br><span class="text-gray-400 font-normal normal-case tracking-normal">${m.unit}</span></th>`).join('')
    : '';

  return `
    <div class="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th class="px-3 py-2 text-left font-medium">Date</th>
            <th class="px-3 py-2 text-left font-medium">Commit</th>
            <th class="px-3 py-2 text-left font-medium">Subject</th>
            <th class="px-3 py-2 text-left font-medium">PR</th>
            <th class="px-3 py-2 text-left font-medium">Scale</th>
            <th class="px-3 py-2 text-left font-medium">Status</th>
            ${metricHeaders}
            <th class="px-3 py-2 text-left font-medium"></th>
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

  // Charts: one per metric, oldest → newest
  const chartsHtml = metrics.map((m, i) => `
    <div class="bg-white border border-gray-200 rounded-lg p-5 min-w-0">
      <h3 class="text-xs uppercase tracking-wide text-gray-500 font-semibold m-0 mb-2">${m.label} <span class="text-gray-400 normal-case tracking-normal">(${m.unit})</span></h3>
      <div class="chart-container large"><canvas id="chart-${i}"></canvas></div>
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

  metrics.forEach((m, i) => {
    const canvas = document.getElementById(`chart-${i}`);
    const points = timeSeries(runs, suiteName, m.get);
    lineChart(canvas, [makeDataset(m.label, points, i)], {
      yLabel: m.unit,
      legend: false,
      unit: m.unit,
    });
  });
}
