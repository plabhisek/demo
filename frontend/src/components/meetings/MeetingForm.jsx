import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import meetingService from '../../services/meetingService';
import stakeholderService from '../../services/stakeholderService';
import authService from '../../services/authService';
import api from '../../services/api'; // Import the API service directly

const MeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState([]);
  const [users, setUsers] = useState([]); // To store users list for admin
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [meeting, setMeeting] = useState(null); // Store the meeting for edit mode
  
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user info first
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        setIsAdmin(user && user.role === 'admin');
        
        // Load stakeholders
        const stakeholdersData = await stakeholderService.getAllStakeholders();
        setStakeholders(stakeholdersData);
        
        // Only try to fetch users if admin
        if (user && user.role === 'admin') {
          try {
            // Directly use API service to get users list
            const response = await api.get('/users');
            setUsers(response.data);
          } catch (error) {
            console.error('Failed to load users (admin only):', error);
            // Don't show error toast, just log it
          }
        }
      } catch (error) {
        toast.error('Failed to load form data');
      }
    };
    
    const loadMeeting = async () => {
      if (id) {
        try {
          setIsEditMode(true);
          const meetingData = await meetingService.getMeetingById(id);
          setMeeting(meetingData);
          
          // Format date for input
          const dateObj = new Date(meetingData.nextMeetingDate);
          const formattedDate = dateObj.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
          
          // Set form values
          setValue('title', meetingData.title);
          setValue('stakeholderId', meetingData.stakeholder._id);
          setValue('frequency', meetingData.frequency);
          setValue('assignedToId', meetingData.assignedTo._id);
          setValue('nextMeetingDate', formattedDate);
          setValue('notes', meetingData.notes);
          setValue('active', meetingData.active);
        } catch (error) {
          toast.error('Failed to load meeting details');
          navigate('/meetings');
        }
      }
    };
    
    loadData();
    loadMeeting();
  }, [id, setValue, navigate]);
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // If not admin, use current user's ID as assignedToId
      if (!isAdmin && !isEditMode) {
        data.assignedToId = currentUser._id;
        console.log(currentUser._id);
      }
      
      if (isEditMode) {
        await meetingService.updateMeeting(id, data);
        toast.success('Meeting updated successfully');
      } else {
        await meetingService.createMeeting(data);
        toast.success('Meeting created successfully');
      }
      
      navigate('/meetings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Meeting' : 'Schedule New Meeting'}
      </h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title *
              </label>
              <input
                id="title"
                type="text"
                {...register('title', { required: 'Title is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="stakeholderId" className="block text-sm font-medium text-gray-700 mb-1">
                Stakeholder *
              </label>
              <select
                id="stakeholderId"
                {...register('stakeholderId', { required: 'Stakeholder is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Stakeholder</option>
                {stakeholders.map((stakeholder) => (
                  <option key={stakeholder._id} value={stakeholder._id}>
                    {stakeholder.name} - {stakeholder.company || ''}
                  </option>
                ))}
              </select>
              {errors.stakeholderId && (
                <p className="mt-1 text-sm text-red-600">{errors.stakeholderId.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Frequency *
              </label>
              <select
                id="frequency"
                {...register('frequency', { required: 'Frequency is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Frequency</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
              {errors.frequency && (
                <p className="mt-1 text-sm text-red-600">{errors.frequency.message}</p>
              )}
            </div>
            
            {/* User assignment section */}
            <div>
              <label htmlFor="assignedToId" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To *
              </label>
              
              {isAdmin ? (
                <select
                  id="assignedToId"
                  {...register('assignedToId', { required: 'User assignment is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select User</option>
                  {/* Show the current user */}
                  
                  {/* Show other users if available */}
                  {users.length > 0 && users
                    .filter(user => user._id !== currentUser?._id) // Don't show current user twice
                    .map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))
                  }
                  
                  {/* Show the assigned user in edit mode if not in users list */}
                  {isEditMode && meeting?.assignedTo && 
                    !users.some(u => u._id === meeting.assignedTo._id) &&
                    meeting.assignedTo._id !== currentUser?._id && (
                      <option value={meeting.assignedTo._id}>
                        {meeting.assignedTo.name} ({meeting.assignedTo.email})
                      </option>
                    )
                  }
                </select>
              ) : (
                <div className="px-3 py-2 border border-gray-300 bg-gray-50 rounded-md">
                  {currentUser?.name} (You)
                  <input type="hidden" {...register('assignedToId')} value={currentUser?._id} />
                </div>
              )}
              
              {errors.assignedToId && (
                <p className="mt-1 text-sm text-red-600">{errors.assignedToId.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="nextMeetingDate" className="block text-sm font-medium text-gray-700 mb-1">
                Next Meeting Date *
              </label>
              <input
                id="nextMeetingDate"
                type="datetime-local"
                {...register('nextMeetingDate', { required: 'Meeting date is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.nextMeetingDate && (
                <p className="mt-1 text-sm text-red-600">{errors.nextMeetingDate.message}</p>
              )}
            </div>
            
            {isEditMode && isAdmin && (
              <div>
                <label htmlFor="active" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="flex items-center mt-2">
                  <input
                    id="active"
                    type="checkbox"
                    {...register('active')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
              </div>
            )}
            
            <div className="col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                rows="4"
                {...register('notes')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any notes about this meeting..."
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/meetings')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Meeting' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeetingForm;