import { Link, useLocation } from 'react-router';
import { User } from '../App';
import { ListTodo, Users, Briefcase, UserCircle, LogOut, UsersRound } from 'lucide-react';

type DashboardProps = {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
};

export default function Dashboard({ user, onLogout, children }: DashboardProps) {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard/my-tasks', label: 'My Tasks', icon: ListTodo },
    ...(user.organizationId && user.membershipStatus === 'approved'
      ? [
          { path: '/dashboard/organization-tasks', label: 'Organization Tasks', icon: Briefcase },
          ...(user.role === 'member'
            ? [{ path: '/dashboard/available-tasks', label: 'Available Tasks', icon: Users }]
            : []),
          ...(user.role === 'admin'
            ? [{ path: '/dashboard/members', label: 'Members', icon: UsersRound }]
            : []),
        ]
      : []),
    { path: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="size-full flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">Task Manager</h1>
          <p className="text-sm text-gray-400 mt-1">{user.name}</p>
          {user.organizationName && (
            <div className="mt-1">
              <p className="text-xs text-gray-500">{user.organizationName}</p>
              {user.membershipStatus === 'pending' && (
                <p className="text-xs text-yellow-400 mt-1">Pending Approval</p>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-300 hover:bg-gray-800 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 overflow-auto">
        {children}
      </div>
    </div>
  );
}
