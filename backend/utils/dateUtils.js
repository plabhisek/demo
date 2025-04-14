const moment = require('moment-business-days');

// Custom configuration for business days including only odd Saturdays (1st, 3rd, 5th)
// 2nd and 4th Saturdays are off
moment.updateLocale('en', {
  workingWeekdays: [1, 2, 3, 4, 5],
  holidays: [],
  holidayFormat: 'YYYY-MM-DD',
  // Override the isBusinessDay method to handle odd Saturdays
  isBusinessDay: function(date) {
    const momentDate = moment(date);
    
    // Check if it's a regular business day (Mon-Fri)
    if ([1, 2, 3, 4, 5].includes(momentDate.day())) {
      return true;
    }
    
    // Check if it's Saturday (day 6)
    if (momentDate.day() === 6) {
      // Get the day of the month
      const dayOfMonth = momentDate.date();
      
      // Calculate which Saturday of the month it is
      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      
      // If it's 1st, 3rd, or 5th Saturday, it's a working day
      // If it's 2nd or 4th Saturday, it's not a working day
      return weekOfMonth === 1 || weekOfMonth === 3 || weekOfMonth === 5;
    }
    
    return false;
  }
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
  let endDate;
  
  switch (frequency) {
    case 'weekly':
      // End of the CURRENT week (not next meeting's week)
      endDate = moment().endOf('week');
      break;
    
    case 'biweekly':
      // For biweekly, determine if we're in the first or second week of the period
      const currentDate = moment();
      const startOfPeriod = moment(getFirstWorkingDay(momentDate, 'biweekly'));
      
      // If we're in the first week of the period
      if (currentDate.diff(startOfPeriod, 'weeks') < 1) {
        endDate = startOfPeriod.clone().add(1, 'week').endOf('week');
      } else {
        // We're in the second week of the period
        endDate = startOfPeriod.clone().add(2, 'weeks').subtract(1, 'day').endOf('day');
      }
      break;
    
    case 'monthly':
      // End of the CURRENT month
      endDate = moment().endOf('month');
      break;
    
    case 'quarterly':
      // End of the CURRENT quarter
      endDate = moment().endOf('quarter');
      break;
    
    default:
      // Default to end of current week
      endDate = moment().endOf('week');
  }
  
  // Find the last business day by going backwards until we find a business day
  while (!endDate.isBusinessDay()) {
    endDate.subtract(1, 'days');
  }
  
  return endDate.toDate();
};

// Check if today is the first working day of the period
const isTodayFirstWorkingDay = (frequency) => {
  const today = moment().startOf('day');
  const firstDay = moment(getFirstWorkingDay(today, frequency)).startOf('day');
  
  return today.isSame(firstDay);
};

// Check if today is the last working day of the period
const isTodayLastWorkingDay = (frequency) => {
  const today = moment().startOf('day');
  const lastDay = moment(getLastWorkingDay(today, frequency)).startOf('day');
  
  return today.isSame(lastDay);
};

module.exports = {
  calculateNextMeetingDate,
  getFirstWorkingDay,
  getLastWorkingDay,
  isTodayFirstWorkingDay,
  isTodayLastWorkingDay
};