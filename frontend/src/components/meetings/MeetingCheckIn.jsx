import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import meetingService from '../../services/meetingService';

const MeetingCheckIn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [meetingHeld, setMeetingHeld] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        setLoading(true);
        const meetingData = await meetingService.getMeetingById(id);
        setMeeting(meetingData);
      } catch (err) {
        toast.error('Failed to load meeting details');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingData();
  }, [id]);

  const handleSelection = (held) => {
    setMeetingHeld(held);
  };

  const handleContinue = () => {
    if (meetingHeld === true) {
      navigate(`/meetings/${id}/mom`);
    } else if (meetingHeld === false) {
      navigate(`/meetings/${id}/missed`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Meeting not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Meeting Check-In</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-md">
        <h2 className="text-lg font-semibold">{meeting.title}</h2>
        <p className="text-gray-600">
          Scheduled for: {format(new Date(meeting.nextMeetingDate), 'MMMM d, yyyy')}
        </p>
        <p className="text-gray-600">Stakeholder: {meeting.stakeholder?.name}</p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-medium mb-4">Did this meeting take place?</h3>
        
        <div className="space-y-4">
          <button
            onClick={() => handleSelection(true)}
            className={`w-full py-3 px-4 rounded-md border ${
              meetingHeld === true 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            Yes, the meeting was held
          </button>
          
          <button
            onClick={() => handleSelection(false)}
            className={`w-full py-3 px-4 rounded-md border ${
              meetingHeld === false 
                ? 'border-red-500 bg-red-50 text-red-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            No, the meeting was not held
          </button>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => navigate(`/meetings/${id}`)}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        
        <button
          onClick={handleContinue}
          disabled={meetingHeld === null}
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default MeetingCheckIn;