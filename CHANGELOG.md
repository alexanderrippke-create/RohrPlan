# RohrPlan 1.0.0 – Neue Oberfläche und Maschinenverwaltung

- CAD-Werkzeugleiste, linke Projekt-/Rohrübersicht und direkte Ansichtstasten.
- Graublaue Dialoge einschließlich der dynamisch erzeugten Kollisionsprüfung im Simulator.
- Mehrere Maschinen über die Maßskizze anlegen, bearbeiten und auswählen.
- Projektordner unter Dokumente\RohrPlan und gemeinsame Rohrdaten mit Sicherung unter Stammdaten.
- Dynamischer Rollen-Ø = 2 × Biegeradius, 3D-Rolle und Zylinderbox von 2 × R bis W.
- Enthält die bisher lokal bereitgestellten Änderungen aus 0.1.8 und 0.1.9.

# RohrPlan 0.1.9 – Rohrdaten im gemeinsamen Stammdaten-Ordner

- Rohrdatensätze dauerhaft unter Dokumente\RohrPlan\Stammdaten ablegen; vor Änderungen die vorherige Datei als .bak sichern.
- Bestehende Daten aus dem jeweiligen lokalen Speicher beim ersten Anlegen der Datei übernehmen.
- Windows-App und Browserversion mit freigegebenem Standardordner verwenden dieselbe Rohrdaten-Datei.
- Stammdaten-Ordner aus der Projektliste ausblenden und den Namen für die Rohrdaten reservieren.
- Unlesbare Daten melden und vor Überschreiben schützen.

# RohrPlan 0.1.8 – Mehrere Maschinen in den Stammdaten

- Projektdatei-Ablauf entfernt: Standardordner Dokumente\RohrPlan; jeder Unterordner ist ein Projekt. Isometrien liegen als einzelne Dateien darin.
- Projektordner anlegen und auswählen; Ordner und Isometrien aus dem Explorer mit „Liste aktualisieren“ einlesen.
- Neue Maschine mit eigenem Namen, Hersteller, Rohrmittellinienhöhe und Biegerichtung anlegen.
- Maschinenmaße direkt in der Maßskizze eintragen, speichern und später bearbeiten.
- Aktive Maschine in den Stammdaten auswählen. Die Auswahl und alle Maschinenmaße bleiben lokal gespeichert.
- Die vorhandene TUBOBEND 48 mit den bestätigten Maßen bleibt erhalten. Bisherige Höhe und Biegerichtung werden übernommen.
- Simulator und Kollisionsprüfung verwenden dasselbe Modell der ausgewählten Maschine. Simulationsdateien enthalten eine Kopie der Maschinenmaße.
- Biegerolle als 3D-Zylinder mit Deckfläche und schattierter Seitenfläche; Durchmesser folgt dem Rohrdatensatz, Höhe bleibt schematisch.
- Rollen-Ø automatisch aus dem ausgewählten Rohrdatensatz: 2 × Biegeradius; kein festes Maschinenmaß mehr.
- Zylinderbox beginnt 2 × Biegeradius ab Rollenmitte und endet bei W. Der schmale Arm bleibt separat in der Kollisionsprüfung.
- Maßskizze aus dem Simulator entfernt; sie gehört jetzt zur Maschinenverwaltung.

Die Skizze und das Modell beschreiben waagerechte Biegemaschinen mit der gezeigten Anordnung. Räumliche Simulation und Maschinenkontaktprüfung unterstützen weiterhin Biegungen im Uhrzeigersinn. Die Prüfung verwendet vereinfachte Außenhüllen; genaue Spannbacken, Rahmenstützen und Armrücklauf sind weiterhin nicht erfasst.

# RohrPlan 0.1.7 – Simulator startet wieder

- JavaScript-Syntaxfehler in der Modellvorschau behoben. Ein verbliebener Teil des alten Maschinen-Datenblocks verhinderte in Version 0.1.6 den Start des Simulators.
- Die bestätigte ISO-Ansicht, Biegearmorientierung und Maschinenmaße bleiben erhalten.

# RohrPlan 0.1.6 – Biegesimulation und Kollisionswarnungen

- Biegesimulation mit Vorschub, Futterdrehung und Biegen im vereinfachten TUBOBEND-48-Modell.
- Maschinenkontakte pro Biegung mit Bauteil und Bewegung in der Biegedaten-Tabelle und im PDF.
- Ereignisliste, markierte Rohrstellen und optionales Anhalten bei Warnungen in der Simulation.
- Bodenprüfung, Umkehren der Biegefolge und Vergleich beider Richtungen anhand des Bodenabstands.
- Korrigierte ISO-Projektion und Biegearmorientierung; gemeinsame Ablaufgeometrie für Tabelle und Vorschau.
- Gemessene Maschinenmaße und alle benötigten Laufzeitdateien im Installer.
- Unvollständige Prüfungen werden gekennzeichnet. Maschinenprüfung gegen vereinfachte Außenhüllen, bislang im Uhrzeigersinn; genaue Spannbacken, Rahmenstützen und Armrücklauf fehlen noch.

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

# RohrPlan 0.1.4

## Neu in dieser Version

- **STEP-/STP-Import:** Unterstützte analytische Rohrmodelle werden jetzt in gerade Rohrstücke und Bögen zerlegt. Für passende vorhandene Rohrdatensätze zeigt RohrPlan die Biegefolge, Biegepositionen und Futterstellungen an. Wandstärke und Biegeradius werden dabei auf volle Millimeter gerundet.
- **Einspannzugabe beim STEP-Import:** Die Sägelänge berücksichtigt nun auch die Einspannzugabe bis zur Mindest-Einspannlänge.
- **Strecken nachträglich bearbeiten:** Gerade Rohrstücke lassen sich in Länge und Richtung ändern. Bei Offsets können R, H, V und die Achsrichtungen angepasst werden.
- **Maße direkt ändern:** Ein Doppelklick auf eine Maßzahl in der Zeichnung öffnet das Eingabefeld. Enter und Tab übernehmen den Wert und führen zum nächsten Maß.
- **Rückgängig und Wiederherstellen:** Änderungen und Zeichenschritte können über die Schaltflächen oder mit Strg+Z, Strg+Y und Strg+Umschalt+Z zurückgenommen bzw. wiederhergestellt werden.
- **Windows-Tastenkürzel:** Strg+S speichert, Strg+O öffnet die Projektverwaltung, Strg+N beginnt ein neues Rohr und Strg+P öffnet die Biegedaten-Druckansicht.
- **Übersichtlichere Werkzeugleiste:** Die Bedienelemente sind nach Datei/Projekt, Rohrplanung und Bearbeiten gruppiert und passen sich schmaleren Fenstern an.
- **Druckansicht:** Die Biegedaten sind für den Ausdruck als einseitiges A4-Blatt im Hochformat kompakter angeordnet.

## Verbesserungen und Korrekturen

- Die STEP-Erkennung liest Bezugspunkte und Achsen jetzt unabhängig von ihrer Reihenfolge in der CAD-Datei ein. Dadurch werden die mitgelieferten Rohrmodelle zuverlässig erkannt.
- Der STEP-Import erzeugt nur dann Biegedaten, wenn ein passender Rohrdatensatz mit gleichem Durchmesser sowie passender, auf volle Millimeter gerundeter Wandstärke und passendem Biegeradius vorhanden ist. Nicht unterstützte CAD-Geometrien bleiben als 3D-Vorschau sichtbar.
- Der STEP-Leser und seine Laufzeitdateien sind jetzt im Windows-Installationspaket enthalten.

## Hinweis zum STEP-Import

Die automatische Ableitung ist für Rohrmodelle aus geraden zylindrischen Abschnitten und torusförmigen Bögen vorgesehen. Beliebige STEP-Bauteile oder Freiformflächen können weiterhin nur als 3D-Vorschau angezeigt werden.
