# Simulateur d’opportunités

## Aperçu

Ce projet fournit un audit express du tunnel commercial B2B. L’interface recueille les volumes clés (visiteurs, leads, devis,
signatures), calcule automatiquement les taux de conversion, chiffre les gains potentiels et génère un plan d’action priorisé.
Tous les calculs s’exécutent dans le navigateur ; aucune donnée n’est transmise côté serveur.

## Fonctionnalités principales

1. **Questionnaire guidé**
   - Champs numériques avec validations instantanées (valeurs ≥ 0, cohérence V ≥ L ≥ D ≥ S).
   - Aides contextuelles, badges ✅ / ⚠️ et surlignage automatique des incohérences.
   - Prise en compte des supports marketing existants, du budget pub, du temps passé à réexpliquer, etc.
   - Persistance `localStorage` + préremplissage via paramètres d’URL (`?V=...&L=...`).

2. **Diagnostic visuel du tunnel**
   - Entonnoir interactif avec mise en évidence du maillon faible et comparaison aux benchmarks sectoriels.
   - Indice de friction “explication” normalisé sur 0–100.

3. **Chiffrage des gains & pertes**
   - Scénarios +10 % / +20 % sur l’étape limitante ou sur le closing final (sélecteur utilisateur).
   - Calcul du CA actuel, gains potentiels, ROI publicitaire (si budget renseigné) et objectif custom basé sur ΔCsign.
   - Estimation du temps perdu et de son coût (avec paramètres commerciaux optionnels).

4. **Benchmarking paramétrable**
   - Comparaison aux moyennes fictives par secteur (JSON local), scoring pondéré et estimation du manque à gagner.

5. **Plan d’action priorisé**
   - Génération de 3 recommandations maximum selon l’étape critique et les frictions internes.
   - Impact, facilité, effort et délai estimés, avec prise en compte des supports déjà disponibles.

6. **Call-to-action & export**
   - Bouton « Prendre RDV » prérempli avec les paramètres de l’audit.
   - Export PDF via `window.print()` et mention explicite sur la confidentialité (« Les données restent sur votre appareil »).

## Organisation du projet

```
.
├── index.html              # Structure de la page et sections fonctionnelles
├── assets/
│   ├── css/
│   │   └── app.css         # Layout et composants (consomme design/charte.css)
│   └── js/
│       └── simulator.js    # Logique métier : validations, calculs, recommandations
└── design/
    └── charte.css          # Charte graphique (tokens couleurs/typos + variantes dark)
```

## Utilisation

Aucun build n’est nécessaire. Ouvrez `index.html` dans un navigateur moderne pour lancer l’audit. Les données sont conservées
localement (et peuvent être exportées via la fonction d’impression du navigateur).
