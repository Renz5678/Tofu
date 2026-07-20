-- Drop the old overly restrictive policy
DROP POLICY IF EXISTS "notifications_owner_all" ON notifications;

-- Receiver can read, update (mark read), and delete their own notifications
CREATE POLICY "notifications_receiver_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_receiver_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_receiver_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Actors (senders) can insert notifications, e.g., when they follow or like something
CREATE POLICY "notifications_actor_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() = actor_id);
