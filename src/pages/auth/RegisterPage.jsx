// pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { Briefcase as BriefcaseBusiness, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Initialize role with 'jobSeeker' or a default of your choice
  const [role, setRole] = useState('jobSeeker');
  const [formError, setFormError] = useState('');

  const { register, isAuthenticated, isLoading, error, user } = useAuth(); // Added 'user' to context

  const navigate = useNavigate();

  // Redirect if already authenticated based on role
  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user?.role === 'employer') {
      return <Navigate to="/employer/dashboard" />;
    } else if (user?.role === 'jobSeeker') {
      return <Navigate to="/jobseeker/dashboard" />;
    }
    return <Navigate to="/" />; // Fallback
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Form validation
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(name, email, password, role);
      // The login function in AuthContext should ideally set the user object
      // and based on the role, the Navigate at the top will handle the redirect.
    } catch (err) {
      console.error('Registration failed:', err);
      // The error state from AuthContext should handle displaying the message
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-20 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-magenta opacity-10 blur-[120px]" />
      </div>

      <Navbar />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full glass-panel p-8 shadow-glow">
          <div className="text-center mb-6">
            <span
              className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{
                backgroundImage: 'conic-gradient(from 210deg, #9D4EDD, #FF007F, #FFBE0B, #9D4EDD)',
                boxShadow: '0 0 24px rgba(255, 0, 127, 0.5)',
              }}
            >
              <span className="absolute inset-[3px] rounded-[14px] bg-void" />
              <BriefcaseBusiness className="relative h-6 w-6 text-ink" />
            </span>
            <h2 className="mt-4 text-3xl font-display font-bold text-ink">Create your account</h2>
            <p className="mt-2 text-sm text-muted">Join our job portal to connect with opportunities</p>
          </div>

          {(error || formError) && (
            <div className="mb-4 rounded-lg border border-magenta/40 bg-magenta/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-[#FF6BB0] mr-2 flex-shrink-0" />
                <span className="text-[#FFD9EA] text-sm">{formError || error}</span>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted mb-1.5">
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <UserIcon className="h-4.5 w-4.5 text-muted" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink
                             placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink
                             placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink
                             placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-muted mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4.5 w-4.5 text-muted" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-white/10 bg-white/5 text-ink
                             placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 focus:border-transparent transition-shadow"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  htmlFor="jobSeeker"
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                    role === 'jobSeeker'
                      ? 'border-violet/60 bg-violet/10 text-violet-soft'
                      : 'border-white/10 bg-white/5 text-muted hover:border-white/20'
                  }`}
                >
                  <input
                    id="jobSeeker"
                    name="role"
                    type="radio"
                    checked={role === 'jobSeeker'}
                    onChange={() => setRole('jobSeeker')}
                    className="sr-only"
                    required
                  />
                  Job Seeker
                </label>
                <label
                  htmlFor="employer"
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                    role === 'employer'
                      ? 'border-violet/60 bg-violet/10 text-violet-soft'
                      : 'border-white/10 bg-white/5 text-muted hover:border-white/20'
                  }`}
                >
                  <input
                    id="employer"
                    name="role"
                    type="radio"
                    checked={role === 'employer'}
                    onChange={() => setRole('employer')}
                    className="sr-only"
                    required
                  />
                  Employer
                </label>
              </div>
            </div>

            <div>
              <button type="submit" disabled={isLoading} className="btn-glow w-full justify-center py-2.5 text-sm">
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[#0E0C22] text-muted">Or</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-violet-soft hover:text-ink transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;