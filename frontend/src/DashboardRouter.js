import React from 'react';
import DashboardOwner from './components/DashboardOwner';
import DashboardUser from './components/DashboardUser';
import DashboardAdmin from './components/DashboardAdmin';
export default function DashboardRouter({ role, onLogout }) {
  const dashboards = {
    systemadmin: <DashboardAdmin onLogout={onLogout} />,
    storeowner: <DashboardOwner onLogout={onLogout} />,
    normaluser: <DashboardUser onLogout={onLogout} />
  };

  return dashboards[role] || <p>Unknown role</p>;
}
