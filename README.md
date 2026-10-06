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

Der NSIS-Installer wird in `release` erstellt. Der Standardordner ist `Dokumente\RohrPlan` (auch bei Windows-Dokumente in OneDrive). Jeder direkte Unterordner außer dem reservierten Ordner `Stammdaten` ist ein Projekt. Im Programm lassen sich Ordner anlegen, auswählen und ihre Isometrien öffnen. Ordner aus dem Windows-Explorer erscheinen nach „Liste aktualisieren“. Isometrien werden als einzelne `.rohrplan.json`-Dateien gespeichert; separate Projektdateien werden nicht mehr erzeugt.

Die Windows-App legt den Standardordner automatisch an. In der Browserversion wird der Ordner einmal über „Standardordner freigeben“ ausgewählt. Ein Browser mit Ordnerzugriff ist erforderlich.

### Rohrdatensätze und Sicherung

Rohrdatensätze liegen unter `Dokumente\RohrPlan\Stammdaten\Rohrdatensaetze.json`. Vor einer Änderung wird der bisherige Stand als `Rohrdatensaetze.json.bak` gesichert. Der Unterordner `Stammdaten` ist für diese Dateien reserviert und wird nicht als Projekt angezeigt.

Die Windows-App übernimmt vorhandene Rohrdaten aus ihrem bisherigen lokalen Speicher, wenn noch keine Datei existiert. Die Browserversion verwendet dieselbe Datei, sobald der Standardordner freigegeben ist; ohne Freigabe bleibt der bisherige Browserspeicher verfügbar. Eine unlesbare Rohrdaten-Datei wird nicht mit einer leeren Liste überschrieben. Im Browser und in der Windows-App gespeicherte Datensätze waren zuvor getrennt; beide Ansichten verwenden nach der Ordnerfreigabe denselben Ablageort.

## Oberfläche

Die Werkzeugleiste ist in Datei, Zeichnen, Biegen und Ansicht gegliedert. Links zeigt die Übersicht das aktuelle Projekt, alle geöffneten Rohre, den Rohrdatensatz und die ausgewählte Maschine. Das Symbol oben rechts blendet diese Übersicht aus und wieder ein.

Unter Ansicht stehen ISO-Ansicht, Alles anzeigen, Zoom und Raster zur Verfügung. Die wichtigsten Ansichtstasten sind zusätzlich direkt im Zeichenfeld erreichbar. Rückgängig, Wiederherstellen und Speichern bleiben oben im Schnellzugriff. Biegedaten und PDF-Ausgabe werden über Biegen → Biegedaten geöffnet.

## Updates

Die installierte App prüft beim Start und danach regelmäßig auf eine neue GitHub-Release. Eine Release muss den von electron-builder erstellten Windows-Installer und die Update-Metadaten enthalten.
