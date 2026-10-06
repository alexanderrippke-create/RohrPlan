# RohrPlan 1.0.0

## Neue Oberfläche

- Werkzeugleiste mit den Bereichen Datei, Zeichnen, Biegen und Ansicht.
- Einblendbare linke Übersicht für Projekt, geöffnete Rohre, Rohrdatensatz und Maschine.
- Direkte Ansichtstasten für ISO, Alles anzeigen, Zoom und Raster.
- Einheitliche graublaue Gestaltung für Projektverwaltung, Biegedaten, Stammdaten, Maßskizze und Simulation einschließlich Kollisionsprüfung.

## Projekte und Rohrdaten

- Standardordner: Dokumente\RohrPlan. Jeder Unterordner außer Stammdaten ist ein Projekt; Isometrien liegen als einzelne Dateien darin.
- Projektordner anlegen, auswählen und mit dem Windows-Explorer angelegte Dateien über „Liste aktualisieren“ einlesen.
- Rohrdatensätze unter Dokumente\RohrPlan\Stammdaten\Rohrdatensaetze.json speichern. Vor Änderungen wird die vorherige Datei als .bak gesichert.
- Windows-App und Browserversion mit freigegebenem Standardordner verwenden dieselbe Rohrdaten-Datei. Vorhandene lokale Rohrdatensätze werden beim ersten Anlegen übernommen; unlesbare Daten werden vor Überschreiben geschützt.

## Maschinen und Simulation

- Mehrere Maschinen mit eigenem Namen, Hersteller, Rohrmittellinienhöhe, Biegerichtung und Maßen anlegen und in den Stammdaten auswählen.
- Maschinenmaße direkt in der Maßskizze eintragen und bearbeiten; die Skizze gehört zur Maschinenverwaltung.
- Simulation und Maschinenkontaktprüfung verwenden dasselbe Modell der ausgewählten Maschine. Kontakte werden pro Biegung in den Biegedaten und im PDF aufgeführt.
- Biegerolle als 3D-Zylinder darstellen; Rollen-Ø = 2 × Biegeradius des ausgewählten Rohrdatensatzes.
- Zylinderbox beginnt 2 × Biegeradius ab Rollenmitte und endet bei W. Der schmale Arm wird separat berücksichtigt.

## Umfang der Maschinenprüfung

Die räumliche Simulation und Maschinenkontaktprüfung unterstützen Biegungen im Uhrzeigersinn und verwenden vereinfachte Außenhüllen. Genaue Spannbacken, Zylinderkonturen, Rahmenstützen und Armrücklauf sind noch nicht erfasst. Die Rollenhöhe bleibt schematisch.

## Windows-Update

Der Installer aktualisiert die vorhandene RohrPlan-Installation. Die installierte App sucht automatisch nach Updates; diese Veröffentlichung enthält Installer, Blockmap und latest.yml.
