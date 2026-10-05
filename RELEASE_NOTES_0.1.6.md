# RohrPlan 0.1.6 – Biegesimulation und Kollisionswarnungen

## Neu

- **Biegesimulation:** Gezeichnete Rohre lassen sich direkt mit Vorschub, Futterdrehung und Biegen auf dem vereinfachten TUBOBEND-48-Modell abspielen.
- **Maschinenkontakte in den Biegedaten:** Eine zusätzliche Spalte nennt mögliche Kontakte pro Biegung mit Bauteil und Bewegung. Erfasst werden Maschinenbett, Spannfutter, Rahmenoberkante und die Außenhülle von Arm und Zylinder.
- **Warnungen in der Simulation:** Betroffene Rohrstellen werden markiert. Die Ereignisliste erlaubt das Aufrufen der jeweiligen Stellung; auf Wunsch hält der Ablauf bei einer Warnung an.
- **Bodenprüfung und Biegefolge:** Bodenberührungen und Drehhinweise stehen in den Biegedaten. Die Biegefolge lässt sich umkehren; die Empfehlung vergleicht die beiden Richtungen anhand der Bodenprüfung.
- **PDF-Bericht:** Maschinenwarnungen werden mit ausgegeben. Der Export wartet auf die Prüfung; unvollständige Prüfungen werden ausdrücklich gekennzeichnet.
- **Maschinenmaße:** Das Modell verwendet die eingetragenen TUBOBEND-48-Maße. Rohrmittellinienhöhe und Biegerichtung sind in den Stammdaten einstellbar.

## Korrekturen

- ISO-Projektion und Orientierung des Biegearms in der Modellvorschau korrigiert.
- Biegedaten und Modellvorschau verwenden dieselbe Ablaufgeometrie und dieselbe Maschinenprüfung.
- Ergebnisse werden nach Änderungen der Rohrform, Biegefolge oder Maschinendaten neu berechnet; veraltete Berichte werden verworfen.
- Die benötigten Simulations- und Modelldateien sind im Windows-Installer enthalten.

## Umfang der Kollisionsprüfung

Die Maschinenprüfung verwendet vereinfachte Außenhüllen und meldet mögliche Kontakte als Warnungen. Genaue Spannbacken, Zylinderkonturen, Rahmenstützen, Öffnen und Schließen der Maschine sowie der Armrücklauf sind noch nicht erfasst. Das gemessene Maschinenmodell gilt für das Biegen im Uhrzeigersinn; Maschinenkontakte in Gegenrichtung werden als nicht geprüft gekennzeichnet. Die Empfehlung zur Biegefolge berücksichtigt bislang den Bodenabstand.

## Update

Die installierte Windows-App prüft beim Start und danach alle sechs Stunden auf Updates. Der Windows-Installer kann auch direkt von dieser Release heruntergeladen werden.
