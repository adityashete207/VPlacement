import React from 'react';
import { Linkedin, Twitter, Facebook, Instagram, Briefcase as BriefcaseBusiness } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Facebook, href: '#' },
    { icon: Twitter, href: '#' },
    { icon: Linkedin, href: '#' },
    { icon: Instagram, href: '#' },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-obsidian">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
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
              <h3 className="font-display font-bold text-lg text-ink">VPlacement</h3>
            </div>
            <p className="text-muted text-sm">
              Connecting talented professionals with great employers since 2023.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-display font-semibold text-ink uppercase tracking-wide mb-4">
              For Job Seekers
            </h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Browse Jobs</a></li>
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Career Resources</a></li>
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Resume Tips</a></li>
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Job Alerts</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-display font-semibold text-ink uppercase tracking-wide mb-4">
              For Employers
            </h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Post a Job</a></li>
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Recruitment Solutions</a></li>
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Talent Search</a></li>
              <li><a href="#" className="text-muted hover:text-ink text-sm transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-display font-semibold text-ink uppercase tracking-wide mb-4">Connect</h4>
            <div className="flex gap-3 mb-4">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted hover:text-ink hover:border-violet/40 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <p className="text-muted text-sm mb-2">Stay updated with our newsletter:</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-3.5 py-2 rounded-l-lg border border-white/10 bg-white/5 text-ink text-sm
                           placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-emerald/50 w-full"
              />
              <button
                className="px-4 py-2 rounded-r-lg text-sm font-semibold text-white transition-all"
                style={{ backgroundImage: 'linear-gradient(120deg, #8a3acb, #e6007a)' }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-muted text-sm">&copy; {currentYear} VPlacement. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="text-muted hover:text-ink text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted hover:text-ink text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-muted hover:text-ink text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;