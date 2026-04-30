const https = require('https');

/**
 * This script prevents the Render server from sleeping by pinging it every 10 minutes.
 * Note: For this to work permanently, you should also use an external service like 
 * UptimeRobot to wake the server up if it ever falls asleep after a deployment.
 */

// Replace this with your actual public Render URL
const RENDER_URL = 'https://dindi-connect.onrender.com';

const keepAlive = () => {
  // Only run in production to avoid unnecessary pings during local development
  if (process.env.NODE_ENV === 'production') {
    console.log('--- Keep-Alive System Activated ---');
    
    setInterval(() => {
      https.get(RENDER_URL, (res) => {
        console.log(`[Keep-Alive] Pinged at ${new Date().toISOString()} - Status: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('[Keep-Alive] Error:', err.message);
      });
    }, 10 * 60 * 1000); // 10 minutes (Render sleeps after 15 mins of inactivity)
  } else {
    console.log('--- Keep-Alive System: Disabled (Local Development) ---');
  }
};

module.exports = keepAlive;
