import { createClient } from 'redis';

// This function creates and returns a Redis client
export async function getRedisClient() {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    // Register error handler
    client.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    // Connect to Redis if not already connected
    if (!client.isOpen) {
      await client.connect();
    }
    
    return client;
  } catch (error) {
    console.error('Failed to create Redis client:', error);
    throw error;
  }
}

// This function safely disconnects a Redis client
export async function disconnectRedis(client) {
  if (client && client.isOpen) {
    try {
      await client.disconnect();
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
}