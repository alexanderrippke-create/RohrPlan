# RohrPlan 1.1.0

## Räumliches Maschinenmodell in der Biegesimulation

- Die Simulation zeigt die Biegemaschine als schattiertes 3D-Modell mit verdeckten Kanten: Bett mit Rädern und Schaltkasten, Führungsbalken mit Schiene und Stützfüßen, Futter mit drehenden Backen, Futterschlitten mit Griff, Biegerolle, Spannbacke, Spannzylinder und Gleitschiene.
- Blick standardmäßig von der Bedienseite: Schaltkasten vorn, Biegekopf links, Rohr von rechts. Die Maßskizzen in den Stammdaten sind genauso ausgerichtet.
- Das Gehäuse hat die hintere Aussparung, den Absatz und die Nische unter der Rollenachse.
- Das Futter fährt mit dem Rohrende über den ganzen Führungsbalken mit; das Rohrende liegt an der Futterfläche hinter den Backen an.
- Ansicht drehen mit der linken Maustaste, verschieben mit Umschalt oder rechter Maustaste oder über den Knopf **Maus: Drehen / Verschieben**. Die geprüfte Außenhülle lässt sich ausblenden.

## Genauere Kollisionsprüfung

- Der Führungsbalken wird als Körper mit Höhe und seitlicher Lage geprüft, dazu Futterschlitten, Griff und Stützfüße.
- Aussparungen im Gehäuse werden berücksichtigt, sobald ihre Maße eingetragen sind.
- Für die TUBOBEND 48 sind die gemessenen Detailmaße hinterlegt.

## Neue Detailmaße je Maschine

- Unter **Stammdaten → Detailmaße eintragen** gibt es ein Eingabeblatt mit Skizzen für 14 zusätzliche Maße: Führungsbalken, Stützfüße, Futterschlitten, Spannzylinder und Gehäuse.
- Leere Felder sind erlaubt. Dann zeichnet die Vorschau mit Schätzwerten, und die Kollisionsprüfung rechnet an dieser Stelle vorsichtig mit der größeren Form.
- Das Blatt lässt sich drucken und als JSON-Datei sichern oder laden.

## Stammdaten bleiben beim Update erhalten

- Gespeicherte Maschinen, Rohrdatensätze und Projekte werden unverändert übernommen.
- Die bisherige Maschinenliste wird beim ersten Start zusätzlich einmalig als Sicherung abgelegt.
- Eine vorhandene TUBOBEND 48 ohne Detailmaße erhält automatisch die gemessenen Werte. Die übrigen Maße bleiben, wie sie gespeichert sind.

## Installation und Update

Die installierte Windows-App prüft beim Start auf Updates. Alternativ **RohrPlan-Setup-1.1.0.exe** herunterladen und installieren.

Die Kollisionsprüfung verwendet weiterhin vereinfachte Maschinenformen. Spannbacken und Armrücklauf sind nicht erfasst.
