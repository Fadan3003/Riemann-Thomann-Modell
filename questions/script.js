/*
 * script.js – Riemann-Kreuz
 * Liegt im Ordner questions/ und wird von index.html und allen Frage-Seiten eingebunden.
 *
 *  - Alle 47 Fragen kommen in zufälliger Reihenfolge dran (bei jedem Start neu gemischt)
 *  - Die Auswertung (ergebnis.html) kommt immer zuletzt
 *  - Punkte werden pro Frage gespeichert -> Zurück-Button / Neuladen zählt nichts doppelt
 *  - Schreibt weiterhin "distanz-nahe" und "dauer-wechsel" in den localStorage (für ergebnis.html)
 */
(() => {
    const BASE = document.currentScript.src.replace(/[^/]*$/, ""); // Ordner, in dem script.js liegt
    const ERGEBNIS = BASE + "../ergebnis.html";

    const NUMMERN = ["first", "second", "third", "fourth", "fifth", "sixth",
                     "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth"];

    // Pol -> Achse und Vorzeichen
    // da = Dauer (+), we = Wechsel (-), di = Distanz (+), na = Nähe (-)
    const POLE = {
        da: { achse: "dauer-wechsel", vorzeichen: +1 },
        we: { achse: "dauer-wechsel", vorzeichen: -1 },
        di: { achse: "distanz-nahe",  vorzeichen: +1 },
        na: { achse: "distanz-nahe",  vorzeichen: -1 },
    };

    // Antwort -> Punkte (ja / teilweise / nein)
    const PUNKTE = { option1: 1, option2: 0.5, option3: 0 };

    // Alle Frage-Seiten (47 Stück: "twelfth-da" gibt es im Projekt nicht)
    const ALLE = NUMMERN
        .flatMap(n => Object.keys(POLE).map(p => `index-${n}-${p}`))
        .filter(name => name !== "index-twelfth-da");

    const KEY_REIHENFOLGE = "reihenfolge";
    const KEY_ANTWORTEN = "antworten";

    const lese = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
        catch { return fallback; }
    };

    const mischen = liste => {
        const a = [...liste];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const aktuelleSeite = () => {
        const m = location.pathname.match(/(index-[a-z]+-(?:da|di|na|we))\.html$/);
        return m ? m[1] : null;
    };

    const seiteUrl = name => `${BASE}${name}.html`;

    // Summen beider Achsen aus den gespeicherten Antworten neu berechnen
    const speichereSummen = antworten => {
        const summen = { "distanz-nahe": 0, "dauer-wechsel": 0 };
        for (const [seite, punkte] of Object.entries(antworten)) {
            const pol = POLE[seite.slice(-2)];
            if (pol) summen[pol.achse] += pol.vorzeichen * punkte;
        }
        localStorage.setItem("distanz-nahe", summen["distanz-nahe"]);
        localStorage.setItem("dauer-wechsel", summen["dauer-wechsel"]);
    };

    const reihenfolge = () => {
        let liste = lese(KEY_REIHENFOLGE, null);
        const gueltig = Array.isArray(liste) && liste.length === ALLE.length
            && ALLE.every(s => liste.includes(s));
        if (!gueltig) {
            liste = mischen(ALLE);
            localStorage.setItem(KEY_REIHENFOLGE, JSON.stringify(liste));
        }
        return liste;
    };

    // Neuer Durchgang: alles zurücksetzen und neu mischen
    window.starteTest = () => {
        localStorage.setItem(KEY_REIHENFOLGE, JSON.stringify(mischen(ALLE)));
        localStorage.setItem(KEY_ANTWORTEN, JSON.stringify({}));
        speichereSummen({});
        window.location.href = seiteUrl(reihenfolge()[0]);
    };

    // Submit-Button der Frage-Seiten
    window.submitButton = () => {
        const seite = aktuelleSeite();
        if (!seite) return;

        const gewaehlt = document.querySelector('.option input[type="radio"]:checked');
        if (!gewaehlt) {
            alert("Bitte wählen Sie eine Option aus.");
            return;
        }

        const antworten = lese(KEY_ANTWORTEN, {});
        antworten[seite] = PUNKTE[gewaehlt.id] ?? 0;
        localStorage.setItem(KEY_ANTWORTEN, JSON.stringify(antworten));
        speichereSummen(antworten);

        const liste = reihenfolge();
        const naechste = liste[liste.indexOf(seite) + 1];
        window.location.href = naechste ? seiteUrl(naechste) : ERGEBNIS;
    };

})();
