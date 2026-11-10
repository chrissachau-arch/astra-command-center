# ASTRA Command Center – Hermes Dashboard Plugin (v1.0)

Eine JARVIS-inspirierte Oberfläche für das **Hermes Web Dashboard** auf IONOS,
mit Agentenwechsel (`astra`, `tu-long`, `dozent-ki`, `ailunor`), Chat,
Spracherkennung und Sprachausgabe in Microsoft Edge/Chrome.

## Was tatsächlich funktioniert

- Eigener Dashboard-Menüpunkt **ASTRA Command Center** unter `/astra-command-center`.
- Direktes Schreiben an ein Hermes-Profil ohne externen API-Schlüssel im Browser.
- Deutschsprachige Mikrofon-Diktierfunktion (Browser-Web-Speech-API; Sprache kann von
  externen Browserdiensten verarbeitet werden).
- Sprachausgabe über vorhandene deutsche Windows-/Browser-Stimmen.
- Experimentelles „Hey Astra“ **nur solange die Seite geöffnet ist**.
- Vier Profile und Schnellbefehle; Links zum offiziellen Hermes-Chat.
- Sicherheitsstatus: Es werden keine erfundenen Antworten angezeigt.

## Wichtige Einschränkungen

1. **Der Dashboardserver muss den Hermes-CLI-Befehl ausführen können**.
   Das Plugin-Backend startet ein *nichtinteraktives* `hermes -p PROFIL -z PROMPT`.
   Falls dein verwalteter IONOS-Container das nicht erlaubt, zeigt die
   Oberfläche einen Hinweis und verlinkt auf den offiziellen Hermes-Chat.
2. Dieser Chat startet derzeit **pro Anfrage einen Hermes-Einzelaufruf**.
   Die letzten Nachrichten dieses Fensters werden als begrenzter Kontext
   mitgegeben, aber eine persistente originale Hermes-TUI-Sitzung wird **nicht** fortgesetzt.
3. Die Profile müssen in Hermes vorher tatsächlich angelegt sein.
4. „Hey Astra“ funktioniert nur bei offenem, aktivem Tab. Nicht systemweit
   und nicht bei einem ausgeschalteten PC/gesperrten Smartphone.
5. Jeder echte Hermes-Aufruf kann bei deinem KI-Anbieter Kosten verursachen.
6. Das Backend nutzt die vorhandene Dashboard-Anmeldung. Bitte aktiviere
   keine ungesicherte öffentliche Dashboard-Freigabe und installiere keine
   ungeprüften Plugins.

## Installation über die Hermes-Oberfläche (nach GitHub-Upload)

1. Entpacke das Paket und lege ein **eigenes privates oder öffentliches** GitHub-Repository an.
   Wenn du den bestehenden Hermes-Installer über `owner/repo` verwenden möchtest,
   muss dieses Repository die Inhalte des Unterordners `astra-command-center/`
   in seiner **Wurzel** enthalten: dort muss also der Ordner `dashboard/` liegen.
2. Öffne dein Hermes Dashboard → **PLUGINS**.
3. Im Bereich **INSTALL FROM GITHUB / GIT URL** trägst du die echte Repo-Adresse ein.
4. Aktiviere **Enable after install** und klicke auf **INSTALL**.
5. Aktualisiere das Dashboard und verwende gegebenenfalls **Rescan** oder
   „Restart Dashboard“ – der Menüpunkt **ASTRA Command Center** sollte erscheinen.

**Wichtig:** Für diesen Schritt gibt es noch **kein von uns hochgeladenes
GitHub-Repository**. Der GitHub-Link muss von dir erstellt werden. Ein ZIP
auf Google Drive lässt sich nicht als Git-URL installieren.

### Alternative ohne GitHub, mit Server-Dateimanager/SFTP

Kopiere den kompletten Ordner `astra-command-center` nach
`~/.hermes/plugins/astra-command-center/` auf dem Server, sodass es dort
`dashboard/manifest.json`, `dashboard/dist/index.js`, `dashboard/dist/style.css`
und `dashboard/plugin_api.py` gibt. Danach Dashboard neu starten bzw. Plugin-Rescan.

Bei IONOS-Container-Hosting kann das tatsächliche Hermes-Home ein anderes
Verzeichnis sein. Ein funktionierender Filemanager bzw. SSH/SFTP-Zugang ist nötig.

## Test

1. Im Dashboard den neuen Menüpunkt **ASTRA Command Center** anklicken.
2. Rechts oben auf **↻ STATUS** klicken. Bei `HERMES LIVE` wurde die CLI gefunden.
3. In Hermes unter **PROFILES** die Profile anlegen, falls sie fehlen.
4. Test: „Hallo Astra. Antworte mit einem Satz.“
5. Die Mikrofontaste drücken, den Mikrofonzugriff bestätigen und sprechen.
6. Bei Bedarf die Sprachausgabe über **STIMME AN/AUS** schalten.

Wenn ein Host den CLI-Aufruf nicht zulässt, verwende die Schaltfläche
**HERMES ORIGINAL-CHAT**. Die JARVIS-Seite bleibt dann eine Oberfläche zur
Navigation, nicht ein voller Chat-Ersatz.

## Sicherheit

- Das Python-Backend akzeptiert nur vier fest definierte Profilnamen,
  begrenzt Länge/Zeit und ruft kein Shell-Skript mit Benutzertext auf.
- Token/API-Schlüssel gehören nie in `dist/index.js` oder ein öffentliches Repository.
- Keine automatische Speicherung der Chatnachrichten in `localStorage`.
- Der Browser spricht ausschließlich mit dem bereits angemeldeten Dashboard.
- Der Code ist ein Ausgangspunkt. Teste alle Berechtigungen und Tools, bevor
  du sensible Mitglieder-/Kunden-/Gesundheitsdaten verwendest.

## Aufbau

```text
astra-command-center/
  dashboard/
    manifest.json
    plugin_api.py
    dist/
      index.js
      style.css
```

Offizielle SDK-Dokumentation:
https://hermes-agent.nousresearch.com/docs/user-guide/features/extending-the-dashboard
