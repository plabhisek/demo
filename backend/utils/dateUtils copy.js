const moment = require('moment-business-days');

// Configure business days (Monday to Friday)
moment.updateLocale('en', {
  workingWeekdays: [1, 2, 3, 4, 5]
});

// Calculate the next meeting date based on frequency
const calculateNextMeetingDate = (currentDate, frequency) => {
  const date = moment(currentDate);
  
  switch (frequency) {
    case 'weekly':
      return date.businessAdd(5).toDate(); // Add 1 week (5 business days)
    
    case 'biweekly':
      return date.businessAdd(10).toDate(); // Add 2 weeks (10 business days)
    
    case 'monthly':
      // Add approximately 1 month (21 business days)
      return date.businessAdd(21).toDate();
    
    case 'quarterly':
      // Add approximately 3 months (63 business days)
      return date.businessAdd(63).toDate();
    
    default:
      return date.businessAdd(5).toDate(); // Default to weekly
  }
};

// Get the first working day of a period
const getFirstWorkingDay = (date, frequency) => {
  const momentDate = moment(date);
  
  switch (frequency) {
    case 'weekly':
      // Start of the week, ensure it's a business day
      return momentDate.startOf('week').nextBusinessDay().toDate();
    
    case 'biweekly':
      // Start of the 2-week period, ensure it's a business day
      return momentDate.startOf('week').nextBusinessDay().toDate();
    
    case 'monthly':
      // Start of the month, ensure it's a business day
      return momentDate.startOf('month').nextBusinessDay().toDate();
    
    case 'quarterly':
      // Start of the quarter, ensure it's a business day
      const quarterStart = momentDate.startOf('quarter');
      return quarterStart.nextBusinessDay().toDate();
    
    default:
      return momentDate.nextBusinessDay().toDate();
  }
};

// Get the last working day of a period
const getLastWorkingDay = (date, frequency) => {
  const momentDate = moment(date);
  let result;
  
  switch (frequency) {
    case 'weekly':
      // End of the week, find the last business day
      result = momentDate.endOf('week').clone();
      // Go backwards until we find a business day
      while (!result.isBusinessDay()) {
        result.subtract(1, 'days');
      }
      return result.toDate();
    
    case 'biweekly':
      // End of the 2-week period, find the last business day
      result = momentDate.add(1, 'weeks').endOf('week').clone();
      // Go backwards until we find a business day
      while (!result.isBusinessDay()) {
        result.subtract(1, 'days');
      }
      return result.toDate();
    
    case 'monthly':
      // End of the month, find the last business day
      result = momentDate.endOf('month').clone();
      // Go backwards until we find a business day
      while (!result.isBusinessDay()) {
        result.subtract(1, 'days');
      }
      return result.toDate();
    
    case 'quarterly':
      // End of the quarter, find the last business day
      result = momentDate.endOf('quarter').clone();
      // Go backwards until we find a business day
      while (!result.isBusinessDay()) {
        result.subtract(1, 'days');
      }
      return result.toDate();
    
    default:
      // Default to finding the last business day of the current week
      result = momentDate.clone();
      // Go backwards until we find a business day
      while (!result.isBusinessDay()) {
        result.subtract(1, 'days');
      }
      return result.toDate();
  }
};

// Check if today is the first working day of the period
const isTodayFirstWorkingDay = (nextMeetingDate, frequency) => {
  const today = moment().startOf('day');
  const firstDay = moment(getFirstWorkingDay(nextMeetingDate, frequency)).startOf('day');
  
  return today.isSame(firstDay);
};

// Check if today is the last working day of the period
const isTodayLastWorkingDay = (nextMeetingDate, frequency) => {
  const today = moment().startOf('day');
  const lastDay = moment(getLastWorkingDay(nextMeetingDate, frequency)).startOf('day');
  
  return today.isSame(lastDay);
};

module.exports = {
  calculateNextMeetingDate,
  getFirstWorkingDay,
  getLastWorkingDay,
  isTodayFirstWorkingDay,
  isTodayLastWorkingDay
};