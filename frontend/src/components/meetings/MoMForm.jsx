import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import meetingService from '../../services/meetingService';

const MoMForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  // Fetch meeting data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch meeting details
        const meetingData = await meetingService.getMeetingById(id);
        setMeeting(meetingData);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load data');
        navigate('/meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Parse attendees from comma-separated list
      const attendees = data.attendees.split(',').map(name => name.trim()).filter(name => name);

      // Parse action items if provided
      let actionItems = [];
      if (data.actionItems && data.actionItems.trim()) {
        actionItems = data.actionItems.split('\n')
          .filter(line => line.trim())
          .map(line => {
            // Default values if parsing fails
            let task = line.trim();
            let assignedTo = '';
            let dueDate = null;

            // Try to parse in format: Task - Assigned to: Person - Due: YYYY-MM-DD
            const taskMatch = line.match(/(.*?)(?:\s+-\s+Assigned to:\s+(.*?))?(?:\s+-\s+Due:\s+(\d{4}-\d{2}-\d{2}))?$/);
            
            if (taskMatch) {
              task = taskMatch[1].trim();
              if (taskMatch[2]) assignedTo = taskMatch[2].trim();
              if (taskMatch[3]) dueDate = taskMatch[3].trim();
            }

            return {
              task,
              assignedTo,
              dueDate,
              status: 'pending'
            };
          });
      }

      const momData = {
        date: data.date,
        content: data.content,
        attendees
      };

      if (actionItems.length > 0) {
        momData.actionItems = actionItems;
      }

      // Use the addMinutesOfMeeting endpoint
      await meetingService.addMinutesOfMeeting(id, momData);
      toast.success('Minutes of Meeting added successfully');
      navigate(`/meetings/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save Minutes of Meeting');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Add Minutes of Meeting</h1>
      
      {meeting && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h2 className="text-lg font-semibold">{meeting.title}</h2>
          <p className="text-gray-600">
            Next Meeting Date: {format(new Date(meeting.nextMeetingDate), 'MMMM d, yyyy')}
          </p>
          <p className="text-gray-600">Stakeholder: {meeting.stakeholder?.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Meeting Date</label>
          <input
            type="date"
            id="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div>
          <label htmlFor="attendees" className="block text-sm font-medium text-gray-700">
            Attendees (comma separated)
          </label>
          <textarea
            id="attendees"
            {...register('attendees', { required: 'Attendees are required' })}
            rows="2"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="John Doe, Jane Smith, ..."
          ></textarea>
          {errors.attendees && <p className="mt-1 text-sm text-red-600">{errors.attendees.message}</p>}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">Meeting Content</label>
          <textarea
            id="content"
            {...register('content', { required: 'Content is required' })}
            rows="6"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Discussion points, decisions, and other relevant information..."
          ></textarea>
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
        </div>

        <div>
          <label htmlFor="actionItems" className="block text-sm font-medium text-gray-700">
            Action Items (one per line, format: Task - Assigned to: Person - Due: YYYY-MM-DD)
          </label>
          <textarea
            id="actionItems"
            {...register('actionItems')}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Follow up with client - Assigned to: John Doe - Due: 2023-12-31"
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/meetings/${id}`)}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Minutes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MoMForm;