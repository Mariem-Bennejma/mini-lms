# MiniLMS : plateforme de cours en ligne

Mini projet Web (sujet 8), ISSAT Sousse, Diplôme National d'Ingénieur en Génie Logiciel.
Réalisé par Mariem Ben Nejma et Balsem Ben Said. Professeur : Mr. Sofiene Ben Ahmed.

**Démo :** https://mariem-bennejma.github.io/mini-lms/

## Description
MiniLMS est un mini LMS en HTML5, CSS3 et JavaScript « vanilla », sans serveur ni
base de données. Il propose 3 cours (HTML, CSS, JavaScript) de 3 leçons chacun.

## Fonctionnalités
**Obligatoires**
- Navigation entre les cours sans rechargement (SPA, routeur sur le `#`)
- Suivi de progression dynamique (pourcentage, checklist, compteur global)
- Sauvegarde automatique de la position dans les cours (`localStorage`)
- Quiz interactif avec correction immédiate et score

**Bonus**
- Lecteur vidéo (API YouTube IFrame) avec marqueurs de progression 25/50/75/90 %
- Interface d'administration : ajout et suppression de cours

## Lancer le projet
Ouvrir le dossier avec VS Code et lancer **Live Server** sur `index.html`
(un serveur local est nécessaire pour le lecteur vidéo).

## Structure
- `index.html` : page unique de l'application
- `css/` : `main.css` (commun), `course.css` (cours), `app.css` (quiz, vidéo, admin)
- `js/` : `data.js` (cours et quiz), `script.js` (application), `script-pages.js` (pages de la 1re étape)
- `pages/` : pages de cours de la première étape (conservées)

## Bibliothèque externe
API YouTube IFrame (lecteur vidéo). Aucune autre bibliothèque.
