import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import meetingService from '../../services/meetingService';

const MoMForm = () => {
  const { id, momId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mom, setMom] = useState(null);
  const isEditing = !!momId;

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch meeting data and MoM if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch meeting details
        const meetingData = await meetingService.getMeetingById(id);
        setMeeting(meetingData);

        // If editing, fetch MoM details
        if (isEditing) {
          const momData = await meetingService.getMoMByMeetingId(id);
          const currentMom = momData.find(m => m._id === momId);
          if (currentMom) {
            setMom(currentMom);
            // Populate form with existing MoM data
            setValue('title', currentMom.title);
            setValue('attendees', currentMom.attendees.join(', '));
            setValue('agenda', currentMom.agenda);
            setValue('discussion', currentMom.discussion);
            setValue('actionItems', currentMom.actionItems.map(item => 
              `${item.task} - Assigned to: ${item.assignedTo} - Due: ${format(new Date(item.dueDate), 'yyyy-MM-dd')}`
            ).join('\n'));
            setValue('decisions', currentMom.decisions.join('\n'));
            setValue('nextMeeting', currentMom.nextMeeting ? format(new Date(currentMom.nextMeeting), 'yyyy-MM-dd') : '');
          } else {
            toast.error('Minutes of Meeting not found');
            navigate(`/meetings/${id}`);
          }
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load data');
        navigate('/meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, momId, isEditing, setValue, navigate]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);

      // Parse action items from text format
      const actionItems = data.actionItems.split('\n').filter(line => line.trim()).map(line => {
        const [task, rest] = line.split(' - Assigned to: ');
        const [assignedTo, dueDate] = rest.split(' - Due: ');
        return {
          task: task.trim(),
          assignedTo: assignedTo.trim(),
          dueDate: dueDate.trim()
        };
      });

      // Parse decisions from text format
      const decisions = data.decisions.split('\n').filter(line => line.trim());

      // Parse attendees from comma-separated list
      const attendees = data.attendees.split(',').map(name => name.trim()).filter(name => name);

      const momData = {
        title: data.title,
        attendees,
        agenda: data.agenda,
        discussion: data.discussion,
        actionItems,
        decisions,
        nextMeeting: data.nextMeeting ? data.nextMeeting : null
      };

      if (isEditing) {
        await meetingService.updateMoM(id, momId, momData);
        toast.success('Minutes of Meeting updated successfully');
      } else {
        await meetingService.createMoM(id, momData);
        toast.success('Minutes of Meeting created successfully');
      }

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
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Minutes of Meeting' : 'Create Minutes of Meeting'}
      </h1>
      
      {meeting && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h2 className="text-lg font-semibold">{meeting.title}</h2>
          <p className="text-gray-600">
            Date: {format(new Date(meeting.date), 'MMMM d, yyyy')} at {format(new Date(meeting.date), 'h:mm a')}
          </p>
          <p className="text-gray-600">Location: {meeting.location}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">MoM Title</label>
          <input
            type="text"
            id="title"
            {...register('title', { required: 'Title is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
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
          <label htmlFor="agenda" className="block text-sm font-medium text-gray-700">Agenda</label>
          <textarea
            id="agenda"
            {...register('agenda', { required: 'Agenda is required' })}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
          {errors.agenda && <p className="mt-1 text-sm text-red-600">{errors.agenda.message}</p>}
        </div>

        <div>
          <label htmlFor="discussion" className="block text-sm font-medium text-gray-700">Discussion</label>
          <textarea
            id="discussion"
            {...register('discussion', { required: 'Discussion is required' })}
            rows="6"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          ></textarea>
          {errors.discussion && <p className="mt-1 text-sm text-red-600">{errors.discussion.message}</p>}
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

        <div>
          <label htmlFor="decisions" className="block text-sm font-medium text-gray-700">
            Decisions Made (one per line)
          </label>
          <textarea
            id="decisions"
            {...register('decisions')}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Approved the project timeline"
          ></textarea>
        </div>

        <div>
          <label htmlFor="nextMeeting" className="block text-sm font-medium text-gray-700">
            Next Meeting Date (if scheduled)
          </label>
          <input
            type="date"
            id="nextMeeting"
            {...register('nextMeeting')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
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
              isEditing ? 'Update Minutes' : 'Save Minutes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MoMForm;