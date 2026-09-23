# Renten-Runde

Eine vollständig clientseitige Jeopardy-Spielseite für Rentenfeiern. Spielinhalte und Spielstand werden ausschließlich im `localStorage` des jeweiligen Browsers gespeichert.

## Lokal starten

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000` öffnen.

## GitHub Pages

Das Repository benötigt keinen Build-Schritt. In den Repository-Einstellungen unter **Pages** einfach den aktuellen Branch und das Wurzelverzeichnis (`/`) als Quelle wählen.

## Funktionen

- Setup für Titel, Ehrengast und ein bis sechs Teams
- Mehrere Boards mit flexibel wählbaren Größen (3–6 Kategorien, 3–5 Fragen)
- Individuelle Punkte, Fragen und Antworten
- Moderierter Spielablauf mit frei wechselbarem aktivem Team
- Zwischenstände und finales Gewinner-Scoreboard
- JSON-Import und -Export
- Rein lokale Persistenz ohne Server oder Tracking
