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
- [x] Mehrere Rohre in Tabs bearbeiten und nach Neuladen wiederherstellen.
- [x] Tabs mit × schließen; bei ungespeicherten Änderungen Speichern, ohne Speichern schließen oder Abbrechen anbieten.
- [x] Einzelne Isometrien als eigene JSON-Dateien speichern und öffnen; vom Anwender als funktionierend bestätigt.
- [x] Projekte optional zum Sammeln mehrerer Isometrien verwenden.
- [x] Lokale Rohrdatensätze mit Durchmesser, Wandstärke, Biegeradius und Kalibrierung anlegen und auswählen.
- [x] Sägelänge, Biegefolge, Biegepositionen und Futterstellungen berechnen.
- [x] Druckansicht/PDF-Ausgabe und STEP-Import implementieren.

**Rückmeldung des Anwenders:** Der aktuelle Stand wurde ausprobiert und als funktionierend bestätigt. Eine dokumentierte fachliche Abnahme anhand bekannter Beispielrohre bleibt als eigener Schritt vorgesehen.

**Veröffentlichung:** Update 0.1.5 für die bestehende Windows-App vorbereitet; ausführliche Patch Notes stehen in RELEASE_NOTES_0.1.5.md. Die Veröffentlichung auf GitHub steht noch aus.

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
- Klären, ob die Profile aus vorhandenen Erfahrungswerten übernommen oder durch Probebiegungen eingemessen werden.
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
- Wie werden Längung und Wandstärkenverhalten beschrieben, und welche vorhandenen Biegeprofile oder Erfahrungswerte gibt es?
- Welche Biegeradien und Biegedaten sollen erfasst werden?
- Druck/PDF, Biegedaten und Zuschnittmaß sind implementiert. Werden zusätzlich CSV oder DXF benötigt?
