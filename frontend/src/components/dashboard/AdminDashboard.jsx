import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import meetingService from '../../services/meetingService';
import stakeholderService from '../../services/stakeholderService';
import userService from '../../services/userService'; // You'll need to create this service
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    upcomingMeetings: 0,
    totalStakeholders: 0,
    recentMeetings: [],
    complianceStats: {
      totalScheduled: 0,
      totalAttended: 0,
      totalMissed: 0,
      compliancePercentage: 0
    }
  });
  const [userComplianceData, setUserComplianceData] = useState([]);
  const [meetingTrendData, setMeetingTrendData] = useState([]);
  const [meetingTypeData, setMeetingTypeData] = useState([]);
  const [meetingComplianceData, setMeetingComplianceData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
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
        // Get users
        const users = await userService.getAllUsers();
        
        // Extract unique departments
        const departmentSet = new Set(users.map(user => user.department).filter(Boolean));
        setDepartments(['all', ...Array.from(departmentSet)]);
        
        // Process data for dashboard stats
        const now = new Date();
        const upcomingMeetings = meetings.filter(meeting => new Date(meeting.nextMeetingDate) > now);
        const recentMeetings = meetings
          .sort((a, b) => new Date(b.nextMeetingDate) - new Date(a.nextMeetingDate))
          .slice(0, 5);
        
        // Calculate compliance stats from all meetings
        let totalScheduled = 0;
        let totalAttended = 0;
        let totalMissed = 0;
        
        meetings.forEach(meeting => {
          if (meeting.complianceStats) {
            totalScheduled += meeting.complianceStats.totalScheduled || 0;
            totalAttended += meeting.complianceStats.totalAttended || 0;
            totalMissed += meeting.complianceStats.totalMissed || 0;
          }
        });
        
        const compliancePercentage = (totalAttended + totalMissed > 0) 
          ? Math.round((totalAttended / (totalAttended + totalMissed)) * 100) 
          : 100;
          
        setStats({
          totalMeetings: meetings.length,
          upcomingMeetings: upcomingMeetings.length,
          totalStakeholders: stakeholders.length,
          recentMeetings,
          complianceStats: {
            totalScheduled,
            totalAttended,
            totalMissed,
            compliancePercentage
          }
        });

        // Process data for user compliance graph
        const userComplianceMap = {};
        
        // Initialize user data
        users.forEach(user => {
          userComplianceMap[user._id] = {
            id: user._id,
            name: user.name,
            department: user.department || 'Unassigned',
            totalAssigned: 0,
            totalAttended: 0,
            totalMissed: 0,
            compliance: 0
          };
        });
        
        // Calculate compliance based on assigned meetings
        meetings.forEach(meeting => {
          if (meeting.assignedTo && Array.isArray(meeting.assignedTo)) {
            meeting.assignedTo.forEach(userId => {
              if (typeof userId === 'object' && userId._id) {
                userId = userId._id;
              }
              
              if (userComplianceMap[userId]) {
                userComplianceMap[userId].totalAssigned += 1;
                
                if (meeting.complianceStats) {
                  userComplianceMap[userId].totalAttended += meeting.complianceStats.totalAttended || 0;
                  userComplianceMap[userId].totalMissed += meeting.complianceStats.totalMissed || 0;
                }
              }
            });
          }
        });
        
        // Calculate compliance percentage for each user
        Object.values(userComplianceMap).forEach(userData => {
          const total = userData.totalAttended + userData.totalMissed;
          userData.compliance = total > 0 ? Math.round((userData.totalAttended / total) * 100) : 0;
        });
        
        // Convert to array and sort by compliance
        const userComplianceArray = Object.values(userComplianceMap)
          .filter(user => user.totalAssigned > 0)
          .sort((a, b) => b.compliance - a.compliance)
          .slice(0, 10); // Take top 10
        
        setUserComplianceData(userComplianceArray);

        // Process data for meeting trends (based on meeting frequency)
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const monthName = d.toLocaleString('default', { month: 'short' });
          const year = d.getFullYear();
          last6Months.push({ 
            month: `${monthName} ${year}`, 
            scheduled: 0,
            completed: 0,
            missed: 0
          });
        }
        
        meetings.forEach(meeting => {
          const meetingDate = new Date(meeting.nextMeetingDate);
          const monthYear = `${meetingDate.toLocaleString('default', { month: 'short' })} ${meetingDate.getFullYear()}`;
          
          const monthIndex = last6Months.findIndex(m => m.month === monthYear);
          if (monthIndex !== -1) {
            last6Months[monthIndex].scheduled += meeting.complianceStats?.totalScheduled || 0;
            last6Months[monthIndex].completed += meeting.complianceStats?.totalAttended || 0;
            last6Months[monthIndex].missed += meeting.complianceStats?.totalMissed || 0;
          }
        });
        
        setMeetingTrendData(last6Months);

        // Process data for meeting frequencies
        const meetingFrequencies = {};
        meetings.forEach(meeting => {
          const frequency = meeting.frequency || 'Unspecified';
          if (!meetingFrequencies[frequency]) {
            meetingFrequencies[frequency] = 0;
          }
          meetingFrequencies[frequency] += 1;
        });
        
        const meetingFrequencyArray = Object.keys(meetingFrequencies).map(frequency => ({
          name: frequency,
          value: meetingFrequencies[frequency]
        }));
        
        setMeetingTypeData(meetingFrequencyArray);
        
        // Process data for individual meeting compliance
        const meetingComplianceArray = meetings.map(meeting => {
          const attendedCount = meeting.complianceStats?.totalAttended || 0;
          const missedCount = meeting.complianceStats?.totalMissed || 0;
          const totalCount = attendedCount + missedCount;
          const compliancePercent = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;
          
          // Find assigned users with their departments
          const assignedUsers = Array.isArray(meeting.assignedTo) 
            ? meeting.assignedTo.map(userId => {
                const user = users.find(u => u._id === (typeof userId === 'object' ? userId._id : userId));
                return user || { department: 'Unknown' };
              })
            : [];
            
          const departments = [...new Set(assignedUsers.map(user => user.department || 'Unknown'))];
          
          // Generate a formatted string of assigned user names
          const assignedUserNames = assignedUsers
            .map(user => user.name || 'Unknown User')
            .join(', ');
          
          return {
            id: meeting._id,
            title: meeting.title,
            stakeholderName: meeting.stakeholder?.name || 'Unknown',
            assignedTo: assignedUserNames, // Add assigned users as a formatted string
            date: new Date(meeting.nextMeetingDate).toLocaleDateString(),
            compliance: compliancePercent,
            departments,
            totalAttended: attendedCount,
            totalMissed: missedCount
          };
        });
        
        setMeetingComplianceData(meetingComplianceArray);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Filter meetings by department
  const filteredMeetingCompliance = meetingComplianceData.filter(meeting => {
    if (selectedDepartment === 'all') return true;
    return meeting.departments.includes(selectedDepartment);
  });

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
          <Link to="/meetings?timeframe=upcoming" className="text-blue-500 hover:underline block mt-4">View upcoming meetings</Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800">Total Stakeholders</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalStakeholders}</p>
          <Link to="/stakeholders" className="text-blue-500 hover:underline block mt-4">Manage stakeholders</Link>
        </div>
      </div>

      {/* Overall Compliance Stats Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Meeting Status Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium capitalize">Scheduled</h3>
            <div className="flex items-center mt-2">
              <span className="px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                {stats.complianceStats.totalScheduled}
              </span>
              <span className="ml-2 text-gray-600">meetings</span>
            </div>
          </div>
          
          <div className="p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium capitalize">Completed</h3>
            <div className="flex items-center mt-2">
              <span className="px-2 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                {stats.complianceStats.totalAttended}
              </span>
              <span className="ml-2 text-gray-600">meetings</span>
            </div>
          </div>
          
          <div className="p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium capitalize">Missed</h3>
            <div className="flex items-center mt-2">
              <span className="px-2 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                {stats.complianceStats.totalMissed}
              </span>
              <span className="ml-2 text-gray-600">meetings</span>
            </div>
          </div>
          
          <div className="p-4 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium capitalize">Compliance</h3>
            <div className="flex items-center mt-2">
              <span className={`px-2 py-1 text-sm font-semibold rounded-full 
                ${stats.complianceStats.compliancePercentage >= 80 ? 'bg-green-100 text-green-800' : 
                  stats.complianceStats.compliancePercentage >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'}`}>
                {stats.complianceStats.compliancePercentage}%
              </span>
              <span className="ml-2 text-gray-600">overall rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Compliance Graph */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">User Meeting Compliance</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={userComplianceData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                <YAxis label={{ value: 'Compliance %', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-bold">{data.name}</p>
                        <p className="text-sm text-gray-600">Department: {data.department}</p>
                        <p className="text-sm">Compliance: {data.compliance}%</p>
                        <p className="text-sm">Attended: {data.totalAttended}</p>
                        <p className="text-sm">Missed: {data.totalMissed}</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Bar dataKey="compliance" fill="#8884d8" name="Attendance Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Meeting Frequency Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Meeting Frequency Distribution</h2>
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
                <Line type="monotone" dataKey="scheduled" stroke="#3b82f6" name="Scheduled" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="missed" stroke="#ef4444" name="Missed" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Meeting-wise Compliance with Department Filter */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Meeting-wise Compliance</h2>
          <div className="flex items-center">
            <label htmlFor="departmentFilter" className="mr-2 text-gray-700">Filter by Department:</label>
            <select
              id="departmentFilter"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept === 'all' ? 'All Departments' : dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredMeetingCompliance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meeting Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stakeholder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attended</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMeetingCompliance.map((meeting) => (
                  <tr key={meeting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meeting.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.stakeholderName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.assignedTo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.totalAttended}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meeting.totalMissed}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${meeting.compliance >= 80 ? 'bg-green-100 text-green-800' : 
                          meeting.compliance >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {meeting.compliance}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link to={`/meetings/${meeting.id}`} className="text-blue-600 hover:text-blue-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No meetings found for selected department.</p>
        )}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
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
                        ${meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                          meeting.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {meeting.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {meeting.frequency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link to={`/meetings/${meeting._id}`} className="text-blue-600 hover:text-blue-900 mr-4">
                        View
                      </Link>
                      {meeting.status === 'scheduled' && (
                        <button 
                          onClick={() => meetingService.sendReminderManually(meeting._id)}
                          className="text-gray-600 hover:text-gray-900 mr-4"
                        >
                          Send Reminder
                        </button>
                      )}
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
          <Link to="/meetings/reports" className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Generate Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;