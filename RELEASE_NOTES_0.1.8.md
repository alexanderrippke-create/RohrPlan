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
