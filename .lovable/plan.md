

## Problem

Die `community_events`-Tabelle enthält Duplikate mit unterschiedlichen IDs aber gleichem Titel (z.B. "Wochenmarkt" 2x, "TRIBE WANDERSAMSTAG" 2x, "Lauftreff @oberseeparkrun" 2x). Die aktuelle Deduplizierung prüft nur nach `event.id`, nicht nach Titel. Dadurch können zwei "Wochenmarkt"-Events in den Top 3 landen.

## Loesung

### Edge Function `daily-top-event-message/index.ts` anpassen

Nach dem Filtern (`funEvents`) und vor dem Aufbau der Top 3: Events nach normalisiertem Titel deduplizieren. Behalte jeweils das Event mit den meisten Likes.

```typescript
// Deduplicate by normalized title - keep the one with most likes
const deduped = new Map<string, any>();
for (const event of topPool) {
  const key = cleanTitle(event.title).toLowerCase();
  const existing = deduped.get(key);
  if (!existing || (event.likes || 0) > (existing.likes || 0)) {
    deduped.set(key, event);
  }
}
const dedupedPool = Array.from(deduped.values());
```

Dann `dedupedPool` statt `topPool` fuer die Top-3-Schleife verwenden.

Zusaetzlich auch bei `addedIds` den normalisierten Titel tracken (`addedTitles` Set), damit auch Tribe-Events (Kennenlernabend, Tuesday Run) nicht nochmal als Duplikat auftauchen.

