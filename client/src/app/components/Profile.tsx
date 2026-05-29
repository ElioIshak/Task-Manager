import { useState } from 'react';
import { User } from '../App';
import { Save, Trash2, LogOut as LogOutIcon, UserPlus } from 'lucide-react';
import * as api from '../api';

type ProfileProps = {
  user: User;
  updateUser: (user: User) => void;
  onLogout: () => void;
};

export default function Profile({ user, updateUser, onLogout }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user.name,
    email: user.email,
  });
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [organizations, setOrganizations] = useState<api.OrganizationOption[]>([]);
  const [error, setError] = useState('');

  const loadOrganizations = async () => {
    try {
      const items = await api.listOrganizations();
      setOrganizations(items.map((org) => ({ ...org, name: org.name.replaceAll('_', ' ') })));
    } catch {
      setOrganizations([]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      updateUser(await api.updateProfile(editedUser));
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  const handleLeaveOrganization = async () => {
    if (window.confirm('Are you sure you want to leave this organization?')) {
      try {
        updateUser(await api.updateOrganization(null));
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to leave organization');
      }
    }
  };

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      updateUser(await api.updateOrganization(selectedOrgId));
      setShowJoinModal(false);
      setSelectedOrgId('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join organization');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.deleteAccount();
        onLogout();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete account');
      }
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile & Settings</h1>
      {error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>

        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editedUser.name}
                onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={editedUser.email}
                onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Save size={20} />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900 capitalize">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization</h2>

        {user.organizationId ? (
          <>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-sm text-gray-500">Organization Name</p>
                <p className="text-gray-900">{user.organizationName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Membership Type</p>
                <p className="text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`capitalize ${user.membershipStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {user.membershipStatus}
                </p>
              </div>
            </div>
            <button
              onClick={handleLeaveOrganization}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Leave Organization
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-4">You are not currently part of an organization.</p>
            <button
              onClick={() => {
                loadOrganizations();
                setShowJoinModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <UserPlus size={20} />
              Join Organization
            </button>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-gray-600 mb-4">
          Deleting your account will permanently remove all your data and tasks. This action cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <Trash2 size={20} />
          Delete Account
        </button>
      </div>

      {/* Join Organization Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Join Organization</h2>
            <form onSubmit={handleJoinOrganization} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an organization</option>
                  {organizations.map((org: any) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {organizations.length === 0 && (
                <p className="text-sm text-gray-500">
                  No organizations available. Ask an admin to create one first.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={organizations.length === 0}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Join
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setSelectedOrgId('');
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
