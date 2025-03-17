import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import meetingService from '../../services/meetingService';
import useAuth from '../../hooks/useAuth';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [mom, setMom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        setLoading(true);
        const meetingData = await meetingService.getMeetingById(id);
        setMeeting(meetingData);
        
        // Try to fetch MoM if exists
        try {
          const momData = await meetingService.getMoMByMeetingId(id);
          setMom(momData);
        } catch (momError) {
          // MoM might not exist yet, which is fine
          console.log('No MoM found');
        }
      } catch (err) {
        setError(err.message || 'Failed to load meeting details');
        toast.error('Failed to load meeting details');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingData();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        await meetingService.deleteMeeting(id);
        toast.success('Meeting deleted successfully');
        navigate('/meetings');
      } catch (err) {
        toast.error('Failed to delete meeting');
      }
    }
  };

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP p'); // Format as "Apr 29, 2023 12:34 PM"
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

  if (error || !meeting) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error || 'Meeting not found'}</p>
      </div>
    );
  }

  // Use nextMeetingDate which is the property used in MeetingList
  const meetingDate = meeting.nextMeetingDate || meeting.date;
  const isUpcoming = new Date(meetingDate) > new Date();
  const canEdit = isAdmin || meeting.createdBy === currentUser?._id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <p className="text-gray-600">
            {formatDate(meetingDate)}
          </p>
        </div>
        <div className="flex space-x-2">
          {canEdit && (
            <>
              <Link 
                to={`/meetings/${id}/edit`}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Edit
              </Link>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Meeting Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and information about the meeting.</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{meeting.location || 'Not specified'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isUpcoming ? 'Upcoming' : 'Completed'}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Frequency</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {meeting.frequency && (meeting.frequency.charAt(0).toUpperCase() + meeting.frequency.slice(1))}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Meeting Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {meeting.status && (meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1))}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Agenda</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{meeting.agenda}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Stakeholders</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">People involved in this meeting.</p>
          </div>
        </div>
        <div className="border-t border-gray-200">
          {/* Display primary stakeholder if available */}
          {meeting.stakeholder && (
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">Primary Stakeholder</p>
              <p className="text-sm text-gray-600 mt-1">
                {meeting.stakeholder.name} ({meeting.stakeholder.company})
              </p>
              {meeting.stakeholder.email && (
                <p className="text-sm text-gray-500 mt-1">
                  Email: {meeting.stakeholder.email}
                </p>
              )}
              {meeting.stakeholder.role && (
                <p className="text-sm text-gray-500 mt-1">
                  Role: {meeting.stakeholder.role}
                </p>
              )}
            </div>
          )}
          
          {/* Display other stakeholders if available */}
          {meeting.stakeholders && meeting.stakeholders.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {meeting.stakeholders.map((stakeholder) => (
                <li key={stakeholder._id} className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {stakeholder.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stakeholder.company && `Company: ${stakeholder.company}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {stakeholder.email && `Email: ${stakeholder.email}`}
                        {stakeholder.role && ` - Role: ${stakeholder.role}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : !meeting.stakeholder ? (
            <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
              No stakeholders added to this meeting.
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Minutes of Meeting</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {mom ? 'Record of the discussion and decisions.' : 'No minutes recorded yet.'}
            </p>
          </div>
          {canEdit && (
            <Link 
              to={mom ? `/meetings/${id}/mom/${mom._id}/edit` : `/meetings/${id}/mom`}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            >
              {mom ? 'Edit Minutes' : 'Add Minutes'}
            </Link>
          )}
        </div>
        {mom && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Attendees</dt>
                <dd className="mt-1 text-sm text-gray-900">{mom.attendees}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Discussion</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{mom.discussion}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Decisions</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{mom.decisions}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Action Items</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{mom.actionItems}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingDetail;