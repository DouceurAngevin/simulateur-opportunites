/**
 * Logique du simulateur d'opportunités.
 * Séparée du markup afin de pouvoir brancher d'autres interfaces (Notion, app…).
 */

const elements = {
  visits: document.getElementById('visits'),
  conversion: document.getElementById('conv'),
  averageOrder: document.getElementById('aov'),
  delta: document.getElementById('delta'),
  adspend: document.getElementById('adspend'),
  outputs: {
    currentRevenue: document.getElementById('caActuel'),
    gain: document.getElementById('gain'),
    projectedRevenue: document.getElementById('caProjete'),
    roi: document.getElementById('roi')
  },
  calculate: document.getElementById('calculate')
};

function readNumber(input, fallback) {
  const parsed = parseFloat(String(input.value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function formatPercent(value) {
  if (value === Infinity) {
    return '∞';
  }

  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(value);
}

function compute() {
  const visits = Math.max(0, readNumber(elements.visits, 5000));
  const conversion = Math.max(0, Math.min(100, readNumber(elements.conversion, 1.5)));
  const averageOrder = Math.max(0, readNumber(elements.averageOrder, 60));
  const delta = Math.max(0, readNumber(elements.delta, 1));
  const adspend = Math.max(0, readNumber(elements.adspend, 0));

  const currentRevenue = visits * (conversion / 100) * averageOrder;
  const gain = visits * (delta / 100) * averageOrder;
  const projectedRevenue = currentRevenue + gain;
  const roi = adspend > 0 ? (gain - adspend) / adspend : (gain > 0 ? Infinity : 0);

  elements.outputs.currentRevenue.textContent = formatCurrency(currentRevenue);
  elements.outputs.gain.textContent = formatCurrency(gain);
  elements.outputs.projectedRevenue.textContent = formatCurrency(projectedRevenue);
  elements.outputs.roi.textContent = formatPercent(roi);
}

elements.calculate.addEventListener('click', compute);
