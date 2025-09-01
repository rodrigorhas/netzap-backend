#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres', // Conectar ao banco padrão primeiro
  });

  try {
    console.log('🔌 Conectando ao PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Verificar se o banco de dados existe
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_DATABASE || 'netzap_db']
    );

    if (dbExists.rows.length === 0) {
      console.log('📦 Criando banco de dados...');
      await client.query(`CREATE DATABASE ${process.env.DB_DATABASE || 'netzap_db'}`);
      console.log('✅ Banco de dados criado');
    } else {
      console.log('ℹ️  Banco de dados já existe');
    }

    // Conectar ao banco de dados específico
    await client.end();
    
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'netzap_db',
    });

    await dbClient.connect();
    console.log('✅ Conectado ao banco de dados específico');

    // Verificar se as tabelas existem
    const tablesExist = await dbClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('messages', 'chats')
    `);

    if (tablesExist.rows.length === 0) {
      console.log('📋 Criando tabelas...');
      
      // Executar script de inicialização
      const fs = require('fs');
      const initScript = fs.readFileSync('./scripts/init-db.sql', 'utf8');
      await dbClient.query(initScript);
      
      console.log('✅ Tabelas criadas com sucesso');
    } else {
      console.log('ℹ️  Tabelas já existem');
      
      // Verificar se há problemas de estrutura
      try {
        await dbClient.query('SELECT chat_id FROM chats LIMIT 1');
        console.log('✅ Estrutura das tabelas está correta');
      } catch (error) {
        console.log('⚠️  Detectado problema na estrutura das tabelas');
        console.log('🔧 Executando correção...');
        
        const fs = require('fs');
        const initScript = fs.readFileSync('./scripts/init-db.sql', 'utf8');
        await dbClient.query(initScript);
        
        console.log('✅ Problemas corrigidos com sucesso');
      }
    }

    await dbClient.end();
    console.log('🎉 Configuração do banco de dados concluída!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('1. Configure as variáveis de ambiente no arquivo .env');
    console.log('2. Execute: npm run start:dev');
    console.log('3. Acesse: http://localhost:3000');

  } catch (error) {
    console.error('❌ Erro na configuração do banco de dados:', error.message);
    console.log('');
    console.log('🔧 Solução de problemas:');
    console.log('1. Verifique se o PostgreSQL está rodando');
    console.log('2. Verifique as credenciais no arquivo .env');
    console.log('3. Certifique-se de que o usuário tem permissões para criar bancos de dados');
    process.exit(1);
  }
}

setupDatabase();
