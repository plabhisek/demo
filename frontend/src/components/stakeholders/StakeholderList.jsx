import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import stakeholderService from '../../services/stakeholderService';
import useAuth from '../../hooks/useAuth';

const StakeholderList = () => {
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchStakeholders();
  }, []);

  const fetchStakeholders = async () => {
    try {
      setLoading(true);
      const data = await stakeholderService.getAllStakeholders();
      setStakeholders(data);
      setError(null);
    } catch (err) {
      setError('Failed to load stakeholders');
      toast.error('Failed to load stakeholders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirmDelete === id) {
      try {
        await stakeholderService.deleteStakeholder(id);
        setStakeholders(stakeholders.filter(stakeholder => stakeholder._id !== id));
        toast.success('Stakeholder deleted successfully');
      } catch (err) {
        toast.error('Failed to delete stakeholder');
        console.error(err);
      }
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  const filteredStakeholders = stakeholders.filter(stakeholder => 
    stakeholder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stakeholder.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (stakeholder.organization && stakeholder.organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Stakeholders</h1>
        <Link 
          to="/stakeholders/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Stakeholder
        </Link>
      </div>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search stakeholders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : filteredStakeholders.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">
            {searchTerm ? 'No stakeholders match your search criteria.' : 'No stakeholders found. Add your first stakeholder!'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStakeholders.map((stakeholder) => (
                <tr key={stakeholder._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stakeholder.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{stakeholder.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{stakeholder.organization || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{stakeholder.role || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/stakeholders/${stakeholder._id}/edit`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    {isAdmin && (
                      confirmDelete === stakeholder._id ? (
                        <>
                          <button 
                            onClick={() => handleDelete(stakeholder._id)} 
                            className="text-red-600 hover:text-red-900 mr-2"
                          >
                            Confirm
                          </button>
                          <button 
                            onClick={() => setConfirmDelete(null)} 
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleDelete(stakeholder._id)} 
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StakeholderList;