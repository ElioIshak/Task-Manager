import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';
import MyTasks from './components/MyTasks';
import TaskDetail from './components/TaskDetail';
import OrganizationTasks from './components/OrganizationTasks';
import AvailableTasks from './components/AvailableTasks';
import Profile from './components/Profile';
import Members from './components/Members';
import { clearStoredToken, getCurrentUser, getStoredToken } from './api';

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  organizationId: string | null;
  organizationName: string | null;
  membershipStatus: 'approved' | 'pending' | null;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  userId: string;
  type: 'personal' | 'organization';
  organizationId: string | null;
  assignedTo: string | null;
  createdAt: string;
};

export type Organization = {
  id: string;
  name: string;
  adminId: string;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const token = getStoredToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch {
        clearStoredToken();
        localStorage.removeItem('currentUser');
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    clearStoredToken();
    localStorage.removeItem('currentUser');
  };

  const updateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  if (isLoading) {
    return (
      <div className="size-full flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            currentUser ? (
              <Navigate to="/dashboard/my-tasks" replace />
            ) : (
              <AuthScreen onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard/*"
          element={
            currentUser ? (
              <Dashboard user={currentUser} onLogout={handleLogout}>
                <Routes>
                  <Route path="my-tasks" element={<MyTasks user={currentUser} />} />
                  <Route path="task/:id" element={<TaskDetail user={currentUser} />} />
                  <Route path="organization-tasks" element={<OrganizationTasks user={currentUser} />} />
                  <Route path="available-tasks" element={<AvailableTasks user={currentUser} />} />
                  <Route path="members" element={<Members user={currentUser} />} />
                  <Route path="profile" element={<Profile user={currentUser} updateUser={updateCurrentUser} onLogout={handleLogout} />} />
                  <Route path="*" element={<Navigate to="my-tasks" replace />} />
                </Routes>
              </Dashboard>
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={currentUser ? "/dashboard/my-tasks" : "/auth"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
