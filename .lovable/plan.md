

# MIA Chat visuell aufwerten -- Event-Cards, Bilder & Rich Content

## Problem

Der MIA-Chat zeigt aktuell nur Text und kleine Event-Chips (Buttons mit abgeschnittenem Titel). Das wirkt langweilig und bietet keinen visuellen Anreiz, Events anzuklicken oder den Chat zu nutzen.

## Loesung

MIA-Antworten werden visuell reich gestaltet mit Event-Cards (inkl. Bild, Datum, Ort, Kategorie-Badge), besserem Layout und interaktiven Elementen.

## Was sich aendert

### `src/components/tribe/MiaNotificationHub.tsx`

**Event-Chips ersetzen durch Event-Cards:**

Statt der aktuellen kleinen Chips (Zeile 311-322) werden die `relatedEvents` als kompakte, visuelle Mini-Cards dargestellt:

```text
+--------------------------------------+
| [Event-Bild]  Konzert im Ringloksch. |
|               Fr 14.02 · 20:00       |
|               Ringlokschuppen        |
|               [Musik]    [Ansehen >] |
+--------------------------------------+
```

Jede Card zeigt:
- Event-Bild (image_url) links als kleines Thumbnail (48x48, rounded)
- Titel (max 2 Zeilen)
- Datum + Uhrzeit
- Location
- Kategorie-Badge
- "Ansehen"-Button der zum Event navigiert

**MIA-Avatar fuer Welcome-Message:**

Wenn der Chat leer ist, wird MIAs Avatar groesser und zentriert angezeigt mit einer persoenlichen Begruessung.

### `src/components/tribe/MiaEventCard.tsx` (Neue Datei)

Kompakte Event-Card-Komponente fuer den MIA-Chat:
- Props: `event: TribeEvent`, `onView: (id: string) => void`
- Zeigt Bild, Titel, Datum, Ort, Kategorie
- Kompaktes Design passend zum dunklen MIA-Hub-Theme
- Fallback-Bild wenn kein image_url vorhanden

### Aenderungen im Detail

| Datei | Aenderung |
|-------|-----------|
| `src/components/tribe/MiaEventCard.tsx` | Neue kompakte Event-Card mit Bild, Datum, Ort, Kategorie-Badge |
| `src/components/tribe/MiaNotificationHub.tsx` | Event-Chips (Zeile 311-322) durch MiaEventCard ersetzen, bessere Empty-State mit groesserem MIA-Avatar |

### Design-Details

- Event-Bild: 48x48px, rounded-lg, object-cover
- Fallback wenn kein Bild: Gradient-Hintergrund mit Kategorie-Icon
- Card-Background: `bg-zinc-800/50` mit `border-white/10`
- Kategorie-Badge: Farbig je nach Kategorie (Musik=lila, Sport=gruen, Kunst=orange)
- Maximal 3 Event-Cards pro MIA-Antwort (wie bisher)
- Cards sind horizontal scrollbar wenn mehr als 2

