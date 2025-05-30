//apps/web/src/app/topics/[topicName]/tasks/flashcard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaVolumeUp } from 'react-icons/fa';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getAuthToken } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { formatTopicNameForDb, formatTopicNameForUrl } from '../../../../lib/topicUtils';
import { flashcardEndpoints, taskEndpoints, topicsEndpoints } from '../../../../../config/api';

interface Flashcard {
  WordId: string;
  Word: string;
  Translation: string;
  ExampleUsage: string;
  TopicName: string;
  StartDate?: string;
}

interface WordData {
  WordId: string;
  Word: string;
  Translation: string;
  ExampleUsage?: string;
  TopicName: string;
}

interface WordToTaskMapping {
  WordId: string;
  TaskId: string;
}

export default function FlashcardTask() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params.topicName as string;
  const providedLevel = searchParams.get('level') || '1';
  
  const [userLevel, setUserLevel] = useState<number>(parseInt(providedLevel, 10) || 1);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [isLoadingUserLevel, setIsLoadingUserLevel] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [reviewedWords, setReviewedWords] = useState<string[]>([]);
  const [pageLoadTimeMs] = useState(Date.now());
  const [showTranslation, setShowTranslation] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'normal' | 'slow'>('normal');
  const [showReviewedWordsModal, setShowReviewedWordsModal] = useState(false);
  const [allWordsReviewed, setAllWordsReviewed] = useState(false);

  // Get user ID from auth context
  const userId = user?.UserId || user?.userId || user?.id || '';

  // NEW: Fetch the user's actual level for this topic
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    
    const fetchUserLevel = async () => {
      try {
        setIsLoadingUserLevel(true);
        
        // For now, just use the level from the URL
        // In the future, we can implement a proper user level endpoint
        const levelFromUrl = parseInt(providedLevel, 10) || 1;
        console.log(`Using level from URL: ${levelFromUrl}`);
        setUserLevel(levelFromUrl);
        
      } catch (err) {
        console.error('Error setting user level:', err);
        // Fall back to level 1
        setUserLevel(1);
      } finally {
        setIsLoadingUserLevel(false);
      }
    };
    
    fetchUserLevel();
  }, [isAuthenticated, isLoading, providedLevel]);

  // Load flashcards on component mount - Updated to use userLevel instead of level from URL
  useEffect(() => {
    if (!isAuthenticated || isLoading || isLoadingUserLevel || !userId) return;
    
    const loadFlashcards = async () => {
      try {
        setIsLoadingCards(true);
        setError(null);
        
        // Format topic name consistently - IMPORTANT: Use the DB format (with spaces)
        const formattedTopicName = formatTopicNameForDb(topicName);
        
        console.log(`Loading flashcards for topic: "${formattedTopicName}", user level: ${userLevel}`);
        console.log(`Original topic name from URL: "${topicName}"`);
        
        // First, validate that the topic exists by checking available topics
        try {
          console.log('Validating topic exists...');
          const availableTopics = await topicsEndpoints.getAll();
          console.log('Available topics:', availableTopics);
          
          // Check if our topic exists in the available topics
          const topicExists = Array.isArray(availableTopics) && 
            availableTopics.some((t: any) => 
              t.TopicName === formattedTopicName || 
              t.TopicName?.toLowerCase() === formattedTopicName.toLowerCase()
            );
          
          if (!topicExists) {
            console.log(`Topic "${formattedTopicName}" not found in available topics. Available topics:`, 
              availableTopics.map((t: any) => t.TopicName));
            throw { status: 404, message: `Topic "${formattedTopicName}" not found` };
          }
          
          console.log(`Topic "${formattedTopicName}" validated successfully`);
        } catch (topicValidationError) {
          console.error('Topic validation failed:', topicValidationError);
          
          // If we can't validate topics, we'll still try to load flashcards
          // This allows fallback to mock data if the backend is having issues
          console.log('Topic validation failed, but continuing with flashcard loading...');
        }
        
        // Create task if needed - Use the user's current level instead of URL level
        if (!taskId) {
          try {
            const taskData = await taskEndpoints.create({
              UserId: userId,
              TopicName: formattedTopicName,
              Level: userLevel,
              TaskType: 'flashcard'
            });
            
            setTaskId(taskData.TaskId);
            console.log('Task created successfully with ID:', taskData.TaskId);
          } catch (err) {
            console.error('Task creation error:', err);
            // Use temporary task ID if API fails
            const tempTaskId = `client_${uuidv4()}`;
            setTaskId(tempTaskId);
          }
        }
        
        // Fetch flashcards from the backend
        try {
          console.log(`Calling flashcard endpoint with topic: "${formattedTopicName}", level: ${userLevel}`);
          const flashcardData = await flashcardEndpoints.getByTopicAndLevel(formattedTopicName, userLevel);
          
          console.log('Flashcard API response:', flashcardData);
          
          if (!Array.isArray(flashcardData) || flashcardData.length === 0) {
            throw new Error('No words available for this topic and level');
          }
          
          // Transform the data if needed
          const transformedFlashcards: Flashcard[] = flashcardData.map((word: any) => ({
            WordId: word.WordId,
            Word: word.Word,
            Translation: word.Translation,
            ExampleUsage: word.ExampleUsage || `Example: ${word.Word} is used in context.`,
            TopicName: word.TopicName,
            StartDate: new Date().toISOString()
          }));
          
          console.log(`Loaded ${transformedFlashcards.length} flashcards:`, transformedFlashcards);
          setFlashcards(transformedFlashcards);
        } catch (flashcardError) {
          console.error('Flashcard loading error details:', {
            error: flashcardError,
            errorType: typeof flashcardError,
            errorKeys: flashcardError && typeof flashcardError === 'object' ? Object.keys(flashcardError) : [],
            errorMessage: flashcardError instanceof Error ? flashcardError.message : 'Not an Error instance',
            errorStringified: JSON.stringify(flashcardError, null, 2)
          });
          
          // If the topic doesn't exist, redirect to topics page
          if (flashcardError && typeof flashcardError === 'object' && 'status' in flashcardError) {
            if (flashcardError.status === 404) {
              console.log(`Topic "${formattedTopicName}" not found, redirecting to topics page`);
              setError(`The topic "${formattedTopicName}" was not found. Redirecting to topics page...`);
              // Redirect after a short delay to show the error message
              setTimeout(() => {
                router.push('/topics');
              }, 2000);
              return;
            } else if (flashcardError.status === 401) {
              console.log('Authentication failed, redirecting to login');
              setError('Authentication failed. Redirecting to login...');
              setTimeout(() => {
                router.push('/login');
              }, 2000);
              return;
            }
          }
          
          // For any other errors, try to get a meaningful message
          let errorMessage = 'Failed to load flashcards';
          if (flashcardError instanceof Error) {
            errorMessage = flashcardError.message;
          } else if (flashcardError && typeof flashcardError === 'object') {
            const errorObj = flashcardError as any;
            if ('message' in errorObj && errorObj.message) {
              errorMessage = String(errorObj.message);
            } else if ('statusText' in errorObj && errorObj.statusText) {
              errorMessage = `${errorObj.statusText} (${errorObj.status || 'unknown status'})`;
            } else if ('status' in errorObj) {
              errorMessage = `HTTP ${errorObj.status} error occurred`;
            }
          }
          
          console.log(`Final error message: ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
      } catch (err) {
        console.error('Error loading flashcards:', err);
        setError(err instanceof Error ? err.message : 'Failed to load flashcards');
      } finally {
        setIsLoadingCards(false);
      }
    };
    
    loadFlashcards();
  }, [isAuthenticated, isLoading, isLoadingUserLevel, userLevel, topicName, taskId, userId, router]);

  // Word pronunciation function
  const pronounceWord = useCallback((word: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = playbackSpeed === 'slow' ? 0.7 : 1;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      window.speechSynthesis.speak(utterance);
    }
  }, [playbackSpeed]);

  // פונקציה לשמירת כל המילים למשימה בכפיפה אחת
  const saveAllWordsToTask = useCallback(async () => {
    if (!taskId || taskId.startsWith('client_') || flashcards.length === 0) {
      console.log('Skipping word-to-task saving: no valid taskId or no flashcards');
      return;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }
      
      console.log(`Saving ${flashcards.length} words to task ${taskId}`);
      
      // יצירת מערך של WordToTaskMapping
      const wordToTaskMappings: WordToTaskMapping[] = flashcards.map(card => ({
        WordId: card.WordId,
        TaskId: taskId
      }));
      
      // שליחת כל המיפויים בבקשה אחת
      const response = await fetch('/api/word-to-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mappings: wordToTaskMappings
        })
      });
      
      if (response.ok) {
        console.log('All words saved to task successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to save words to task:', errorText);
      }
    } catch (error) {
      console.error('Error saving words to task:', error);
    }
  }, [taskId, flashcards]);

  // Auto-pronounce the current word when it changes
  useEffect(() => {
    if (flashcards.length > 0 && !showTranslation) {
      const currentWord = flashcards[currentIndex]?.Word;
      if (currentWord) {
        pronounceWord(currentWord);
      }
    }
  }, [currentIndex, flashcards, showTranslation, pronounceWord]);

  // Save words to task when flashcards are loaded
  useEffect(() => {
    if (flashcards.length > 0 && taskId && !taskId.startsWith('client_')) {
      console.log('Saving words to task...');
      saveAllWordsToTask();
    }
  }, [flashcards, taskId, saveAllWordsToTask]);

  // Check if all words have been reviewed
  useEffect(() => {
    if (flashcards.length > 0) {
      const allReviewed = flashcards.every(card => reviewedWords.includes(card.WordId));
      if (allReviewed && !allWordsReviewed) {
        setAllWordsReviewed(true);
        setShowReviewedWordsModal(true);
      }
    }
  }, [reviewedWords, flashcards, allWordsReviewed]);

  // Complete task function
  const completeFlashcardTask = async () => {
    if (!taskId || taskId.startsWith('client_')) {
      console.log('Task completion skipped: no valid taskId');
      return true; // Return success to allow navigation
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return false;
      }
      
      const durationTask = Math.floor((Date.now() - pageLoadTimeMs) / 1000);
      
      console.log(`Completing flashcard task ${taskId} with duration ${durationTask} seconds`);
      
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: taskId,
          TaskScore: 100, // Full score for completing all flashcards
          DurationTask: durationTask,
          CompletionDate: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        console.log('Flashcard task completed successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to complete flashcard task:', errorText);
        return false;
      }
    } catch (error) {
      console.error('Error completing flashcard task:', error);
      return false;
    }
  };

  // Start quiz function
  const startQuiz = async () => {
    try {
      console.log('Starting quiz for topic:', topicName, 'level:', userLevel);
      
      // First complete the flashcard task
      const taskCompleted = await completeFlashcardTask();
      
      if (!taskCompleted) {
        console.warn('Failed to complete flashcard task, but continuing to quiz');
      }
      
      // Create a new task for the quiz
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        router.push(`/topics/${topicName}/tasks/quiz?level=${userLevel}`);
        return;
      }
      
      try {
        const formattedTopicName = formatTopicNameForDb(topicName);
        
        const taskResponse = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            TopicName: formattedTopicName,
            Level: userLevel,
            TaskType: 'quiz',
            StartDate: new Date().toISOString()
          })
        });
        
        if (taskResponse.ok) {
          const taskData = await taskResponse.json();
          const quizTaskId = taskData.TaskId;
          console.log('Quiz task created successfully with ID:', quizTaskId);
          
          // Navigate to quiz with the new task ID
          router.push(`/topics/${topicName}/tasks/quiz?level=${userLevel}&taskId=${quizTaskId}`);
        } else {
          console.error('Failed to create quiz task, navigating without task ID');
          router.push(`/topics/${topicName}/tasks/quiz?level=${userLevel}`);
        }
      } catch (error) {
        console.error('Error creating quiz task:', error);
        router.push(`/topics/${topicName}/tasks/quiz?level=${userLevel}`);
      }
    } catch (error) {
      console.error('Error in startQuiz:', error);
      router.push(`/topics/${topicName}/tasks/quiz?level=${userLevel}`);
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTranslation(false);
    }
  };

  // Mark word as reviewed
  const markWordAsReviewed = () => {
    const currentWordId = flashcards[currentIndex]?.WordId;
    if (currentWordId && !reviewedWords.includes(currentWordId)) {
      setReviewedWords(prev => [...prev, currentWordId]);
    }
  };

  // Format topic name for display
  const formatTopicName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = `${formatTopicName(topicName)} - level ${userLevel}`;

  // Debug rendering
  console.log('Rendering FlashcardTask. allWordsReviewed:', allWordsReviewed);
  console.log(`Reviewed ${reviewedWords.length}/${flashcards.length} words`);

  // Loading state
  if (isLoading || isLoadingCards || isLoadingUserLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">טוען כרטיסיות...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">לא ניתן לטעון את הכרטיסיות כרגע. נא לנסות שוב מאוחר יותר.</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              נסה שוב
            </button>
            <Link 
              href="#" 
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              חזרה לנושאים
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No flashcards state
  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-orange-500 text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">אין מילים זמינות</h2>
          <p className="text-gray-600 mb-6">אין מילים זמינות לנושא זה ברמה הנוכחית.</p>
          <Link 
            href="#" 
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 inline-block"
          >
            חזרה לנושאים
          </Link>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative" dir="rtl">
      {/* Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Rubik', sans-serif;
        }
      `}</style>

      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 mt-2">{pageTitle}</h1>

      <main className="max-w-4xl mx-auto mt-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">
              כרטיסיה {currentIndex + 1} מתוך {flashcards.length}
            </span>
            <span className="text-sm font-medium text-gray-500">
              נסקרו: {reviewedWords.length} מתוך {flashcards.length}
            </span>
          </div>

          <div
            className="relative h-72 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl flex flex-col justify-center items-center mb-8 cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-md"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            <h2 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent text-center px-4">
              {showTranslation
                ? flashcards[currentIndex]?.Translation
                : flashcards[currentIndex]?.Word}
            </h2>
            {!showTranslation && flashcards[currentIndex]?.ExampleUsage && (
              <p className="text-gray-600 text-xl italic mt-6 px-12 text-center">
                {flashcards[currentIndex].ExampleUsage}
              </p>
            )}
          </div>

          <div className="flex justify-between items-center gap-6 mb-8">
            <button
              onClick={handlePrevious}
              className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
              disabled={currentIndex === 0}
            >
              הקודם
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => pronounceWord(flashcards[currentIndex]?.Word)}
                className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                title="השמע הגייה"
              >
                <FaVolumeUp className="text-xl" />
              </button>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(e.target.value as 'normal' | 'slow')}
                className="border-2 border-orange-200 text-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:border-orange-400"
              >
                <option value="normal">מהירות רגילה</option>
                <option value="slow">מהירות איטית</option>
              </select>
            </div>
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
              disabled={currentIndex === flashcards.length - 1}
            >
              הבא
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={markWordAsReviewed}
              className={`px-8 py-3 ${reviewedWords.includes(flashcards[currentIndex]?.WordId) ? 'bg-gray-400 hover:bg-gray-500' : 'bg-green-500 hover:bg-green-600'} text-white rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg`}
              disabled={reviewedWords.includes(flashcards[currentIndex]?.WordId)}
            >
              {reviewedWords.includes(flashcards[currentIndex]?.WordId) ? '✓ מילה סומנה כנלמדה' : 'סמן מילה כמילה שלמדתי ✓'}
            </button>
            <button
              onClick={() => setShowReviewedWordsModal(true)}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg"
            >
              צפה במילים שנסקרו 📚
            </button>
          </div>

          {/* Quiz start button */}
          {(allWordsReviewed || reviewedWords.length >= flashcards.length) && (
            <div className="flex justify-center mt-8">
              <button
                onClick={startQuiz}
                className="px-8 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
              >
                סיימתי ללמוד - התחל מבחן! 🎯
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Reviewed Words Modal */}
      {showReviewedWordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">מילים שנסקרו 🌟</h2>
            {reviewedWords.length > 0 ? (
              <ul className="space-y-4">
                {reviewedWords.map((wordId) => {
                  const word = flashcards.find((card) => card.WordId === wordId);
                  return word && (
                    <li key={wordId} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">{word.Word}</span>
                        <span className="text-sm text-gray-500">{word.Translation}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">אין עדיין מילים שנסקרו.</p>
            )}
            <button
              onClick={() => setShowReviewedWordsModal(false)}
              className="mt-6 w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1"
            >
              סגור
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      
    </div>
  );
}