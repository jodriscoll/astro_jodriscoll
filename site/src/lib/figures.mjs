// Remark plugin: fenced blocks named before-after, steps, timeline, or bars
// hold JSON and become figures. Same fields as GameKal's docs site
// (docs/storybook.md, "The docs site"), so posts move between the two as-is.

const KINDS = new Set(['before-after', 'steps', 'timeline', 'bars']);

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const lines = (value) => esc(value).replace(/\\n|\n/g, '<br>');
const tone = (value) => (['accent', 'light', 'muted', 'dim'].includes(value) ? value : 'light');
const pct = (value, max) => `${Math.max(0, Math.min(100, (Number(value) / Number(max || 1)) * 100)).toFixed(2)}%`;

const ICONS = {
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c1-3.6 3.6-5.4 7-5.4s6 1.8 7 5.4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  server: '<rect x="4" y="4" width="16" height="7" rx="1.5"/><rect x="4" y="13" width="16" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
  file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  shield: '<path d="M12 3 5 6v6c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6z"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
  zap: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
};

function icon(name) {
  const path = ICONS[name];
  if (!path) return '';
  return `<svg class="fig__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function box(item, extra = '') {
  if (!item) return '';
  const variant = ['accent', 'muted', 'dashed'].includes(item.variant) ? ` is-${item.variant}` : '';
  return `<div class="fig__box${variant}${extra}">${icon(item.icon)}<span><strong>${esc(item.title)}</strong>${
    item.detail ? `<small>${lines(item.detail)}</small>` : ''
  }</span></div>`;
}

function frame(kind, data, inner) {
  const head = `${data.title ? `<p class="fig__title">${esc(data.title)}</p>` : ''}${
    data.subtitle ? `<p class="fig__sub">${lines(data.subtitle)}</p>` : ''
  }`;
  const panelHead = `${data.heading ? `<p class="fig__heading">${esc(data.heading)}</p>` : ''}${
    data.description ? `<p class="fig__desc">${lines(data.description)}</p>` : ''
  }`;
  return `<figure class="fig fig--${kind}">${head}<div class="fig__panel">${panelHead}${inner}</div>${
    data.note ? `<figcaption class="fig__note">${lines(data.note)}</figcaption>` : ''
  }</figure>`;
}

function axis(ticks = [], max, unit = '', format) {
  if (!ticks.length) return '';
  const label = (t) => (format === 'k' && t >= 1000 ? `${t / 1000}k` : Number(t).toLocaleString('en-US'));
  return `<div class="fig__axis">${ticks
    .map((t) => `<span style="left:${pct(t, max)}">${esc(label(t))}${t === ticks[ticks.length - 1] && unit ? ` ${esc(unit)}` : ''}</span>`)
    .join('')}</div>`;
}

function steps(data) {
  const rows = (data.rows ?? [])
    .map((row) => {
      const chain = (row.steps ?? [])
        .map((s, i) => `${i ? '<i class="fig__arrow" aria-hidden="true"></i>' : ''}<div class="fig__step"><strong>${esc(s.title)}</strong>${s.detail ? `<small>${lines(s.detail)}</small>` : ''}</div>`)
        .join('');
      const group = row.group
        ? `<div class="fig__group"><p class="fig__group-title">${esc(row.group.title)}${row.group.detail ? ` <small>${lines(row.group.detail)}</small>` : ''}</p><div class="fig__chain">${chain}</div></div>`
        : `<div class="fig__chain">${chain}</div>`;
      const aside = row.aside ? `<div class="fig__aside">${typeof row.aside === 'string' ? lines(row.aside) : `<strong>${esc(row.aside.title)}</strong> ${lines(row.aside.detail)}`}</div>` : '';
      return `<div class="fig__row"><div class="fig__label"><strong>${esc(row.label)}</strong>${row.sublabel ? `<small>${lines(row.sublabel)}</small>` : ''}</div><div class="fig__track">${group}${aside}${
        row.caption ? `<p class="fig__caption">${lines(row.caption)}</p>` : ''
      }</div></div>`;
    })
    .join('');
  return frame('steps', data, rows);
}

function bars(data) {
  const max = data.max ?? Math.max(...(data.groups ?? []).flatMap((g) => (g.bars ?? []).map((b) => Number(b.value) || 0)), 1);
  const legend = (data.legend ?? []).length
    ? `<p class="fig__legend">${data.legend.map((l) => `<span><i class="t-${tone(l.tone)}"></i>${esc(l.label)}</span>`).join('')}</p>`
    : '';
  const groups = (data.groups ?? [])
    .map((group) => {
      const items = (group.bars ?? [])
        .map((bar) => {
          const shown = bar.display ?? `${Number(bar.value).toLocaleString('en-US')}${data.unit ? ` ${data.unit}` : ''}`;
          const dots = (bar.dots ?? []).map((d) => `<i class="fig__dot" style="left:${pct(d, max)}"></i>`).join('');
          const fill = bar.text
            ? `<span class="fig__bartext">${esc(bar.text)}</span>`
            : `<span class="fig__fill t-${tone(bar.tone)}" style="width:${pct(bar.value, max)}"></span>${dots}`;
          return `<div class="fig__bar"${bar.label ? ` aria-label="${esc(bar.label)}"` : ''}><span class="fig__barlane">${fill}</span><span class="fig__value">${esc(shown)}</span></div>`;
        })
        .join('');
      return `<div class="fig__row"><div class="fig__label"><strong>${esc(group.label)}</strong>${group.sublabel ? `<small>${lines(group.sublabel)}</small>` : ''}</div><div class="fig__track">${items}</div></div>`;
    })
    .join('');
  return frame('bars', data, `${legend}${groups}<div class="fig__row fig__row--axis"><div></div><div class="fig__track">${axis(data.ticks, max, data.unit, data.tickFormat)}</div></div>`);
}

function timeline(data) {
  const max = data.max ?? 1;
  const rows = (data.rows ?? [])
    .map((row) => {
      const segs = (row.segments ?? [])
        .map((s) => `<span class="fig__seg t-${tone(s.tone)}" style="left:${pct(s.from, max)};width:calc(${pct(s.to, max)} - ${pct(s.from, max)})">${s.label ? `<em>${esc(s.label)}</em>` : ''}</span>`)
        .join('');
      const marks = (row.marks ?? []).map((m) => `<span class="fig__mark" style="left:${pct(m.at, max)}">${esc(m.label)}</span>`).join('');
      return `<div class="fig__row"><div class="fig__label"><strong>${esc(row.label)}</strong>${row.sublabel ? `<small>${lines(row.sublabel)}</small>` : ''}</div><div class="fig__track"><div class="fig__marks">${marks}</div><div class="fig__lane">${segs}</div></div></div>`;
    })
    .join('');
  return frame('timeline', data, `${rows}<div class="fig__row fig__row--axis"><div></div><div class="fig__track">${axis(data.ticks, max, data.unit)}</div></div>`);
}

function beforeAfter(data) {
  const panels = (data.panels ?? [])
    .map((panel, index) => {
      const lanes = (panel.lanes ?? [])
        .map((lane) => {
          const tos = (lane.to ?? []).map((t) => box(t)).join('');
          const middle = lane.group
            ? `<div class="fig__group${lane.group.variant ? ` is-${esc(lane.group.variant)}` : ''}"><p class="fig__group-title">${esc(lane.group.title)}${lane.group.detail ? ` <small>${lines(lane.group.detail)}</small>` : ''}</p>${tos}</div>`
            : `<div class="fig__tos">${tos}</div>`;
          return `<div class="fig__lanerow">${box(lane.from)}<i class="fig__arrow" aria-hidden="true"></i>${middle}${lane.target || lane.group?.target ? '<i class="fig__arrow fig__arrow--target" aria-hidden="true"></i>' : ''}</div>`;
        })
        .join('');
      return `<section class="fig__ba${index ? ' is-after' : ''}"><header><p class="fig__heading">${esc(panel.label)}</p>${panel.metric ? `<p class="fig__metric">${esc(panel.metric)}</p>` : ''}</header>${
        panel.caption ? `<p class="fig__desc">${lines(panel.caption)}</p>` : ''
      }<div class="fig__lanes">${lanes}</div>${panel.target ? `<div class="fig__target">${box(panel.target)}</div>` : ''}</section>`;
    })
    .join('');
  return frame('before-after', data, `<div class="fig__bas">${panels}</div>`);
}

const RENDER = { steps, bars, timeline, 'before-after': beforeAfter };

function walk(node, visit) {
  if (!node || !Array.isArray(node.children)) return;
  node.children.forEach((child, i) => {
    visit(child, i, node);
    walk(child, visit);
  });
}

export default function remarkFigures() {
  return (tree) => {
    walk(tree, (node, index, parent) => {
      if (node.type !== 'code' || !KINDS.has(node.lang)) return;
      let html;
      try {
        html = RENDER[node.lang](JSON.parse(node.value));
      } catch (error) {
        html = `<pre class="fig__error">Figure could not be drawn: ${esc(error.message)}</pre>`;
      }
      parent.children[index] = { type: 'html', value: html };
    });
  };
}
