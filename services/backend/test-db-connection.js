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
    console.log('Connected to PostgreSQL');
    
    // Create database if it doesn't exist
    try {
      await client.query('CREATE DATABASE smartlaw_dev');
      console.log('Database smartlaw_dev created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('Database smartlaw_dev already exists');
      } else {
        console.error('Error creating database:', err.message);
      }
    }
    
    // Create user if it doesn't exist
    try {
      await client.query("CREATE USER smartlaw_user WITH PASSWORD 'smartlaw_password'");
      console.log('User smartlaw_user created');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('User smartlaw_user already exists');
      } else {
        console.error('Error creating user:', err.message);
      }
    }
    
    // Grant privileges
    try {
      await client.query('GRANT ALL PRIVILEGES ON DATABASE smartlaw_dev TO smartlaw_user');
      console.log('Privileges granted to smartlaw_user');
    } catch (err) {
      console.error('Error granting privileges:', err.message);
    }
    
  } catch (err) {
    console.error('Connection error:', err.message);
  } finally {
    await client.end();
  }
}

testConnection();