
# MIA als Community-Matchmakerin (nicht 1:1, sondern Community-basiert)

## Konzept

Statt Leute ueber private Chats zu verbinden, nutzt MIA den bestehenden Community-Chat als Treffpunkt. MIA erkennt, wenn mehrere Leute aehnliche Interessen haben oder sich fuer dasselbe Event interessieren, und macht daraus Community-Notifications wie:

- "5 Leute aus der Community moegen Sport -- beim Tuesday Run koenntet ihr euch treffen! 🏃"
- "Du und 3 andere interessieren euch fuer Kunst -- der Creative Circle am Freitag waere perfekt fuer euch!"
- "Beim Kennenlernabend sind schon 4 Leute mit aehnlichen Interessen dabei -- komm dazu!"

Die Aktion ist immer **"Im Community Chat schreiben"** oder **"Event ansehen"** -- nie ein privater Chat.

## Was sich aendert

### `src/services/miaNotificationService.ts`

- Neuer Notification-Typ: `community_match`
- Neue Funktion `generateCommunityMatchNotifications()`:
  1. Lade aktive User-Profile (letzte 7 Tage online, nicht Guest)
  2. Berechne Match-Scores mit dem aktuellen User (Logik aus TribeUserMatcher extrahiert)
  3. Gruppiere User nach gemeinsamen Interessen-Kategorien
  4. Finde passende Events in den naechsten 3 Tagen fuer diese Gruppen
  5. Generiere Notifications wie "X Leute moegen [Interesse] -- [Event] waere perfekt!"
- Neue Action-Types: `join_community_chat` (oeffnet Community-Chat) und `view_event`
- Maximal 2 Match-Notifications pro Refresh

### `src/hooks/useMiaNotifications.ts`

- `generateCommunityMatchNotifications()` in den Fetch-Zyklus integrieren
- Wird nach den lokalen Notifications aufgerufen und angehaengt

### `src/components/tribe/MiaNotificationHub.tsx`

- Neues visuelles Design fuer `community_match` Notifications:
  - Mehrere kleine Avatare nebeneinander (die gematchten Community-Mitglieder)
  - Match-Info als Badge (z.B. "5 Leute | Sport")
  - Aktion: "Im Chat vorbeischauen" statt privatem Chat
- Neue `onJoinCommunityChat` Prop die den Community-Chat oeffnet

### Notification-Beispiele

```text
+------------------------------------------+
| [Avatar1] [Avatar2] [Avatar3] +2         |
| "5 Leute aus der Community moegen Sport  |
|  -- beim Tuesday Run koenntet ihr euch   |
|  alle treffen! 🏃"                       |
|  [Event ansehen] [Community Chat]        |
+------------------------------------------+
| [Avatar1] [Avatar2]                      |
| "Du und 3 andere interessieren euch fuer |
|  Kunst -- Creative Circle am Fr. waere   |
|  perfekt! 🎨"                            |
|  [Event ansehen]                         |
+------------------------------------------+
```

### Datenfluss

1. Lade alle aktiven User-Profile (last_online innerhalb 7 Tage)
2. Berechne Match-Scores (Interessen, Hobbies, Lieblingsorte)
3. Filtere User mit Score >= 40%
4. Gruppiere nach gemeinsamer Interesse-Kategorie
5. Finde Events die zur Kategorie passen (naechste 3 Tage)
6. Generiere Community-Notifications mit Gruppen-Avataren
7. Aktionen fuehren immer zum Community-Chat oder Event -- nie zu privaten Chats

## Technische Details

| Datei | Aenderung |
|-------|-----------|
| `src/services/miaNotificationService.ts` | Neuer Typ `community_match`, neue Funktion `generateCommunityMatchNotifications()` mit Match-Score-Logik, neue Felder `matchAvatars` und `matchCount` im Interface |
| `src/hooks/useMiaNotifications.ts` | Community-Match-Notifications in Fetch-Zyklus einbinden |
| `src/components/tribe/MiaNotificationHub.tsx` | Avatar-Gruppe rendern, neue `join_community_chat` Aktion, `onJoinCommunityChat` Prop |

### Performance-Massnahmen
- Nur User mit `last_online` innerhalb 7 Tagen laden
- Maximal 20 Profile vergleichen
- Maximal 2 Community-Match-Notifications pro Refresh
- Match-Score Minimum: 40%
