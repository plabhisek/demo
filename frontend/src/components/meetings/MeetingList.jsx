import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { Calendar, List } from 'lucide-react';
import meetingService from '../../services/meetingService';
import useAuth from '../../hooks/useAuth';

const MeetingList = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    fetchMeetings();
  }, [filter]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await meetingService.getAllMeetings({ 
        timeframe: filter !== 'all' ? filter : undefined 
      });
      setMeetings(response);
    } catch (error) {
      toast.error('Failed to load meetings');
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await meetingService.deleteMeeting(id);
        toast.success('Meeting deleted successfully');
        fetchMeetings();
      } catch (error) {
        toast.error('Failed to delete meeting');
        console.error('Error deleting meeting:', error);
      }
    }
  };

  const filterMeetings = () => {
    const now = new Date();
    
    if (filter === 'upcoming') {
      return meetings.filter(meeting => new Date(meeting.nextMeetingDate) >= now);
    } else if (filter === 'past') {
      return meetings.filter(meeting => new Date(meeting.nextMeetingDate) < now);
    }
    
    return meetings;
  };

  const displayMeetings = filterMeetings();
  
  // Helper function to safely format dates
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP p'); // Format as "Apr 29, 2023 12:34 PM"
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meetings</h1>
        </div>
        <div className="flex space-x-2">
          <Link 
            to="/meetings/new" 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            New Meeting
          </Link>
          <Link 
            to="/meetings/view/calendar" 
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 flex items-center"
          >
            <Calendar className="h-4 w-4 mr-1" /> Calendar View
          </Link>
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button 
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-md ${filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
        >
          All
        </button>
        <button 
          onClick={() => setFilter('upcoming')}
          className={`px-3 py-1 rounded-md ${filter === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setFilter('past')}
          className={`px-3 py-1 rounded-md ${filter === 'past' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
        >
          Past
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : displayMeetings.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500">No meetings found</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {displayMeetings.map((meeting) => (
              <li key={meeting._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/meetings/${meeting._id}`}
                      className="text-lg font-medium text-blue-600 hover:underline"
                    >
                      {meeting.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDate(meeting.nextMeetingDate)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {meeting.stakeholder && (
                        <span>Stakeholder: {meeting.stakeholder.name} ({meeting.stakeholder.company})</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Frequency: {meeting.frequency.charAt(0).toUpperCase() + meeting.frequency.slice(1)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Status: {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      to={`/meetings/${meeting._id}`}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      View
                    </Link>
                    {(isAdmin || (meeting.createdBy && meeting.createdBy._id === currentUser?._id)) && (
                      <>
                        <Link 
                          to={`/meetings/${meeting._id}/edit`}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(meeting._id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MeetingList;