# RohrPlan als Windows-Desktopprogramm

Die App wird mit Electron als eigenständiges Windows-Programm gestartet. Die Projektordnerauswahl läuft über den Windows-Dateidialog; Projektmanifest und Isometrien werden als JSON-Dateien im gewählten Ordner abgelegt. Der zuletzt verwendete Ordner wird im lokalen App-Profil gemerkt.

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
