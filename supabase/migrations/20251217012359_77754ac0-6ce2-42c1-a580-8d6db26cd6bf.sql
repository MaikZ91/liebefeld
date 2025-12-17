-- Remove push notification triggers for new events
DROP TRIGGER IF EXISTS trigger_new_event_push_notification ON public.community_events;
DROP TRIGGER IF EXISTS trigger_send_event_push_notification ON public.community_events;