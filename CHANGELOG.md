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
