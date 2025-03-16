import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import meetingService from '../../services/meetingService';
import stakeholderService from '../../services/stakeholderService';

const MeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stakeholders, setStakeholders] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm();
  
  useEffect(() => {
    const loadStakeholders = async () => {
      try {
        const data = await stakeholderService.getAllStakeholders();
        setStakeholders(data);
      } catch (error) {
        toast.error('Failed to load stakeholders');
      }
    };
    
    const loadMeeting = async () => {
      if (id) {
        try {
          setIsEditMode(true);
          const meeting = await meetingService.getMeetingById(id);
          
          // Format date for input
          const dateObj = new Date(meeting.date);
          const formattedDate = dateObj.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
          
          // Set form values
          setValue('title', meeting.title);
          setValue('description', meeting.description);
          setValue('date', formattedDate);
          setValue('location', meeting.location);
          setValue('agenda', meeting.agenda);
          setValue('participants', meeting.participants);
        } catch (error) {
          toast.error('Failed to load meeting details');
          navigate('/meetings');
        }
      }
    };
    
    loadStakeholders();
    loadMeeting();
  }, [id, setValue, navigate]);
  
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
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
            
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows="3"
                {...register('description')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date and Time *
              </label>
              <input
                id="date"
                type="datetime-local"
                {...register('date', { required: 'Date and time are required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                id="location"
                type="text"
                {...register('location', { required: 'Location is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
            
            <div className="col-span-2">
              <label htmlFor="agenda" className="block text-sm font-medium text-gray-700 mb-1">
                Agenda
              </label>
              <textarea
                id="agenda"
                rows="4"
                {...register('agenda')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter meeting agenda items..."
              ></textarea>
            </div>
            
            <div className="col-span-2">
              <label htmlFor="participants" className="block text-sm font-medium text-gray-700 mb-1">
                Participants
              </label>
              <select
                id="participants"
                multiple
                {...register('participants')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                size="5"
              >
                {stakeholders.map((stakeholder) => (
                  <option key={stakeholder._id} value={stakeholder._id}>
                    {stakeholder.name} ({stakeholder.email}) - {stakeholder.role}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple participants</p>
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