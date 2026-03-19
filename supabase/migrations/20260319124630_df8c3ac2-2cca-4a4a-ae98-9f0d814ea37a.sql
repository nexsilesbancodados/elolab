
-- DELETE policies for chat tables
CREATE POLICY "chat_conv_delete" ON public.chat_conversations
  FOR DELETE TO authenticated
  USING (participante_1_id = auth.uid() OR participante_2_id = auth.uid());

CREATE POLICY "chat_msg_delete" ON public.chat_messages
  FOR DELETE TO authenticated
  USING (remetente_id = auth.uid());

-- Missing UPDATE policy for tipos_exame_custom
CREATE POLICY "tipos_exame_update" ON public.tipos_exame_custom
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
