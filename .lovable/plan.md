

## Performance-Optimierung: Community Chat Scrolling

### Problem-Analyse
Der Community Board (`TribeCommunityBoard.tsx`, 1523 Zeilen) rendert **alle Posts auf einmal** mit vielen Bildern und Avataren:
- Jeder Post hat Avatare (User, Voter in Polls, RSVP-Teilnehmer)
- MIA Top-Event-Posts laden 3 Bilder im 3:4-Format
- Kennenlernabend-Polls zeigen bis zu 6 Voter-Avatare pro Option
- Kein Lazy Loading auf Bildern
- `loadPosts()` wird bei **jedem** Realtime-UPDATE neu aufgerufen (kompletter Refresh)
- Keine Virtualisierung oder Pagination

### Plan

**1. Lazy Loading für alle Bilder**
- `loading="lazy"` auf alle `<img>`-Tags setzen (Post-Bilder, Avatare in Top-Events, Poll-Voter-Avatare, RSVP-Avatare, Post-Media)
- Betrifft ca. 15 Stellen im Component

**2. Post-Pagination einführen**
- Nur die letzten 15 Posts initial rendern
- "Mehr laden"-Button am Ende des Feeds
- Neue Posts kommen weiterhin oben live rein

**3. Realtime-Updates optimieren**
- Bei `UPDATE`-Events nicht mehr `loadPosts()` aufrufen (kompletter DB-Fetch + Re-Render)
- Stattdessen nur den betroffenen Post im State updaten via `setPosts(prev => prev.map(...))`

**4. Post-Rendering in eigene Komponente extrahieren**
- Einzelne Posts in `React.memo`-wrapped Komponente auslagern
- Verhindert Re-Render aller Posts wenn sich nur ein Post ändert

### Technische Details

- **Dateien**: `src/components/tribe/TribeCommunityBoard.tsx` (Hauptänderungen), neue Datei `src/components/tribe/CommunityPost.tsx`
- **Keine neuen Dependencies** nötig – `loading="lazy"` ist native HTML, `React.memo` ist built-in
- Pagination über einfachen `useState<number>` für `visibleCount`

