# RohrPlan

RohrPlan ist ein Windows-Desktopprogramm zur isometrischen Planung einzelner Rohrleitungen und zur Vorbereitung manueller Biegungen.

## Lokal starten

Node.js 22 oder neuer sowie pnpm installieren. Im Projektordner:

```powershell
pnpm install
pnpm start
```

## Windows-Installer bauen

```powershell
pnpm run dist
```

Der NSIS-Installer wird in `release` erstellt. Projekte werden über den Windows-Ordnerdialog als Dateien im ausgewählten Projektordner gespeichert.

## Updates

Die installierte App prüft beim Start und danach regelmäßig auf eine neue GitHub-Release. Eine Release muss den von electron-builder erstellten Windows-Installer und die Update-Metadaten enthalten.
