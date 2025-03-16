require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const { setupCronJobs } = require('./utils/cronJobs');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Setup cron jobs for email reminders
    setupCronJobs();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });