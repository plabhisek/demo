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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Add state to track which past MoMs are expanded
  const [expandedMoMs, setExpandedMoMs] = useState({});

  useEffect(() => {
    const fetchMeetingData = async () => {
      try {
        setLoading(true);
        const meetingData = await meetingService.getMeetingById(id);
        setMeeting(meetingData);
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

  // Toggle function for expanding/collapsing past MoMs
  const toggleMoMDetails = (index) => {
    setExpandedMoMs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
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
  
  // Check if user can edit meeting (admin, creator or assigned user)
  const canEdit = isAdmin || 
    (meeting.createdBy && meeting.createdBy._id === currentUser?._id) || 
    (meeting.assignedTo && meeting.assignedTo._id === currentUser?._id);
  
  // Check if user can add MoM (admin or assigned user)
  const canAddMoM = isAdmin || 
    (meeting.assignedTo && meeting.assignedTo._id === currentUser?.id);
  
  // Get the latest MoM if available
  const latestMoM = meeting.minutesOfMeeting && meeting.minutesOfMeeting.length > 0 
    ? meeting.minutesOfMeeting[meeting.minutesOfMeeting.length - 1] 
    : null;

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
              {(isAdmin || (meeting.createdBy && meeting.createdBy._id === currentUser?._id)) && (
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Delete
                </button>
              )}
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
              <dt className="text-sm font-medium text-gray-500">Stakeholder</dt>
              <dd className="mt-1 text-sm text-gray-900">{meeting.stakeholder?.name || 'Not specified'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900">{meeting.assignedTo?.name || 'Not assigned'}</dd>
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
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{meeting.notes}</dd>
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
                {meeting.stakeholder.name} {meeting.stakeholder.company && `(${meeting.stakeholder.company})`}
              </p>
              {meeting.stakeholder.email && (
                <p className="text-sm text-gray-500 mt-1">
                  Email: {meeting.stakeholder.email}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Minutes of Meeting</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {latestMoM ? 'Record of the discussion and decisions.' : 'No minutes recorded yet.'}
            </p>
          </div>
          {canAddMoM && (
            <Link 
              to={`/meetings/${id}/mom`}
              className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            >
              {latestMoM ? 'Add New Minutes' : 'Add Minutes'}
            </Link>
          )}
        </div>
        {latestMoM ? (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(latestMoM.date)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Attendees</dt>
                <dd className="mt-1 text-sm text-gray-900">{latestMoM.attendees.join(', ')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Content</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{latestMoM.content}</dd>
              </div>
              {latestMoM.actionItems && latestMoM.actionItems.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Action Items</dt>
                  <dd className="mt-1">
                    <ul className="list-disc pl-5 text-sm text-gray-900">
                      {latestMoM.actionItems.map((item, index) => (
                        <li key={index} className="mb-1">
                          <span className={item.status === 'completed' ? 'line-through' : ''}>
                            {item.task} - Assigned to: {item.assignedTo}
                            {item.dueDate && ` - Due: ${formatDate(item.dueDate)}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6 text-center text-gray-500">
            No minutes have been recorded for this meeting yet.
          </div>
        )}
      </div>
      
      {/* Show past meeting minutes if there are more than one */}
      {meeting.minutesOfMeeting && meeting.minutesOfMeeting.length > 1 && (
        <div className="bg-white shadow overflow-hidden rounded-lg mt-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Past Meeting Minutes</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Previous minutes of meeting records.
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {meeting.minutesOfMeeting.slice(0, -1).reverse().map((mom, index) => (
                <li key={index} className="px-4 py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{formatDate(mom.date)}</p>
                      <p className="text-sm text-gray-500">
                        Attendees: {mom.attendees.join(', ')}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleMoMDetails(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {expandedMoMs[index] ? 'Hide Details' : 'View Details'}
                    </button>
                  </div>
                  
                  {/* Expandable content section */}
                  {expandedMoMs[index] && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <dl className="grid grid-cols-1 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Content</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{mom.content}</dd>
                        </div>
                        {mom.actionItems && mom.actionItems.length > 0 && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Action Items</dt>
                            <dd className="mt-1">
                              <ul className="list-disc pl-5 text-sm text-gray-900">
                                {mom.actionItems.map((item, idx) => (
                                  <li key={idx} className="mb-1">
                                    <span className={item.status === 'completed' ? 'line-through' : ''}>
                                      {item.task} - Assigned to: {item.assignedTo}
                                      {item.dueDate && ` - Due: ${formatDate(item.dueDate)}`}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;