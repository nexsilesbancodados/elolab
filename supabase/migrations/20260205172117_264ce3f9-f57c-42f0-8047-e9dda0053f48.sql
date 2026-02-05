-- Criar bucket de storage para anexos médicos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-attachments',
  'medical-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
);

-- Políticas de storage para anexos médicos
CREATE POLICY "Usuários clínicos podem ver anexos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'medical-attachments' AND can_access_clinical(auth.uid()));

CREATE POLICY "Usuários clínicos podem fazer upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'medical-attachments' AND can_access_clinical(auth.uid()));

CREATE POLICY "Médicos e admins podem deletar anexos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'medical-attachments' AND (is_admin(auth.uid()) OR is_medico(auth.uid())));

CREATE POLICY "Usuários clínicos podem atualizar anexos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'medical-attachments' AND can_access_clinical(auth.uid()));