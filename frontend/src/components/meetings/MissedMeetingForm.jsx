import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import meetingService from '../../services/meetingService';

const MissedMeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      reason: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const meetingData = await meetingService.getMeetingById(id);
        setMeeting(meetingData);
      } catch (error) {
        toast.error('Failed to load meeting data');
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
      await meetingService.addMissedReason(id, data);
      toast.success('Missed meeting reason recorded');
      navigate(`/meetings/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save reason');
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
    <div className="bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Missed Meeting</h1>
      
      {meeting && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h2 className="text-lg font-semibold">{meeting.title}</h2>
          <p className="text-gray-600">
            Scheduled for: {format(new Date(meeting.nextMeetingDate), 'MMMM d, yyyy')}
          </p>
          <p className="text-gray-600">Stakeholder: {meeting.stakeholder?.name}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Scheduled Date</label>
          <input
            type="date"
            id="date"
            {...register('date', { required: 'Date is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Missing Meeting</label>
          <textarea
            id="reason"
            {...register('reason', { required: 'Reason is required' })}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Please explain why the meeting could not be held..."
          ></textarea>
          {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/meetings/${id}`)}
            className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
              'Submit'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MissedMeetingForm;