// src/pages/admin/AdminProfilePage.jsx
import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Navbar from '../../components/Navbar.jsx';
import Footer from '../../components/Footer.jsx';
import { ArrowLeft, ShieldCheck, Mail, User as UserIcon } from 'lucide-react';

const AdminProfilePage = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-void text-ink relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-56 w-[64rem] h-[64rem] rounded-full bg-violet opacity-15 blur-[120px]" />
        <div className="absolute -right-32 top-10 w-[48rem] h-[48rem] rounded-full bg-amber opacity-[0.06] blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-grow py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center text-sm text-violet-soft hover:text-ink transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to dashboard
            </Link>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="px-6 py-8 border-b border-white/10 bg-gradient-to-r from-violet/10 to-amber/10 text-center">
              <div
                className="mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center text-2xl font-display font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #9D4EDD, #FF007F)' }}
              >
                {user?.name ? user.name.trim()[0].toUpperCase() : <UserIcon className="h-7 w-7" />}
              </div>
              <h1 className="text-xl font-display font-bold text-ink">{user?.name}</h1>
              <span className="chip-violet mt-2 inline-block">admin</span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center text-sm">
                <Mail className="h-4.5 w-4.5 mr-3 text-violet-soft flex-shrink-0" />
                <span className="text-muted">{user?.email}</span>
              </div>
              <div className="flex items-start text-sm rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <ShieldCheck className="h-4.5 w-4.5 mr-3 text-emerald-300 flex-shrink-0 mt-0.5" />
                <p className="text-muted">
                  Your admin account is protected from deletion through the dashboard, including by other
                  admins. This prevents the platform from accidentally being left without an administrator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminProfilePage;
