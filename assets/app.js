// Shared utilities for the Hindsight perf dashboard.
// Pure ES module, no build step. Loaded via <script type="module">.

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

// Map suite name → list of metrics to track (label, accessor, unit, biggerIsBetter).
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

// The "headline" metric shown on the overview card for each suite.
export const SUITE_HEADLINE = {
  'retain': SUITE_METRICS['retain'][0],
  'recall': SUITE_METRICS['recall'][0],
  'recall-with-observations': SUITE_METRICS['recall-with-observations'][0],
  'consolidation': SUITE_METRICS['consolidation'][0],
};

// Build chart points (oldest → newest) for a given suite + metric accessor.
export function timeSeries(runs, suiteName, accessor) {
  return runs.slice().reverse()
    .map(run => {
      const suite = getSuite(run, suiteName);
      if (!suite || !suite.success) return null;
      const value = accessor(suite);
      if (value == null) return null;
      return { x: run.commit?.author_date ?? run.timestamp, y: value, run };
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

// Render a delta as a coloured pill. biggerIsBetter inverts the "good/bad" sense.
export function renderDelta(curr, prev, biggerIsBetter) {
  const d = deltaPct(curr, prev);
  if (d == null) return '<span class="delta flat">—</span>';
  const sign = d >= 0 ? '+' : '';
  const cls = Math.abs(d) < 0.5 ? 'flat'
    : (d > 0) === biggerIsBetter ? 'good' : 'bad';
  return `<span class="delta ${cls}">${sign}${d.toFixed(1)}%</span>`;
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
  return `
    <div class="header-inner">
      <h1>Hindsight perf dashboard</h1>
      <nav>
        ${pages.map(p => `<a href="${p.href}" class="${p.id === activePage ? 'active' : ''}">${p.label}</a>`).join('')}
      </nav>
    </div>
  `;
}

export function renderLatestBanner(run) {
  if (!run) return '';
  const c = run.commit ?? {};
  const prLink = c.pr_url ? `<a href="${c.pr_url}" target="_blank">#${c.pr_number}</a>` : '—';
  return `
    <div class="latest-banner">
      <div>
        <div class="label">Latest run</div>
        <div class="value">${fmtDateTime(run.timestamp)}</div>
      </div>
      <div>
        <div class="label">Commit</div>
        <div class="value mono">
          <a href="${c.url ?? '#'}" target="_blank">${c.short_sha ?? '—'}</a>
          <span class="muted">${c.author ? '· ' + c.author : ''}</span>
        </div>
      </div>
      <div>
        <div class="label">Subject</div>
        <div class="value">${escapeHtml(c.subject ?? '—')}</div>
      </div>
      <div>
        <div class="label">PR</div>
        <div class="value">${prLink}</div>
      </div>
      <div>
        <div class="label">Scale</div>
        <div class="value">${run.scale ?? '—'}</div>
      </div>
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
      parsing: false,
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
      ? `<a href="compare.html?a=${prevEntry.short_sha}&b=${entry.short_sha}">vs prev</a>`
      : '<span class="muted">—</span>';

    let metricCells = '';
    if (suiteName && run) {
      const suite = getSuite(run, suiteName);
      const metrics = SUITE_METRICS[suiteName] ?? [];
      metricCells = metrics.map(m => {
        const v = suite ? m.get(suite) : null;
        return `<td class="num mono">${fmtNumber(v)}</td>`;
      }).join('');
    }

    const status = run?.suites?.every(s => s.success)
      ? '<span class="success-pill">pass</span>'
      : '<span class="failed-pill">fail</span>';

    const prCell = entry.pr_url
      ? `<a href="${entry.pr_url}" target="_blank">#${entry.pr_url.split('/').pop()}</a>`
      : '<span class="muted">—</span>';

    return `
      <tr>
        <td>${fmtDate(entry.author_date)}</td>
        <td class="mono"><a href="${entry.commit_url}" target="_blank">${entry.short_sha}</a></td>
        <td class="subject" title="${escapeHtml(entry.subject)}">${escapeHtml(entry.subject)}</td>
        <td>${prCell}</td>
        <td>${entry.scale ?? '—'}</td>
        <td>${status}</td>
        ${metricCells}
        <td>${compareLink}</td>
      </tr>
    `;
  }).join('');

  const metricHeaders = suiteName
    ? (SUITE_METRICS[suiteName] ?? []).map(m =>
        `<th class="num">${m.label}<br><span class="muted" style="font-weight:400">${m.unit}</span></th>`).join('')
    : '';

  return `
    <div class="runs-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Commit</th>
            <th>Subject</th>
            <th>PR</th>
            <th>Scale</th>
            <th>Status</th>
            ${metricHeaders}
            <th></th>
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
    container.innerHTML = '<div class="empty-state">No runs yet.</div>';
    return;
  }

  const metrics = SUITE_METRICS[suiteName];
  if (!metrics) {
    container.innerHTML = `<div class="empty-state">Unknown suite ${suiteName}</div>`;
    return;
  }

  const latest = runs[0];
  const prev = runs[1] ?? null;
  const latestSuite = getSuite(latest, suiteName);
  const prevSuite = prev ? getSuite(prev, suiteName) : null;

  // Headline metric cards
  const cardsHtml = metrics.map(m => {
    const curr = latestSuite ? m.get(latestSuite) : null;
    const previous = prevSuite ? m.get(prevSuite) : null;
    return `
      <div class="card">
        <div class="card-header"><h3>${m.label}</h3></div>
        <div class="metric-row">
          <span class="metric">${fmtNumber(curr)}</span>
          <span class="metric-unit">${m.unit}</span>
          ${renderDelta(curr, previous, m.biggerIsBetter)}
        </div>
      </div>
    `;
  }).join('');

  // Charts: one per metric, oldest → newest
  const chartsHtml = metrics.map((m, i) => `
    <div class="card">
      <div class="card-header"><h3>${m.label} <span class="muted">(${m.unit})</span></h3></div>
      <div class="chart-container large"><canvas id="chart-${i}"></canvas></div>
    </div>
  `).join('');

  // Phase breakdown for recall suites (latest only)
  let phasesHtml = '';
  if (latestSuite?.recall?.phase_timings) {
    const phases = Object.entries(latestSuite.recall.phase_timings)
      .sort(([, a], [, b]) => b.mean - a.mean);
    phasesHtml = `
      <div class="card" style="margin-top:1.5rem">
        <div class="card-header"><h3>Latest run · phase breakdown</h3></div>
        <table>
          <thead><tr><th>Phase</th><th class="num">Mean</th><th class="num">p50</th><th class="num">p95</th><th class="num">p99</th></tr></thead>
          <tbody>
            ${phases.map(([name, ps]) => `
              <tr>
                <td class="mono">${escapeHtml(name)}</td>
                <td class="num mono">${fmtNumber(ps.mean)}</td>
                <td class="num mono">${fmtNumber(ps.p50)}</td>
                <td class="num mono">${fmtNumber(ps.p95)}</td>
                <td class="num mono">${fmtNumber(ps.p99)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Build runs-by-file index for the table
  const runsByFile = {};
  manifest.runs.slice(0, runs.length).forEach((entry, i) => {
    runsByFile[entry.data_file] = runs[i];
  });

  container.innerHTML = `
    ${renderLatestBanner(latest)}
    <div class="grid grid-${Math.min(metrics.length, 4)}">${cardsHtml}</div>
    <div class="grid" style="margin-top:1.5rem">${chartsHtml}</div>
    ${phasesHtml}
    <h2 style="margin-top:2rem">Runs</h2>
    ${renderRunsTable(manifest.runs.slice(0, runs.length), runsByFile, suiteName)}
  `;

  // Render charts now that canvases are in the DOM
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
