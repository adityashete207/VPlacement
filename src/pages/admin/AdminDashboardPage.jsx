// pages/admin/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import {
  Eye,
  AlertCircle,
  Loader2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

import { getAllUsers, getAllJobs, deleteUser, deleteJob } from '../../api/adminService.js';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel.jsx';

const roleChip = (role) => {
  if (role === 'admin') return 'chip-violet';
  if (role === 'employer') return 'chip-ok';
  return 'chip-warn';
};

// Shared Actions-cell logic for any user row, since the same "who can I
// view/delete" rules apply across the Users, Employers, and Job Seekers tabs.
// Every branch renders inside a fixed-width, centered box so "View" (and
// whatever follows it) starts at the exact same x-position on every row,
// regardless of whether the second item is "Delete" or "Protected" — this
// is what keeps the column looking like one straight, uniform line instead
// of each row's content just floating at a different width.
const ACTIONS_BOX = 'inline-flex items-center gap-3 w-[150px] whitespace-nowrap';

const UserRowActions = ({ userItem, currentUserId, onDelete }) => {
  const isSelf = userItem.id === currentUserId;

  if (userItem.role === 'admin') {
    return isSelf ? (
      <div className={ACTIONS_BOX}>
        <Link
          to="/admin/profile"
          className="inline-flex items-center text-violet-soft hover:text-ink transition-colors"
        >
          <Eye className="h-4 w-4 mr-1" /> View
        </Link>
        <span
          className="inline-flex items-center text-muted/60 cursor-not-allowed"
          title="You can't delete your own admin account."
        >
          <ShieldCheck className="h-4 w-4 mr-1" /> Protected
        </span>
      </div>
    ) : (
      // Another admin's row — backend blocks deleting any admin account, so
      // reflect that plainly here too instead of leaving it blank.
      <div className={ACTIONS_BOX}>
        <span
          className="inline-flex items-center text-muted/60 cursor-not-allowed"
          title="Admin accounts are protected from deletion."
        >
          <ShieldCheck className="h-4 w-4 mr-1" /> Protected
        </span>
      </div>
    );
  }

  return (
    <div className={ACTIONS_BOX}>
      <Link
        to={`/admin/view-${userItem.role === 'jobSeeker' ? 'jobseeker' : 'employer'}/${userItem.id}`}
        className="inline-flex items-center text-violet-soft hover:text-ink transition-colors"
      >
        <Eye className="h-4 w-4 mr-1" /> View
      </Link>
      <button
        onClick={() => onDelete(userItem.id, userItem.name)}
        className="inline-flex items-center text-[#FF6BB0] hover:text-magenta transition-colors"
      >
        <Trash2 className="h-4 w-4 mr-1" /> Delete
      </button>
    </div>
  );
};

const AdminDashboardPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'jobs', 'employers', 'jobseekers'

  // Check if user is authenticated and is an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const allUsers = await getAllUsers();
        setUsers(allUsers);

        const allJobs = await getAllJobs();
        setJobs(allJobs);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.');
        console.error('Error fetching admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user: ${userName}? This action cannot be undone.`)) {
      try {
        await deleteUser(userId);
        setUsers(users.filter((u) => u.id !== userId));
      } catch (err) {
        setError('Failed to delete user. Please try again.');
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (window.confirm(`Are you sure you want to delete job: "${jobTitle}"? This action cannot be undone.`)) {
      try {
        await deleteJob(jobId);
        setJobs(jobs.filter((j) => j.id !== jobId));
      } catch (err) {
        setError('Failed to delete job. Please try again.');
        console.error('Error deleting job:', err);
      }
    }
  };

  // Filter users by role
  const jobSeekers = users.filter((u) => u.role === 'jobSeeker');
  const employers = users.filter((u) => u.role === 'employer');

  const tabs = [
    { key: 'users', label: `All Users (${users.length})` },
    { key: 'jobs', label: `All Jobs (${jobs.length})` },
    { key: 'employers', label: `Employers (${employers.length})` },
    { key: 'jobseekers', label: `Job Seekers (${jobSeekers.length})` },
  ];

  const thClass = 'px-6 py-3 text-left text-xs font-tag font-medium text-muted uppercase tracking-wider';
  const tdClass = 'px-6 py-4 whitespace-nowrap text-sm';

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-15 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-amber opacity-[0.06] blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-display font-bold text-ink mb-2">Admin Dashboard</h1>
          <p className="text-lg text-muted mb-8">Manage users, job listings, and site content.</p>

          {error && (
            <div className="mb-6 rounded-lg border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA] text-sm">{error}</span>
              </div>
            </div>
          )}

          <AIInsightsPanel />

          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="animate-spin h-12 w-12 text-violet-soft" />
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <div className="border-b border-white/10">
                <nav className="-mb-px flex flex-wrap gap-1 px-4 sm:px-6 pt-4" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.key
                          ? 'border-violet text-violet-soft'
                          : 'border-transparent text-muted hover:text-ink hover:border-white/20'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-4 sm:p-6">
                {activeTab === 'users' && (
                  <div className="overflow-x-auto">
                    <h2 className="text-lg font-display font-semibold text-ink mb-4">All Users</h2>
                    <table className="w-full table-fixed divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className={`${thClass} w-[28%]`}>Name</th>
                          <th className={`${thClass} w-[34%]`}>Email</th>
                          <th className={`${thClass} w-[16%]`}>Role</th>
                          <th className={`${thClass} w-[22%] text-center`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {users.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className={`${tdClass} font-medium text-ink truncate`}>{userItem.name}</td>
                            <td className={`${tdClass} text-muted truncate`}>{userItem.email}</td>
                            <td className={tdClass}>
                              <span className={roleChip(userItem.role)}>{userItem.role}</span>
                            </td>
                            <td className={`${tdClass} text-center`}>
                              <UserRowActions
                                userItem={userItem}
                                currentUserId={user.id}
                                onDelete={handleDeleteUser}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'jobs' && (
                  <div className="overflow-x-auto">
                    <h2 className="text-lg font-display font-semibold text-ink mb-4">All Job Listings</h2>
                    <table className="w-full table-fixed divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className={`${thClass} w-[28%]`}>Job Title</th>
                          <th className={`${thClass} w-[22%]`}>Company</th>
                          <th className={`${thClass} w-[18%]`}>Location</th>
                          <th className={`${thClass} w-[12%]`}>Type</th>
                          <th className={`${thClass} w-[20%] text-right`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {jobs.map((jobItem) => (
                          <tr key={jobItem.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className={`${tdClass} font-medium text-ink`}>{jobItem.title}</td>
                            <td className={`${tdClass} text-muted`}>{jobItem.companyName}</td>
                            <td className={`${tdClass} text-muted`}>{jobItem.location}</td>
                            <td className={`${tdClass} text-muted`}>{jobItem.jobType}</td>
                            <td className={`${tdClass} text-right space-x-3`}>
                              <Link
                                to={`/jobs/${jobItem.id}`}
                                target="_blank"
                                className="inline-flex items-center text-violet-soft hover:text-ink transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Link>
                              <button
                                onClick={() => handleDeleteJob(jobItem.id, jobItem.title)}
                                className="inline-flex items-center text-[#FF6BB0] hover:text-magenta transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'employers' && (
                  <div className="overflow-x-auto">
                    <h2 className="text-lg font-display font-semibold text-ink mb-4">Registered Employers</h2>
                    <table className="w-full table-fixed divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className={`${thClass} w-[35%]`}>Name</th>
                          <th className={`${thClass} w-[40%]`}>Email</th>
                          <th className={`${thClass} w-[25%] text-center`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {employers.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className={`${tdClass} font-medium text-ink truncate`}>{userItem.name}</td>
                            <td className={`${tdClass} text-muted truncate`}>{userItem.email}</td>
                            <td className={`${tdClass} text-center`}>
                              <UserRowActions
                                userItem={userItem}
                                currentUserId={user.id}
                                onDelete={handleDeleteUser}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'jobseekers' && (
                  <div className="overflow-x-auto">
                    <h2 className="text-lg font-display font-semibold text-ink mb-4">Registered Job Seekers</h2>
                    <table className="w-full table-fixed divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className={`${thClass} w-[35%]`}>Name</th>
                          <th className={`${thClass} w-[40%]`}>Email</th>
                          <th className={`${thClass} w-[25%] text-center`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {jobSeekers.map((userItem) => (
                          <tr key={userItem.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className={`${tdClass} font-medium text-ink truncate`}>{userItem.name}</td>
                            <td className={`${tdClass} text-muted truncate`}>{userItem.email}</td>
                            <td className={`${tdClass} text-center`}>
                              <UserRowActions
                                userItem={userItem}
                                currentUserId={user.id}
                                onDelete={handleDeleteUser}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
