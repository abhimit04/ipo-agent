import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL, // This comes from Vercel Redis integration
});

redis.on('error', (err) => console.log('Redis Client Error', err));

if (!redis.isOpen) await redis.connect();

export default redis;
