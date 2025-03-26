require('dotenv').config(); // Make sure environment variables are loaded
const mongoose = require('mongoose');
// Adjust the path to match your project structure
const { runJobs } = require('./utils/cronJobs'); 

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Run the jobs
    return runJobs();
  })
  .then(() => {
    console.log('Test jobs completed successfully');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });