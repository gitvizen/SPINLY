# Spinly – Gruppen-Loser & Entscheidungsrad (Mobile PWA)

**Spinly** ist eine schlanke, mobile-optimierte Progressive Web App (PWA) für schnelle Gruppenentscheidungen unterwegs. Entwickelt ohne externe Frameworks im minimalistischen Dark-Utility-Design mit Fokus auf Touch-Bedienung, Offline-Fähigkeit und native Browser-APIs.

---

## Features & Technische Umsetzung

* **Interaktives Canvas-Glücksrad:** High-DPI (`devicePixelRatio`) Rendering mit kalibriertem Außenring, dynamischer Segment-Berechnung und Quartic-Ease-Out-Animation via `requestAnimationFrame`.
* **Hardware- & Browser-APIs:** Synthetische Klick-Sounds über die **Web Audio API** (ohne externe Audiodateien) sowie haptisches Feedback über die **Vibration API**.
* **Lokale Zustandsverwaltung:** Persistiert Optionen, Audio-Einstellungen und die letzten Ziehungen direkt im `localStorage`.
* **Offline-First PWA:** Installierbar auf iOS und Android (`manifest.json`) inklusive Caching über einen eigenen **Service Worker** (`sw.js`).
* **Presets & Ausscheidungs-Modus:** Schnellvorlagen (*Wer zahlt?*, *Essen*, *Ja/Nein*) und 1-Klick-Entfernen gezogener Personen für mehrstufige Runden.

---

## Tech-Stack

* **Frontend:** HTML5 Canvas, CSS3 (Mobile-First, Safe-Area-Insets, Dark Mode), Vanilla JavaScript (ES2023)
* **PWA:** Service Worker & Web App Manifest

---

## Lokal starten & Deployment

Da Spinly komplett clientseitig arbeitet, ist kein Build-Schritt oder Backend-Server nötig:

1. `index.html` direkt im Browser öffnen (oder mit einem lokalen Static-Server wie `npx serve .` starten).
2. Für kostenloses Hosting: Repository auf GitHub hochladen und unter **Settings → Pages** den `main`-Branch aktivieren.

---

## Lizenz

MIT License
