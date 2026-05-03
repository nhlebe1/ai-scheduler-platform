import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import WidgetPage from './pages/WidgetPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6 shadow-sm">
          <span className="font-semibold text-gray-800 text-sm mr-2">
            AI Scheduler Platform
          </span>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            Widget Demo
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm px-3 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800'
              }`
            }
          >
            Dashboard
          </NavLink>
        </nav>

        <Routes>
          <Route path="/" element={<WidgetPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
