import React from 'react';

const AccountSettings: React.FC = () => {
  return (
    <div className="bg-white border border-[#E6E6E6] mt-[32px] shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Account & Security</h2>
        <p className="text-gray-600">
          Manage your account preferences and security settings.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Coming Soon</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Account settings functionality will be available in a future update. This will include:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Password change</li>
                <li>Email preferences</li>
                <li>Notification settings</li>
                <li>Account deactivation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
