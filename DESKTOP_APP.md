# RohrPlan als Windows-Desktopprogramm

Die App wird mit Electron als eigenständiges Windows-Programm gestartet. Die Projektordnerauswahl läuft über den Windows-Dateidialog; Projektmanifest und Isometrien werden als JSON-Dateien im gewählten Ordner abgelegt. Der zuletzt verwendete Ordner wird im lokalen App-Profil gemerkt.

## STEP-Vorschau

Über „STEP importieren“ lassen sich `.step`- und `.stp`-Dateien lokal als drehbare 3D-Vorschau öffnen. Analytische Rohrmodelle aus geraden Zylinderstücken und torusförmigen Bögen können als Rohrverlauf mit Biegewinkeln, Biegepositionen und Futterstellungen ausgewertet werden. Biegedaten entstehen nur, wenn zuvor ein Rohrdatensatz mit passendem Durchmesser, auf volle Millimeter gerundeter Wandstärke und passendem, auf volle Millimeter gerundetem Biegeradius angelegt wurde. Ohne passende Zuordnung oder bei nicht unterstützter STEP-Geometrie bleibt die Datei eine Vorschau.

## Tastenkürzel

- Strg+S: Isometrie speichern
- Strg+O: Projektverwaltung öffnen
- Strg+N: neues Rohr beginnen
- Strg+Z: rückgängig
- Strg+Y oder Strg+Umschalt+Z: wiederherstellen
- Strg+P: Biegedaten-Druckansicht öffnen

## Entwicklerversion starten

Node.js 22 oder neuer und pnpm installieren; dann im Projektordner ausführen:

```powershell
pnpm install
pnpm start
```

## Windows-Installationsdatei erstellen

```powershell
pnpm run dist
```

Der Installer wird im Ordner `release` abgelegt.
