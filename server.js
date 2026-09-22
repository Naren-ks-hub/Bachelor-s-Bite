const app = require('./server/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🍳 BachelorBite Server is Running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔌 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📋 Recipes: http://localhost:${PORT}/api/recipes`);
  console.log(`=========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
