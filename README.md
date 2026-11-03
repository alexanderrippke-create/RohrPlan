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

## PDFs und Bilder je Rohr

Links unter **Dokumente zum Rohr → PDFs und Bilder** lassen sich mehrere PDFs oder Bilder auswählen und ansehen. „Rohr mit Anhängen speichern“ verwendet den normalen Speicherdialog. Beim Speichern im Projekt liegen die Dateien getrennt von der Isometrie unter `Anhänge/<Rohrkennung>/`; die Zuordnung steht in der Rohr-Datei und bleibt über Tabwechsel, Neuladen und erneutes Öffnen erhalten. Entwürfe werden bis zum Speichern zusätzlich im lokalen Browserspeicher (IndexedDB) gehalten.

Beim Speichern als einzelne Isometrie-Datei werden die Anhänge eingebettet, damit die Datei weitergegeben und auf einem anderen Rechner geöffnet werden kann. Dadurch kann die JSON-Datei größer werden. Eine entfernte Zuordnung löscht keine vorhandenen Original- oder Projektdateien. Unterstützt sind PDF, JPG, PNG, WEBP, GIF und BMP bis 50 MB je Datei.

Beim STEP-Import wird die erkannte Wandstärke auf den nächsten halben Millimeter gerundet, etwa 2,4 → 2,5 und 2,8 → 3,0. Die Datensatzsuche verwendet diese Wandstärke; ein Datensatz mit 2,5 mm wird nicht auf 3 mm umgedeutet.

## Biegerichtung der Maschine

Unter **Stammdaten → Maschinen → Maßskizze / Maschine bearbeiten** wird die Biegerichtung von oben gesehen gespeichert. Simulation, Bodenprüfung und Maschinenkontaktprüfung übernehmen diese Einstellung von der ausgewählten Maschine. Unterstützt werden Biegungen im Uhrzeigersinn und gegen Uhrzeigersinn.

Die Maßskizze beschreibt die Grundanordnung im Uhrzeigersinn. Bei Gegen Uhrzeigersinn wird das Maschinenmodell zur Rohrlinie gespiegelt; Rolle, Arm und Zylinder folgen der Gegenrichtung. Wird die aktive Maschine geändert, erhält auch eine bereits geöffnete Simulation die neuen Stammdaten und beginnt erneut bei 0.

**Futterdrehung bei positiven Winkeln** ist eine eigene Einstellung im Maschineneditor: Uhrzeigersinn oder Gegen Uhrzeigersinn, vom Futter zur Biegerolle gesehen. Die Futterstellungen bleiben Zahlen ab 0°; die ausgewählte Richtung bestimmt ihre räumliche Umsetzung. Das Futter nimmt den kürzesten Weg zur nächsten Stellung. Simulation, Maschinenkontakte, Bodenprüfung und Biegefolge-Empfehlung berücksichtigen diese Bewegung. Bereits gespeicherte Maschinen und alte Simulationsdateien ohne dieses Feld behalten Uhrzeigersinn.

Exportierte Simulationsdateien enthalten den Maschinenstand zum Exportzeitpunkt. Beim separaten Laden verwenden sie diese Kopie; ältere Dateien ohne Maschinenprofil verwenden die aktive Maschine.

## Updates

Die installierte App prüft beim Start und danach regelmäßig auf eine neue GitHub-Release. Eine Release muss den von electron-builder erstellten Windows-Installer und die Update-Metadaten enthalten.
