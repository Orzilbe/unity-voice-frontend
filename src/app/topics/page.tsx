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
import LearningProcessGuide from '../components/LearningProcessGuide';


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
const [showGuide, setShowGuide] = useState(false);

const { isAuthenticated, isLoading, user, isInitialized, logout } = useAuth();

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
  console.log('🔄 Starting to fetch topics...');
  
  // Fallback topics data
  const fallbackTopics = [
      { TopicName: "Diplomacy and International Relations", TopicHe: "דיפלומטיה ויחסים בינלאומיים", Icon: "🤝" },
      { TopicName: "Economy and Entrepreneurship", TopicHe: "כלכלה ויזמות", Icon: "💰" },
      { TopicName: "Environment and Sustainability", TopicHe: "סביבה וקיימות", Icon: "🌱" },
      { TopicName: "History and Heritage", TopicHe: "הסטוריה ומורשת", Icon: "🏛️" },
      { TopicName: "Holocaust and Revival", TopicHe: "שואה ותקומה", Icon: "✡️" },
      { TopicName: "Innovation and Technology", TopicHe: "חדשנות וטכנולוגיה", Icon: "💡" },
      { TopicName: "Iron Swords War", TopicHe: "מלחמת חרבות ברזל", Icon: "⚔️" },
      { TopicName: "Society and Multiculturalism", TopicHe: "חברה ורב תרבותיות", Icon: "🌍" }
  ];
  
  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 5 seconds')), 5000)
    );
    
    // Race between API call and timeout
    const data = await Promise.race([
      topicsEndpoints.getAll(),
      timeoutPromise
    ]);
    
    console.log('✅ Topics data received:', data);
    console.log('🔍 Topics count:', Array.isArray(data) ? data.length : 'Not array');
    console.log('🔍 First topic:', data?.[0]);
    
    if (Array.isArray(data) && data.length > 0) {
      setTopics(data);
      console.log('✅ Topics state updated with API data');
    } else {
      console.log('⚠️ API returned empty or invalid data, using fallback');
      setTopics(fallbackTopics);
    }
    
  } catch (error) {
    console.error('❌ Error fetching topics:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    
    console.log('🔄 Using fallback topics data');
    setTopics(fallbackTopics);
  }
};

      // Fetch user data
const fetchUserData = async () => {
  try {
    console.log('🔍 === DEBUG: Starting fetchUserData ===');
    console.log('🔍 Current user from useAuth:', user);
    console.log('🔍 Token in localStorage:', localStorage.getItem('token'));
    console.log('🔍 IsAuthenticated:', isAuthenticated);
    
    const data = await userEndpoints.getData();
    
    console.log('🔍 === RAW API Response ===');
    console.log('🔍 Full response:', data);
    console.log('🔍 Response type:', typeof data);
    console.log('🔍 Response keys:', Object.keys(data || {}));
    console.log('🔍 Score field:', data?.Score);
    console.log('🔍 CurrentLevel field:', data?.currentLevel);
    console.log('🔍 CreationDate field:', data?.CreationDate);
    console.log('🔍 === END RAW RESPONSE ===');
    
    // מיפוי הנתונים
    const mappedUserData = {
      level: data.currentLevel || "Beginner",
      points: data.currentLevelPoints || 0,
      totalScore: data.Score || 0, // שינוי: רק Score כמו ב-UserProfile
      completedTasks: data.completedTasksCount || 0,
      activeSince: data.CreationDate ? new Date(data.CreationDate).toLocaleDateString() : "Today",
      nextLevel: data.nextLevel || "Intermediate",
      pointsToNextLevel: data.pointsToNextLevel || 100
    };
    
    console.log('🔍 === MAPPED USER DATA ===');
    console.log('🔍 Mapped data:', mappedUserData);
    console.log('🔍 Final totalScore:', mappedUserData.totalScore);
    console.log('🔍 === END MAPPED DATA ===');
    
    setUserData(mappedUserData);
    console.log('✅ User data set successfully');
    
  } catch (error) {
    console.error('❌ === API FAILED ===');
    console.error('❌ Error details:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('❌ === USING FALLBACK DATA ===');
    
    // Fallback למידע מדומה
    const fallbackData = {
      level: "Beginner",
      points: 150,
      totalScore: 850, // זה הערך הפיקטיבי
      completedTasks: 12,
      activeSince: new Date().toLocaleDateString(),
      nextLevel: "Intermediate", 
      pointsToNextLevel: 250
    };
    
    console.log('🔄 Setting fallback data:', fallbackData);
    setUserData(fallbackData);
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
console.log('🔍 Current topics in render:', topics);
console.log('🔍 Topics length:', topics.length);
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
<LearningProcessGuide 
  isVisible={showGuide} 
  onToggle={() => setShowGuide(!showGuide)} 
  showIcon={true} 
/>
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

{/* Hall of Fame Button - זמנית מוסתר */}
{/* 
<div className="flex justify-center mb-8">
  <Link href="/hall-of-fame">
    <div className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center">
      <span className="mr-2 text-xl">👑</span>
      <span>Hall of Fame</span>
    </div>
  </Link>
</div>
*/}
        
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

<div className="absolute top-4 left-4 flex space-x-3">
  <button 
    onClick={async () => {
      console.log('👋 Logout button clicked - starting cleanup...');
      
      try {
        // 1. נקה דרך useAuth hook (זה ינקה localStorage + יקרא לAPI)
        await logout();
        console.log('✅ useAuth logout completed');
        
        // 2. נקה דרך auth-cookies (לוודא שהכל נקי)
        clearAuthData();
        console.log('✅ clearAuthData completed');
        
        // 3. נקה ידנית את כל localStorage (לוודא שאין שאריות)
        localStorage.clear();
        console.log('✅ localStorage cleared');
        
        // 4. נקה cookies ידנית
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        console.log('✅ All cookies cleared');
        
        // 5. נווט לעמוד הלוגין
        console.log('🔄 Redirecting to login...');
        router.push('/login');
        
      } catch (error) {
        console.error('❌ Error during logout:', error);
        
        // אם יש שגיאה, עדיין ננקה הכל ידנית
        clearAuthData();
        localStorage.clear();
        window.location.href = '/login';
      }
    }}
    className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all duration-300"
  >
    <span className="text-2xl">👋</span>
  </button>
</div>
    </div>
  );
}