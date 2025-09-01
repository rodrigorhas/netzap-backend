# NetZap API

API do projeto NetZap com persistência em PostgreSQL.

## 🚀 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)

### Configuração do Banco de Dados

1. **Configurar variáveis de ambiente:**
   ```bash
   # Copiar arquivo de exemplo
   cp database.example.env .env
   ```

2. **Subir banco de dados com Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Verificar se o banco está rodando:**
   ```bash
   # Ver logs do PostgreSQL
   npm run docker:logs
   
   # Acessar pgAdmin (se disponível)
   # http://localhost:8080
   # Email: admin@netzap.com
   # Senha: admin123
   ```

### Executar a Aplicação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run start:dev

# Executar em produção
npm run build
npm run start:prod
```

## 📚 Documentação

A documentação da API está disponível em: `http://localhost:3001/api`

## 🔧 Endpoints

### Estrutura das Tabelas
- **`messages`**: Todas as mensagens do WhatsApp
- **`chats`**: Informações dos chats e última mensagem

### Acessos
- **API**: http://localhost:3000
- **pgAdmin**: http://localhost:8080 (admin@netzap.com / admin123)
- **PostgreSQL**: localhost:5432

## 📦 Dependências Principais

- NestJS
- TypeORM (PostgreSQL)
- WhatsApp Web.js
- Socket.io
- QRCode
- Swagger
- Docker
