# Géo Quiz 🌍

Jeu de géographie interactif — identifiez les pays du monde en cliquant sur la carte.

## Fonctionnalités

### Mode Jeu
- Carte monde interactive avec zoom (molette) et panoramique (clic-glisser)
- Chronomètre de 5 secondes par question avec jauge visuelle
- Score dynamique : jusqu'à 1000 pts pour une réponse instantanée, minimum 100 pts
- 3 vies par partie
- Bouton ⏱ pour désactiver le chrono (score fixe 100 pts)

### Mode Apprentissage
- Liste des pays triable par nom, population ou superficie
- Clic sur un pays (carte ou liste) : affiche la capitale et la population
- Numérotation des lignes pour connaître le nombre de pays par région

### Niveaux
- Monde entier
- Europe
- Union Européenne
- Afrique
- Asie
- Amérique
- Océanie

### Thèmes
- Sombre
- Coloré
- Carte au trésor
- Multicolore

## Démo en ligne

👉 [https://yan-circus.github.io/ludoedu-geo-testing/](https://yan-circus.github.io/ludoedu-geo-testing/)

## Lancement en local

Aucune dépendance externe. Il suffit d'un serveur HTTP statique :

```bash
python3 -m http.server 8080
```

Puis ouvrir [http://localhost:8080](http://localhost:8080) dans un navigateur.

## Structure

```
├── index.html       — Interface
├── game.js          — Logique du jeu
├── style.css        — Styles et thèmes
├── countries.json   — Données pays (nom, capitale, population, superficie, continent, UE)
└── world.svg        — Carte monde SVG
```
