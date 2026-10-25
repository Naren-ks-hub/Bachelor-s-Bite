const app = require('./server/app');

const PORT = Number(process.env.PORT) || 3000;
const ALT_PORT = 3055;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🍳 BachelorBite Server is Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔌 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Recipes: http://localhost:${PORT}/api/recipes`);
  console.log(`=========================================`);
});

// Also bind port 3055 if different, to ensure active browser sessions on 3055 seamlessly connect
let serverAlt = null;
if (PORT !== ALT_PORT) {
  try {
    serverAlt = app.listen(ALT_PORT, () => {
      console.log(`📡 Active Browser Bridge on: http://localhost:${ALT_PORT}`);
    });
    serverAlt.on('error', (err) => {
      // Ignore if port 3055 is in use
    });
  } catch (e) {}
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP servers');
  if (server) server.close();
  if (serverAlt) serverAlt.close();
});
