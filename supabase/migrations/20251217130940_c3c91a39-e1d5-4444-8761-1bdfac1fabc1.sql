-- Drop the trigger that sends "ist jetzt Teil der Community" push notifications
DROP TRIGGER IF EXISTS on_new_user_welcome_push ON public.user_profiles;

-- Drop the function for welcome push notification (THE TRIBE one)
DROP FUNCTION IF EXISTS public.trigger_welcome_push_notification();