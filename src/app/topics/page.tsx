// unity-voice-frontend/src/app/topics/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import UserProfile from '../components/UserProfile';
import TopicCard from '../components/TopicCard';
import { useAuth } from '../../hooks/useAuth';
import { clearAuthData } from '../../utils/auth-cookies';
import Link from 'next/link';
import { authenticatedApiCall, topicsEndpoints, userEndpoints } from '../../config/api';

interface Topic {
  TopicName: string;
  TopicHe: string;
  Icon: string;
}

interface UserData {
  level: string;
  points: number;
  totalScore: number;
  completedTasks: number;
  activeSince: string;
  nextLevel: string;
  pointsToNextLevel: number;
}

export default function Topics() {
  // הגדרת state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [userData, setUserData] = useState<UserData>({
    level: "",
    points: 0,
    totalScore: 0,
    completedTasks: 0,
    activeSince: "",
    nextLevel: "",
    pointsToNextLevel: 100
  });
  const [showProfile, setShowProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isAuthenticated, isLoading, user, isInitialized } = useAuth();
  const router = useRouter();
  
  // Add detailed logging for authentication state
  console.log('🔍 Topics page - Auth State:', { isAuthenticated, isLoading, isInitialized, user });
  
  // בדיקת אימות
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔄 Topics page - Checking auth:', { isInitialized, isLoading, isAuthenticated });
      
      if (isInitialized && !isLoading && !isAuthenticated) {
        console.log("❌ User not authenticated, redirecting to login...");
        try {
          await router.push('/login');
          console.log('✅ Navigation to login initiated');
        } catch (error) {
          console.error('❌ Navigation failed:', error);
          // Fallback to direct navigation
          window.location.href = '/login';
        }
      } else if (isInitialized && !isLoading && isAuthenticated) {
        console.log("✅ User authenticated, staying on topics page");
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, isInitialized, router]);

  // טעינת נתונים
  useEffect(() => {
    if (isAuthenticated) {
      // Fetch topics
      const fetchTopics = async () => {
        try {
          const data = await topicsEndpoints.getAll();
          console.log('Topics data:', data);
          setTopics(data);
        } catch (error) {
          console.error('Error fetching topics:', error);
          // Fallback to mock data if API fails
          console.log('🔄 Using mock topics data as fallback');
          setTopics([
            { TopicName: "Medical", TopicHe: "רפואה", Icon: "🏥" },
            { TopicName: "Legal", TopicHe: "משפטי", Icon: "⚖️" },
            { TopicName: "Social", TopicHe: "חברתי", Icon: "👥" },
            { TopicName: "Educational", TopicHe: "חינוכי", Icon: "📚" },
            { TopicName: "Community", TopicHe: "קהילתי", Icon: "🏘️" },
            { TopicName: "Employment", TopicHe: "תעסוקה", Icon: "💼" },
            { TopicName: "Healthcare", TopicHe: "בריאות", Icon: "💊" },
            { TopicName: "Rights", TopicHe: "זכויות", Icon: "🛡️" }
          ]);
        }
      };

      // Fetch user data
      const fetchUserData = async () => {
        try {
          const data = await userEndpoints.getData();
          console.log('User data from API:', data);
          
          setUserData({
            level: data.currentLevel || "Beginner",
            points: data.currentLevelPoints || 0,
            totalScore: data.totalScore || data.Score || data.score || 0,
            completedTasks: data.completedTasksCount || 0,
            activeSince: data.CreationDate ? new Date(data.CreationDate).toLocaleDateString() : "Today",
            nextLevel: data.nextLevel || "Intermediate",
            pointsToNextLevel: data.pointsToNextLevel || 100
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to mock data if API fails
          console.log('🔄 Using mock user data as fallback');
          setUserData({
            level: "Beginner",
            points: 150,
            totalScore: 850,
            completedTasks: 12,
            activeSince: new Date().toLocaleDateString(),
            nextLevel: "Intermediate", 
            pointsToNextLevel: 250
          });
        }
      };

      fetchTopics();
      fetchUserData();
    }
  }, [isAuthenticated]);

  const toggleProfile = () => setShowProfile(!showProfile);
  
  // פונקציה לטיפול בשגיאות מהקומפוננטה
  const handleTopicError = (message: string) => {
    setErrorMessage(message);
    // הסרת ההודעה אחרי 5 שניות
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 font-sans">
        <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-2xl text-teal-600 mb-4">
            {!isInitialized ? 'Initializing...' : 'Loading Topics...'}
          </div>
          <div className="w-16 h-16 border-t-4 border-b-4 border-teal-500 rounded-full animate-spin mb-4"></div>
          <div className="text-sm text-gray-600 text-center">
            {!isInitialized ? (
              <p>Setting up your session...</p>
            ) : (
              <p>Fetching your personalized topics...</p>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Status: {!isInitialized ? 'Initializing Auth' : 'Loading Data'}
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!isAuthenticated) {
    console.log('🚫 Topics page: User not authenticated, returning null...');
    return null;
  }

  console.log('✅ Topics page: Rendering content for authenticated user');

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      {/* Debug Panel - Remove this after debugging */}

      {/* Google Font Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>

      {/* User Profile Component */}
      <UserProfile isVisible={showProfile} onToggle={toggleProfile} showIcon={true} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Choose Your Topic
        </h1>

        {/* Gamification Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">🎯</span>
            </div>
            <p className="text-sm text-gray-500">Total Score</p>
            <p className="text-2xl font-bold text-orange-600">{userData.totalScore}</p>
            <p className="text-xs text-gray-400">points</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">✅</span>
            </div>
            <p className="text-sm text-gray-500">Completed Tasks</p>
            <p className="text-2xl font-bold text-orange-600">{userData.completedTasks}</p>
            <p className="text-xs text-gray-400">activities</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-xl">⏱️</span>
            </div>
            <p className="text-sm text-gray-500">Active Since</p>
            <p className="text-2xl font-bold text-orange-600">{userData.activeSince}</p>
          </div>
        </div>

        {/* Dashboard Button - מוצג רק למנהלים */}
        {user && user.role === 'admin' && (
          <div className="flex justify-center mb-4">
            <Link 
              href="/dashboard"
              onClick={(e) => {
                console.log('Dashboard link clicked');
                const token = localStorage.getItem('token');
                if (!token) {
                  e.preventDefault();
                  console.error('No token found in localStorage');
                  return;
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center cursor-pointer"
            >
              <span className="mr-2 text-xl">📊</span>
              <span>Dashboard</span>
            </Link>
          </div>
        )}

        {/* Hall of Fame Button */}
        <div className="flex justify-center mb-8">
          <Link href="/hall-of-fame">
            <div className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center">
              <span className="mr-2 text-xl">👑</span>
              <span>Hall of Fame</span>
            </div>
          </Link>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center">
            {errorMessage}
          </div>
        )}

        {/* Topics Grid - שימוש בקומפוננטת TopicCard המעודכנת */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map((topic) => (
            <TopicCard 
              key={topic.TopicName} 
              topic={topic} 
              userId={user?.UserId || user?.userId || user?.id || ""}
              onError={handleTopicError}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute top-4 left-4 flex space-x-3">
        <button 
          onClick={() => {
            clearAuthData();
            router.push('/login');
          }}
          className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <span className="text-2xl">👋</span>
        </button>
      </div>
    </div>
  );
}