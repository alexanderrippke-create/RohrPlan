# RohrPlan 1.0.1

## Biegerichtung aus den Stammdaten

- Simulation unterstützt jetzt Biegungen im Uhrzeigersinn und gegen Uhrzeigersinn.
- Die Biegerichtung der ausgewählten Maschine wird direkt aus den Stammdaten übernommen. Rolle, Bett, Arm und Zylinder folgen der jeweiligen Anordnung.
- Bodenprüfung und Maschinenkontakte berücksichtigen denselben Bewegungsablauf. Bei Änderungen der Maschine werden die Ergebnisse neu berechnet.

## Futterdrehrichtung je Maschine

- Unter **Stammdaten → Maßskizze / Maschine bearbeiten** gibt es die eigene Auswahl **Futterdrehung bei positiven Winkeln**.
- Uhrzeigersinn oder Gegen Uhrzeigersinn, vom Futter zur Biegerolle gesehen.
- Die Auswahl gilt direkt für Simulation, Bodenprüfung, Maschinenkontakte und Biegefolge-Empfehlung. Das Futter nimmt den kürzesten Weg zur nächsten Stellung.
- Bereits gespeicherte Maschinen behalten die bisherige Einstellung Uhrzeigersinn. Simulationsdateien enthalten die gewählte Einstellung.

## Neues App-Symbol

- RohrPlan-Logo mit einem metallischen Rohr als R auf einer graublauen Kachel.
- Eigenes Windows-Programm-, Desktop-, Installer- und Deinstallationssymbol sowie Browser-Favicon.

Die Kollisionsprüfung verwendet weiterhin vereinfachte Maschinenformen. Genaue Spannbacken, Rahmenstützen und Armrücklauf sind noch nicht erfasst.

## Installation und Update

Die installierte App prüft beim Start auf Updates. Alternativ **RohrPlan-Setup-1.0.1.exe** herunterladen und installieren.
