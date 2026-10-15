"use strict";

const CLE = "minilms-progression";

const lire = () => {
    try { return JSON.parse(localStorage.getItem(CLE)) || {}; }
    catch (e) { return {}; }
};
const ecrire = (donnees) => {
    try { localStorage.setItem(CLE, JSON.stringify(donnees)); }
    catch (e) { /* stockage indisponible : on ignore */ }
};

const majBarre = (barre, label, pourcentage) => {
    barre.style.width = pourcentage + "%";
    barre.parentElement.setAttribute("aria-valuenow", pourcentage);
    if (label) { label.textContent = pourcentage + " % complété"; }
};

/* ----- Menu burger ----- */
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

/* ----- Page d'accueil : progression de chaque cours ----- */
document.querySelectorAll(".card[data-course]").forEach((carte) => {
    const cours = carte.dataset.course;
    const total = Number(carte.dataset.total);
    const faites = (lire()[cours] || []).length;
    const pourcentage = Math.min(100, Math.round((faites / total) * 100));
    majBarre(carte.querySelector(".progress-bar"), carte.querySelector(".progress-label"), pourcentage);
});

/* ----- Page de cours : boutons "Marquer comme terminé" ----- */
const cours = document.body.dataset.course;
const boutons = document.querySelectorAll(".done-btn");

const majCours = () => {
    const faites = lire()[cours] || [];
    let nb = 0;
    boutons.forEach((b) => {
        const fait = faites.includes(b.dataset.lesson);
        if (fait) { nb++; }
        b.classList.toggle("is-done", fait);
        b.setAttribute("aria-pressed", String(fait));
        b.textContent = fait ? "✓ Leçon terminée" : "Marquer comme terminé";
    });
    const pourcentage = Math.round((nb / boutons.length) * 100);
    majBarre(document.getElementById("course-bar"), document.getElementById("course-label"), pourcentage);
};

if (cours && boutons.length > 0) {
    boutons.forEach((b) => {
        b.addEventListener("click", () => {
            const donnees = lire();
            const faites = donnees[cours] || [];
            const i = faites.indexOf(b.dataset.lesson);
            if (i === -1) { faites.push(b.dataset.lesson); } else { faites.splice(i, 1); }
            donnees[cours] = faites;
            ecrire(donnees);
            majCours();
        });
    });
    majCours();
}