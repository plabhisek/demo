import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import meetingService from '../../services/meetingService';
import stakeholderService from '../../services/stakeholderService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    totalStakeholders: 0,
    recentMeetings: [],
  });
  const [complianceData, setComplianceData] = useState([]);
  const [meetingTrendData, setMeetingTrendData] = useState([]);
  const [meetingTypeData, setMeetingTypeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get meetings
        const meetings = await meetingService.getAllMeetings();
        // Get stakeholders
        const stakeholders = await stakeholderService.getAllStakeholders();
        
        // Process data for dashboard stats
        const now = new Date();
        const upcomingMeetings = meetings.filter(meeting => new Date(meeting.nextMeetingDate) > now);
        const recentMeetings = meetings
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        
        setStats({
          totalMeetings: meetings.length,
          upcomingMeetings: upcomingMeetings.length,
          totalStakeholders: stakeholders.length,
          recentMeetings,
        });

        // Process data for compliance graph
        // This would normally come from your API, but we'll simulate it
        const userComplianceData = stakeholders.map(stakeholder => {
          // Calculate a compliance percentage (this is simulated)
          const userMeetings = meetings.filter(m => 
            m.participants && m.participants.includes(stakeholder._id)
          );
          
          const attendedMeetings = userMeetings.filter(m => 
            m.attendees && m.attendees.includes(stakeholder._id)
          );
          
          const compliance = userMeetings.length > 0 
            ? Math.round((attendedMeetings.length / userMeetings.length) * 100) 
            : 0;
            
          return {
            name: stakeholder.name,
            compliance: compliance,
          };
        }).slice(0, 10); // Limit to top 10 stakeholders for readability
        
        setComplianceData(userComplianceData);

        // Process data for meeting trends
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthName = d.toLocaleString('default', { month: 'short' });
          const year = d.getFullYear();
          last6Months.push({ month: `${monthName} ${year}`, meetings: 0 });
        }
        
        meetings.forEach(meeting => {
          const meetingDate = new Date(meeting.date);
          const monthYear = `${meetingDate.toLocaleString('default', { month: 'short' })} ${meetingDate.getFullYear()}`;
          
          const monthIndex = last6Months.findIndex(m => m.month === monthYear);
          if (monthIndex !== -1) {
            last6Months[monthIndex].meetings += 1;
          }
        });
        
        setMeetingTrendData(last6Months);

        // Process data for meeting types
        const meetingTypes = {};
        meetings.forEach(meeting => {
          const type = meeting.type || 'Unspecified';
          if (!meetingTypes[type]) {
            meetingTypes[type] = 0;
          }
          meetingTypes[type] += 1;
        });
        
        const meetingTypeArray = Object.keys(meetingTypes).map(type => ({
          name: type,
          value: meetingTypes[type]
        }));
        
        setMeetingTypeData(meetingTypeArray);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Total Meetings</h2>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalMeetings}</p>
          <Link to="/meetings" className="text-blue-500 hover:underline block mt-4">View all meetings</Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Meetings</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.upcomingMeetings}</p>
          <Link to="/meetings" className="text-blue-500 hover:underline block mt-4">View upcoming meetings</Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Total Stakeholders</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalStakeholders}</p>
          <Link to="/stakeholders" className="text-blue-500 hover:underline block mt-4">Manage stakeholders</Link>
        </div>
      </div>

      {/* Data Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Compliance Graph */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Stakeholder Meeting Compliance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={complianceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis label={{ value: 'Compliance %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="compliance" fill="#8884d8" name="Attendance Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meeting Types Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Meeting Types Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={meetingTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {meetingTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meeting Trends Line Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Meeting Trends (Last 6 Months)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={meetingTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="meetings" stroke="#82ca9d" name="Number of Meetings" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Meetings */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Meetings</h2>
          <Link to="/meetings" className="text-blue-500 hover:underline">View all</Link>
        </div>
        
        {stats.recentMeetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentMeetings.map((meeting) => (
                  <tr key={meeting._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meeting.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(meeting.nextMeetingDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${new Date(meeting.nextMeetingDate) > new Date() ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {new Date(meeting.nextMeetingDate) > new Date() ? 'Upcoming' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link to={`/meetings/${meeting._id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No meetings found.</p>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/meetings/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Schedule New Meeting
          </Link>
          <Link to="/stakeholders/new" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Add Stakeholder
          </Link>
          <Link to="/reports" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Generate Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;