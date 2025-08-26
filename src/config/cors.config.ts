export const corsConfig = {
  // Origens permitidas
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
  ],

  // Métodos HTTP permitidos
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Headers permitidos
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-API-Key',
  ],

  // Headers expostos
  exposedHeaders: ['Content-Length', 'X-Requested-With'],

  // Credenciais
  credentials: true,
};

export const getCorsConfig = () => {
  const config = { ...corsConfig };
  
  // Adiciona origem do FRONTEND_URL se definida
  if (process.env.FRONTEND_URL) {
    config.allowedOrigins.push(process.env.FRONTEND_URL);
  }

  return {
    ...config,
    origin: function (origin: string, callback: Function) {
      // Permite requisições sem origin (como mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Verifica se a origem está na lista de permitidas
      if (config.allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      
      // Em desenvolvimento, permite todas as origens
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
  };
};
