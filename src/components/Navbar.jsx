// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

import {
  Briefcase as BriefcaseBusiness,
  Menu,
  User,
  X,
  Bell,
  LogOut,
} from 'lucide-react';

// Dropdowns/menus need an OPAQUE base. .glass-panel is only ~5% white and its
// backdrop blur can't reach the page from inside the (already blurred) navbar,
// so page content was showing straight through. Solid obsidian + the same soft
// gradient keeps the look without the see-through problem.
const DROPDOWN_PANEL = 'rounded-2xl border border-white/10 bg-obsidian shadow-glow overflow-hidden';
const DROPDOWN_STYLE = {
  backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.01))',
};

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notificationsRef = React.useRef(null);
  const profileRef = React.useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsRef, profileRef]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileOpen(false);
  };

  const handleNotificationClick = () => {
    setIsNotificationsOpen((prev) => !prev);
    if (!isNotificationsOpen) {
      markAllAsRead();
    }
  };

  const getDashboardLink = () => {
    if (user?.role === 'employer') {
      return '/employer/dashboard';
    } else if (user?.role === 'jobSeeker') {
      return '/jobseeker/dashboard';
    } else if (user?.role === 'admin') {
      return '/admin/dashboard';
    }
    return '/';
  };

  const getInitial = () => {
    if (user?.name && user.name.trim().length > 0) {
      return user.name.trim()[0].toUpperCase();
    }
    return null;
  };

  const getRoleLabel = () => {
    if (user?.role === 'employer') return 'Employer';
    if (user?.role === 'jobSeeker') return 'Job Seeker';
    if (user?.role === 'admin') return 'Admin';
    return '';
  };

  return (
    <header className="sticky top-0 z-[60] px-3 sm:px-4 pt-3">
      <nav
        className="max-w-7xl mx-auto flex items-center gap-3 rounded-full border border-white/10
                   bg-obsidian/60 backdrop-blur-xl px-4 py-2 shadow-glow"
      >
        {/* Logo and Brand Name */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <span
            className="relative flex h-7 w-7 items-center justify-center rounded-[9px]"
            style={{
              backgroundImage: 'conic-gradient(from 210deg, #9D4EDD, #FF007F, #FFBE0B, #9D4EDD)',
              boxShadow: '0 0 16px rgba(255, 0, 127, 0.5)',
            }}
          >
            <span className="absolute inset-[5px] rounded-full bg-void" />
            <BriefcaseBusiness className="relative h-3.5 w-3.5 text-ink" />
          </span>
          <span className="font-display font-bold text-lg text-ink">VPlacement</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          <Link
            to="/jobs"
            className="px-3.5 py-2 rounded-full text-sm font-medium text-muted hover:text-ink hover:bg-white/5 transition-colors"
          >
            Find Jobs
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to={getDashboardLink()}
                className="px-3.5 py-2 rounded-full text-sm font-medium text-muted hover:text-ink hover:bg-white/5 transition-colors"
              >
                {user?.role === 'employer' ? 'Dashboard' : user?.role === 'jobSeeker' ? 'My Applications' : 'Dashboard'}
              </Link>

              {user?.role === 'employer' && (
                <Link
                  to="/employer/post-job"
                  className="px-3.5 py-2 rounded-full text-sm font-medium text-muted hover:text-ink hover:bg-white/5 transition-colors"
                >
                  Post a Job
                </Link>
              )}
            </>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Notification Icon */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={handleNotificationClick}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10
                             bg-white/5 text-muted hover:text-ink transition-shadow hover:shadow-glow focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-magenta"
                      style={{ boxShadow: '0 0 8px #FF007F' }}
                    />
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className={`${DROPDOWN_PANEL} absolute right-0 mt-3 w-80 py-1 z-[60]`} style={DROPDOWN_STYLE}>
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm font-display font-medium text-ink border-b border-white/10">
                      Notifications
                      <button
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-muted hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted">No new notifications.</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.slice(0, 10).map((n, index) => (
                          <div
                            key={index}
                            className={`block px-4 py-2.5 text-sm cursor-pointer hover:bg-white/5 ${
                              n.read ? 'text-muted' : 'text-ink font-semibold'
                            }`}
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              markAllAsRead();
                            }}
                          >
                            {n.message}
                            <span className="block text-xs text-muted/80 mt-1">
                              {new Date(n.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        {notifications.length > 10 && (
                          <div className="text-center text-violet-soft text-sm py-2 border-t border-white/10 hover:underline cursor-pointer">
                            View All
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Round Profile Button + Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full font-display font-bold text-white
                             transition-shadow focus:outline-none"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #9D4EDD, #FF007F)',
                    boxShadow: '0 0 0 2px #080612, 0 0 0 3px rgba(157,78,221,.6), 0 0 20px rgba(157,78,221,.5)',
                  }}
                  aria-label="Open profile menu"
                >
                  {getInitial() ? getInitial() : <User className="h-4.5 w-4.5" />}
                </button>

                {isProfileOpen && (
                  <div className={`${DROPDOWN_PANEL} absolute right-0 mt-3 w-64 py-1 z-[60]`} style={DROPDOWN_STYLE}>
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-display font-semibold text-ink truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-sm text-muted truncate">{user?.email}</p>
                      <span className="chip-ok mt-2">{getRoleLabel()}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#FF6BB0] hover:bg-magenta/10 transition-colors flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-ghost text-sm px-4 py-2"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn-glow text-sm px-4 py-2"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center ml-auto">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full text-muted hover:text-ink hover:bg-white/5 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden max-w-7xl mx-auto mt-2">
          <div className={`${DROPDOWN_PANEL} px-2 pt-2 pb-3 space-y-1`} style={DROPDOWN_STYLE}>
            <Link
              to="/jobs"
              className="block px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Find Jobs
            </Link>

            {isAuthenticated && (
              <>
                {/* Profile summary block for mobile */}
                <div className="px-3 py-2 border-t border-b border-white/10 mt-1 mb-1">
                  <div className="flex items-center">
                    <div
                      className="h-9 w-9 rounded-full text-white flex items-center justify-center font-display font-semibold mr-3 flex-shrink-0"
                      style={{ backgroundImage: 'linear-gradient(135deg, #9D4EDD, #FF007F)' }}
                    >
                      {getInitial() ? getInitial() : <User className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-semibold text-ink truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Notifications in Mobile Menu */}
                <button
                  onClick={() => {
                    handleNotificationClick();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors relative"
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 chip-bad">{unreadCount}</span>
                  )}
                </button>

                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user?.role === 'employer' ? 'Dashboard' : user?.role === 'jobSeeker' ? 'My Applications' : 'Dashboard'}
                </Link>

                {user?.role === 'employer' && (
                  <Link
                    to="/employer/post-job"
                    className="block px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Post a Job
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-lg text-[#FF6BB0] hover:bg-magenta/10 transition-colors"
                >
                  Logout
                </button>
              </>
            )}

            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/5 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;