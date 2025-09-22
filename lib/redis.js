// lib/redis.js
import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  console.warn("⚠️ REDIS_URL is not set — falling back to no-cache mode.");
}

// Singleton Redis connection (prevents multiple connections on hot reloads)
let redis;

if (!global.redis) {
  global.redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined, // enable TLS for cloud Redis
      })
    : null;
}

redis = global.redis;

export default redis;
