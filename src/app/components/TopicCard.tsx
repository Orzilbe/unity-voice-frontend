// apps/web/src/app/components/TopicCard.tsx
import { useRouter } from "next/navigation";
import { useState } from "react";
import { taskEndpoints } from '../../config/api';

interface Topic {
  TopicName: string;
  TopicHe: string;
  Icon: string;
}

interface TopicCardProps {
  topic: Topic;
  userId: string;
  onError?: (message: string) => void;
}

const TopicCard = ({ topic, userId, onError }: TopicCardProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // פונקציה ליצירת משימה ולניווט לדף התוכן
  const handleTopicClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // אם כבר מעבד, אל תעשה כלום
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // בדיקה שיש userId תקין
      if (!userId || userId === "" || userId === "0") {
        throw new Error('לא נמצא מזהה משתמש תקין - יש להתחבר מחדש');
      }
      
      // קבלת הטוקן
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('לא נמצא טוקן אימות - יש להתחבר מחדש');
      }
      
      // עיצוב שם הנושא לשימוש ב-URL
      const topicUrlName = topic.TopicName.toLowerCase().replace(/\s+/g, '-');
      
      // לוג הפרטים לפני השליחה
      console.log(`Creating task for topic: ${topic.TopicName}, userId: ${userId}`);
      
      try {
        // יצירת משימה חדשה - שימוש ב-endpoint הנכון
        const taskData = await taskEndpoints.create({
          UserId: userId,
          TopicName: topic.TopicName,
          Level: 1, // התחלה מרמה 1
          TaskType: 'flashcard' // סוג המשימה הראשונה
        });

        // בדיקה שהתשובה תקינה
        if (!taskData || !taskData.TaskId) {
          throw new Error('לא התקבל מזהה משימה מהשרת');
        }

        const taskId = taskData.TaskId;
        console.log('Task created successfully with ID:', taskId);

        // ניווט לדף כרטיסיות עם מזהה המשימה
        const path = `/topics/${topicUrlName}/tasks/flashcard?level=1&taskId=${taskId}`;
        console.log(`Navigating to: ${path}`);
        router.push(path);
        
      } catch (apiError: any) {
        console.error('API Error details:', apiError);
        
        // טיפול בשגיאות ספציפיות מה-API
        if (apiError.status === 401) {
          throw new Error('פג תוקף ההתחברות - יש להתחבר מחדש');
        } else if (apiError.status === 403) {
          throw new Error('אין הרשאה לבצע פעולה זו');
        } else if (apiError.status === 400) {
          throw new Error(apiError.message || 'נתונים לא תקינים');
        } else if (apiError.responseData?.message) {
          throw new Error(apiError.responseData.message);
        } else {
          throw new Error('אירעה שגיאה בתקשורת עם השרת');
        }
      }
      
    } catch (error) {
      console.error('Error in topic selection:', error);
      
      // בדיקה אם השגיאה היא שגיאת אימות
      if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('אימות') || 
          error.message.includes('להתחבר') ||
          error.message.includes('פג תוקף')
      )) {
        // ניווט לדף ההתחברות במקרה של שגיאת אימות
        console.log('Authentication error detected - redirecting to login');
        router.push('/login');
        return;
      }
      
      // הצגת הודעת שגיאה למשתמש
      if (onError) {
        const errorMessage = error instanceof Error ? error.message : 'אירעה שגיאה בהתחלת פעילות. אנא נסה שוב.';
        onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={handleTopicClick}
      className={`group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${isProcessing ? 'opacity-75' : ''}`}
    >
      <div className="flex flex-col items-center space-y-4">
        {isProcessing ? (
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
            {topic.Icon || '🌟'}
          </span>
        )}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
            {topic.TopicName}
          </h2>
          <p className="text-gray-500 text-sm">
            {topic.TopicHe}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;