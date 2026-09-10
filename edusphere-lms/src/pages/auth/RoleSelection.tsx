import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiBookOpen, FiShield, FiArrowRight } from 'react-icons/fi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleSelectRole = (role: 'student' | 'instructor' | 'admin') => {
    setRole(role);
    if (role === 'student') navigate('/auth/student-login');
    else if (role === 'instructor') navigate('/auth/instructor-login');
    else if (role === 'admin') navigate('/auth/admin-login');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Choose Your Account Role</h2>
        <p className="text-xs text-slate-500">Select how you intend to use the EduSphere LMS ecosystem</p>
      </div>

      <div className="space-y-4">
        {/* Student Card */}
        <Card
          hoverEffect
          onClick={() => handleSelectRole('student')}
          className="p-5 flex items-center justify-between border-2 hover:border-brand-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-100 dark:bg-brand-950 text-brand-600 rounded-xl">
              <FiUser className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Student Portal</h3>
              <p className="text-xs text-slate-500">Access courses, assignments, quizzes, and certificates</p>
            </div>
          </div>
          <FiArrowRight className="w-5 h-5 text-slate-400" />
        </Card>

        {/* Instructor Card */}
        <Card
          hoverEffect
          onClick={() => handleSelectRole('instructor')}
          className="p-5 flex items-center justify-between border-2 hover:border-brand-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <FiBookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Instructor Studio</h3>
              <p className="text-xs text-slate-500">Manage curriculum, student rosters, gradebook, and revenue</p>
            </div>
          </div>
          <FiArrowRight className="w-5 h-5 text-slate-400" />
        </Card>

        {/* Admin Card */}
        <Card
          hoverEffect
          onClick={() => handleSelectRole('admin')}
          className="p-5 flex items-center justify-between border-2 hover:border-rose-500 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-xl">
              <FiShield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">System Governance</h3>
              <p className="text-xs text-slate-500">Platform control panel, user audits, and security settings</p>
            </div>
          </div>
          <FiArrowRight className="w-5 h-5 text-slate-400" />
        </Card>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
        <Link to="/">
          <Button variant="ghost" size="sm">Back to Home Page</Button>
        </Link>
      </div>
    </div>
  );
};
