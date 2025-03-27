import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import stakeholderService from '../../services/stakeholderService';
import useAuth from '../../hooks/useAuth';

const StakeholderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'mass'
  const fileInputRef = useRef(null);
  const {currentUser,isAdmin } = useAuth();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchStakeholderData();
    }
  }, [id]);

  const fetchStakeholderData = async () => {
    try {
      setLoading(true);
      const stakeholder = await stakeholderService.getStakeholderById(id);
      reset(stakeholder);
    } catch (error) {
      toast.error('Failed to load stakeholder data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      if (isEdit) {
        await stakeholderService.updateStakeholder(id, data);
        toast.success('Stakeholder updated successfully');
      } else {
        await stakeholderService.createStakeholder(data);
        toast.success('Stakeholder created successfully');
      }
      navigate('/stakeholders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred while saving stakeholder');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMassUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'buffer' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Validate required fields
      const requiredFields = ['name'];
      const invalidRows = data.filter(row => 
        requiredFields.some(field => !row[field])
      );

      if (invalidRows.length > 0) {
        toast.error(`Invalid data: ${invalidRows.length} rows are missing required fields`);
        return;
      }

      // Attempt to create stakeholders
      const results = await Promise.allSettled(
        data.map(stakeholderData => 
          stakeholderService.createStakeholder({
            name: stakeholderData.name,
            email: stakeholderData.email,
            company: stakeholderData.company || '',
            position: stakeholderData.position || '',
            phone: stakeholderData.phone || ''
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} stakeholders`);
      }
      if (failedCount > 0) {
        toast.warn(`${failedCount} stakeholders failed to upload`);
      }

      navigate('/stakeholders');
    } catch (error) {
      toast.error('Failed to process mass upload');
      console.error(error);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        company: 'Acme Inc',
        position: 'Director',
        phone: '+1-555-123-4567'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        company: 'Tech Solutions',
        position: 'Manager',
        phone: '+1-555-987-6543'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stakeholders');
    
    XLSX.writeFile(workbook, 'stakeholder_template.xlsx');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isEdit ? 'Edit Stakeholder' : 'Add New Stakeholder'}
        </h1>
        {!isEdit && isAdmin &&  (
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadMode"
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={() => setUploadMode('single')}
                  className="mr-2"
                />
                Single Entry
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="uploadMode"
                  value="mass"
                  checked={uploadMode === 'mass'}
                  onChange={() => setUploadMode('mass')}
                  className="mr-2"
                />
                Mass Upload
              </label>
            </div>
            {uploadMode === 'mass' && (
              <button
                type="button"
                onClick={downloadSampleExcel}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                Download Sample
              </button>
            )}
          </div>
        )}
      </div>
      
      {loading && !isEdit ? (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {uploadMode === 'mass' ? (
            <div className="mb-4">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".xlsx, .xls"
                onChange={handleMassUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="mt-2 text-sm text-gray-600">
                Upload an Excel file with columns: name*, email*, company, position, phone
                <br />
                * indicates required fields
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                  Name*
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { 
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                  Phone
                </label>
                <input
                  type="text"
                  id="phone"
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9+\-() ]{10,15}$/,
                      message: 'Invalid phone number'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="company">
                  Organization
                </label>
                <input
                  type="text"
                  id="company"
                  {...register('company')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="position">
                  Role
                </label>
                <input
                  type="text"
                  id="position"
                  {...register('position')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/stakeholders')}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Stakeholder'
                  )}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default StakeholderForm;