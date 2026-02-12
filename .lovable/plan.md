
# MIA als aktiver Notification Hub & Community Assistentin

## Konzept

MIA wird als schwebender FAB-Button (Floating Action Button) unten rechts positioniert. Sie pulsiert/blinkt bei neuen Benachrichtigungen und oeffnet ein Notification-Panel mit personalisierten, KI-generierten Hinweisen. Der Nutzer kann von dort direkt mit MIA chatten oder Aktionen ausfuehren.

## Architektur

### 1. Neue Komponente: `MiaNotificationHub`

Ein schwebendes UI-Element bestehend aus:
- **FAB-Button** (unten rechts, ueber der Bottom-Nav): MIA-Avatar mit Gold-Ring, pulsierender Glow bei neuen Notifications
- **Notification-Panel** (Sheet/Drawer von unten): Liste der aktuellen MIA-Hinweise mit Aktions-Buttons
- **Chat-Modus**: Vom Panel aus kann direkt mit MIA gechattet werden

### 2. Neuer Service: `miaNotificationService.ts`

Generiert proaktive Benachrichtigungen basierend auf:
- **Neue Events**: Wenn ein Event in den letzten Stunden hinzugefuegt wurde
- **User-Aktivitaet**: "Lauren schaut sich gerade Event X an" (via `user_activity_logs`)
- **Community-Beitritte**: Neue User-Profile erkennen und bei gemeinsamen Interessen hinweisen
- **Bevorstehende Community-Events**: Tribe Kennenlernabend, Tuesday Run etc.
- **Tagesempfehlungen**: Basierend auf User-Interessen und heutigem Eventangebot
- **Event-Likes**: "Laurin hat Event X geliked, vielleicht auch was fuer dich?"

### 3. Neue Edge Function: `mia-notifications`

Generiert personalisierte Notification-Texte via Lovable AI Gateway:
- Empfaengt User-Profil, aktuelle Events, Community-Aktivitaet
- Erstellt 3-5 kontextbezogene, persoenliche Benachrichtigungen
- Nutzt den lockeren MIA-Ton ("Hey! Schau mal...")

### 4. Realtime-Integration

- Supabase Realtime-Subscription auf `community_events` (neue Events)
- Supabase Realtime-Subscription auf `user_profiles` (neue Mitglieder)
- Supabase Realtime-Subscription auf `chat_messages` (Community-Aktivitaet)
- Polling fuer `user_activity_logs` (wer schaut sich was an)
- Badge-Counter am FAB-Button zeigt Anzahl ungelesener Notifications

### 5. Aktionen aus dem Hub

Jede Notification hat kontextbezogene Aktions-Buttons:
- "Event ansehen" - navigiert zum Event
- "Profil checken" - oeffnet User-Profil-Dialog
- "Bin dabei!" - RSVP direkt aus der Notification
- "Event starten" - oeffnet Event-Erstellung
- "Mit MIA chatten" - wechselt in den Chat-Modus

## Technische Umsetzung

### Dateien die erstellt werden:

| Datei | Zweck |
|-------|-------|
| `src/components/tribe/MiaNotificationHub.tsx` | FAB-Button + Notification-Panel + Mini-Chat |
| `src/services/miaNotificationService.ts` | Notification-Generierung und -Management |
| `src/hooks/useMiaNotifications.ts` | Hook fuer Realtime-Subscriptions und Notification-State |
| `supabase/functions/mia-notifications/index.ts` | Edge Function fuer KI-generierte Benachrichtigungstexte |

### Dateien die geaendert werden:

| Datei | Aenderung |
|-------|-----------|
| `src/components/tribe/TribeApp.tsx` | MiaNotificationHub einbinden, State weiterreichen |
| `supabase/config.toml` | Neue Edge Function registrieren |

### Notification-Typen:

```text
+------------------------------------------+
| MIA Notification Hub                     |
|                                          |
| "Hey! Neues Event: Jazz Night am Fr.    |
|  Passt zu deinen Interessen!"           |
|  [Event ansehen]                         |
|                                          |
| "Laurin ist vielleicht beim             |
|  Kennenlernabend dabei - du auch?"      |
|  [Bin dabei!] [Mehr Info]               |
|                                          |
| "Max ist neu in der Community und mag   |
|  auch Sport & Konzerte!"                |
|  [Profil checken]                       |
|                                          |
| "Dein Tipp fuer heute: Creative Circle  |
|  heute Abend - perfekt fuer dich!"      |
|  [Event ansehen]                         |
+------------------------------------------+
```

### FAB-Button Design:

- MIA-Avatar (rund, 56px) mit Gold-Border
- Bei neuen Notifications: pulsierender Gold-Glow + Badge mit Anzahl
- Positioniert `bottom-20 right-4` (ueber der Bottom-Nav)
- Tap oeffnet das Panel als Sheet von unten

### Datenfluss:

1. `useMiaNotifications` Hook startet Realtime-Subscriptions beim Mount
2. Bei neuen Events/Usern/Aktivitaeten wird `miaNotificationService` aufgerufen
3. Service sammelt Kontext und ruft `mia-notifications` Edge Function auf
4. Edge Function generiert personalisierte Texte via Lovable AI
5. Notifications werden im State gespeichert und FAB blinkt
6. User oeffnet Panel, sieht Notifications, fuehrt Aktionen aus
7. Gelesene Notifications werden als "seen" markiert
