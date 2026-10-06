# Agenda: weitere Entwicklung der Rohrplanungssoftware

**Grundlage:** `zeichenfeld.html` mit dem isometrischen Zeichenfeld, Offsetkasten, später Bemaßen, Ansicht drehen, verschieben und zoomen.

**Ziel:** Die nächsten Planungsgespräche so strukturieren, dass wir erst den Ablauf und die benötigten Daten klären und anschließend die passende technische Lösung auswählen.

## Aktueller Stand · 03.10.2026

### Umgesetzt

- [x] Isometrisches Zeichenfeld mit schwarzem Hintergrund und dezenter grüner Punktewolke.
- [x] 2D- und 3D-Offsets; nach einem Offset und nach Rückgängig weiterzeichnen.
- [x] Gerade Strecken in gleicher Richtung verlängern, ohne einen zusätzlichen Punkt anzulegen.
- [x] Bemaßen, Maße direkt ändern und einzelne Strecken bearbeiten.
- [x] Optionalen Offset-Winkel beim Bemaßen eingeben; R daraus berechnen und auf eine Nachkommastelle runden. Ohne Winkel bleiben R und H frei eingebbar.
- [x] Offset-Winkel auf die ankommende Rohrrichtung beziehen; C nur bei 3D anzeigen.
- [x] Biegedaten mit isometrischer Skizze, Schraffur für 2D-Offsets und Kasten für 3D-Offsets.
- [x] Ansicht mit mittlerer Maustaste drehen und beim Loslassen zur ISO-Ansicht zurückkehren.
- [x] Rückgängig und Wiederherstellen.
- [x] Shortcuts mit F1-Übersicht: Bemaßen, Biegedaten, Simulation, Streckenbearbeitung, Stammdaten und ISO-Ansicht; Start/Pause und Zurücksetzen in der Simulation.
- [x] Mehrere Rohre in Tabs bearbeiten und nach Neuladen wiederherstellen.
- [x] Tabs mit × schließen; bei ungespeicherten Änderungen Speichern, ohne Speichern schließen oder Abbrechen anbieten.
- [x] Einzelne Isometrien als eigene JSON-Dateien speichern und öffnen; vom Anwender als funktionierend bestätigt.
- [x] Projekte optional zum Sammeln mehrerer Isometrien verwenden.
- [x] Lokale Rohrdatensätze mit Durchmesser, Wandstärke, Biegeradius und Kalibrierung anlegen und auswählen.
- [x] Sägelänge, Biegefolge, Biegepositionen und Futterstellungen berechnen.
- [x] Druckansicht/PDF-Ausgabe und STEP-Import implementieren.

**Rückmeldung des Anwenders:** Der aktuelle Stand wurde ausprobiert und als funktionierend bestätigt. Eine dokumentierte fachliche Abnahme anhand bekannter Beispielrohre bleibt als eigener Schritt vorgesehen.

**Veröffentlichung:** Version 0.1.5 wurde am 03.10.2026 auf GitHub als aktuelles Windows-Update veröffentlicht, einschließlich Installer, Blockmap und latest.yml. Ausführliche Patch Notes stehen in RELEASE_NOTES_0.1.5.md und auf https://github.com/alexanderrippke-create/RohrPlan/releases/tag/v0.1.5.

### Ergänzungen nach Veröffentlichung von 0.1.5

- Maschine des Anwenders: Tracto-Technik TUBOBEND 48. Für zusätzliche Kollisionen am Maschinenkörper werden Maße relativ zur Biegerollenachse und der tatsächlichen Ausrüstung benötigt; Prospekt-Außenmaße reichen dafür nicht aus.
- Maschinendaten für waagerechte Biegeebene ergänzt: Rohrmittellinienhöhe standardmäßig 1150 mm, in den Stammdaten änderbar und lokal gespeichert.
- Biegerichtung von oben gesehen in den Stammdaten auswählbar.
- Bodenprüfung entlang der geometrischen Fertigungsfolge einschließlich Rohrdurchmesser und Futterdrehung. Bodenkontakt während der Drehung ergibt einen Hinweis; Bodenkontakt in der Biegestellung ergibt einen Fehler „In dieser Biegerichtung nicht biegbar“. Keine Prüfung gegen Maschinenbauteile.
- Biegefolge über „Vom anderen Ende biegen“ umkehrbar. Biegepositionen, Futterstellungen, Einspannzugabe und Bodenhinweise werden für die umgekehrte Fertigungsreihenfolge neu berechnet; der gezeichnete Verlauf bleibt erhalten. Die Auswahl wird im Tab und in Isometrie-Dateien gespeichert.
- Beide Biegefolgen werden bei Änderungen automatisch verglichen. Empfehlung nach weniger Bodenwarnungen, weniger Drehhinweisen und größerem Mindestabstand; per Schaltfläche übernehmbar. Gleichwertige Ergebnisse werden entsprechend gekennzeichnet.
- Diese Ergänzungen sind lokal implementiert und noch nicht als Windows-Update veröffentlicht. Fachlicher Vergleich mit Beispielrohren steht aus.

### Biegesimulation und Maschinenmodell

- [x] Grobe Messdaten übernommen: TUBOBEND_48_Messdaten.json und TUBOBEND_48_Maschinenmodell.json.
- [x] Messblatt mit Skizzen, Eingabefeldern und JSON-Export: TUBOBEND_48_Messblatt.html.
- [x] Drehbare Maschinenvorschau mit korrigierter Arm-Grundstellung und Drehrichtung: TUBOBEND_48_Modellvorschau.html.
- [x] Erste Demo-Biegung für Rohr Ø 25 mm und Mittellinienradius 50 mm; vom Anwender als funktionierend bestätigt.
- [x] Mehrere Biegungen aus einer Simulationsdatei mit Vorschub, Futterdrehung, Start/Pause, Zurücksetzen und Ablaufregler darstellen.
- [x] Simulation direkt in der Browser-App öffnen; aktives bemaßtes Rohr automatisch übernehmen.
- [x] Bodenabstand in der Simulation anzeigen: Drehkontakt als gelber Hinweis, Kontakt beim Biegen als roter Fehler. Unterscheidung vom Anwender bestätigt.
- [ ] Maschinenmaße am Montag, 05.10.2026, genau messen und Fotos mit eingetragenen Maßen bereitstellen (vom Anwender geplant).
- [ ] Insbesondere Q, V und W abgleichen: 400 mm Armreichweite gegenüber 250 mm bis zur Kopfkante in der korrigierten Grundstellung.
- [ ] Rollenlage, Werkzeugnut, Armquerschnitt, Spannbacken, Rahmen und Futter-Verfahrbereich anhand der Messungen bestätigen.
- [ ] Modell und Bewegungsfolge anhand der tatsächlichen Maschine korrigieren; anschließend Maschinenkollisionen über den gesamten Ablauf ergänzen.

**Bezugspunkt:** Rohrmittellinie am Tangentenpunkt zu Beginn der Biegung. Die Rollenlage wird daraus abgeleitet und ist im aktuellen Modell vorläufig. Futterbewegung und Werkzeugdarstellung sind vereinfacht. Die Simulation ist noch keine vollständige Maschinen-Kollisionsprüfung.

### Werkzeugdaten · Grunddatensatz bereits umgesetzt

- [x] Rohr-/Werkzeuggrunddatensatz mit Rohrdurchmesser, Wandstärke und Mittellinien-Biegeradius anlegen und auswählen. Ein zusätzlicher Grunddatensatz muss dafür nicht erneut angelegt werden.
- [x] Biegeversuch und Kalibrierung im Rohrdatensatz hinterlegen.
- [x] Rollen-Ø automatisch aus dem ausgewählten Rohrdatensatz ableiten: 2 × Biegeradius.
- [x] Zylinderbox ab Rollenmitte bei 2 × Biegeradius beginnen lassen; äußeres Ende bleibt W. Der schmale Arm wird separat berücksichtigt.
- [x] Diese Geometrie in Simulation und Maschinen-Kollisionsprüfung verwenden.
- [x] Rohrdatensatz einschließlich Radius und Kalibrierung mit der Isometrie speichern.
- [x] Biegerolle als 3D-Zylinder darstellen; die Rollenhöhe ist weiterhin schematisch.
- [ ] Bestehenden Datensatz bei Bedarf um Werkzeugnummer/Name, Spannbackenmaße und Mindest-Einspannlänge ergänzen. Der maximale Schwenkwinkel ist bereits je Maschine gespeichert; eine zusätzliche Grenze je Werkzeug bleibt offen.
- [ ] Zusätzliche Werkzeugmaße ebenfalls mit der Isometrie festhalten, sobald sie im Datensatz vorhanden sind.

Stand 05.10.2026: Mehrere Maschinen können in den Stammdaten angelegt, über die Maßskizze bearbeitet und ausgewählt werden. Simulator und Kollisionsprüfung verwenden die ausgewählte Maschine. Auf ausdrücklichen Wunsch wurde die installierte Windows-App am 05.10.2026 lokal auf Version 0.1.8 aktualisiert; eine Veröffentlichung auf GitHub steht noch aus.

### Projektordner · Stand 05.10.2026

- [x] Standardordner unter Windows-Dokumente: RohrPlan. Die Windows-App legt ihn automatisch an.
- [x] Jeder direkte Unterordner außer Stammdaten ist ein Projekt; Ordner im Programm oder im Windows-Explorer anlegen.
- [x] Projektordner auswählen, Isometrien als einzelne Dateien speichern und wieder öffnen. Die Dateiliste nach Explorer-Änderungen aktualisieren.
- [x] Separaten Projektdatei-Download und Projektdatei-Import aus der Bedienoberfläche entfernen. Vorhandene Dateien werden nicht gelöscht.
- [x] Im Browser den Standardordner einmal freigeben; in der Windows-App direkt nutzen.
- [x] Lokales Updatepaket 0.1.8 gebaut und in der installierten Windows-App eingespielt. Installierte Quelldateien stimmen mit dem aktuellen Projekt überein.
- [ ] Ordnerablauf im Browser und in der Windows-App fachlich bestätigen.

### Rohrdaten und Sicherungen · Stand 05.10.2026

- [x] Bisherige Rohrdatensätze Ø 10 × 1 / R 20 und Ø 25 × 3 / R 50 aus dem bisherigen Browserspeicher wiederhergestellt.
- [x] Rohrdaten und Sicherungen unter Dokumente\RohrPlan\Stammdaten ablegen; vorherigen Stand vor Änderungen als .bak sichern.
- [x] Lokales Korrekturupdate 0.1.9 in der Windows-App installiert. Installierte Dateien stimmen mit den aktuellen Quellen überein.
- [ ] Fachliche Bestätigung der Rohrdatenauswahl; Browserversion verwendet die Datei nach Freigabe des Standardordners.

### Nächste Schritte

1. [ ] Bekannte Beispielrohre für die fachliche Abnahme festlegen: gerade Strecke, 90°-Biegung, 2D-Offset und 3D-Offset.
2. [ ] Offset-Winkel und R vergleichen, besonders bei 5°, 30° und 45° sowie unterschiedlichen ankommenden Richtungen.
3. [ ] Sägelänge, Einspannzugabe, Biegepositionen und Futterstellungen mit den erwarteten Fertigungswerten vergleichen.
4. [ ] Druck/PDF unter Windows mit vollständig bemaßten Beispielrohren prüfen.
5. [ ] Rohr-Stammdaten bearbeiten sowie sichern und wiederherstellen können.
6. [ ] Pflichtangaben und optionale Angaben festlegen: Rohrname, Teilenummer, Werkstoff, Datum und Notizen.
7. [ ] Umfang der ersten freigegebenen Windows-Version und weitere Exportformate entscheiden.

Die folgenden Abschnitte bleiben als fachliche Planungsliste erhalten. Bereits entschiedene Punkte sind entsprechend angepasst.

## 1. Umfang der ersten Programmversion

- Einzelne Rohre planen; keine Rohrnetze oder Anlagenisometrien.
- Für manuelle Rohrbiegemaschinen; zunächst keine Maschinensteuerung.
- Festlegen, welche Funktionen in die erste nutzbare Version gehören.
- Festlegen, was ausdrücklich erst später dazukommt.

## 2. Arbeitsablauf des Anwenders

- Neues Rohr in einem eigenen Tab anlegen; ein Projekt ist optional.
- Rohr räumlich im Zeichenfeld zeichnen.
- 2D- und 3D-Offsets mit der vereinbarten Rechtsklickfolge erstellen.
- Rohrverlauf fertigstellen und anschließend bemaßen.
- Werte mit Enter der Reihe nach eingeben und korrigieren.
- Einzelne Isometrie oder Projekt speichern, wieder öffnen und weiterbearbeiten.
- Rohr über × schließen; ungespeicherte Änderungen vorher speichern oder bewusst verwerfen. „Neues Rohr“ öffnet einen weiteren Tab.

## 3. Welche Daten ein Rohr benötigt

Gemeinsam festlegen, welche Angaben Pflicht sind und welche optional bleiben:

- Projektname, Rohrname oder Teilenummer, Datum und Notizen.
- Rohrwerkstoff und Rohrabmessung, zum Beispiel Außendurchmesser und Wandstärke.
- Längen und Richtungen der einzelnen Strecken.
- Für jeden Offset: R und H sowie bei 3D zusätzlich V. Optional Winkel vorgeben und R berechnen; C nur bei 3D anzeigen, T ist die diagonale Rohrlänge.
- Biegeradius, Biegewinkel und Bezugspunkt des Biegeradius.
- Maßeinheit und Bezug der Längen, zum Beispiel Mittellinie oder Rohrende.
- Welche Angaben die Software berechnet und welche der Anwender eingibt.

**Fachlich zu klären:** Biegeradius, Rohrmittellinie, Biegezugabe und Abzug beeinflussen die Fertigungsmaße. Die verwendeten Regeln müssen wir gemeinsam festlegen, bevor die Software daraus Fertigungswerte berechnet.

## 4. Datenbank und Rohr-Stammdaten

Für die Rohrabmessungen wird eine Stammdatenbank benötigt:

- Rohrgrößen mit **Außendurchmesser** und **Wandstärke** in Millimetern hinterlegen.
- Beim Anlegen eines Rohrs eine passende Abmessung aus der Liste auswählen.
- Doppelte Kombinationen aus Außendurchmesser und Wandstärke verhindern.
- Festlegen, ob Anwender Rohrabmessungen selbst hinzufügen, ändern und deaktivieren dürfen.
- Klären, wie die erste Größenliste eingepflegt wird, zum Beispiel manuell oder über eine Importdatei.
- Bei gespeicherten Rohrprojekten die verwendeten Abmessungen festhalten, damit spätere Änderungen am Stammdatensatz alte Projekte nicht verändern.
- Werkstoff, Norm oder weitere Rohrmerkmale nur aufnehmen, wenn sie für Planung oder Fertigung benötigt werden.

Zusätzlich soll es eine Auswahl von **Biegemustern bzw. Biegeprofilen** geben:

- Profile sollen Längung und das Biegeverhalten bei unterschiedlichen Wandstärken berücksichtigen.
- Beim Rohr kann das passende Profil ausgewählt werden; zu klären ist, ob die Zuordnung nur über Wandstärke oder auch über Werkstoff, Durchmesser und Biegeradius läuft.
- Festlegen, welche Kennwerte ein Profil enthält, zum Beispiel Längung/Biegezugabe und gegebenenfalls Rückfederung.
- Bereits entschieden und umgesetzt: Für jeden Rohrdatensatz wird ein Biegeversuch hinterlegt und zur Kalibrierung verwendet.
- Profilwerte versionieren oder im Rohrprojekt mitspeichern, damit spätere Profiländerungen bestehende Projekte nicht stillschweigend verändern.

Zusätzlich ist zu klären, wo Projekte und die Rohr-Stammdaten gespeichert werden:

- Offene Rohr-Tabs bleiben beim Neuladen erhalten. Sicherungskonzept für Stammdaten und Dateien noch festlegen.
- Ein Projekt kann mehrere Isometrien enthalten; einzelne Isometrien sind unabhängig davon speicherbar.
- Soll die Software nur lokal auf einem Rechner laufen oder später auf mehreren Geräten?
- Werden Suche, Versionshistorie, Kunden- oder weitere Materiallisten benötigt?
- Wie werden Sicherungskopien erstellt und wiederhergestellt?
- Wie gehen wir mit späteren Änderungen am Datenformat um?

**Zu entscheidende Speicheroptionen:**

- **Projektdatei plus lokale Rohr-Stammdatenbank:** Projekte lassen sich einzeln kopieren; die Rohrgrößen werden zentral auf dem Rechner verwaltet.
- **Lokale Datenbank für Stammdaten und Projekte:** sinnvoll, wenn viele Projekte, Suche oder Historie dazukommen.
- **Online-Datenbank:** erst relevant, wenn mehrere Anwender oder Geräte dieselben Daten gemeinsam nutzen sollen.

Aktuell werden Rohr-Stammdaten lokal im Browser gespeichert. Isometrien lassen sich als einzelne JSON-Dateien speichern; Projekte sind optional. Noch offen sind ein dauerhaftes Stammdatenbanksystem, Datensicherung und mögliche spätere Formatänderungen.

## 5. Datenstruktur und Berechnungen

- Datenmodell für Projekt, Rohr, Strecken, Richtungen, Offsets und Biegungen festlegen.
- Datenmodell für Rohrgrößen mit Außendurchmesser und Wandstärke festlegen.
- Datenmodell und Berechnungsregeln für auswählbare Biegeprofile festlegen.
- Zeichnungsgeometrie von den eingetragenen Fertigungsmaßen trennen.
- Einheiten intern eindeutig behandeln und Rundungsregeln definieren.
- Regeln für Vorzeichen und Achsrichtungen bei R, H und V festlegen.
- Berechnung von C, T und Winkel anhand vereinbarter Beispiele prüfen.
- Festlegen, wie ungültige, fehlende oder widersprüchliche Werte angezeigt werden.

## 6. Ausgabe und Dokumentation

- Welche Informationen die fertige Zeichnung zeigen muss.
- Maßbeschriftungen und Rohrdaten auf der Zeichnung festlegen.
- Druckansicht und PDF-Export priorisieren.
- Prüfen, ob zusätzlich CSV, DXF oder eine Biegeliste gebraucht wird.
- Festlegen, ob Stückliste, Zuschnittlänge oder Biegefolge ausgegeben werden soll.

## 7. Bedienoberfläche und Arbeitskomfort

- Zeichnen, Bemaßen und Weiterzeichnen klar voneinander trennen.
- Auswahl, Änderung und Löschen einzelner Strecken festlegen.
- Rückgängig, Wiederherstellen und Zeichnung leeren abstimmen.
- Ansichten und Orientierungshilfe für X, Y und Z prüfen.
- Tastaturbedienung und eindeutige Hinweise für Mausaktionen festlegen.
- Umgang mit langen Rohren und vielen Strecken festlegen.

## 8. Technische Grundlagen

- Zielsystem festlegen: zunächst Windows oder zusätzlich weitere Plattformen.
- Entscheiden, ob die erste Version offline funktionieren muss.
- Technische Architektur und Programmiersprache nach den Anforderungen auswählen.
- Export, automatische Sicherung und Aktualisierung berücksichtigen.
- Datenschutz und Speicherort der Projektdaten festlegen.

## 9. Reihenfolge und Abnahme

1. Arbeitsablauf und Umfang der ersten Version abstimmen.
2. Eingabedaten und Fachbegriffe verbindlich festlegen.
3. Speicherbedarf klären und Projektdatei gegen Datenbank abwägen.
4. Berechnungsregeln für Offset und Biegung an Beispielen festhalten.
5. Ausgabeformate priorisieren.
6. Anforderungen in umsetzbare Arbeitsschritte aufteilen.
7. Jede Funktion anhand vereinbarter Beispielrohre abnehmen.

## Offene Entscheidungen für unser nächstes Gespräch

- Wird die Software anfangs nur auf einem Windows-Rechner verwendet?
- Müssen Projekte zwischen Rechnern ausgetauscht werden?
- Welche Rohrdaten sind für jedes Rohr zwingend erforderlich?
- Welche Kombinationen aus Außendurchmesser und Wandstärke sollen in die erste Größenliste?
- Dürfen Anwender Rohrgrößen selbst pflegen oder kommen sie aus einer zentral vorgegebenen Liste?
- Welche zusätzlichen Werkzeugmaße benötigen die Simulation und die Maschinen-Kollisionsprüfung? Der Biegeversuch ist bereits je Rohrdatensatz hinterlegt.
- Welche Biegeradien und Biegedaten sollen erfasst werden?
- Druck/PDF, Biegedaten und Zuschnittmaß sind implementiert. Werden zusätzlich CSV oder DXF benötigt?

### Bestätigung zur Messhilfe

- Der rechte Antriebszylinder schwenkt mit dem Biegearm mit (vom Anwender bestätigt). W wird bis zum äußersten Ende der gesamten bewegten Einheit einschließlich Zylinder gemessen.

### Kollisionsmaße vom 05.10.2026

- Exportierte M1–M7-Maße im Projekt gespeichert; Anwenderkorrekturen: linke Bettkante ab C 455 mm, Armbreite 40 mm.
- Maschinenmodell und Vorschau auf die neuen Maße aktualisiert: Reichweite 460 mm einschließlich Zylinder, Schwenkwinkel 190°, Futter Ø 125 × 200 mm.
- Bestätigte Draufsicht: Rohrzufuhr von links, C unterhalb von O, Arm/Zylinder bei 0° nach oben; Schwenkraum rechts.
- Die bewegte Einheit wird als konservative Außenhülle dargestellt. Einzelkonturen, Spannbacken, Zylinderlänge, Rahmenhöhe und Stützen fehlen noch; die Maschinen-Kollisionsprüfung ist weiterhin offen.

### Erste Maschinen-Kollisionsprüfung

- Biegesimulation prüft den Ablauf mit Vorschub, Futterdrehung und Biegen gegen die gemessenen Bettgrenzen, das Futter, die Rahmenoberkante und die bewegte Außenhülle.
- Rohrdurchmesser, Zwischenstellungen und ein konservativer Abstand für räumliche/zeitliche Näherungen werden berücksichtigt. Die gerade Rohrführung im Futter und der aktive Werkzeugkontakt werden ausgenommen.
- Mögliche Maschinenkontakte sind Warnungen: rote Markierung, Ereignisliste mit Biegungsnummer/Bewegung und automatisches Anhalten. „Weiter“ bestätigt die aktuelle Warnung für diesen Abspielvorgang; Zurücksetzen prüft sie erneut.
- Unvollständige oder abgebrochene Prüfungen werden ausdrücklich angezeigt und nicht als kollisionsfrei gewertet. Der Richtungsvergleich in den Biegedaten bleibt eine Bodenprüfung.
- Noch nicht erfasst: genaue Spannbacken, Zylinderkonturen, Rahmenstützen, Armrücklauf und Maschinenbewegungen zum Öffnen/Schließen.

### Maschinenkontakte in den Biegedaten

- Zusätzliche Tabellenspalte nennt mögliche Kontakte pro Biegung mit Bauteil und Bewegung (Vorschub, Futterdrehung, Biegen).
- Tabelle und Vorschau verwenden dasselbe gemessene Maschinenmodell, dieselbe Ablaufgeometrie und dieselbe Kollisionsprüfung.
- Prüfung startet beim Öffnen der Biegedaten und nach Änderungen der Biegefolge. Veraltete Ergebnisse werden verworfen; vollständige Berichte werden zwischengespeichert.
- PDF wartet auf den Bericht. Unvollständige Prüfungen und eine nicht unterstützte Gegenrichtung werden ausdrücklich gekennzeichnet.
- Bodenwarnungen bleiben sichtbar; zusätzliche Bodenereignisse aus dem vollständigen Bewegungsablauf werden ergänzt. Richtungsvergleich weiterhin nur nach Bodenabstand.


### Übersichtliche Oberfläche · Stand 06.10.2026

- [x] CAD-orientierte Werkzeugleiste mit den Bereichen Datei, Zeichnen, Biegen und Ansicht.
- [x] Linke Übersicht für Projekt, geöffnete Rohre, Rohrdatensatz und Maschine; ein- und ausblendbar.
- [x] Direkte Ansichtstasten für ISO, Alles anzeigen, Zoom und Raster.
- [x] Dunkle neutrale Flächen, größere Beschriftungen und zusammengehörige Werkzeuge.
- [x] Neue Aufteilung vom Anwender bestätigt und im Windows-Installer von Version 1.0.0 enthalten.
- [x] Projektfenster, Biegedaten, Simulation, Stammdaten und Maßskizze an die graublaue Oberfläche angepasst. Version 1.0.0 am 06.10.2026 auf GitHub als aktuelles Windows-Update veröffentlicht; Installer, Blockmap und latest.yml sind vorhanden. Release: https://github.com/alexanderrippke-create/RohrPlan/releases/tag/v1.0.0.
