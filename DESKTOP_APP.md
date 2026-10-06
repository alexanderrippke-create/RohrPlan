# RohrPlan als Windows-Desktopprogramm

Die App wird mit Electron als eigenständiges Windows-Programm gestartet. Der Standardordner ist Dokumente\RohrPlan, auch wenn Windows-Dokumente in OneDrive liegen. Jeder direkte Unterordner außer Stammdaten ist ein Projekt. Einzelne Isometrien werden als .rohrplan.json-Dateien gespeichert und geöffnet. Im Programm können Projektordner angelegt und ausgewählt werden; „Liste aktualisieren“ liest Änderungen aus dem Explorer ein.

Rohrdatensätze liegen in Dokumente\RohrPlan\Stammdaten\Rohrdatensaetze.json. Vor Änderungen wird der bisherige Stand als .bak gesichert. Maschinen werden in den Stammdaten ausgewählt und über die Maßskizze angelegt oder bearbeitet.

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
