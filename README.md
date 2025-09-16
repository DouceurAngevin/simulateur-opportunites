# Simulateur d’opportunités

## État des lieux actuel

- **Type d’outil :** simulateur statique côté client permettant d’estimer l’impact d’une amélioration du taux de conversion e-commerce.
- **Données manipulées :** trafic qualifié mensuel, taux de conversion actuel, panier moyen, amélioration visée et budget publicitaire.
- **Résultats restitués :** CA actuel, gains potentiels, CA projeté et ROI indicatif.
- **Technologies** : HTML/CSS/JavaScript natifs, aucune dépendance externe, fonctionnement hors-ligne possible.

## Organisation structurée du projet

```
.
├── index.html              # Structure de la page et points d’ancrage pour les composants
├── assets/
│   ├── css/
│   │   └── app.css         # Styles d’interface consommant la charte graphique
│   └── js/
│       └── simulator.js    # Logique de calcul (séparable pour d’autres frontends)
└── design/
    └── charte.css          # Charte graphique indépendante (couleurs, typos, espacements)
```

- Le HTML se limite au markup sémantique (sections, formulaires, KPI) et charge les ressources statiques.
- Le JavaScript encapsule la logique métier dans `compute()` et expose uniquement un listener sur le bouton « Calculer ».
- La charte graphique est isolée dans `design/charte.css`. Les styles applicatifs de `assets/css/app.css` ne manipulent que des variables définies dans la charte, ce qui facilite le remplacement du thème ou le branchement de styles alternatifs.

## Pistes d’évolution

1. **Validation en direct** : afficher des messages lorsque des champs sont vides ou incohérents.
2. **Persistances des valeurs** : stocker les entrées utilisateur dans `localStorage` pour retrouver la dernière simulation.
3. **Export / partage** : générer un résumé PDF ou un lien partageable avec les paramètres saisis.
4. **Intégration Notion / iframe** : grâce à la séparation logique/charte, réutiliser `simulator.js` dans d’autres environnements.

## Utilisation

Ouvrir simplement `index.html` dans un navigateur moderne. Aucun build ni serveur n’est requis.
