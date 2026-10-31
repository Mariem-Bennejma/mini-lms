"use strict";

/* ============================================================
   MiniLMS : application monopage (SPA simplifiée)
   - Navigation entre les vues sans rechargement (routeur sur le #)
   - Progression dynamique (pourcentage + checklist des leçons)
   - Sauvegarde automatique de la position (leçon, vidéo, quiz)
   - Quiz interactif avec validation immédiate
   - Bonus : lecteur vidéo avec marqueurs, administration des cours
   ============================================================ */

/* ---------- Clés du localStorage ---------- */
const CLES = {
    progression: "minilms-progression",
    position: "minilms-position",
    quiz: "minilms-quiz",
    quizEtat: "minilms-quiz-etat",
    video: "minilms-video",
    admin: "minilms-admin"
};

const Stockage = {
    lire(cle, defaut) {
        try {
            const valeur = JSON.parse(localStorage.getItem(cle));
            return valeur === null || valeur === undefined ? defaut : valeur;
        } catch (e) {
            return defaut;
        }
    },
    ecrire(cle, valeur) {
        try { localStorage.setItem(cle, JSON.stringify(valeur)); }
        catch (e) { /* stockage indisponible : on ignore */ }
    },
    supprimer(cle) {
        try { localStorage.removeItem(cle); } catch (e) { /* ignore */ }
    }
};

/* ---------- Utilitaires ---------- */
const app = document.getElementById("app");
let nettoyages = []; /* fonctions à exécuter quand on quitte une vue */

const esc = (texte) => String(texte).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

const pourcent = (n, total) => (total ? Math.round((n / total) * 100) : 0);

const formatTemps = (secondes) => {
    const s = Math.max(0, Math.floor(secondes || 0));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
};

const melanger = (tableau) => {
    const copie = tableau.slice();
    for (let i = copie.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
};

let minuteurToast = null;
const afficherToast = (message) => {
    const toast = document.getElementById("toast");
    if (!toast) { return; }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(minuteurToast);
    minuteurToast = setTimeout(() => toast.classList.remove("show"), 3200);
};

/* ---------- Cours (par défaut + ajoutés dans l'administration) ---------- */
const lireAdmin = () => {
    const a = Stockage.lire(CLES.admin, {});
    return {
        ajoutes: Array.isArray(a.ajoutes) ? a.ajoutes : [],
        supprimes: Array.isArray(a.supprimes) ? a.supprimes : []
    };
};

const tousLesCours = () => {
    const admin = lireAdmin();
    const defaut = COURS_PAR_DEFAUT.filter((c) => !admin.supprimes.includes(c.id));
    return [...defaut, ...admin.ajoutes].map((c, i) => ({ ...c, module: i + 1 }));
};

const trouverCours = (id) => tousLesCours().find((c) => c.id === id);

/* ---------- Progression des leçons ---------- */
const leconsFaites = (cours) => {
    const liste = Stockage.lire(CLES.progression, {})[cours.id];
    return Array.isArray(liste) ? liste.filter((id) => cours.lecons.some((l) => l.id === id)) : [];
};

/* valeur : true, false, ou undefined pour inverser */
const marquerLecon = (cours, leconId, valeur) => {
    const donnees = Stockage.lire(CLES.progression, {});
    const liste = Array.isArray(donnees[cours.id]) ? donnees[cours.id] : [];
    const present = liste.includes(leconId);
    const voulu = valeur === undefined ? !present : valeur;
    if (voulu && !present) { liste.push(leconId); }
    if (!voulu && present) { liste.splice(liste.indexOf(leconId), 1); }
    donnees[cours.id] = liste;
    Stockage.ecrire(CLES.progression, donnees);
    return voulu;
};

/* ---------- Position sauvegardée (leçon en cours de lecture) ---------- */
const lirePosition = () => {
    const p = Stockage.lire(CLES.position, {});
    return { cours: p.cours || {}, dernier: p.dernier || null };
};

const sauverPosition = (coursId, leconId) => {
    const p = lirePosition();
    p.cours[coursId] = leconId;
    p.dernier = { cours: coursId, lecon: leconId };
    Stockage.ecrire(CLES.position, p);
};

/* ---------- Scores de quiz ---------- */
const lireScores = () => Stockage.lire(CLES.quiz, {});

const lireEtatQuiz = (cours) => {
    const e = Stockage.lire(CLES.quizEtat, {})[cours.id];
    const choix = e && Array.isArray(e.choix) ? e.choix : [];
    const i = e && Number.isInteger(e.i) ? Math.min(Math.max(e.i, 0), cours.quiz.length) : 0;
    return { i, choix };
};

const ecrireEtatQuiz = (cours, etat) => {
    const tous = Stockage.lire(CLES.quizEtat, {});
    tous[cours.id] = etat;
    Stockage.ecrire(CLES.quizEtat, tous);
};

const scoreQuiz = (cours, etat) =>
    cours.quiz.filter((q, i) => etat.choix[i] === q.bonne).length;

/* ============================================================
   VUE : ACCUEIL
   ============================================================ */
const COULEURS = ["orange", "blue", "yellow", "pink", "green", "accent"];

const vueAccueil = () => {
    const cours = tousLesCours();
    const total = cours.reduce((s, c) => s + c.lecons.length, 0);
    const faites = cours.reduce((s, c) => s + leconsFaites(c).length, 0);
    const pct = pourcent(faites, total);
    const scores = lireScores();

    /* Carte "reprendre là où vous étiez" */
    let reprise = "";
    const dernier = lirePosition().dernier;
    const coursReprise = dernier && trouverCours(dernier.cours);
    if (coursReprise) {
        const index = coursReprise.lecons.findIndex((l) => l.id === dernier.lecon);
        if (index !== -1) {
            reprise = `
            <section class="resume" aria-label="Reprendre votre lecture">
                <div class="container resume-inner">
                    <p><strong>Reprendre où vous étiez</strong><br>
                    ${esc(coursReprise.titre)} · Leçon ${index + 1} : ${esc(coursReprise.lecons[index].titre)}</p>
                    <a class="btn btn-primary" href="#/cours/${esc(coursReprise.id)}">Reprendre</a>
                </div>
            </section>`;
        }
    }

    const cartes = cours.map((c) => {
        const n = leconsFaites(c).length;
        const p = pourcent(n, c.lecons.length);
        const s = scores[c.id];
        const libelleBtn = n === 0 ? "Commencer" : (n === c.lecons.length ? "Revoir" : "Continuer");
        const badge = c.quiz.length
            ? `<p class="quiz-badge">${s ? "Quiz : meilleur score " + s.meilleur + " / " + s.total : "Quiz non tenté"}</p>`
            : "";
        const boutonQuiz = c.quiz.length
            ? `<a class="btn btn-light" href="#/quiz/${esc(c.id)}">Quiz</a>`
            : "";
        return `
        <article class="card" style="--course: var(--${esc(c.couleur)})">
            <div class="card-banner" aria-hidden="true">${esc(c.banniere)}</div>
            <div class="card-body">
                <h3>${esc(c.titre)}</h3>
                <p>${esc(c.description)}</p>
                <p class="meta">${c.lecons.length} leçon${c.lecons.length > 1 ? "s" : ""}${c.duree ? " · " + esc(c.duree) : ""}</p>
                <div class="progress" role="progressbar" aria-label="Progression du cours ${esc(c.titre)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}">
                    <div class="progress-bar" style="width:${p}%"></div>
                </div>
                <p class="progress-label">${p} % complété</p>
                ${badge}
                <div class="card-actions">
                    <a class="btn" href="#/cours/${esc(c.id)}">${libelleBtn}</a>
                    ${boutonQuiz}
                </div>
            </div>
        </article>`;
    }).join("");

    const premier = cours[0];
    return `
    <section class="hero" id="accueil">
        <span class="shape shape-circle" aria-hidden="true"></span>
        <span class="shape shape-tri" aria-hidden="true"></span>
        <span class="shape shape-ring" aria-hidden="true"></span>
        <div class="container hero-grid">
            <div class="hero-text">
                <p class="eyebrow">Mini projet web · FIA3</p>
                <h1>Apprenez le web, <mark>un module à la fois</mark></h1>
                <p class="lead">MiniLMS est une mini plateforme de cours en ligne. Suivez les leçons, regardez les vidéos, passez les quiz et visualisez votre progression.</p>
                <div class="hero-actions">
                    <a class="btn btn-primary" href="#cours">Voir les cours</a>
                    ${premier ? `<a class="btn" href="#/cours/${esc(premier.id)}">Commencer : ${esc(premier.banniere)}</a>` : ""}
                </div>
            </div>
            <aside class="summary" aria-label="Votre progression globale">
                <p class="summary-title">Votre progression</p>
                <p class="summary-count"><span id="overall-count">${faites}</span> <span class="summary-total">/ ${total} leçons</span></p>
                <div class="progress" role="progressbar" aria-label="Progression globale" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
                    <div class="progress-bar" id="overall-bar" style="width:${pct}%"></div>
                </div>
                <p class="summary-note">Enregistrée automatiquement dans votre navigateur.</p>
            </aside>
        </div>
    </section>
    ${reprise}
    <section class="section" id="cours">
        <div class="container">
            <h2>Nos cours</h2>
            <p class="section-intro">Choisissez un module, marquez chaque leçon comme terminée puis testez-vous avec le quiz.</p>
            ${cours.length ? `<div class="grid">${cartes}</div>` : `<p class="empty">Aucun cours pour le moment. Ajoutez-en un depuis l'<a href="#/admin">administration</a>.</p>`}
        </div>
    </section>
    <section class="section section-alt" id="apropos">
        <div class="container">
            <h2>À propos de la plateforme</h2>
            <p class="section-intro">Un mini LMS réalisé dans le cadre du mini projet web FIA3.</p>
            <div class="features">
                <div class="feature">
                    <h3>Contenus variés</h3>
                    <p>Texte, schémas, extraits de code, vidéos avec marqueurs et quiz dans chaque module.</p>
                </div>
                <div class="feature">
                    <h3>Progression sauvegardée</h3>
                    <p>Votre avancement, votre position dans le cours et vos scores sont conservés dans votre navigateur.</p>
                </div>
                <div class="feature">
                    <h3>Responsive</h3>
                    <p>Une interface adaptée au mobile, à la tablette et au bureau.</p>
                </div>
            </div>
        </div>
    </section>`;
};

/* ============================================================
   VUE : COURS
   ============================================================ */
const blocVideo = (cours, lecon) => `
    <p class="video-title">Vidéo de révision</p>
    <div class="video-player" data-video="${esc(lecon.video)}" data-lecon="${esc(lecon.id)}">
        <div class="video"><div class="yt-slot"></div></div>
        <div class="video-track" aria-label="Progression de la vidéo">
            <div class="video-fill"></div>
            <button class="video-marker" type="button" data-pct="25" style="left:25%" aria-label="Aller à 25 % de la vidéo"><span>25 %</span></button>
            <button class="video-marker" type="button" data-pct="50" style="left:50%" aria-label="Aller à 50 % de la vidéo"><span>50 %</span></button>
            <button class="video-marker" type="button" data-pct="75" style="left:75%" aria-label="Aller à 75 % de la vidéo"><span>75 %</span></button>
            <button class="video-marker marker-end" type="button" data-pct="90" style="left:90%" aria-label="Aller à 90 % de la vidéo (leçon validée)"><span>Validée</span></button>
        </div>
        <div class="video-meta">
            <span class="video-time">0:00 / 0:00</span>
            <span class="video-seen">Vu : 0 %</span>
            <button class="video-resume" type="button" hidden>Reprendre</button>
        </div>
        <p class="video-info"></p>
    </div>`;

const vueCours = (cours) => {
    const faites = leconsFaites(cours);
    const pct = pourcent(faites.length, cours.lecons.length);
    const scores = lireScores();
    const s = scores[cours.id];
    const position = lirePosition().cours[cours.id];
    const indexReprise = cours.lecons.findIndex((l) => l.id === position);

    const liste = tousLesCours();
    const index = liste.findIndex((c) => c.id === cours.id);
    const precedent = liste[index - 1];
    const suivant = liste[index + 1];

    const toc = cours.lecons.map((l) => `
        <li data-toc="${esc(l.id)}" class="${faites.includes(l.id) ? "is-done" : ""}">
            <a href="#/cours/${esc(cours.id)}" data-goto="${esc(l.id)}">${esc(l.titre)}</a>
        </li>`).join("");

    const lecons = cours.lecons.map((l, i) => `
        <section class="lesson" id="lecon-${esc(l.id)}" data-lecon="${esc(l.id)}">
            <p class="lesson-kicker">Leçon ${i + 1}</p>
            <h2>${esc(l.titre)}</h2>
            ${l.html}
            ${l.video ? blocVideo(cours, l) : ""}
            <button class="done-btn ${faites.includes(l.id) ? "is-done" : ""}" type="button" data-lecon-btn="${esc(l.id)}" aria-pressed="${faites.includes(l.id)}">${faites.includes(l.id) ? "Leçon terminée" : "Marquer comme terminé"}</button>
        </section>`).join("");

    const promoQuiz = cours.quiz.length ? `
        <aside class="quiz-promo">
            <div>
                <h3>Testez vos connaissances</h3>
                <p>${cours.quiz.length} question${cours.quiz.length > 1 ? "s" : ""}, avec correction immédiate.${s ? " Meilleur score : " + s.meilleur + " / " + s.total + "." : ""}</p>
            </div>
            <a class="btn btn-primary" href="#/quiz/${esc(cours.id)}">Passer le quiz</a>
        </aside>` : "";

    return `
    <div class="course-view" style="--course: var(--${esc(cours.couleur)})">
        <section class="course-header">
            <div class="container">
                <p class="breadcrumb"><a href="#/">Cours</a> / Module ${cours.module}</p>
                <h1>${esc(cours.titre)}</h1>
                <p class="course-sub">${esc(cours.sousTitre || cours.description)}</p>
                <div class="progress" role="progressbar" aria-label="Progression du cours" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
                    <div class="progress-bar" id="course-bar" style="width:${pct}%"></div>
                </div>
                <p class="progress-label" id="course-label">${pct} % complété</p>
                ${indexReprise > 0 ? `<p class="resume-note">Reprise à la leçon ${indexReprise + 1} : ${esc(cours.lecons[indexReprise].titre)}</p>` : ""}
            </div>
        </section>
        <div class="container course-layout">
            <aside class="sidebar" aria-label="Sommaire du cours">
                <h2>Sommaire</h2>
                <ol>${toc}</ol>
                ${cours.quiz.length ? `<a class="sidebar-quiz" href="#/quiz/${esc(cours.id)}">Passer le quiz</a>` : ""}
                <a class="back-link" href="#/">&larr; Tous les cours</a>
            </aside>
            <div class="course-content">
                ${lecons}
                ${promoQuiz}
                <nav class="course-nav" aria-label="Navigation entre les cours">
                    ${precedent ? `<a href="#/cours/${esc(precedent.id)}">&larr; Cours précédent : ${esc(precedent.banniere)}</a>` : `<a href="#/">Tous les cours</a>`}
                    ${suivant ? `<a href="#/cours/${esc(suivant.id)}">Cours suivant : ${esc(suivant.banniere)} &rarr;</a>` : `<a href="#/">Retour aux cours</a>`}
                </nav>
            </div>
        </div>
    </div>`;
};

/* Met à jour boutons, sommaire et barre sans recharger la vue */
const majCoursUI = (cours) => {
    const faites = leconsFaites(cours);
    document.querySelectorAll("[data-lecon-btn]").forEach((b) => {
        const fait = faites.includes(b.dataset.leconBtn);
        b.classList.toggle("is-done", fait);
        b.setAttribute("aria-pressed", String(fait));
        b.textContent = fait ? "Leçon terminée" : "Marquer comme terminé";
    });
    document.querySelectorAll("[data-toc]").forEach((li) => {
        li.classList.toggle("is-done", faites.includes(li.dataset.toc));
    });
    const pct = pourcent(faites.length, cours.lecons.length);
    const barre = document.getElementById("course-bar");
    const label = document.getElementById("course-label");
    if (barre) {
        barre.style.width = pct + "%";
        barre.parentElement.setAttribute("aria-valuenow", pct);
    }
    if (label) { label.textContent = pct + " % complété"; }
};

/* Suit la leçon visible à l'écran et la sauvegarde */
const suivrePosition = (cours) => {
    if (!("IntersectionObserver" in window)) { return; }
    const observateur = new IntersectionObserver((entrees) => {
        entrees.forEach((e) => {
            if (e.isIntersecting) { sauverPosition(cours.id, e.target.dataset.lecon); }
        });
    }, { rootMargin: "-35% 0px -60% 0px" });
    document.querySelectorAll(".lesson").forEach((l) => observateur.observe(l));
    nettoyages.push(() => observateur.disconnect());
};

const allerALecon = (leconId, comportement) => {
    const cible = document.getElementById("lecon-" + leconId);
    if (cible) { cible.scrollIntoView({ behavior: comportement || "smooth", block: "start" }); }
};

/* ---------- Lecteur vidéo avec marqueurs de progression ---------- */
let promesseYT = null;
const chargerYT = () => {
    if (window.YT && window.YT.Player) { return Promise.resolve(); }
    if (!promesseYT) {
        promesseYT = new Promise((resolve, reject) => {
            const ancien = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof ancien === "function") { ancien(); }
                resolve();
            };
            const script = document.createElement("script");
            script.src = "https://www.youtube.com/iframe_api";
            script.onerror = () => { promesseYT = null; reject(new Error("API YouTube indisponible")); };
            document.head.appendChild(script);
        });
    }
    return promesseYT;
};

const initLecteur = (bloc, cours) => {
    const idVideo = bloc.dataset.video;
    const leconId = bloc.dataset.lecon;
    const cle = cours.id + "/" + leconId;
    const slot = bloc.querySelector(".yt-slot");
    const remplissage = bloc.querySelector(".video-fill");
    const marqueurs = bloc.querySelectorAll(".video-marker");
    const texteTemps = bloc.querySelector(".video-time");
    const texteVu = bloc.querySelector(".video-seen");
    const boutonReprise = bloc.querySelector(".video-resume");
    const info = bloc.querySelector(".video-info");

    const tous = () => Stockage.lire(CLES.video, {});
    const etat = Object.assign({ t: 0, max: 0, d: 0 }, tous()[cle] || {});
    let joueur = null;
    let minuteur = null;

    const afficher = () => {
        const vu = etat.d ? Math.min(100, (etat.max / etat.d) * 100) : 0;
        remplissage.style.width = vu + "%";
        marqueurs.forEach((m) => m.classList.toggle("reached", vu >= Number(m.dataset.pct)));
        texteTemps.textContent = formatTemps(etat.t) + " / " + formatTemps(etat.d);
        texteVu.textContent = "Vu : " + Math.round(vu) + " %";
    };

    const sauver = () => {
        const donnees = tous();
        donnees[cle] = { t: etat.t, max: etat.max, d: etat.d };
        Stockage.ecrire(CLES.video, donnees);
    };

    const tic = () => {
        if (!joueur || typeof joueur.getCurrentTime !== "function") { return; }
        const d = joueur.getDuration();
        if (!d) { return; }
        etat.d = d;
        etat.t = joueur.getCurrentTime();
        etat.max = Math.max(etat.max, etat.t);
        afficher();
        sauver();
        /* 90 % de la vidéo vue : la leçon est validée automatiquement */
        if (etat.max / etat.d >= 0.9 && !leconsFaites(cours).includes(leconId)) {
            marquerLecon(cours, leconId, true);
            majCoursUI(cours);
            afficherToast("Vidéo terminée : leçon validée !");
        }
    };

    afficher();
    if (etat.d && etat.t > 5 && etat.t < etat.d - 5) {
        boutonReprise.hidden = false;
        boutonReprise.textContent = "Reprendre à " + formatTemps(etat.t);
    }

    boutonReprise.addEventListener("click", () => {
        if (joueur && joueur.seekTo) {
            joueur.seekTo(etat.t, true);
            joueur.playVideo();
            boutonReprise.hidden = true;
        }
    });

    marqueurs.forEach((m) => {
        m.addEventListener("click", () => {
            const d = joueur && joueur.getDuration ? joueur.getDuration() : 0;
            if (!d) { return; }
            joueur.seekTo((d * Number(m.dataset.pct)) / 100, true);
            joueur.playVideo();
        });
    });

    if (location.protocol === "file:") {
        info.innerHTML = "Astuce : YouTube refuse parfois de lire les vidéos depuis un fichier local. Ouvrez le site avec Live Server (VS Code).";
    }

    chargerYT().then(() => {
        if (!bloc.isConnected) { return; }
        joueur = new YT.Player(slot, {
            videoId: idVideo,
            host: "https://www.youtube-nocookie.com",
            playerVars: { rel: 0, playsinline: 1 },
            events: {
                onReady: () => { tic(); },
                onStateChange: (e) => {
                    clearInterval(minuteur);
                    if (e.data === 1) { minuteur = setInterval(tic, 1000); }
                    else { tic(); }
                }
            }
        });
    }).catch(() => {
        info.innerHTML = `Lecteur indisponible (connexion ?). <a href="https://www.youtube.com/watch?v=${esc(idVideo)}" target="_blank" rel="noopener">Ouvrir la vidéo sur YouTube</a>.`;
    });

    nettoyages.push(() => {
        clearInterval(minuteur);
        try { if (joueur && joueur.destroy) { joueur.destroy(); } } catch (e) { /* ignore */ }
    });
};

/* ============================================================
   VUE : QUIZ
   ============================================================ */
const vueQuiz = (cours) => `
    <div class="course-view" style="--course: var(--${esc(cours.couleur)})">
        <section class="course-header">
            <div class="container">
                <p class="breadcrumb"><a href="#/">Cours</a> / <a href="#/cours/${esc(cours.id)}">Module ${cours.module}</a> / <strong>Quiz</strong></p>
                <h1>Quiz : ${esc(cours.titre)}</h1>
                <p class="course-sub">${cours.quiz.length} question${cours.quiz.length > 1 ? "s" : ""}, avec correction immédiate.</p>
            </div>
        </section>
        <div class="container quiz-page">
            <div id="quiz-zone"></div>
        </div>
    </div>`;

const rendreQuiz = (cours) => {
    const zone = document.getElementById("quiz-zone");
    if (!zone) { return; }
    const questions = cours.quiz;
    const total = questions.length;
    const etat = lireEtatQuiz(cours);

    /* ----- Écran de résultat ----- */
    if (etat.i >= total) {
        const score = scoreQuiz(cours, etat);
        const pct = pourcent(score, total);
        const message = pct === 100 ? "Parfait, sans faute !" : (pct >= 60 ? "Bien joué, vous maîtrisez l'essentiel." : "Relisez le cours puis retentez votre chance.");
        const recap = questions.map((q, i) => {
            const ok = etat.choix[i] === q.bonne;
            return `<li class="${ok ? "ok" : "ko"}">
                <strong>${esc(q.question)}</strong><br>
                ${ok ? "Bonne réponse : " : "Votre réponse : " + esc(q.options[etat.choix[i]] ?? "aucune") + ". Bonne réponse : "}${esc(q.options[q.bonne])}
            </li>`;
        }).join("");
        zone.innerHTML = `
        <div class="quiz-card quiz-result">
            <p class="quiz-pill">Résultat</p>
            <p class="quiz-score">${score}<span> / ${total}</span></p>
            <p class="quiz-msg">${message}</p>
            <div class="progress" role="progressbar" aria-label="Score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
                <div class="progress-bar" style="width:${pct}%"></div>
            </div>
            <ol class="quiz-recap">${recap}</ol>
            <div class="quiz-actions">
                <button class="btn btn-primary" type="button" data-quiz-restart>Recommencer le quiz</button>
                <a class="btn" href="#/cours/${esc(cours.id)}">Retour au cours</a>
            </div>
        </div>`;
        return;
    }

    /* ----- Question en cours ----- */
    const q = questions[etat.i];
    const choisi = etat.choix[etat.i];
    const repondu = choisi !== undefined && choisi !== null;
    const pct = pourcent(etat.i, total);

    const options = q.options.map((texte, k) => {
        let classe = "quiz-option";
        if (repondu) {
            if (k === q.bonne) { classe += " is-correct"; }
            else if (k === choisi) { classe += " is-wrong"; }
        }
        return `<button type="button" class="${classe}" data-option="${k}" ${repondu ? "disabled" : ""}>${esc(texte)}</button>`;
    }).join("");

    let retour = "";
    if (repondu) {
        const juste = choisi === q.bonne;
        retour = `
        <div class="quiz-feedback" role="status">
            <p class="quiz-verdict ${juste ? "ok" : "ko"}">${juste ? "Bonne réponse !" : "Mauvaise réponse. La bonne réponse était : " + esc(q.options[q.bonne]) + "."}</p>
            ${q.explication ? `<p class="quiz-expl">${esc(q.explication)}</p>` : ""}
            <button class="btn btn-primary" type="button" data-quiz-next>${etat.i === total - 1 ? "Voir mon résultat" : "Question suivante &rarr;"}</button>
        </div>`;
    }

    zone.innerHTML = `
    <div class="quiz-card">
        <p class="quiz-pill">Question ${etat.i + 1} / ${total}</p>
        <div class="progress" role="progressbar" aria-label="Progression du quiz" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
            <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <h2 class="quiz-question">${esc(q.question)}</h2>
        <div class="quiz-options">${options}</div>
        ${retour}
    </div>`;

    const suite = zone.querySelector("[data-quiz-next]");
    if (suite && repondu) { suite.focus({ preventScroll: true }); }
};

/* ============================================================
   VUE : ADMINISTRATION
   ============================================================ */
const extraireIdYoutube = (texte) => {
    const t = texte.trim();
    if (!t) { return ""; }
    if (/^[\w-]{11}$/.test(t)) { return t; }
    const m = t.match(/(?:youtu\.be\/|[?&]v=|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
};

const vueAdmin = () => {
    const cours = tousLesCours();
    const admin = lireAdmin();
    const liste = cours.map((c) => `
        <li class="admin-item">
            <span class="admin-dot" style="background: var(--${esc(c.couleur)})" aria-hidden="true"></span>
            <div class="admin-info">
                <strong>${esc(c.titre)}</strong>
                <span>${c.lecons.length} leçon${c.lecons.length > 1 ? "s" : ""} · ${c.quiz.length} question${c.quiz.length > 1 ? "s" : ""} de quiz</span>
            </div>
            <a class="btn btn-small" href="#/cours/${esc(c.id)}">Voir</a>
            <button class="btn btn-small btn-danger" type="button" data-del-cours="${esc(c.id)}">Supprimer</button>
        </li>`).join("");

    const options = COULEURS.map((c) => `<option value="${c}">${{ orange: "Orange", blue: "Bleu", yellow: "Jaune", pink: "Rose", green: "Vert", accent: "Cyan" }[c]}</option>`).join("");

    return `
    <div class="course-view" style="--course: var(--pink)">
        <section class="course-header">
            <div class="container">
                <p class="breadcrumb"><a href="#/">Accueil</a> / <strong>Administration</strong></p>
                <h1>Administration</h1>
                <p class="course-sub">Ajoutez ou supprimez des cours. Les changements sont enregistrés dans ce navigateur.</p>
            </div>
        </section>
        <div class="container admin-page">
            <section class="admin-card">
                <h2>Cours existants (${cours.length})</h2>
                ${cours.length ? `<ul class="admin-list">${liste}</ul>` : `<p class="empty">Aucun cours. Ajoutez-en un ci-dessous.</p>`}
                <div class="admin-tools">
                    ${admin.supprimes.length ? `<button class="btn btn-small" type="button" data-restore>Restaurer les cours supprimés (${admin.supprimes.length})</button>` : ""}
                    <button class="btn btn-small" type="button" data-reset-prog>Réinitialiser ma progression</button>
                </div>
            </section>

            <section class="admin-card">
                <h2>Ajouter un cours</h2>
                <form id="form-cours" novalidate>
                    <div class="field">
                        <label for="f-titre">Titre du cours *</label>
                        <input id="f-titre" name="titre" type="text" maxlength="60" placeholder="Ex : Introduction à Git">
                    </div>
                    <div class="field">
                        <label for="f-desc">Description courte *</label>
                        <input id="f-desc" name="description" type="text" maxlength="120" placeholder="Ex : Versionner son code avec Git et GitHub.">
                    </div>
                    <div class="field-row">
                        <div class="field">
                            <label for="f-ban">Texte de la bannière</label>
                            <input id="f-ban" name="banniere" type="text" maxlength="8" placeholder="GIT">
                        </div>
                        <div class="field">
                            <label for="f-couleur">Couleur</label>
                            <select id="f-couleur" name="couleur">${options}</select>
                        </div>
                        <div class="field">
                            <label for="f-duree">Durée</label>
                            <input id="f-duree" name="duree" type="text" maxlength="30" placeholder="environ 30 min">
                        </div>
                    </div>
                    <div class="field">
                        <label for="f-lecons">Leçons * <small>(une par ligne : Titre | Contenu)</small></label>
                        <textarea id="f-lecons" name="lecons" rows="5" placeholder="Qu'est-ce que Git ? | Git est un outil de versionnement du code.&#10;Les commits | Un commit enregistre une version du projet."></textarea>
                    </div>
                    <div class="field">
                        <label for="f-video">Vidéo YouTube <small>(optionnel, ajoutée à la dernière leçon)</small></label>
                        <input id="f-video" name="video" type="text" placeholder="https://www.youtube.com/watch?v=...">
                    </div>
                    <div class="field">
                        <label for="f-quiz">Quiz <small>(optionnel, une question par ligne)</small></label>
                        <textarea id="f-quiz" name="quiz" rows="4" placeholder="Question | Bonne réponse | Mauvaise 1 | Mauvaise 2 | Mauvaise 3 | Explication"></textarea>
                        <p class="hint">La première réponse est la bonne : elle est mélangée automatiquement à l'enregistrement.</p>
                    </div>
                    <p class="form-error" id="form-error" role="alert"></p>
                    <button class="btn btn-primary" type="submit">Ajouter le cours</button>
                </form>
            </section>
        </div>
    </div>`;
};

const lireFormulaire = (form) => {
    const v = (nom) => form.elements[nom].value.trim();
    const titre = v("titre");
    const description = v("description");
    if (!titre) { return { erreur: "Le titre du cours est obligatoire." }; }
    if (!description) { return { erreur: "La description est obligatoire." }; }

    /* Leçons */
    const lignes = v("lecons").split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lignes.length) { return { erreur: "Ajoutez au moins une leçon (Titre | Contenu)." }; }
    const lecons = [];
    for (let i = 0; i < lignes.length; i++) {
        const coupe = lignes[i].indexOf("|");
        const titreLecon = (coupe === -1 ? lignes[i] : lignes[i].slice(0, coupe)).trim();
        const contenu = coupe === -1 ? "" : lignes[i].slice(coupe + 1).trim();
        if (!titreLecon) { return { erreur: "Leçon " + (i + 1) + " : le titre est vide." }; }
        lecons.push({ id: "l" + (i + 1), titre: titreLecon, html: contenu ? "<p>" + esc(contenu) + "</p>" : "" });
    }

    /* Vidéo (attachée à la dernière leçon) */
    const idVideo = extraireIdYoutube(v("video"));
    if (idVideo === null) { return { erreur: "Le lien YouTube n'est pas valide." }; }
    if (idVideo) { lecons[lecons.length - 1].video = idVideo; }

    /* Quiz */
    const quiz = [];
    const lignesQuiz = v("quiz").split("\n").map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lignesQuiz.length; i++) {
        const parties = lignesQuiz[i].split("|").map((p) => p.trim());
        if (parties.length !== 6 || parties.slice(0, 5).some((p) => !p)) {
            return { erreur: "Quiz, ligne " + (i + 1) + " : 6 champs séparés par | (question, bonne réponse, 3 mauvaises, explication)." };
        }
        const bonneReponse = parties[1];
        const ordre = melanger(parties.slice(1, 5));
        quiz.push({
            question: parties[0],
            options: ordre,
            bonne: ordre.indexOf(bonneReponse),
            explication: parties[5]
        });
    }

    return {
        cours: {
            id: "c" + Date.now().toString(36),
            titre,
            sousTitre: description,
            description,
            banniere: (v("banniere") || titre.slice(0, 4)).toUpperCase(),
            couleur: COULEURS.includes(v("couleur")) ? v("couleur") : "pink",
            duree: v("duree"),
            lecons,
            quiz
        }
    };
};

const effacerDonneesCours = (id) => {
    [CLES.progression, CLES.position, CLES.quiz, CLES.quizEtat, CLES.video].forEach((cle) => {
        const donnees = Stockage.lire(cle, {});
        if (cle === CLES.position) {
            if (donnees.cours) { delete donnees.cours[id]; }
            if (donnees.dernier && donnees.dernier.cours === id) { donnees.dernier = null; }
        } else if (cle === CLES.video) {
            Object.keys(donnees).filter((k) => k.startsWith(id + "/")).forEach((k) => delete donnees[k]);
        } else {
            delete donnees[id];
        }
        Stockage.ecrire(cle, donnees);
    });
};

/* ============================================================
   ROUTEUR
   ============================================================ */
const vueIntrouvable = (message) => `
    <section class="section">
        <div class="container">
            <h2>Oups…</h2>
            <p class="section-intro">${esc(message)}</p>
            <a class="btn btn-primary" href="#/">Retour à l'accueil</a>
        </div>
    </section>`;

let contexte = { type: null, cours: null };

const marquerMenu = (cle) => {
    document.querySelectorAll("[data-nav]").forEach((a) => {
        if (a.dataset.nav === cle) { a.setAttribute("aria-current", "page"); }
        else { a.removeAttribute("aria-current"); }
    });
};

const afficher = (html, titre, menu) => {
    nettoyages.forEach((fn) => fn());
    nettoyages = [];
    app.innerHTML = html;
    document.title = titre + " - MiniLMS";
    marquerMenu(menu);
    window.scrollTo({ top: 0, behavior: "auto" });
};

const router = () => {
    const hash = location.hash || "#/";

    /* Ancres internes de la page d'accueil (#cours, #apropos) */
    if (/^#(cours|apropos|accueil)$/.test(hash)) {
        const cible = hash.slice(1);
        if (contexte.type !== "accueil") {
            contexte = { type: "accueil", cours: null };
            afficher(vueAccueil(), "Plateforme de cours en ligne", "accueil");
        }
        const el = document.getElementById(cible);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
        return;
    }

    let m;
    if ((m = hash.match(/^#\/cours\/([^/]+)$/))) {
        const cours = trouverCours(decodeURIComponent(m[1]));
        if (!cours) { contexte = { type: "404" }; afficher(vueIntrouvable("Ce cours n'existe pas (ou a été supprimé)."), "Cours introuvable", "accueil"); return; }
        contexte = { type: "cours", cours };
        afficher(vueCours(cours), cours.titre, "accueil");
        const position = lirePosition().cours[cours.id];
        const index = cours.lecons.findIndex((l) => l.id === position);
        if (index > 0) { allerALecon(position, "auto"); }
        setTimeout(() => suivrePosition(cours), 400);
        document.querySelectorAll(".video-player").forEach((bloc) => initLecteur(bloc, cours));
        return;
    }

    if ((m = hash.match(/^#\/quiz\/([^/]+)$/))) {
        const cours = trouverCours(decodeURIComponent(m[1]));
        if (!cours || !cours.quiz.length) {
            contexte = { type: "404" };
            afficher(vueIntrouvable("Aucun quiz disponible pour ce cours."), "Quiz introuvable", "accueil");
            return;
        }
        contexte = { type: "quiz", cours };
        afficher(vueQuiz(cours), "Quiz : " + cours.titre, "accueil");
        rendreQuiz(cours);
        return;
    }

    if (hash === "#/admin") {
        contexte = { type: "admin" };
        afficher(vueAdmin(), "Administration", "admin");
        return;
    }

    contexte = { type: "accueil", cours: null };
    afficher(vueAccueil(), "Plateforme de cours en ligne", "accueil");
};

/* ============================================================
   ÉVÉNEMENTS (délégation sur #app)
   ============================================================ */
app.addEventListener("click", (e) => {
    const cible = e.target.closest("button, a");
    if (!cible) { return; }
    const cours = contexte.cours;

    /* Cours : marquer une leçon comme terminée */
    if (cible.dataset.leconBtn && cours) {
        marquerLecon(cours, cible.dataset.leconBtn);
        majCoursUI(cours);
        return;
    }

    /* Cours : sommaire (défilement sans changer de page) */
    if (cible.dataset.goto && cours) {
        e.preventDefault();
        allerALecon(cible.dataset.goto);
        sauverPosition(cours.id, cible.dataset.goto);
        return;
    }

    /* Quiz : choix d'une réponse */
    if (cible.dataset.option !== undefined && contexte.type === "quiz") {
        const etat = lireEtatQuiz(cours);
        if (etat.choix[etat.i] !== undefined && etat.choix[etat.i] !== null) { return; }
        etat.choix[etat.i] = Number(cible.dataset.option);
        ecrireEtatQuiz(cours, etat);
        rendreQuiz(cours);
        return;
    }

    /* Quiz : question suivante / résultat */
    if (cible.hasAttribute("data-quiz-next") && contexte.type === "quiz") {
        const etat = lireEtatQuiz(cours);
        etat.i += 1;
        ecrireEtatQuiz(cours, etat);
        if (etat.i >= cours.quiz.length) {
            const score = scoreQuiz(cours, etat);
            const scores = lireScores();
            const ancien = scores[cours.id] ? scores[cours.id].meilleur : 0;
            scores[cours.id] = { meilleur: Math.max(ancien, score), dernier: score, total: cours.quiz.length };
            Stockage.ecrire(CLES.quiz, scores);
        }
        rendreQuiz(cours);
        return;
    }

    /* Quiz : recommencer */
    if (cible.hasAttribute("data-quiz-restart") && contexte.type === "quiz") {
        ecrireEtatQuiz(cours, { i: 0, choix: [] });
        rendreQuiz(cours);
        const premier = document.querySelector(".quiz-option");
        if (premier) { premier.focus({ preventScroll: true }); }
        return;
    }

    /* Administration : supprimer un cours */
    if (cible.dataset.delCours) {
        const id = cible.dataset.delCours;
        const c = trouverCours(id);
        if (!c || !window.confirm("Supprimer le cours « " + c.titre + " » ?")) { return; }
        const admin = lireAdmin();
        if (COURS_PAR_DEFAUT.some((d) => d.id === id)) {
            if (!admin.supprimes.includes(id)) { admin.supprimes.push(id); }
        } else {
            admin.ajoutes = admin.ajoutes.filter((a) => a.id !== id);
        }
        Stockage.ecrire(CLES.admin, admin);
        effacerDonneesCours(id);
        afficher(vueAdmin(), "Administration", "admin");
        afficherToast("Cours supprimé.");
        return;
    }

    /* Administration : restaurer les cours par défaut supprimés */
    if (cible.hasAttribute("data-restore")) {
        const admin = lireAdmin();
        admin.supprimes = [];
        Stockage.ecrire(CLES.admin, admin);
        afficher(vueAdmin(), "Administration", "admin");
        afficherToast("Cours par défaut restaurés.");
        return;
    }

    /* Administration : réinitialiser la progression */
    if (cible.hasAttribute("data-reset-prog")) {
        if (!window.confirm("Effacer toute votre progression, vos scores et vos positions ?")) { return; }
        [CLES.progression, CLES.position, CLES.quiz, CLES.quizEtat, CLES.video].forEach((cle) => Stockage.supprimer(cle));
        afficherToast("Progression réinitialisée.");
    }
});

app.addEventListener("submit", (e) => {
    if (e.target.id !== "form-cours") { return; }
    e.preventDefault();
    const resultat = lireFormulaire(e.target);
    if (resultat.erreur) {
        document.getElementById("form-error").textContent = resultat.erreur;
        return;
    }
    const admin = lireAdmin();
    admin.ajoutes.push(resultat.cours);
    Stockage.ecrire(CLES.admin, admin);
    afficher(vueAdmin(), "Administration", "admin");
    afficherToast("Cours « " + resultat.cours.titre + " » ajouté.");
});

/* ---------- Menu burger ---------- */
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");
if (burger && menu) {
    burger.addEventListener("click", () => {
        const ouvert = menu.classList.toggle("open");
        burger.setAttribute("aria-expanded", String(ouvert));
    });
    menu.querySelectorAll("a").forEach((lien) => {
        lien.addEventListener("click", () => {
            menu.classList.remove("open");
            burger.setAttribute("aria-expanded", "false");
        });
    });
}

/* ---------- Démarrage ---------- */
window.addEventListener("hashchange", router);
router();