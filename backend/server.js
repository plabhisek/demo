const cors = require('cors');
require('dotenv').config();
const app = require('./app');
const mongoose = require('mongoose');
const { setupCronJobs } = require('./utils/cronJobs');
app.use(cors({
  origin: '*',               // Allow requests from any origin
  methods: '*',              // Allow all HTTP methods
  allowedHeaders: '*',       // Allow all headers
  credentials: true          // Allow cookies to be sent with requests
}));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Setup cron jobs for email reminders
    setupCronJobs();
    
    // Start server
    app.listen(PORT,'0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
