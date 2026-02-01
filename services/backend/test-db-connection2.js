const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    user: 'smartlaw_user',
    host: 'localhost',
    database: 'smartlaw_dev',
    password: 'smartlaw_password',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL');
    
    const res = await client.query('SELECT NOW()');
    console.log('Current time:', res.rows[0].now);
    
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();