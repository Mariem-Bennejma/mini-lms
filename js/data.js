"use strict";

/* ============================================================
   Données par défaut de MiniLMS : cours, leçons, vidéos et quiz.
   Les cours ajoutés depuis la page Administration sont stockés
   à part dans le localStorage (voir script.js).
   ============================================================ */

const COURS_PAR_DEFAUT = [
    {
        id: "html",
        module: 1,
        titre: "Les bases du HTML",
        sousTitre: "Apprenez à structurer une page web.",
        description: "Structure d'une page, balises sémantiques, liens, images et listes.",
        banniere: "HTML",
        couleur: "orange",
        duree: "environ 30 min",
        lecons: [
            {
                id: "l1",
                titre: "Structure d'une page",
                html: `
                <p>Toute page HTML commence par une déclaration de type de document, puis un élément <code>html</code> qui contient deux parties : <code>head</code> (informations sur la page) et <code>body</code> (contenu visible).</p>
                <svg class="schema" viewBox="0 0 300 140" role="img" aria-labelledby="svg-titre">
                    <title id="svg-titre">Arbre d'un document HTML : html contient head et body</title>
                    <line x1="150" y1="40" x2="70" y2="90" stroke="#14123a" stroke-width="2.5"/>
                    <line x1="150" y1="40" x2="230" y2="90" stroke="#14123a" stroke-width="2.5"/>
                    <rect x="110" y="10" width="80" height="30" rx="8" fill="#4f46e5" stroke="#14123a" stroke-width="2.5"/>
                    <text x="150" y="30" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700" font-family="monospace">html</text>
                    <rect x="30" y="90" width="80" height="30" rx="8" fill="#ffd23f" stroke="#14123a" stroke-width="2.5"/>
                    <text x="70" y="110" text-anchor="middle" fill="#14123a" font-size="14" font-weight="700" font-family="monospace">head</text>
                    <rect x="190" y="90" width="80" height="30" rx="8" fill="#06b6d4" stroke="#14123a" stroke-width="2.5"/>
                    <text x="230" y="110" text-anchor="middle" fill="#14123a" font-size="14" font-weight="700" font-family="monospace">body</text>
                </svg>
                <pre data-lang="HTML"><code>&lt;!DOCTYPE html&gt;
&lt;html lang="fr"&gt;
&lt;head&gt;
    &lt;meta charset="UTF-8"&gt;
    &lt;title&gt;Ma première page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Bonjour&lt;/h1&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre>`
            },
            {
                id: "l2",
                titre: "Balises sémantiques",
                html: `
                <p>Les balises sémantiques décrivent le rôle de chaque zone : <code>header</code> pour l'en-tête, <code>nav</code> pour la navigation, <code>main</code> pour le contenu principal, <code>section</code> et <code>article</code> pour organiser le contenu, <code>footer</code> pour le pied de page. Elles améliorent l'accessibilité et le référencement.</p>
                <pre data-lang="HTML"><code>&lt;header&gt;
    &lt;nav&gt;...&lt;/nav&gt;
&lt;/header&gt;
&lt;main&gt;
    &lt;section&gt;
        &lt;h2&gt;Titre de section&lt;/h2&gt;
    &lt;/section&gt;
&lt;/main&gt;
&lt;footer&gt;...&lt;/footer&gt;</code></pre>`
            },
            {
                id: "l3",
                titre: "Liens, images et listes",
                video: "it1rTvBcfRg",
                html: `
                <p>Un lien utilise <code>a</code> avec l'attribut <code>href</code>. Une image utilise <code>img</code> avec <code>src</code> et un texte alternatif <code>alt</code> obligatoire. Les listes se font avec <code>ul</code> (à puces) ou <code>ol</code> (numérotée).</p>
                <pre data-lang="HTML"><code>&lt;a href="https://www.w3.org"&gt;Site du W3C&lt;/a&gt;
&lt;img src="logo.png" alt="Logo du site"&gt;
&lt;ul&gt;
    &lt;li&gt;Premier élément&lt;/li&gt;
    &lt;li&gt;Deuxième élément&lt;/li&gt;
&lt;/ul&gt;</code></pre>`
            }
        ],
        quiz: [
            {
                question: "Quelle balise contient le contenu visible de la page ?",
                options: ["head", "body", "title", "meta"],
                bonne: 1,
                explication: "body contient tout ce que l'utilisateur voit. head contient seulement des informations sur la page."
            },
            {
                question: "Quel attribut donne un texte alternatif à une image ?",
                options: ["title", "href", "alt", "name"],
                bonne: 2,
                explication: "alt décrit l'image pour les lecteurs d'écran et s'affiche si l'image ne charge pas."
            },
            {
                question: "Quelle balise sémantique sert à regrouper les liens de navigation ?",
                options: ["nav", "section", "footer", "article"],
                bonne: 0,
                explication: "nav indique au navigateur et aux lecteurs d'écran que ce bloc contient la navigation principale."
            }
        ]
    },
    {
        id: "css",
        module: 2,
        titre: "Mettre en forme avec CSS",
        sousTitre: "Donnez du style et de la structure à vos pages.",
        description: "Sélecteurs, couleurs, Flexbox, Grid et design responsive.",
        banniere: "CSS",
        couleur: "blue",
        duree: "environ 40 min",
        lecons: [
            {
                id: "l1",
                titre: "Sélecteurs et couleurs",
                html: `
                <p>Une règle CSS cible des éléments avec un sélecteur (balise, classe <code>.carte</code> ou identifiant <code>#menu</code>) puis applique des propriétés.</p>
                <pre data-lang="CSS"><code>h1 { color: #4f46e5; }
.carte { background: white; border-radius: 14px; }
#menu { display: none; }</code></pre>`
            },
            {
                id: "l2",
                titre: "Flexbox",
                html: `
                <p>Flexbox aligne des éléments sur un axe (ligne ou colonne). Avec <code>display: flex</code> sur le parent, on contrôle l'alignement avec <code>justify-content</code> et <code>align-items</code>.</p>
                <pre data-lang="CSS"><code>.menu ul {
  display: flex;
  justify-content: space-between;
  align-items: center;
}</code></pre>`
            },
            {
                id: "l3",
                titre: "Grid et responsive",
                video: "AGDDdsiZ0Ko",
                html: `
                <p>Grid organise des éléments en lignes et colonnes. Les media queries adaptent la mise en page à la taille de l'écran.</p>
                <pre data-lang="CSS"><code>.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .burger { display: none; }
}</code></pre>`
            }
        ],
        quiz: [
            {
                question: "Quelle déclaration active Flexbox sur un conteneur ?",
                options: ["display: flex", "position: flex", "float: flex", "align: flex"],
                bonne: 0,
                explication: "On écrit display: flex sur le parent. Ses enfants deviennent des éléments flexibles."
            },
            {
                question: "Quel sélecteur cible les éléments ayant la classe « carte » ?",
                options: ["#carte", ".carte", "carte", "*carte"],
                bonne: 1,
                explication: "Le point sélectionne une classe. Le dièse (#) sélectionne un identifiant."
            },
            {
                question: "À quoi sert une media query ?",
                options: [
                    "À charger une police externe",
                    "À animer un élément",
                    "À adapter le style à la taille de l'écran",
                    "À importer un autre fichier CSS"
                ],
                bonne: 2,
                explication: "Une media query applique des règles seulement si la condition est vraie, par exemple min-width: 768px."
            }
        ]
    },
    {
        id: "js",
        module: 3,
        titre: "Initiation à JavaScript",
        sousTitre: "Rendez vos pages interactives.",
        description: "Variables, fonctions, manipulation du DOM et événements.",
        banniere: "JS",
        couleur: "yellow",
        duree: "environ 40 min",
        lecons: [
            {
                id: "l1",
                titre: "Variables et types",
                html: `
                <p>On déclare une variable avec <code>let</code> (modifiable) ou <code>const</code> (constante). Les types de base sont les chaînes, les nombres et les booléens.</p>
                <pre data-lang="JavaScript"><code>let nom = "Sara";
const age = 20;
let inscrit = true;</code></pre>`
            },
            {
                id: "l2",
                titre: "Fonctions",
                html: `
                <p>Une fonction regroupe des instructions réutilisables. La syntaxe fléchée est la plus courte.</p>
                <pre data-lang="JavaScript"><code>const somme = (a, b) =&gt; a + b;
console.log(somme(2, 3)); // 5</code></pre>`
            },
            {
                id: "l3",
                titre: "DOM et événements",
                video: "zofMnllkVfI",
                html: `
                <p>Le DOM représente la page. On sélectionne un élément avec <code>querySelector</code> et on réagit à une action avec <code>addEventListener</code>.</p>
                <pre data-lang="JavaScript"><code>const bouton = document.querySelector("button");
bouton.addEventListener("click", () =&gt; {
  bouton.textContent = "Cliqué !";
});</code></pre>`
            }
        ],
        quiz: [
            {
                question: "Quel mot-clé déclare une variable qui ne sera pas réassignée ?",
                options: ["var", "let", "const", "def"],
                bonne: 2,
                explication: "const crée une constante : on ne peut pas lui affecter une nouvelle valeur."
            },
            {
                question: "Que renvoie somme(2, 3) avec const somme = (a, b) => a + b ?",
                options: ["23", "5", "undefined", "Une erreur"],
                bonne: 1,
                explication: "La fonction fléchée retourne directement a + b, donc 2 + 3 = 5."
            },
            {
                question: "Quelle méthode permet de réagir à un clic sur un élément ?",
                options: ["onClickElement()", "listen('click')", "addEventListener('click', ...)", "element.click = true"],
                bonne: 2,
                explication: "addEventListener associe une fonction à un événement (click, input, submit...)."
            }
        ]
    }
];