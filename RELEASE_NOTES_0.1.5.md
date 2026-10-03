# RohrPlan 0.1.5 – Rohr-Tabs, einzelne Isometrien und verbesserte Biegeskizzen

## Neue Funktionen

### Mehrere Rohre in Tabs

- „Neues Rohr“ legt nach Auswahl des Rohrdatensatzes einen weiteren Tab an. Bereits geöffnete Rohre bleiben erhalten.
- Jeder Tab behält seinen Rohrdatensatz, den Verlauf, die eingetragenen Maße, den Bearbeitungszustand und die Ansicht.
- Rückgängig und Wiederherstellen werden für jedes Rohr getrennt geführt.
- Offene Tabs werden lokal automatisch gespeichert. Beim Neuladen werden die Rohre und der zuletzt aktive Tab wiederhergestellt.
- Jeder Rohr-Tab hat ein × zum Schließen.
- Bei ungespeicherten Änderungen erscheint eine Auswahl: „Speichern“, „Ohne Speichern schließen“ oder „Abbrechen“.
- Bei Auswahl von „Speichern“ wird der Tab erst nach erfolgreichem Abschluss des Speichervorgangs geschlossen. Abbruch oder Speicherfehler lassen ihn geöffnet.
- Nach dem Schließen des letzten Rohrs steht wieder ein leeres Zeichenfeld bereit.

### Einzelne Isometrien unabhängig vom Projekt speichern

- „Isometrie speichern“ bietet „Als Datei speichern“ und „Im Projekt speichern“ an.
- Der Name der Isometrie kann vor dem Speichern eingegeben oder geändert werden.
- Einzelne Rohrzeichnungen lassen sich ohne Projekt als eigene Datei mit der Endung .rohrplan.json speichern.
- Die Datei enthält Rohrdatensatz, Strecken, Offset-Maße, vorgegebene Offset-Winkel und die Ansicht.
- In der Windows-App wird der Speicherort über einen Dateidialog ausgewählt.
- Im Browser wird die Datei über den verfügbaren Speichermechanismus gespeichert; ohne Dateidialog wird sie heruntergeladen.
- „Isometrie öffnen“ lädt eine einzelne Datei in einen eigenen Rohr-Tab, sofern bereits ein Rohr geöffnet ist.
- Projekte bleiben optional, um mehrere Isometrien gemeinsam zu verwalten.
- Strg+S öffnet die neue Speicherauswahl.

### Offset-Winkel beim Bemaßen vorgeben

- Jeder Offset hat beim Bemaßen ein optionales Winkelfeld. Die frühere Winkelauswahl oberhalb des Zeichenfelds entfällt.
- Ohne Winkelvorgabe bleiben R und H frei eingebbar; bei 3D kommt V hinzu.
- Mit Winkelvorgabe wird R aus H, gegebenenfalls V und der ankommenden Rohrrichtung berechnet.
- R wird bei aktiver Winkelvorgabe als berechnetes Feld angezeigt und kann nicht direkt verändert werden.
- Berechnetes R wird auf eine Nachkommastelle gerundet.
- Wird das Winkelfeld geleert, ist R wieder frei bearbeitbar.
- Dieselbe Winkelvorgabe ist auch unter „Strecken bearbeiten“ verfügbar.
- Winkel müssen größer als 0° und kleiner als 90° sein. Nicht passende Kombinationen aus Maßen, Winkel und Rohrrichtung werden mit einem Hinweis angezeigt.

## Verbesserungen an der Zeichnung

### Zeichenfeld und Orientierung

- Der Hintergrund des Zeichenfelds ist schwarz.
- Die Punktewolke ist grün, transparenter und mit kleineren Punkten dargestellt.
- Die sichtbaren Rasterpunkte haben größere Abstände. Die Auswahl der Zeichenrichtungen bleibt davon unabhängig.
- Die Ansicht lässt sich weiterhin mit gedrückter mittlerer Maustaste drehen und kehrt beim Loslassen zur ISO-Ausgangsansicht zurück.
- Verschieben mit Shift und mittlerer Maustaste sowie Zoomen mit dem Mausrad bleiben verfügbar.

### Biegedaten-Skizze

- Die Rohrskizze in den Biegedaten verwendet eine feste isometrische Darstellung auf weißem Hintergrund.
- Rohrverlauf, Anfang und Ende sowie Maßbeschriftungen sind deutlicher dargestellt.
- Die Skizze wird anhand des Rohrverlaufs und der Offset-Konstruktionen in den verfügbaren Bereich eingepasst.
- Maßbeschriftungen werden horizontal und mit Abstand zu benachbarten Beschriftungen und Rohrstrecken angeordnet.
- Fehlende Maße werden als offene Angaben dargestellt, statt als 0 mm.
- 2D-Offsets erhalten schraffierte Konstruktionsflächen. Ihre Anordnung berücksichtigt umliegende Rohrstrecken.
- 3D-Offsets erhalten einen gestrichelten Konstruktionskasten, der die drei räumlichen Komponenten verdeutlicht.
- Die versuchsweise eingeführten Drehbedienelemente für diese Skizze wurden wieder entfernt.

### PDF-Ausgabe unter Windows

- Die Windows-App erstellt die Biegedaten über die PDF-Funktion von Electron.
- Ein Speicherdialog legt den Zielort fest; die erzeugte PDF wird anschließend geöffnet.
- Im Browser wird weiterhin der Druckdialog verwendet.

## Fehlerkorrekturen und Bedienungsänderungen

- **Offset-Winkel:** Die Berechnung bezieht sich auf die tatsächlich ankommende Rohrrichtung. Dadurch wird eine Winkelvorgabe nicht mehr allein anhand der Hilfsachse H interpretiert, was je nach Rohrverlauf den ergänzenden Winkel liefern konnte.
- **H-/R-Beschriftung:** Die sichtbaren Bezeichnungen wurden entsprechend der vereinbarten Zuordnung getauscht. Bestehende interne Datenfelder bleiben für die Dateikompatibilität erhalten.
- **C bei 2D:** Die zusätzliche C-Maßbeschriftung wird bei 2D-Offsets ausgeblendet. Bei 3D bleibt sie sichtbar.
- **2D-Offset abschließen:** Nach dem ersten Rechtsklick kann der seitliche Versatz mit Linksklick als 2D-Offset abgeschlossen werden, ohne zusätzlich eine gerade Strecke anzulegen.
- **Nach 3D weiterzeichnen:** Nach einem 3D-Offset stehen wieder alle Achsrichtungen zur Verfügung.
- **Nach Rückgängig weiterzeichnen:** Die Richtung eines zurückgenommenen Zeichenschritts wird wieder freigegeben.
- **Gerade Strecke verlängern:** Die gleiche Richtung kann erneut gewählt werden. Die vorhandene gerade Strecke wird verlängert, statt einen zusätzlichen Punkt und eine weitere Strecke anzulegen.
- **Bemaßung nach Verlängerung:** Die bisherige Länge der verlängerten Strecke wird zur erneuten Eingabe freigegeben. Rückgängig stellt den vorherigen Verlauf und das vorherige Maß wieder her.

## Hinweise zum Update

- Die automatische Wiederherstellung der Tabs erfolgt im lokalen Speicher der jeweiligen Installation beziehungsweise des jeweiligen Browsers.
- Für Austausch und dauerhafte Ablage können einzelne Isometrien oder Projekte zusätzlich als Dateien gespeichert werden.
- Die installierte Windows-App prüft beim Start und anschließend alle sechs Stunden auf Updates.
