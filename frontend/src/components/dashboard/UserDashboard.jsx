import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import meetingService from '../../services/meetingService';
import useAuth from '../../hooks/useAuth';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState({
    upcoming: [],
    recent: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserMeetings = async () => {
      try {
        setLoading(true);
        const now = new Date();
        
        // Get all meetings
        const allMeetings = await meetingService.getAllMeetings();
        
        // Filter meetings where user is a participant or organizer
        const userMeetings = allMeetings.filter(meeting => 
          Array.isArray(meeting.participants) && meeting.participants.includes(currentUser._id) || 
          meeting.organizer === currentUser._id
        );
        // Split into upcoming and past meetings
        const upcomingMeetings = userMeetings
          .filter(meeting => new Date(meeting.nextMeetingDate) > now)
          .sort((a, b) => new Date(a.nextMeetingDate) - new Date(b.nextMeetingDate))
          .slice(0, 5);
          
        const recentMeetings = userMeetings
          .filter(meeting => new Date(meeting.nextMeetingDate) <= now)
          .sort((a, b) => new Date(b.nextMeetingDate) - new Date(a.nextMeetingDate))
          .slice(0, 5);
        
        setMeetings({
          upcoming: upcomingMeetings,
          recent: recentMeetings
        });
      } catch (err) {
        setError(err.message || 'Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserMeetings();
    }
  }, [currentUser]);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Welcome, {currentUser?.name}</h1>
        <Link 
          to="/meetings/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Schedule Meeting
        </Link>
      </div>
      
      {/* Upcoming Meetings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Meetings</h2>
        
        {meetings.upcoming.length > 0 ? (
          <div className="space-y-4">
            {meetings.upcoming.map((meeting) => (
              <Link 
                key={meeting._id} 
                to={`/meetings/${meeting._id}`}
                className="block p-4 border rounded-md hover:bg-gray-50 transition"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{meeting.title}</h3>
                    <p className="text-gray-600 text-sm">{meeting.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-600 font-medium">
                      {format(new Date(meeting.nextMeetingDate), 'MMM d, yyyy')}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {format(new Date(meeting.nextMeetingDate), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming meetings.</p>
        )}
        
        <div className="mt-4">
          <Link to="/meetings" className="text-blue-500 hover:underline">
            View all meetings
          </Link>
        </div>
      </div>
      
      {/* Recent Meetings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Meetings</h2>
        
        {meetings.recent.length > 0 ? (
          <div className="space-y-4">
            {meetings.recent.map((meeting) => (
              <Link 
                key={meeting._id} 
                to={`/meetings/${meeting._id}`}
                className="block p-4 border rounded-md hover:bg-gray-50 transition"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{meeting.title}</h3>
                    <p className="text-gray-600 text-sm">{meeting.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">
                      {format(new Date(meeting.nextMeetingDate), 'MMM d, yyyy')}
                    </p>
                    <div className="mt-1">
                      {meeting.mom ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          MoM Available
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          No MoM
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent meetings.</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;