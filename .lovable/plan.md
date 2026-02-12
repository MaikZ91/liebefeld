

# MIA als proaktive People-Connector & Smart Matchmaker

## Die Idee

MIA wird zur aktiven Vermittlerin: Sie erkennt, wenn Community-Mitglieder gemeinsame Interessen haben UND ein passendes Event ansteht, und schlaegt gezielt vor, sich dort zu treffen. Das verwandelt passive Notifications in echte soziale Verbindungen.

## Was sich aendert

### Neuer Notification-Typ: `people_match`

MIA generiert Nachrichten wie:
- "Du und Lisa (82% Match) moegt beide Fotografie -- beim Creative Circle heute Abend koenntet ihr euch treffen!"
- "3 Leute mit aehnlichen Interessen gehen zum Kennenlernabend -- du auch?"
- "Max hat gerade das gleiche Event geliked wie du -- vielleicht wollt ihr zusammen hin?"

### Neue Funktion: `generateMatchNotifications`

Nutzt die bestehende `calculateMatchScore`-Logik aus `TribeUserMatcher.tsx` und kombiniert sie mit:
- Aktuelle Event-Daten (wer hat was geliked)
- User-Profile und Interessen
- Bevorstehende Events in den naechsten 3 Tagen

### Ablauf

1. Lade aktive User mit Profilen (nicht Guest)
2. Berechne Match-Scores zwischen aktuellem User und anderen
3. Finde Events die beide interessieren koennten (basierend auf Kategorie + Interessen)
4. Generiere personalisierte "Verbindungs-Notifications"
5. Zeige Match-Prozent und gemeinsame Interessen direkt in der Notification

### Konkrete Notification-Beispiele

- **Match + Event**: "Du und [Name] ([X]% Match) moegt beide [Interesse] -- '[Event]' am [Datum] waere perfekt fuer euch!"
- **Gruppen-Match**: "[X] Leute mit aehnlichen Interessen schauen sich '[Event]' an"
- **Like-Match**: "[Name] hat gerade '[Event]' geliked -- ihr habt [X] gemeinsame Interessen!"

### Neue Aktion: `connect`

Neben "Event ansehen" und "Profil checken" gibt es neu:
- "Zusammen hin?" -- oeffnet einen Mini-Chat oder Vorschlag zum gemeinsamen Besuch

## Technische Details

### Dateien die geaendert werden:

| Datei | Aenderung |
|-------|-----------|
| `src/services/miaNotificationService.ts` | Neue Funktion `generateMatchNotifications()` die Match-Score-Logik aus TribeUserMatcher extrahiert und mit Event-Daten kombiniert. Neuer Typ `people_match` in der Interface. |
| `src/hooks/useMiaNotifications.ts` | Match-Notifications in den Fetch-Zyklus integrieren |
| `src/components/tribe/MiaNotificationHub.tsx` | Match-Notifications mit Match-Score-Badge und gemeinsamen Interessen visuell darstellen. Neue `connect`-Aktion. |

### Match-Score-Logik (wird aus TribeUserMatcher extrahiert):

Die bestehende `calculateMatchScore`-Funktion vergleicht:
- Gemeinsame Interessen (gewichtet)
- Gemeinsame Lieblingsorte
- Gemeinsame Hobbies
- Ergibt einen Prozent-Score (z.B. 78% Match)

Diese Logik wird in den `miaNotificationService` uebernommen, damit sie sowohl im Matcher als auch in den Notifications genutzt werden kann.

### Performance

- Match-Berechnung nur fuer aktive User (letzten 7 Tage online)
- Maximal 2-3 Match-Notifications pro Refresh
- Gecacht fuer 5 Minuten (wie andere Notifications)

