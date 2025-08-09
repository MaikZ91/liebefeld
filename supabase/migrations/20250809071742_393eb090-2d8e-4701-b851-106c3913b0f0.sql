-- Create trigger for new event push notifications
CREATE TRIGGER trigger_new_event_push_notification
  AFTER INSERT ON public.community_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_event_push_notification();