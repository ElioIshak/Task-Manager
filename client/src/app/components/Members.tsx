import { useState, useEffect } from 'react';
import { User, Task } from '../App';
import { UserCheck, UserX, Trash2, UserPlus } from 'lucide-react';

type MembersProps = {
  user: User;
};

type MemberWithTasks = User & {
  assignedTasksCount: number;
};

export default function Members({ user }: MembersProps) {
  const [members, setMembers] = useState<MemberWithTasks[]>([]);
  const [pendingMembers, setPendingMembers] = useState<User[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  useEffect(() => {
    if (user.role === 'admin' && user.organizationId) {
      loadMembers();
    }
  }, [user.organizationId]);

  const loadMembers = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // Get approved members
    const orgMembers = users.filter(
      (u: any) =>
        u.organizationId === user.organizationId &&
        u.membershipStatus === 'approved' &&
        u.id !== user.id
    );

    // Count assigned tasks for each member
    const membersWithTasks = orgMembers.map((member: User) => ({
      ...member,
      assignedTasksCount: tasks.filter(
        (t: Task) => t.assignedTo === member.id && t.type === 'organization'
      ).length,
    }));

    setMembers(membersWithTasks);

    // Get pending members
    const pending = users.filter(
      (u: any) =>
        u.organizationId === user.organizationId &&
        u.membershipStatus === 'pending'
    );
    setPendingMembers(pending);

    // Get available tasks
    const available = tasks.filter(
      (t: Task) =>
        t.organizationId === user.organizationId &&
        t.type === 'organization' &&
        t.assignedTo === null
    );
    setAvailableTasks(available);
  };

  const handleApproveMember = (memberId: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === memberId);

    if (userIndex !== -1) {
      users[userIndex].membershipStatus = 'approved';
      localStorage.setItem('users', JSON.stringify(users));
      loadMembers();
    }
  };

  const handleRejectMember = (memberId: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === memberId);

    if (userIndex !== -1) {
      users[userIndex].organizationId = null;
      users[userIndex].organizationName = null;
      users[userIndex].membershipStatus = null;
      localStorage.setItem('users', JSON.stringify(users));
      loadMembers();
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member? Their assigned tasks will become available again.')) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === memberId);

      if (userIndex !== -1) {
        // Unassign all tasks
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const updatedTasks = tasks.map((task: any) => {
          if (task.assignedTo === memberId && task.type === 'organization') {
            return { ...task, assignedTo: null };
          }
          return task;
        });
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));

        // Remove from organization
        users[userIndex].organizationId = null;
        users[userIndex].organizationName = null;
        users[userIndex].membershipStatus = null;
        localStorage.setItem('users', JSON.stringify(users));
        loadMembers();
      }
    }
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId || !selectedTaskId) return;

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const taskIndex = tasks.findIndex((t: Task) => t.id === selectedTaskId);

    if (taskIndex !== -1 && tasks[taskIndex].assignedTo === null) {
      tasks[taskIndex].assignedTo = selectedMemberId;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      loadMembers();
      setShowAssignModal(false);
      setSelectedMemberId('');
      setSelectedTaskId('');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">
          Only organization admins can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Members Management</h1>
        <p className="text-gray-600">{user.organizationName}</p>
      </div>

      {/* Pending Approvals */}
      {pendingMembers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Approvals ({pendingMembers.length})
          </h2>
          <div className="grid gap-4">
            {pendingMembers.map((member) => (
              <div
                key={member.id}
                className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <p className="text-xs text-yellow-600 mt-1">Waiting for approval</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveMember(member.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      <UserCheck size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectMember(member.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <UserX size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Active Members ({members.length})
          </h2>
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={members.length === 0 || availableTasks.length === 0}
          >
            <UserPlus size={16} />
            Assign Task
          </button>
        </div>

        <div className="grid gap-4">
          {members.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
              No active members yet.
            </div>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-lg shadow border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-gray-500 capitalize">
                        Role: {member.role}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                        {member.assignedTasksCount} task{member.assignedTasksCount !== 1 ? 's' : ''} assigned
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Assign Task to Member</h2>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Member
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.assignedTasksCount} tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Task
                </label>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a task</option>
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} - {task.priority} priority
                    </option>
                  ))}
                </select>
              </div>

              {availableTasks.length === 0 && (
                <p className="text-sm text-gray-500">
                  No available tasks to assign. Create organization tasks first.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={availableTasks.length === 0}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedMemberId('');
                    setSelectedTaskId('');
                  }}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
