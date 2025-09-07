// Production Configuration for cPanel Deployment
// Copy this file to your server and set environment variables accordingly

module.exports = {
  // Database Configuration
  database: {
    host: 'localhost',
    port: 5432,
    database: 'udaanage_udaan_agencies',
    user: 'udaanage_udaanage',
    // Set DB_PASSWORD environment variable to: happyhappy123
  },
  
  // Application Configuration
  server: {
    port: process.env.PORT || 5000,
    host: '0.0.0.0'
  },
  
  // CORS allowed origins
  allowedOrigins: [
    'https://udaanagencies.com.np',
    'http://udaanagencies.com.np',
    'https://www.udaanagencies.com.np',
    'http://www.udaanagencies.com.np'
  ],
  
  // Security settings
  security: {
    rateLimitWindowMs: 900000, // 15 minutes
    rateLimitMaxRequests: 100,
    sessionSecret: 'CHANGE_THIS_TO_A_SECURE_SECRET_IN_PRODUCTION'
  }
};