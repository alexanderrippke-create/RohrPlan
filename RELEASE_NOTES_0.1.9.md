# RohrPlan 0.1.9 – Rohrdaten und Sicherung

- Rohrdatensätze liegen jetzt in Dokumente\RohrPlan\Stammdaten\Rohrdatensaetze.json.
- Vor jeder Änderung wird die vorherige Datei als Rohrdatensaetze.json.bak gesichert.
- Die Windows-App liest diese Datei unabhängig von ihrem Installationsordner. Die Browserversion verwendet dieselbe Datei nach Freigabe des Standardordners.
- Bisherige lokal gespeicherte Datensätze werden übernommen, wenn noch keine Datei existiert.
- Der Stammdaten-Ordner erscheint nicht als Projekt. Unlesbare Daten werden gemeldet und nicht überschrieben.

Dieses Korrekturupdate wurde lokal erstellt. Eine Veröffentlichung auf GitHub ist noch nicht erfolgt.
