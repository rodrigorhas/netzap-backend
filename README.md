# NetZap API

API do projeto NetZap migrada para NestJS.

## 🚀 Instalação

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

### WhatsApp
- `GET /whatsapp` - Verificar status do WhatsApp
- `POST /whatsapp` - Inicializar/desconectar WhatsApp

### Messages
- `GET /messages` - Buscar mensagens ou grupos de chat
- `POST /messages` - Enviar mensagem
- `PATCH /messages` - Marcar chat como lido

### Debug
- `GET /debug` - Informações de debug

## 🔄 Migração do Next.js

Esta API foi migrada do projeto Next.js original, mantendo a mesma funcionalidade mas com as vantagens do NestJS:

- ✅ Estrutura modular
- ✅ Injeção de dependências
- ✅ Validação automática
- ✅ Documentação automática (Swagger)
- ✅ Melhor tratamento de erros
- ✅ Testes mais fáceis

## 📦 Dependências Principais

- NestJS
- WhatsApp Web.js
- Socket.io
- QRCode
- Swagger
