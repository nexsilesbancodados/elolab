-- Atribuir role de admin para o usuário de teste
INSERT INTO user_roles (user_id, role) 
VALUES ('59616b0a-849b-422a-9163-32acdde26ee6', 'admin')
ON CONFLICT DO NOTHING;