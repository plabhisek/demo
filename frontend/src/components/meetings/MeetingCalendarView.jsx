import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import meetingService from '../../services/meetingService';
import useAuth from '../../hooks/useAuth';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { toast } from 'react-toastify';

const MeetingCalendarView = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        // Use your existing API endpoint to get all meetings
        const meetingsData = await meetingService.getAllMeetings();
        setMeetings(meetingsData);
      } catch (err) {
        setError(err.message || 'Failed to load meetings');
        toast.error('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const getDaysInView = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const startDate = startOfWeek(monthStart);
      
      // Get all days from the start of the week containing the first of the month
      // to the end of the month
      return eachDayOfInterval({ start: startDate, end: monthEnd });
    } else {
      const weekStart = startOfWeek(currentDate);
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
  };

  const getMeetingsForDay = (day) => {
    return meetings.filter(meeting => {
      const meetingDate = parseISO(meeting.nextMeetingDate || meeting.date);
      return isSameDay(meetingDate, day);
    });
  };

  // Get meeting color based on status
  const getMeetingColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'missed':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  // Helper function to format dates
  const formatMeetingTime = (dateString) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  const days = getDaysInView();
  const isCurrentMonth = (day) => {
    return day.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meeting Calendar</h1>
        </div>
        <div className="flex space-x-2">
          <Link 
            to="/meetings/new" 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            New Meeting
          </Link>
          <Link 
            to="/meetings" 
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex items-center"
          >
            <List className="h-4 w-4 mr-1" /> List View
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Calendar Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex space-x-2">
            <button 
              onClick={prevPeriod}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={today}
              className="px-3 py-1 border rounded-md hover:bg-gray-100"
            >
              Today
            </button>
            <button 
              onClick={nextPeriod}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <h2 className="text-xl font-semibold">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </h2>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md ${viewMode === 'week' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md ${viewMode === 'month' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Calendar Days Header */}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 py-2 text-center text-gray-500 text-sm font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-fr' : 'grid-rows-1'} gap-px bg-gray-200`}>
          {days.map((day, i) => {
            const dayMeetings = getMeetingsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={i} 
                className={`bg-white min-h-[100px] ${viewMode === 'week' ? 'h-96' : ''} ${
                  isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className={`p-2 flex justify-between ${isToday ? 'bg-blue-50' : ''}`}>
                  <span className={`text-sm font-medium ${
                    isToday 
                      ? 'h-6 w-6 bg-blue-600 text-white rounded-full flex items-center justify-center' 
                      : isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {dayMeetings.length > 0 ? `${dayMeetings.length} meetings` : ''}
                  </span>
                </div>
                
                <div className="p-1 overflow-y-auto max-h-32">
                  {dayMeetings.map(meeting => (
                    <Link
                      key={meeting._id}
                      to={`/meetings/${meeting._id}`}
                      className={`block mb-1 p-1 text-xs rounded border ${getMeetingColor(meeting.status)} hover:opacity-80 truncate`}
                    >
                      <div className="font-medium">{formatMeetingTime(meeting.nextMeetingDate || meeting.date)}</div>
                      <div className="truncate">{meeting.title}</div>
                      {meeting.stakeholder && <div className="truncate text-xs opacity-75">{meeting.stakeholder.name}</div>}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MeetingCalendarView;