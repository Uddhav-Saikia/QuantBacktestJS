const app = require('../backend/server');

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Ensure MongoDB is connected before handling request
  await app.locals.connectDB();
  
  // Handle the request with Express
  return app(req, res);
};
