import { useState, useEffect } from 'react';
import { User, Task } from '../App';
import { Calendar, Flag, CheckCircle } from 'lucide-react';
import * as api from '../api';

type AvailableTasksProps = {
  user: User;
};

export default function AvailableTasks({ user }: AvailableTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTakenTasks, setMyTakenTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.role !== 'member') {
      return;
    }

    loadTasks();
  }, [user.organizationId, user.role]);

  const loadTasks = async () => {
    try {
      const [available, organizationTasks] = await Promise.all([
        api.listAvailableOrganizationTasks(),
        api.listOrganizationTasks(),
      ]);
      setTasks(available);
      setMyTakenTasks(organizationTasks.filter((task) => task.assignedTo === user.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load available tasks');
    }
  };

  const handleTakeTask = async (taskId: string) => {
    try {
      await api.takeOrganizationTask(taskId);
      await loadTasks();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to take task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await api.completeTask(taskId);
      await loadTasks();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!user.organizationId) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">
          You are not part of an organization.
        </div>
      </div>
    );
  }

  if (user.membershipStatus === 'pending') {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">
          Your membership is pending approval from an organization admin.
        </div>
      </div>
    );
  }

  if (user.role !== 'member') {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">
          Organization admins manage tasks from the Organization Tasks page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Tasks</h1>
        <p className="text-gray-600">Take tasks from {user.organizationName}</p>
      </div>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Available Tasks */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available to Take</h2>
        <div className="grid gap-4">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
              No available tasks at the moment.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-2 py-1 text-xs rounded-md border ${getPriorityColor(task.priority)}`}>
                        <Flag size={12} className="inline mr-1" />
                        {task.priority}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleTakeTask(task.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Take Task
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Taken Tasks */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Taken Tasks</h2>
        <div className="grid gap-4">
          {myTakenTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
              You haven't taken any tasks yet.
            </div>
          ) : (
            myTakenTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-2 py-1 text-xs rounded-md border ${getPriorityColor(task.priority)}`}>
                        <Flag size={12} className="inline mr-1" />
                        {task.priority}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(task.dueDate)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-md ${
                          task.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      <CheckCircle size={16} />
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
