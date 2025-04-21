const moment = require('moment-business-days');

// Custom business day logic: Mon-Fri + Odd Saturdays
const isCustomBusinessDay = (date) => {
  const momentDate = moment(date);
  const day = momentDate.day();

  if ([1, 2, 3, 4, 5].includes(day)) return true; // Mon-Fri

  if (day === 6) {
    const dayOfMonth = momentDate.date();
    const saturdayCount = Math.floor((dayOfMonth - 1) / 7) + 1;
    return saturdayCount % 2 === 1; // Odd Saturdays only
  }

  return false; // Sunday
};

const calculateNextMeetingDate = (currentDate, frequency) => {
  const date = moment(currentDate);

  switch (frequency) {
    case 'weekly':
      return date.businessAdd(5).toDate();
    case 'biweekly':
      return date.businessAdd(10).toDate();
    case 'monthly':
      return date.businessAdd(21).toDate();
    case 'quarterly':
      return date.businessAdd(63).toDate();
    default:
      return date.businessAdd(5).toDate();
  }
};

const getFirstWorkingDay = (date, frequency) => {
  const momentDate = moment(date);
  let start;

  switch (frequency) {
    case 'weekly':
    case 'biweekly':
      start = momentDate.startOf('week');
      break;
    case 'monthly':
      start = momentDate.startOf('month');
      break;
    case 'quarterly':
      start = momentDate.startOf('quarter');
      break;
    default:
      start = momentDate.clone();
  }

  while (!isCustomBusinessDay(start)) {
    start.add(1, 'day');
  }

  return start.toDate();
};

const getLastWorkingDay = (date, frequency) => {
  const momentDate = moment(date);
  let end;

  switch (frequency) {
    case 'weekly':
      end = momentDate.endOf('week').clone();
      break;
    case 'biweekly':
      end = momentDate.clone().add(1, 'week').endOf('week');
      break;
    case 'monthly':
      end = momentDate.endOf('month').clone();
      break;
    case 'quarterly':
      end = momentDate.endOf('quarter').clone();
      break;
    default:
      end = momentDate.clone();
  }

  while (!isCustomBusinessDay(end)) {
    end.subtract(1, 'day');
  }

  return end.toDate();
};

const isTodayFirstWorkingDay = (nextMeetingDate, frequency) => {
  const today = moment().startOf('day');
  const firstDay = moment(getFirstWorkingDay(nextMeetingDate, frequency)).startOf('day');
  return today.isSame(firstDay);
};

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