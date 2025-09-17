/**
 * Audit du tunnel commercial — logique côté navigateur.
 * Tous les calculs sont effectués localement, aucune donnée n’est transmise.
 */

const STORAGE_KEY = 'audit-tunnel-state-v1';
const DEFAULT_SECTOR = 'machinesLourdes';

const DEFAULT_STATE = {
  visitors: '',
  leads: '',
  quotes: '',
  signatures: '',
  averageOrder: '',
  supports: [],
  reExplain: '',
  adBudget: '',
  deltaSign: '',
  nbSales: '',
  hourlyRate: '',
  scenarioMode: 'weak',
  sector: DEFAULT_SECTOR
};

const REQUIRED_FIELDS = new Set(['visitors', 'leads', 'quotes', 'signatures', 'averageOrder', 'reExplain']);
const INTEGER_FIELDS = new Set(['visitors', 'leads', 'quotes', 'signatures', 'nbSales']);
const NUMERIC_FIELDS = new Set([
  'visitors',
  'leads',
  'quotes',
  'signatures',
  'averageOrder',
  'reExplain',
  'adBudget',
  'deltaSign',
  'nbSales',
  'hourlyRate'
]);

const BENCHMARKS = {
  machinesLourdes: {
    label: 'Machines industrielles & équipements lourds',
    rates: { tc1: 0.011, tc2: 0.44, tc3: 0.31 }
  },
  robotique: {
    label: 'Robotique & automatisation de production',
    rates: { tc1: 0.013, tc2: 0.46, tc3: 0.32 }
  },
  sousTraitance: {
    label: 'Sous-traitance mécanique & usinage',
    rates: { tc1: 0.018, tc2: 0.52, tc3: 0.36 }
  },
  electronique: {
    label: 'Électronique professionnelle & IoT industriel',
    rates: { tc1: 0.015, tc2: 0.49, tc3: 0.33 }
  },
  chimie: {
    label: 'Chimie fine & matériaux de spécialité',
    rates: { tc1: 0.009, tc2: 0.41, tc3: 0.28 }
  },
  logistique: {
    label: 'Logistique contractuelle & supply chain B2B',
    rates: { tc1: 0.021, tc2: 0.54, tc3: 0.39 }
  },
  maintenance: {
    label: 'Maintenance industrielle & services MRO',
    rates: { tc1: 0.023, tc2: 0.58, tc3: 0.43 }
  }
};

const STEP_LABELS = {
  tc1: 'Visiteurs → Leads',
  tc2: 'Leads → Devis',
  tc3: 'Devis → Signatures'
};

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});

const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0
});

const badgeLabels = {
  visitors: 'Visiteurs',
  leads: 'Leads',
  quotes: 'Devis',
  signatures: 'Signatures',
  averageOrder: 'Panier moyen',
  reExplain: 'Frictions'
};

const fieldElements = {
  visitors: { input: document.getElementById('visitors'), error: document.querySelector('[data-error="visitors"]'), wrapper: document.querySelector('[data-field="visitors"]') },
  leads: { input: document.getElementById('leads'), error: document.querySelector('[data-error="leads"]'), wrapper: document.querySelector('[data-field="leads"]') },
  quotes: { input: document.getElementById('quotes'), error: document.querySelector('[data-error="quotes"]'), wrapper: document.querySelector('[data-field="quotes"]') },
  signatures: { input: document.getElementById('signatures'), error: document.querySelector('[data-error="signatures"]'), wrapper: document.querySelector('[data-field="signatures"]') },
  averageOrder: { input: document.getElementById('averageOrder'), error: document.querySelector('[data-error="averageOrder"]'), wrapper: document.querySelector('[data-field="averageOrder"]') },
  reExplain: { input: document.getElementById('reExplain'), error: document.querySelector('[data-error="reExplain"]'), wrapper: document.querySelector('[data-field="reExplain"]') },
  adBudget: { input: document.getElementById('adBudget'), error: document.querySelector('[data-error="adBudget"]'), wrapper: document.querySelector('[data-field="adBudget"]') },
  deltaSign: { input: document.getElementById('deltaSign'), error: document.querySelector('[data-error="deltaSign"]'), wrapper: document.querySelector('[data-field="deltaSign"]') },
  nbSales: { input: document.getElementById('nbSales'), error: document.querySelector('[data-error="nbSales"]'), wrapper: document.querySelector('[data-field="nbSales"]') },
  hourlyRate: { input: document.getElementById('hourlyRate'), error: document.querySelector('[data-error="hourlyRate"]'), wrapper: document.querySelector('[data-field="hourlyRate"]') }
};

const summaryBadges = {
  visitors: document.querySelector('[data-summary-badge="visitors"]'),
  leads: document.querySelector('[data-summary-badge="leads"]'),
  quotes: document.querySelector('[data-summary-badge="quotes"]'),
  signatures: document.querySelector('[data-summary-badge="signatures"]'),
  averageOrder: document.querySelector('[data-summary-badge="averageOrder"]'),
  reExplain: document.querySelector('[data-summary-badge="reExplain"]')
};

const supportsInputs = Array.from(document.querySelectorAll('input[name="supports"]'));
const scenarioSelect = document.getElementById('scenarioMode');
const sectorSelect = document.getElementById('sector');
const coherenceBadge = document.getElementById('coherenceBadge');
const exportButton = document.getElementById('export');

const funnelSteps = {
  tc1: {
    container: document.querySelector('[data-step="tc1"]'),
    fill: document.querySelector('[data-step="tc1"] .step-fill'),
    value: document.querySelector('[data-tc="tc1"]')
  },
  tc2: {
    container: document.querySelector('[data-step="tc2"]'),
    fill: document.querySelector('[data-step="tc2"] .step-fill'),
    value: document.querySelector('[data-tc="tc2"]')
  },
  tc3: {
    container: document.querySelector('[data-step="tc3"]'),
    fill: document.querySelector('[data-step="tc3"] .step-fill'),
    value: document.querySelector('[data-tc="tc3"]')
  }
};

const weakLinkMessage = document.getElementById('weakLinkMessage');
const frictionFill = document.querySelector('.friction-fill');
const frictionValue = document.getElementById('frictionValue');

const tiles = {
  currentRevenue: document.getElementById('currentRevenue'),
  timeLost: document.getElementById('timeLostSummary'),
  timeCost: document.getElementById('timeCostSummary'),
  gain10: document.getElementById('gain10'),
  gain20: document.getElementById('gain20'),
  ca10: document.getElementById('ca10'),
  ca20: document.getElementById('ca20'),
  customGain: document.getElementById('customGain'),
  customCa: document.getElementById('customCa'),
  roi10: document.getElementById('roi10'),
  roi20: document.getElementById('roi20'),
  customTile: document.getElementById('customGainTile'),
  roiTile: document.getElementById('roiTile')
};

const ctaSummary = document.getElementById('ctaSummary');

const benchmarkCells = {
  tc1: {
    benchmark: document.querySelector('[data-benchmark="tc1"]'),
    actual: document.querySelector('[data-actual="tc1"]'),
    verdict: document.querySelector('[data-verdict="tc1"]')
  },
  tc2: {
    benchmark: document.querySelector('[data-benchmark="tc2"]'),
    actual: document.querySelector('[data-actual="tc2"]'),
    verdict: document.querySelector('[data-verdict="tc2"]')
  },
  tc3: {
    benchmark: document.querySelector('[data-benchmark="tc3"]'),
    actual: document.querySelector('[data-actual="tc3"]'),
    verdict: document.querySelector('[data-verdict="tc3"]')
  }
};

const benchmarkSummary = {
  globalScore: document.getElementById('globalScore'),
  benchmarkRevenue: document.getElementById('benchmarkRevenue'),
  lostRevenue: document.getElementById('lostRevenue')
};

const recoList = document.getElementById('recoList');

let formState = deepClone(DEFAULT_STATE);
let lastWeakestStep = 'tc3';

const RECOMMENDATIONS = {
  tc1: [
    {
      id: 'clarify-promise',
      title: 'Clarifier la promesse + CTA',
      objective: 'Renforcer la conversion Visiteur → Lead',
      steps: ['Reformuler la proposition de valeur en une phrase claire', 'Positionner un CTA visible sur les pages à trafic', 'Tester une variante courte du formulaire'],
      effort: 'M',
      duration: '2 semaines',
      impact: 5,
      ease: 3,
      boostSupports: ['Site']
    },
    {
      id: 'lead-magnets',
      title: 'Créer des aimants à prospects',
      objective: 'Capturer davantage de leads qualifiés',
      steps: ['Identifier 1 contenu premium (guide, modèle, check-list)', 'Créer un formulaire court en 3 champs maximum', 'Programmer une séquence d’email de bienvenue'],
      effort: 'M',
      duration: '3 semaines',
      impact: 4,
      ease: 3,
      boostSupports: ['Emailing', 'Site']
    },
    {
      id: 'nurturing',
      title: 'Relances emailing / retargeting',
      objective: 'Rattraper les visiteurs non convertis',
      steps: ['Segmenter les visiteurs clés (pages produits, pricing…)', 'Déployer une campagne retargeting simple', 'Envoyer une relance email avec preuve sociale'],
      effort: 'M',
      duration: '4 semaines',
      impact: 4,
      ease: 2,
      boostSupports: ['Emailing', 'Plaquette']
    }
  ],
  tc2: [
    {
      id: 'qualification-script',
      title: 'Structurer la qualification',
      objective: 'Améliorer le passage Lead → Devis',
      steps: ['Formaliser un script de découverte (5 questions clés)', 'Définir les critères MQL/SQL partagés', 'Suivre les conversions par persona/segment'],
      effort: 'M',
      duration: '2 semaines',
      impact: 5,
      ease: 3,
      boostSupports: ['Scripts commerciaux']
    },
    {
      id: 'standardised-proposals',
      title: 'Standardiser les devis',
      objective: 'Rendre l’offre plus lisible et rassurante',
      steps: ['Créer un template clair avec prix / options', 'Ajouter FAQ objections + bénéfices clés', 'Insérer cas clients ou témoignages visuels'],
      effort: 'M',
      duration: '3 semaines',
      impact: 4,
      ease: 2,
      boostSupports: ['Plaquette']
    },
    {
      id: 'guided-demo',
      title: 'Démo guidée / cas clients',
      objective: 'Accélérer la décision après la prise de contact',
      steps: ['Sélectionner 2 cas clients représentatifs', 'Préparer un déroulé de démo en 5 étapes', 'Envoyer un récap visuel après chaque échange'],
      effort: 'M',
      duration: '3 semaines',
      impact: 4,
      ease: 2,
      boostSupports: ['Plaquette', 'Site']
    }
  ],
  tc3: [
    {
      id: 'follow-up-sequences',
      title: 'Séquences de relance automatisées',
      objective: 'Maximiser le closing sur Devis → Signatures',
      steps: ['Programmer des relances J+2, J+7 et J+21', 'Varier les angles : rappel bénéfices, objection, urgence', 'Tracer les réponses dans le CRM pour adapter les scripts'],
      effort: 'S',
      duration: '1 semaine',
      impact: 5,
      ease: 3,
      boostSupports: ['Emailing']
    },
    {
      id: 'objection-checklist',
      title: 'Check-list objections + garanties',
      objective: 'Réassurer les prospects indécis',
      steps: ['Lister les 5 objections majeures rencontrées', 'Associer preuve / garantie à chaque objection', 'Partager la check-list avec l’équipe commerciale'],
      effort: 'S',
      duration: '1 semaine',
      impact: 4,
      ease: 3,
      boostSupports: ['Scripts commerciaux']
    },
    {
      id: 'price-reassurance',
      title: 'Réassurance prix & valeur',
      objective: 'Défendre la valeur sans rogner les marges',
      steps: ['Comparer votre offre à 2 alternatives marché', 'Mettre en avant garanties, délais et ROI', 'Préparer une option “entrée de gamme” maîtrisée'],
      effort: 'M',
      duration: '2 semaines',
      impact: 4,
      ease: 2,
      boostSupports: ['Plaquette']
    }
  ],
  friction: [
    {
      id: 'pitch-script',
      title: 'Script pitch + FAQ interne',
      objective: 'Réduire le temps passé à réexpliquer',
      steps: ['Formaliser un pitch de 90 secondes', 'Documenter les réponses aux 10 questions récurrentes', 'Partager le script dans un format accessible (Notion, PDF)'],
      effort: 'S',
      duration: '1 semaine',
      impact: 3,
      ease: 3,
      boostSupports: ['Scripts commerciaux']
    },
    {
      id: 'explainer-videos',
      title: 'Mini-vidéos explicatives',
      objective: 'Automatiser la pédagogie produit',
      steps: ['Identifier les notions les plus complexes', 'Tourner 3 vidéos courtes (2-3 minutes)', 'Partager le contenu dans vos emails de suivi'],
      effort: 'M',
      duration: '3 semaines',
      impact: 3,
      ease: 2,
      boostSupports: ['Site', 'Emailing']
    },
    {
      id: 'sales-training',
      title: 'Formation express commerciaux',
      objective: 'Aligner les messages et réponses clés',
      steps: ['Organiser un atelier de 2 heures avec l’équipe', 'Jouer 3 scénarios d’objection réels', 'Définir un plan d’amélioration individuel'],
      effort: 'M',
      duration: '2 semaines',
      impact: 4,
      ease: 1,
      boostSupports: ['Autre']
    }
  ]
};

function deepClone(source) {
  return JSON.parse(JSON.stringify(source));
}

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }
  const normalized = String(value).replace(',', '.').trim();
  if (normalized === '') {
    return 0;
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return currencyFormatter.format(value);
}

function formatPercent(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return percentFormatter.format(value);
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return numberFormatter.format(value);
}

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      formState = { ...deepClone(DEFAULT_STATE), ...parsed };
      if (!Array.isArray(formState.supports)) {
        formState.supports = [];
      }
      if (!BENCHMARKS[formState.sector]) {
        formState.sector = DEFAULT_SECTOR;
      }
    }
  } catch (error) {
    // Stockage non disponible, on reste sur l’état par défaut.
  }
}

function applyQueryParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.size === 0) {
    return;
  }

  const mapping = {
    V: 'visitors',
    L: 'leads',
    D: 'quotes',
    S: 'signatures',
    PM: 'averageOrder',
    TR: 'reExplain',
    B: 'adBudget',
    Delta: 'deltaSign',
    DeltaCsign: 'deltaSign'
  };

  params.forEach((value, key) => {
    const target = mapping[key];
    if (target) {
      formState[target] = value;
    }
  });

  const scenario = params.get('scenarioMode');
  if (scenario && (scenario === 'weak' || scenario === 'tc3')) {
    formState.scenarioMode = scenario;
  }
  const sector = params.get('sector');
  if (sector && BENCHMARKS[sector]) {
    formState.sector = sector;
  }
}

function syncFormWithState() {
  Object.entries(fieldElements).forEach(([name, refs]) => {
    if (refs.input) {
      refs.input.value = formState[name] ?? '';
    }
  });

  supportsInputs.forEach((input) => {
    input.checked = formState.supports.includes(input.value);
  });

  scenarioSelect.value = formState.scenarioMode;
  sectorSelect.value = formState.sector;
}

function saveState() {
  try {
    const payload = { ...formState, supports: Array.from(formState.supports) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Silencieusement ignoré si le stockage n’est pas disponible.
  }
}

function getNumericState() {
  const numeric = {};
  NUMERIC_FIELDS.forEach((field) => {
    numeric[field] = toNumber(formState[field]);
  });
  return numeric;
}

function computeConversions(numericState) {
  const tc1 = numericState.visitors > 0 ? clamp(numericState.leads / numericState.visitors, 0, 1) : 0;
  const tc2 = numericState.leads > 0 ? clamp(numericState.quotes / numericState.leads, 0, 1) : 0;
  const tc3 = numericState.quotes > 0 ? clamp(numericState.signatures / numericState.quotes, 0, 1) : 0;
  return { tc1, tc2, tc3 };
}

function validateInputs(numericState, conversions = computeConversions(numericState)) {
  const REALISTIC_RANGES = {
    visitors: [0, 200000],
    leads: [0, 50000],
    quotes: [0, 20000],
    signatures: [0, 10000],
    averageOrder: [0, 200000],
    reExplain: [0, 40],
    adBudget: [0, 200000],
    deltaSign: [0, 100],
    nbSales: [0, 500],
    hourlyRate: [0, 1000],
    tc1: [0, 0.5],
    tc2: [0, 0.9],
    tc3: [0, 0.95]
  };

  const RANGE_LABELS = {
    visitors: 'le volume de visiteurs',
    leads: 'le volume de leads',
    quotes: 'le nombre de devis',
    signatures: 'le nombre de signatures',
    averageOrder: 'le panier moyen',
    reExplain: 'le temps à réexpliquer',
    adBudget: 'le budget publicitaire',
    deltaSign: "l'amélioration visée du taux final",
    nbSales: 'le nombre de commerciaux',
    hourlyRate: 'le taux horaire'
  };

  const RANGE_FORMATTERS = {
    visitors: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)}`,
    leads: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)}`,
    quotes: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)}`,
    signatures: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)}`,
    averageOrder: (min, max) => `${formatCurrency(min)} à ${formatCurrency(max)}`,
    reExplain: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)} h`,
    adBudget: (min, max) => `${formatCurrency(min)} à ${formatCurrency(max)}`,
    deltaSign: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)} pts`,
    nbSales: (min, max) => `${numberFormatter.format(min)} à ${numberFormatter.format(max)}`,
    hourlyRate: (min, max) => `${formatCurrency(min)} à ${formatCurrency(max)}`
  };

  const errors = {};
  Object.keys(fieldElements).forEach((field) => {
    errors[field] = [];
  });

  const coherenceIssues = [];
  const warnings = [];

  for (const field of NUMERIC_FIELDS) {
    const raw = (formState[field] ?? '').toString().trim();
    if (REQUIRED_FIELDS.has(field) && raw === '') {
      errors[field].push('Champ requis pour le diagnostic.');
      continue;
    }
    if (raw === '') {
      continue;
    }

    if (numericState[field] < 0) {
      errors[field].push('Valeur négative impossible.');
    }

    if (INTEGER_FIELDS.has(field) && !Number.isInteger(numericState[field])) {
      errors[field].push('Veuillez saisir un entier.');
    }

    if (field === 'deltaSign' && numericState[field] > 100) {
      errors[field].push('Maximum 100 points de pourcentage.');
    }

    if (REALISTIC_RANGES[field]) {
      const [min, max] = REALISTIC_RANGES[field];
      if (numericState[field] < min || numericState[field] > max) {
        const label = RANGE_LABELS[field] ?? `le champ ${field}`;
        const formatRange = RANGE_FORMATTERS[field] ?? ((minValue, maxValue) => `${numberFormatter.format(minValue)} à ${numberFormatter.format(maxValue)}`);
        errors[field].push(`Valeur irréaliste pour ${label} (plage ${formatRange(min, max)}).`);
      }
    }
  }

  if (numericState.leads > numericState.visitors) {
    errors.leads.push('Ne peut pas dépasser les visiteurs.');
    coherenceIssues.push('L doit être ≤ V');
  }
  if (numericState.quotes > numericState.leads) {
    errors.quotes.push('Ne peut pas dépasser les leads.');
    coherenceIssues.push('D doit être ≤ L');
  }
  if (numericState.signatures > numericState.quotes) {
    errors.signatures.push('Ne peut pas dépasser les devis.');
    coherenceIssues.push('S doit être ≤ D');
  }

  const ratioDenominators = {
    tc1: numericState.visitors,
    tc2: numericState.leads,
    tc3: numericState.quotes
  };

  ['tc1', 'tc2', 'tc3'].forEach((ratio) => {
    const denominator = ratioDenominators[ratio];
    const range = REALISTIC_RANGES[ratio];
    if (!range || !Number.isFinite(denominator) || denominator <= 0) {
      return;
    }
    const [min, max] = range;
    const value = conversions[ratio];
    if (value < min || value > max) {
      warnings.push(`Taux ${STEP_LABELS[ratio]} atypique : ${formatPercent(value)} (plage ${formatPercent(min)} à ${formatPercent(max)}).`);
    }
  });

  return { errors, coherenceIssues, warnings };
}

function renderValidation(validation) {
  Object.entries(validation.errors).forEach(([field, messages]) => {
    const refs = fieldElements[field];
    if (!refs) {
      return;
    }
    const hasError = messages.length > 0;
    if (refs.error) {
      refs.error.textContent = hasError ? messages.join(' ') : '';
    }
    if (refs.wrapper) {
      refs.wrapper.classList.toggle('field--invalid', hasError);
    }
    if (refs.input) {
      refs.input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    }
  });

  Object.entries(summaryBadges).forEach(([field, badge]) => {
    const messages = validation.errors[field] ?? [];
    const isFilled = (formState[field] ?? '').toString().trim() !== '';
    const status = messages.length === 0 && isFilled ? 'ok' : 'warn';
    badge.textContent = badgeLabels[field];
    badge.dataset.state = status;
    badge.classList.toggle('badge--ok', status === 'ok');
    badge.classList.toggle('badge--warn', status === 'warn');
    badge.classList.remove('badge--info');
  });

  const warnings = validation.warnings ?? [];
  if (validation.coherenceIssues.length === 0 && warnings.length === 0) {
    coherenceBadge.textContent = '✅ Données cohérentes.';
    coherenceBadge.className = 'coherence ok';
  } else {
    const issues = [...validation.coherenceIssues, ...warnings];
    const prefix = validation.coherenceIssues.length > 0 ? 'Vérifier vos chiffres' : 'Valeurs à surveiller';
    coherenceBadge.textContent = `⚠️ ${prefix} (${issues.join(' · ')}).`;
    coherenceBadge.className = 'coherence warn';
  }
}

function determineWeakestStep(conversions, numericState) {
  const denominators = {
    tc1: numericState.visitors,
    tc2: numericState.leads,
    tc3: numericState.quotes
  };

  const availableSteps = Object.entries(denominators)
    .filter(([, value]) => value > 0)
    .map(([step]) => step);

  if (availableSteps.length === 0) {
    return { weakestStep: 'tc3', availableSteps: [] };
  }

  let weakestStep = availableSteps[0];
  let weakestValue = conversions[weakestStep];
  availableSteps.forEach((step) => {
    if (conversions[step] < weakestValue) {
      weakestStep = step;
      weakestValue = conversions[step];
    }
  });

  return { weakestStep, availableSteps };
}

function renderFunnel(conversions, numericState) {
  const benchmark = BENCHMARKS[formState.sector] ?? BENCHMARKS[DEFAULT_SECTOR];
  const { weakestStep, availableSteps } = determineWeakestStep(conversions, numericState);
  lastWeakestStep = weakestStep;
  const denominators = {
    tc1: numericState.visitors,
    tc2: numericState.leads,
    tc3: numericState.quotes
  };

  Object.entries(funnelSteps).forEach(([step, refs]) => {
    const percentValue = conversions[step] * 100;
    refs.fill.style.width = `${clamp(percentValue, 0, 100)}%`;
    const hasData = denominators[step] > 0;
    refs.value.textContent = hasData ? formatPercent(conversions[step]) : '—';
    refs.value.classList.remove('good', 'medium', 'low');
    refs.container.classList.remove('weakest');

    const benchmarkValue = benchmark.rates[step];
    let statusClass = 'low';
    if (conversions[step] >= benchmarkValue) {
      statusClass = 'good';
    } else if (conversions[step] >= benchmarkValue * 0.7) {
      statusClass = 'medium';
    }

    if (availableSteps.length > 0 && hasData) {
      refs.value.classList.add(statusClass);
    }
  });

  if (availableSteps.length > 0) {
    funnelSteps[weakestStep].container.classList.add('weakest');
    weakLinkMessage.textContent = `Votre principal point de fuite est ${STEP_LABELS[weakestStep]}.`;
  } else {
    weakLinkMessage.textContent = 'Renseignez vos volumes pour visualiser votre tunnel.';
  }

  const frictionScore = clamp(Math.round((numericState.reExplain / 10) * 100), 0, 100);
  frictionFill.style.width = `${frictionScore}%`;
  frictionValue.textContent = `${frictionScore} / 100`;
}

function projectFlow(numericState, conversions, step, factor) {
  const result = {
    leads: numericState.leads,
    quotes: numericState.quotes,
    signatures: numericState.signatures
  };

  const safeFactor = Math.max(factor, 0);

  if (step === 'tc1') {
    const newLeads = Math.min(numericState.visitors, numericState.leads * safeFactor);
    const newQuotes = newLeads * conversions.tc2;
    const newSignatures = newQuotes * conversions.tc3;
    result.leads = newLeads;
    result.quotes = newQuotes;
    result.signatures = newSignatures;
  } else if (step === 'tc2') {
    const newQuotes = Math.min(numericState.leads, numericState.quotes * safeFactor);
    const newSignatures = newQuotes * conversions.tc3;
    result.quotes = newQuotes;
    result.signatures = newSignatures;
  } else {
    const newSignatures = Math.min(numericState.quotes, numericState.signatures * safeFactor);
    result.signatures = newSignatures;
  }

  return result;
}

function renderChiffrage(numericState, conversions) {
  const scenarioTarget = formState.scenarioMode === 'tc3' ? 'tc3' : lastWeakestStep;
  const caActuel = numericState.signatures * numericState.averageOrder;
  const nbSales = numericState.nbSales > 0 ? numericState.nbSales : 1;
  const hourlyRate = numericState.hourlyRate > 0 ? numericState.hourlyRate : 50;
  const hoursLost = numericState.reExplain * nbSales;
  const costLost = hoursLost * hourlyRate;

  tiles.currentRevenue.textContent = formatCurrency(caActuel);
  tiles.timeLost.textContent = `Heures perdues estimées : ${formatNumber(hoursLost)} h / mois`;
  tiles.timeCost.textContent = `Coût du temps perdu : ${formatCurrency(costLost)}`;

  const flow10 = projectFlow(numericState, conversions, scenarioTarget, 1.1);
  const flow20 = projectFlow(numericState, conversions, scenarioTarget, 1.2);

  const ca10 = flow10.signatures * numericState.averageOrder;
  const ca20 = flow20.signatures * numericState.averageOrder;
  const gain10 = Math.max(0, ca10 - caActuel);
  const gain20 = Math.max(0, ca20 - caActuel);

  tiles.gain10.textContent = formatCurrency(gain10);
  tiles.ca10.textContent = `CA projeté : ${formatCurrency(ca10)}`;
  tiles.gain20.textContent = formatCurrency(gain20);
  tiles.ca20.textContent = `CA projeté : ${formatCurrency(ca20)}`;

  const deltaRaw = (formState.deltaSign ?? '').toString().trim();
  const deltaRatio = numericState.deltaSign / 100;
  if (deltaRaw !== '' && deltaRatio > 0 && numericState.quotes > 0) {
    const newRate = clamp(conversions.tc3 + deltaRatio, 0, 1);
    const customSignatures = numericState.quotes * newRate;
    const customCa = customSignatures * numericState.averageOrder;
    const customGain = Math.max(0, customCa - caActuel);
    tiles.customGain.textContent = formatCurrency(customGain);
    tiles.customCa.textContent = `CA projeté : ${formatCurrency(customCa)}`;
    tiles.customTile.hidden = false;
  } else {
    tiles.customTile.hidden = true;
  }

  if (numericState.adBudget > 0) {
    const roi10 = gain10 > 0 ? (gain10 - numericState.adBudget) / numericState.adBudget : -1;
    const roi20 = gain20 > 0 ? (gain20 - numericState.adBudget) / numericState.adBudget : -1;
    tiles.roi10.textContent = `+10% : ${formatPercent(roi10)}`;
    tiles.roi20.textContent = `+20% : ${formatPercent(roi20)}`;
    tiles.roiTile.hidden = false;
  } else {
    tiles.roiTile.hidden = true;
  }
}

function renderCtaSummary(numericState, conversions) {
  if (!ctaSummary) {
    return;
  }

  ctaSummary.innerHTML = '';

  const hasBaseData = numericState.signatures > 0 && numericState.averageOrder > 0;

  if (!hasBaseData) {
    const fallback = document.createElement('p');
    fallback.className = 'cta-text';
    fallback.textContent = 'Complétez vos signatures et votre panier moyen pour obtenir un récapitulatif personnalisé.';
    ctaSummary.append(fallback);
    return;
  }

  const sentences = [];
  const caActuel = numericState.signatures * numericState.averageOrder;
  const budget = numericState.adBudget;
  const hasBudget = budget > 0;

  if (hasBudget) {
    const perEuro = budget > 0 ? caActuel / budget : 0;
    sentences.push(
      `Actuellement, vous investissez ${formatCurrency(budget)} en publicité chaque mois et vous en récupérez ${formatCurrency(
        caActuel
      )}, soit ${formatNumber(perEuro)} € par euro investi.`
    );
  } else {
    sentences.push(`Actuellement, votre tunnel génère ${formatCurrency(caActuel)} de chiffre d’affaires par mois.`);
  }

  const { weakestStep, availableSteps } = determineWeakestStep(conversions, numericState);
  if (availableSteps.length > 0) {
    const weakestLabel = STEP_LABELS[weakestStep];
    const weakestRate = conversions[weakestStep];
    sentences.push(`Votre principal point de progression concerne ${weakestLabel} avec un taux actuel de ${formatPercent(weakestRate)}.`);
  } else {
    sentences.push('Renseignez vos volumes de tunnel pour identifier le point de progression prioritaire.');
  }

  const scenarioTarget = formState.scenarioMode === 'tc3' ? 'tc3' : lastWeakestStep;
  const flow10 = projectFlow(numericState, conversions, scenarioTarget, 1.1);
  const ca10 = flow10.signatures * numericState.averageOrder;
  const gain10 = Math.max(0, ca10 - caActuel);

  if (gain10 > 0) {
    if (hasBudget) {
      const extraPerEuro = gain10 / budget;
      sentences.push(
        `En optimisant vos conversions de 10 %, chaque euro investi pourrait générer ${formatNumber(extraPerEuro)} € supplémentaires, soit ${formatCurrency(gain10)} par mois.`
      );
    } else {
      sentences.push(`En optimisant vos conversions de 10 %, vous pourriez ajouter ${formatCurrency(gain10)} de chiffre d’affaires mensuel.`);
    }
  } else if (availableSteps.length > 0) {
    sentences.push(
      `Avec une amélioration de 10 % sur ${STEP_LABELS[scenarioTarget]}, votre chiffre d’affaires resterait stable faute de volume suffisant. Ajustez vos données pour affiner le calcul.`
    );
  } else {
    sentences.push('Complétez l’ensemble des volumes du tunnel pour projeter le gain d’une optimisation de 10 %.');
  }

  sentences.forEach((text) => {
    const paragraph = document.createElement('p');
    paragraph.className = 'cta-text';
    paragraph.textContent = text;
    ctaSummary.append(paragraph);
  });
}

function renderBenchmark(numericState, conversions) {
  const benchmark = BENCHMARKS[formState.sector] ?? BENCHMARKS[DEFAULT_SECTOR];
  const weights = { tc1: 0.35, tc2: 0.25, tc3: 0.4 };

  let globalScore = 0;

  ['tc1', 'tc2', 'tc3'].forEach((step) => {
    const cells = benchmarkCells[step];
    const benchValue = benchmark.rates[step];
    const actual = conversions[step];
    const denominator = step === 'tc1' ? numericState.visitors : step === 'tc2' ? numericState.leads : numericState.quotes;
    const hasData = denominator > 0;

    cells.benchmark.textContent = formatPercent(benchValue);
    cells.actual.textContent = hasData ? formatPercent(actual) : '—';

    let verdict = '↓ En dessous – priorité';
    let verdictClass = 'verdict-down';
    if (!hasData) {
      verdict = 'Données manquantes';
      verdictClass = 'verdict-mid';
    } else if (actual >= benchValue) {
      verdict = '↑ Au-dessus de la moyenne';
      verdictClass = 'verdict-up';
    } else if (actual >= benchValue * 0.7) {
      verdict = '→ Légèrement en dessous';
      verdictClass = 'verdict-mid';
    }
    cells.verdict.textContent = verdict;
    cells.verdict.classList.remove('verdict-up', 'verdict-mid', 'verdict-down');
    cells.verdict.classList.add(verdictClass);

    const score = hasData ? clamp(Math.round((actual / benchValue) * 50), 0, 100) : 0;
    globalScore += score * weights[step];
  });

  const lBenchmark = numericState.visitors * benchmark.rates.tc1;
  const dBenchmark = lBenchmark * benchmark.rates.tc2;
  const sBenchmark = dBenchmark * benchmark.rates.tc3;
  const caBenchmark = sBenchmark * numericState.averageOrder;
  const caActuel = numericState.signatures * numericState.averageOrder;
  const lost = Math.max(0, caBenchmark - caActuel);

  benchmarkSummary.globalScore.textContent = Math.round(globalScore).toString();
  benchmarkSummary.benchmarkRevenue.textContent = formatCurrency(caBenchmark);
  benchmarkSummary.lostRevenue.textContent = formatCurrency(lost);
}

function renderRecommendations(numericState, conversions) {
  const hasEnoughData =
    numericState.visitors > 0 &&
    numericState.leads > 0 &&
    numericState.quotes > 0 &&
    numericState.signatures > 0 &&
    numericState.averageOrder > 0;

  if (!hasEnoughData) {
    recoList.innerHTML = '';
    const empty = document.createElement('li');
    empty.className = 'reco-empty';
    empty.textContent = 'Complétez vos volumes et votre panier moyen pour générer un plan d’action.';
    recoList.append(empty);
    return;
  }

  const supports = new Set(formState.supports ?? []);
  const actions = new Map();

  const candidates = [];
  RECOMMENDATIONS[lastWeakestStep].forEach((item) => candidates.push({ ...item }));
  if (numericState.reExplain >= 5) {
    RECOMMENDATIONS.friction.forEach((item) => candidates.push({ ...item }));
  }

  candidates.forEach((item) => {
    if (actions.has(item.id)) {
      return;
    }
    const easeBoost = item.boostSupports && item.boostSupports.some((support) => supports.has(support)) ? 1 : 0;
    const easeScore = clamp(item.ease + easeBoost, 1, 5);
    const score = item.impact * 0.7 + easeScore * 0.3;
    actions.set(item.id, { ...item, easeScore, score });
  });

  const sorted = Array.from(actions.values()).sort((a, b) => b.score - a.score).slice(0, 3);

  recoList.innerHTML = '';
  sorted.forEach((action) => {
    const li = document.createElement('li');
    const title = document.createElement('h3');
    title.className = 'reco-title';
    title.textContent = action.title;

    const objective = document.createElement('p');
    objective.className = 'reco-objective';
    objective.textContent = action.objective;

    const steps = document.createElement('ul');
    steps.className = 'reco-steps';
    action.steps.forEach((step) => {
      const liStep = document.createElement('li');
      liStep.textContent = step;
      steps.append(liStep);
    });

    const meta = document.createElement('div');
    meta.className = 'reco-meta';
    const impact = document.createElement('span');
    impact.textContent = `Impact : ${action.impact}/5`;
    const ease = document.createElement('span');
    ease.textContent = `Facilité : ${action.easeScore}/5`;
    const effort = document.createElement('span');
    effort.textContent = `Effort : ${action.effort}`;
    const duration = document.createElement('span');
    duration.textContent = `Délai : ${action.duration}`;
    meta.append(impact, ease, effort, duration);

    li.append(title, objective, steps, meta);
    recoList.append(li);
  });
}

function computeAndRender() {
  const numericState = getNumericState();
  const conversions = computeConversions(numericState);
  const validation = validateInputs(numericState, conversions);

  renderValidation(validation);
  renderFunnel(conversions, numericState);
  renderChiffrage(numericState, conversions);
  renderCtaSummary(numericState, conversions);
  renderBenchmark(numericState, conversions);
  renderRecommendations(numericState, conversions);
  saveState();
}

function bindEvents() {
  Object.entries(fieldElements).forEach(([name, refs]) => {
    if (!refs.input) {
      return;
    }
    refs.input.addEventListener('input', (event) => {
      formState[name] = event.target.value;
      computeAndRender();
    });
  });

  supportsInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const selected = supportsInputs.filter((item) => item.checked).map((item) => item.value);
      formState.supports = selected;
      computeAndRender();
    });
  });

  scenarioSelect.addEventListener('change', (event) => {
    formState.scenarioMode = event.target.value;
    computeAndRender();
  });

  sectorSelect.addEventListener('change', (event) => {
    formState.sector = event.target.value;
    computeAndRender();
  });

  exportButton.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('tunnel-form').addEventListener('submit', (event) => {
    event.preventDefault();
  });
}

loadStateFromStorage();
applyQueryParams();
syncFormWithState();
bindEvents();
computeAndRender();
