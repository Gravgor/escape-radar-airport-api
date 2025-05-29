export default () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  database: {
    type: process.env.DATABASE_TYPE || 'sqlite',
    database: process.env.DATABASE_NAME || 'airports.db',
    synchronize: true,
    logging: false,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  airports: {
    dataUrl: process.env.AIRPORTS_DATA_URL || 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat',
  },
  auth: {
    validApiKeys: process.env.VALID_API_KEYS?.split(',') || ['default-api-key'],
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
}); 