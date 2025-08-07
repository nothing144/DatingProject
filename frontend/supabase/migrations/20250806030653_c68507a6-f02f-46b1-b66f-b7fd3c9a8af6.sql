-- Fix function security issues by setting proper search path
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (target_user_id, notification_type, notification_title, notification_message)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update the existing get_or_create_conversation function with proper search path
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id uuid, user2_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
declare
  convo_id uuid;
begin
  -- Check if a conversation already exists
  select id into convo_id
  from public.conversations
  where (participant_1 = user1_id and participant_2 = user2_id)
     or (participant_1 = user2_id and participant_2 = user1_id)
  limit 1;

  if convo_id is not null then
    return convo_id;
  end if;

  -- If not, create a new conversation
  insert into public.conversations (participant_1, participant_2, last_message_at)
  values (user1_id, user2_id, now())
  returning id into convo_id;

  return convo_id;
end;
$function$;