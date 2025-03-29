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
  const [expandedMoMs, setExpandedMoMs] = useState({});
  const [expandedMissedReasons, setExpandedMissedReasons] = useState({});
  const [showMeetingStatusModal, setShowMeetingStatusModal] = useState(false);

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

  const handleMeetingStatusSelection = (wasHeld) => {
    setShowMeetingStatusModal(false);
    
    if (wasHeld) {
      // If meeting was held, redirect to MoM form
      navigate(`/meetings/${id}/mom`);
    } else {
      // If meeting was not held, redirect to missed reason form
      navigate(`/meetings/${id}/missed`);
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

  // Toggle function for expanding/collapsing missed reasons
  const toggleMissedReasonDetails = (index) => {
    setExpandedMissedReasons(prev => ({
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
  console.log(currentUser?.id);
  // Check if user can edit meeting (admin, creator or assigned user)
  const canEdit = isAdmin || 
    (meeting.createdBy && meeting.createdBy._id === currentUser?.id) || 
    (meeting.assignedTo && meeting.assignedTo._id === currentUser?.id);
  
  // Check if user can add MoM (admin or assigned user)
  console.log(meeting.assignedTo);
  const canAddMoM = isAdmin ||
    (meeting.assignedTo && meeting.assignedTo.some(
        assignedUser => assignedUser._id === currentUser?.id
    ));
  
  // Get the latest MoM if available
  const latestMoM = meeting.minutesOfMeeting && meeting.minutesOfMeeting.length > 0 
    ? meeting.minutesOfMeeting[meeting.minutesOfMeeting.length - 1] 
    : null;

  // Get the latest missed reason if available
  const latestMissedReason = meeting.missedReasons && meeting.missedReasons.length > 0 
    ? meeting.missedReasons[meeting.missedReasons.length - 1] 
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
  <dd className="mt-1 text-sm text-gray-900">
    {meeting.assignedTo?.length > 0 
      ? meeting.assignedTo.map(user => user.name).join(', ') 
      : 'Not assigned'}
  </dd>
</div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  meeting.status === 'scheduled' 
                    ? 'bg-blue-100 text-blue-800'
                    : meeting.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
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
              <dt className="text-sm font-medium text-gray-500">Next Meeting Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(meeting.nextMeetingDate)}</dd>
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

      {/* Meeting Status Actions Section */}
      {canAddMoM && (
        <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Meeting Status</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Update the status of this meeting
              </p>
            </div>
            <button 
              onClick={() => setShowMeetingStatusModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Update Meeting Status
            </button>
          </div>
        </div>
      )}

      {/* Minutes of Meeting Section */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Minutes of Meeting</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {latestMoM ? 'Record of the discussion and decisions.' : 'No minutes recorded yet.'}
            </p>
          </div>
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
      
      {/* Missed Meetings Reasons Section */}
      {meeting.missedReasons && meeting.missedReasons.length > 0 && (
        <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Missed Meeting Records</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Records of meetings that couldn't be held
            </p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {meeting.missedReasons.map((missed, index) => (
                <li key={index} className="px-4 py-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{formatDate(missed.date)}</p>
                    </div>
                    <button 
                      onClick={() => toggleMissedReasonDetails(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {expandedMissedReasons[index] ? 'Hide Reason' : 'View Reason'}
                    </button>
                  </div>
                  
                  {/* Expandable content section */}
                  {expandedMissedReasons[index] && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-md">
                      <dl className="grid grid-cols-1 gap-y-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Reason</dt>
                          <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{missed.reason}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

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

      {/* Meeting Status Modal */}
      {showMeetingStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Update Meeting Status</h3>
            <p className="mb-6">Was the meeting held with {meeting.stakeholder?.name}?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowMeetingStatusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMeetingStatusSelection(false)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
              >
                No, Meeting Missed
              </button>
              <button
                onClick={() => handleMeetingStatusSelection(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Yes, Meeting Held
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;