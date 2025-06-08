// unity-voice-frontend/src/app/components/UserProfile.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { authenticatedApiCall } from '../../config/api';

// Extend the User interface to match your database structure
interface User {
  UserId?: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  EnglishLevel: string;
  AgeRange: string;
  ProfilePicture?: string;
  CreationDate: Date;
  LastLogin?: Date;
  Score: number;
}

interface UserProfileProps {
  isVisible?: boolean;
  onToggle?: () => void;  // Changed from onClose to onToggle
  showIcon?: boolean;
}

const UserProfile = ({ isVisible = false, onToggle, showIcon = true }: UserProfileProps) => {
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user data from the API
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isVisible) return;
    
      console.log('📊 UserProfile: Fetching user data...');
      setIsLoading(true);
      try {
        const data = await authenticatedApiCall('/user/data');
        
        // Set user data with proper type casting
        setUserData({
          FirstName: data.FirstName || '',
          LastName: data.LastName || '',
          Email: data.Email || '',
          PhoneNumber: data.PhoneNumber || '',
          EnglishLevel: data.EnglishLevel || 'Not Set',
          AgeRange: data.AgeRange || '',
          ProfilePicture: data.ProfilePicture || null,
          CreationDate: new Date(data.CreationDate),
          LastLogin: data.LastLogin ? new Date(data.LastLogin) : undefined,
          Score: data.Score || 0
        });
        
        setIsLoading(false);
        console.log('✅ UserProfile: User data loaded successfully');
      } catch (error) {
        console.error('❌ UserProfile: Error fetching user data:', error);
        setIsLoading(false);
      }
    };
    
    if (isVisible) {
      fetchUserData();
    }
  }, [isVisible]);

  // Simple handler that just calls the parent's toggle function
  const handleToggle = () => {
    console.log('🔄 UserProfile: Toggle clicked');
    if (onToggle) {
      onToggle();
    }
  };

  // Render full name
  const getFullName = () => {
    if (!userData?.FirstName && !userData?.LastName) return 'Guest User';
    return `${userData?.FirstName || ''} ${userData?.LastName || ''}`.trim();
  };

  return (
    <>
      {/* User profile icon - shown only if showIcon is true */}
      {showIcon && (
        <div className="absolute top-4 right-4">
          <div 
            className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            onClick={handleToggle}
          >
            {userData?.ProfilePicture ? (
              <Image 
                src={userData.ProfilePicture} 
                alt="Profile" 
                width={48}
                height={48}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
        </div>
      )}

      {/* Profile modal */}
      {isVisible && (
        <div className="absolute top-20 right-4 bg-white p-6 shadow-2xl rounded-2xl w-80 z-50 border border-gray-100 transform transition-all duration-300">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Profile</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : userData ? (
            <div className="space-y-3 text-gray-800">
              {/* Profile Picture */}
              {userData.ProfilePicture && (
                <div className="flex justify-center mb-4">
                  <Image 
                    src={userData.ProfilePicture} 
                    alt="Profile" 
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              )}

              <div className="space-y-2">
                <p className="flex justify-between">
                  <strong>Name:</strong> 
                  <span>{getFullName()}</span>
                </p>
                <p className="flex justify-between">
                  <strong>Email:</strong> 
                  <span className="text-right">{userData.Email || 'Not provided'}</span>
                </p>
                <p className="flex justify-between">
                  <strong>Phone:</strong> 
                  <span>{userData.PhoneNumber || 'Not provided'}</span>
                </p>
                <p className="flex justify-between">
                  <strong>English Level:</strong> 
                  <span>{userData.EnglishLevel}</span>
                </p>
                {userData.AgeRange && (
                  <p className="flex justify-between">
                    <strong>Age Range:</strong> 
                    <span>{userData.AgeRange}</span>
                  </p>
                )}
                <p className="flex justify-between">
                  <strong>Score:</strong> 
                  <span>{userData.Score}</span>
                </p>
                <p className="flex justify-between">
                  <strong>Member Since:</strong> 
                  <span>{userData.CreationDate.toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Failed to load user data</p>
          )}
          
          <div className="mt-6 space-y-2">
            <button
              className="w-full py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              onClick={handleToggle}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UserProfile;