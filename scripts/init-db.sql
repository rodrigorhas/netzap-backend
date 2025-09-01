-- Script de inicialização e correção do banco de dados NetZap

-- 1. Criar extensão para UUID (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar tabela messages
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    "from" VARCHAR(255) NOT NULL,
    "to" VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    timestamp BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_from_me BOOLEAN NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    chat_name VARCHAR(255) NOT NULL,
    is_group BOOLEAN NOT NULL,
    has_media BOOLEAN NOT NULL,
    media JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar tabela chats
CREATE TABLE chats (
    chat_id VARCHAR(255) PRIMARY KEY,
    chat_name VARCHAR(255) NOT NULL,
    is_group BOOLEAN NOT NULL,
    unread_count INTEGER DEFAULT 0,
    last_message_id VARCHAR(255),
    last_message_timestamp BIGINT,
    last_message_body TEXT,
    last_message_from VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar índices para otimização de performance
CREATE INDEX idx_messages_chat_id_timestamp ON messages(chat_id, timestamp);
CREATE INDEX idx_messages_from_timestamp ON messages("from", timestamp);
CREATE INDEX idx_messages_to_timestamp ON messages("to", timestamp);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_is_from_me ON messages(is_from_me);

CREATE INDEX idx_chats_last_message_timestamp ON chats(last_message_timestamp);
CREATE INDEX idx_chats_is_group ON chats(is_group);
CREATE INDEX idx_chats_unread_count ON chats(unread_count);

-- 5. Criar função para atualizar o timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Inserir dados de exemplo (opcional - para desenvolvimento)
INSERT INTO chats (chat_id, chat_name, is_group, unread_count) 
VALUES 
    ('5511999999999@c.us', 'Chat de Teste', false, 0),
    ('5511888888888@c.us', 'Grupo de Teste', true, 0)
ON CONFLICT (chat_id) DO NOTHING;

-- 8. Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados NetZap inicializado/corrigido com sucesso!';
    RAISE NOTICE 'Tabelas criadas: messages, chats';
    RAISE NOTICE 'Índices criados para otimização de performance';
    RAISE NOTICE 'Triggers configurados para updated_at automático';
END $$;
