import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Monitor, Users, Cpu,
  UserCheck, Bell, BarChart2, Settings, Droplets
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ward-monitor', icon: Monitor,          label: 'Ward Monitor' },
  { to: '/patients',     icon: Users,            label: 'Patients' },
  { to: '/devices',      icon: Cpu,              label: 'Devices' },
  { to: '/nurses',       icon: UserCheck,        label: 'Nurses' },
  { to: '/alerts',       icon: Bell,             label: 'Alerts' },
  { to: '/reports',      icon: BarChart2,        label: 'Reports' },
  { to: '/settings',     icon: Settings,         label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="bg-primary rounded-lg p-2">
          <Droplets className="text-white w-5 h-5" />
        </div>
        <div>
          <p className="font-display font-700 text-text-primary text-sm leading-tight">Smart IV Drip</p>
          <p className="text-xs text-text-secondary">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-control text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-xs text-text-secondary">GC University Hyderabad</p>
        <p className="text-xs text-text-secondary">FYP 2023 Batch</p>
      </div>
    </aside>
  );
}
