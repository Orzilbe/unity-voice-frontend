//apps/web/src/app/topics/[topicName]/tasks/flashcard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FaVolumeUp, FaTimes } from 'react-icons/fa';
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
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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
  const [isLoading, setIsLoading] = useState(false);
  const [wordsAlreadySaved, setWordsAlreadySaved] = useState(false);
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
            console.log('🎯 Creating flashcard task...');
            // ✅ Add StartDate in MySQL format
            const startDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const taskCreationData = {
              UserId: userId,
              TopicName: formattedTopicName,
              Level: userLevel,
              TaskType: 'flashcard',
              StartDate: startDate // ✅ Add this!
            };
            console.log('📋 Task creation data:', taskCreationData);
            const taskData = await taskEndpoints.create(taskCreationData);
            console.log('✅ Task creation response:', taskData);
            
            // בדיקה אם יש TaskId בתגובה
            if (taskData && taskData.TaskId) {
              setTaskId(taskData.TaskId);
              console.log('💾 Task ID set successfully:', taskData.TaskId);
            } else {
              console.error('❌ Task creation response missing TaskId:', taskData);
              throw new Error('Invalid task creation response - missing TaskId');
            }
            
          } catch (taskCreateError) {
            console.error('💥 Task creation failed:', taskCreateError);
            
            // 🔍 פירוק מפורט של השגיאה
            if (taskCreateError instanceof Error) {
              console.error('🔍 Error details:');
              console.error('   - Name:', taskCreateError.name);
              console.error('   - Message:', taskCreateError.message);
              if (taskCreateError.stack) {
                console.error('   - Stack:', taskCreateError.stack.substring(0, 200) + '...');
              }
            }
            
            // בדיקת סוג השגיאה
            if (taskCreateError && typeof taskCreateError === 'object') {
              const errorObj = taskCreateError as any;
              if ('status' in errorObj) {
                console.error('🔍 HTTP Status:', errorObj.status);
                
                // הצגת הודעות ספציפיות לפי סטטוס
                switch (errorObj.status) {
                  case 401:
                    console.error('❌ Authentication failed - check your login status');
                    break;
                  case 403:
                    console.error('❌ Permission denied - check user permissions');
                    break;
                  case 404:
                    console.error('❌ API endpoint not found - check API_URL');
                    break;
                  case 500:
                    console.error('❌ Server error - check backend logs');
                    break;
                  default:
                    console.error(`❌ HTTP ${errorObj.status} error`);
                }
              }
              if ('response' in errorObj) {
                console.error('🔍 Response details:', errorObj.response);
              }
            }
            
            // ❌ אל תיצור client_ taskId!
            // במקום זה, פשוט המשך בלי taskId
            console.log('⚠️ Continuing without task ID - flashcards will load but progress will not be saved');
            
            // אם אתה רוצה להודיע למשתמש על הבעיה (אופציונלי):
            // setError('לא ניתן לשמור את התקדמותך כרגע. אתה יכול להמשיך ללמוד.');
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
  
  const [isSavingWords, setIsSavingWords] = useState(false);

  // פונקציה לשמירת כל המילים למשימה בכפיפה אחת
// פונקציה מתוקנת עם טיפול משופר בשגיאות
// מצא את הפונקציה saveAllWordsToTask והחלף אותה בקוד הזה:

const saveAllWordsToTask = useCallback(async () => {
  // 🔧 בדיקות מניעת שמירה
  if (isSavingWords) {
    console.log('⏳ Already saving words, skipping...');
    return;
  }
  
  if (!taskId) {
    console.log('⚠️ No taskId available - cannot save words to backend');
    return;
  }
  
  if (taskId.startsWith('client_')) {
    console.log('⚠️ Client-side taskId detected');
    return;
  }
  
  if (flashcards.length === 0) {
    console.log('📭 No flashcards to save');
    return;
  }

  // ✅ בדיקה חדשה - אם כבר נשמר, אל תשמור שוב
  if (wordsAlreadySaved) {
    console.log('✅ Words already saved for this task, skipping...');
    return;
  }
  
  setIsSavingWords(true);
  console.log(`💾 Starting to save ${flashcards.length} words to task ${taskId}`);
  
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const wordIds = flashcards.map(card => card.WordId);
    const requestPayload = {
      taskId: taskId,
      wordIds: wordIds
    };
    
    console.log('📤 Sending request:', {
      taskId,
      wordIdsCount: wordIds.length,
      sampleWordIds: wordIds.slice(0, 3)
    });
    
    const response = await fetch('/api/words/to-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestPayload)
    });
    
    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }
    
    const result = responseText ? JSON.parse(responseText) : { success: true };
    
    if (result.success === false) {
      throw new Error(result.error || 'Operation failed');
    }
    
    console.log(`✅ Successfully saved ${wordIds.length} words`);
    
    // ✅ סמן שהשמירה הושלמה בהצלחה
    setWordsAlreadySaved(true);
    
    return result;
    
  } catch (error) {
    console.error('💥 Error saving words:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        isNetworkError: error.message.includes('Failed to fetch')
      });
    }
    
    // אם יש שגיאה, לא נסמן כנשמר כדי שנוכל לנסות שוב
    
  } finally {
    setIsSavingWords(false);
    console.log('🏁 Save operation completed');
  }
}, [taskId, flashcards, isSavingWords, wordsAlreadySaved]); // ✅ עדכן dependencies

// פונקציה נוספת לבדיקת חיבור API (אופציונלית)
const testApiConnection = useCallback(async () => {
  try {
    console.log('🧪 Testing API connection...');
    
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📡 Health check response: ${response.status}`);
    
    if (response.ok) {
      const healthData = await response.json();
      console.log('✅ API is healthy:', healthData);
      return true;
    } else {
      console.error('❌ API health check failed');
      return false;
    }
  } catch (error) {
    console.error('💥 API connection test failed:', error);
    return false;
  }
}, []);

// פונקציה להצגת מידע debug (אופציונלית)
const logDebugInfo = useCallback(() => {
  console.group('🔍 Debug Information');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
  });
  
  console.log('Component State:', {
    taskId,
    flashcardsCount: flashcards.length,
    isSavingWords,
    userId
  });
  
  console.log('Authentication:', {
    hasToken: !!getAuthToken(),
    tokenLength: getAuthToken()?.length || 0
  });
  
  console.groupEnd();
}, [taskId, flashcards.length, isSavingWords, userId]);

  // Save words to task when flashcards are loaded
// useEffect מתוקן לשמירת מילים
// מצא את הuseEffect הזה והחלף אותו:

// Save words to task when flashcards are loaded
useEffect(() => {
  // Save words only if not already saved and not currently saving
  if (flashcards.length > 0 && 
      taskId && 
      !taskId.startsWith('client_') && 
      !isSavingWords && 
      !wordsAlreadySaved) {
    
    console.log('🎯 Triggering one-time word save...');
    console.log(`   - Flashcards: ${flashcards.length}`);
    console.log(`   - Task ID: ${taskId}`);
    console.log(`   - Already saved: ${wordsAlreadySaved}`);
    console.log(`   - Currently saving: ${isSavingWords}`);
    
    // Add a small delay to ensure all state is settled
    const saveTimer = setTimeout(() => {
      saveAllWordsToTask().catch(error => {
        console.error('❌ Automatic word save failed:', error);
      });
    }, 500); // השהיה של 500ms
    
    return () => {
      clearTimeout(saveTimer);
    };
  } else {
    // Log why we're not saving
    if (flashcards.length === 0) {
      console.log('⏸️ Not saving words: No flashcards loaded yet');
    } else if (!taskId) {
      console.log('⏸️ Not saving words: No task ID available');
    } else if (taskId.startsWith('client_')) {
      console.log('⏸️ Not saving words: Using client-side task ID');
    } else if (isSavingWords) {
      console.log('⏸️ Not saving words: Already in progress');
    } else if (wordsAlreadySaved) {
      console.log('⏸️ Not saving words: Already saved successfully');
    }
  }
}, [flashcards.length, taskId, isSavingWords, wordsAlreadySaved]); // ✅ עדכן dependencies

useEffect(() => {
  console.log('🔄 Task ID changed, resetting word save state');
  setWordsAlreadySaved(false);
}, [taskId]);


// הוספה אופציונלית: useEffect לבדיקת API בטעינה
useEffect(() => {
  // Test API connection when component mounts (optional)
  if (process.env.NODE_ENV === 'development') {
    const timer = setTimeout(() => {
      testApiConnection();
    }, 1000);
    
    return () => clearTimeout(timer);
  }
}, [testApiConnection]);

  // 🔄 פונקציה מעודכנת לחישוב המילים הפעילות (שלא נסקרו)
  const getActiveFlashcards = useCallback(() => {
    return flashcards.filter(card => !reviewedWords.includes(card.WordId));
  }, [flashcards, reviewedWords]);

  // 🔄 פונקציה להתאמת האינדקס למילה הפעילה הבאה
  const adjustCurrentIndex = useCallback(() => {
    const activeCards = getActiveFlashcards();
    if (activeCards.length === 0) {
      return; // כל המילים נסקרו
    }
    
    // אם המילה הנוכחית נסקרה, מעבר למילה הפעילה הבאה
    const currentCard = flashcards[currentIndex];
    if (currentCard && reviewedWords.includes(currentCard.WordId)) {
      // מצא את המילה הפעילה הבאה
      const nextActiveIndex = flashcards.findIndex((card, index) => 
        index > currentIndex && !reviewedWords.includes(card.WordId)
      );
      
      if (nextActiveIndex !== -1) {
        setCurrentIndex(nextActiveIndex);
      } else {
        // אם אין מילה פעילה אחרי, מצא את הראשונה מהתחלה
        const firstActiveIndex = flashcards.findIndex(card => 
          !reviewedWords.includes(card.WordId)
        );
        if (firstActiveIndex !== -1) {
          setCurrentIndex(firstActiveIndex);
        }
      }
    }
  }, [flashcards, currentIndex, reviewedWords, getActiveFlashcards]);

  // Check if all words have been reviewed
  useEffect(() => {
    if (flashcards.length > 0) {
      const allReviewed = flashcards.every(card => reviewedWords.includes(card.WordId));
      if (allReviewed && !allWordsReviewed) {
        setAllWordsReviewed(true);
      }
    }
  }, [reviewedWords, flashcards, allWordsReviewed]);

  // התאמת האינדקס כאשר מילה מסומנת כנסקרה
  useEffect(() => {
    adjustCurrentIndex();
  }, [reviewedWords, adjustCurrentIndex]);

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
          TaskScore: 0, // Flashcard tasks always have score of 0
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

  // Start quiz with error handling - תיקון עם UserId נכון
  const startQuiz = async () => {
    console.group('🎯 Starting Quiz');
    setError(null);
    setIsLoading(true);

    try {
      // First complete the current flashcard task
      const taskCompleted = await completeFlashcardTask();
      if (!taskCompleted) {
        throw new Error('Failed to complete flashcard task');
      }
      console.log('✅ Successfully completed flashcard task');

      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Format topic name consistently for DB (with spaces)
      const formattedTopicName = formatTopicNameForDb(topicName);
      console.log(`📝 Creating quiz task for topic: "${formattedTopicName}"`);
      
      const startDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const requestBody = {
        UserId: userId,
        TopicName: formattedTopicName,
        Level: userLevel,
        TaskType: 'quiz',
        StartDate: startDate
      };
      
      console.log('📤 Quiz task creation request:', requestBody);
      
      const createTaskResponse = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 Quiz task response status:', createTaskResponse.status);

      if (!createTaskResponse.ok) {
        const errorText = await createTaskResponse.text();
        console.error('❌ Failed to create quiz task:', {
          status: createTaskResponse.status,
          error: errorText
        });
        throw new Error(`Failed to create quiz task: ${errorText}`);
      }

      const taskData = await createTaskResponse.json();
      console.log('✅ Received task data:', taskData);

      if (!taskData.TaskId) {
        throw new Error('Quiz task created but no TaskId received');
      }

      const quizTaskId = taskData.TaskId;
      console.log('✅ Quiz task created with ID:', quizTaskId);

      // Build quiz URL with required parameters
      const urlTopicName = topicName;
      const quizParams = new URLSearchParams({
        level: userLevel.toString(),
        taskId: quizTaskId
      });

      const quizUrl = `/topics/${urlTopicName}/tasks/quiz?${quizParams.toString()}`;
      console.log(`🎯 Navigating to: ${quizUrl}`);
      
      router.push(quizUrl);

    } catch (error) {
      console.error('💥 Error starting quiz:', error);
      setError('אירעה שגיאה בהתחלת המבחן. אנא נסו שנית.');
      setIsLoading(false);
    } finally {
      console.groupEnd();
    }
  };

  // 🔄 פונקציות ניווט מעודכנות - רק למילים פעילות
  const handleNext = () => {
    const activeCards = getActiveFlashcards();
    if (activeCards.length === 0) return;
    
    const currentActiveIndex = activeCards.findIndex(card => 
      card.WordId === flashcards[currentIndex]?.WordId
    );
    
    if (currentActiveIndex < activeCards.length - 1) {
      // מצא את המילה הפעילה הבאה ברשימה המקורית
      const nextActiveCard = activeCards[currentActiveIndex + 1];
      const nextIndex = flashcards.findIndex(card => card.WordId === nextActiveCard.WordId);
      setCurrentIndex(nextIndex);
      setShowTranslation(false);
    }
  };

  const handlePrevious = () => {
    const activeCards = getActiveFlashcards();
    if (activeCards.length === 0) return;
    
    const currentActiveIndex = activeCards.findIndex(card => 
      card.WordId === flashcards[currentIndex]?.WordId
    );
    
    if (currentActiveIndex > 0) {
      // מצא את המילה הפעילה הקודמת ברשימה המקורית
      const prevActiveCard = activeCards[currentActiveIndex - 1];
      const prevIndex = flashcards.findIndex(card => card.WordId === prevActiveCard.WordId);
      setCurrentIndex(prevIndex);
      setShowTranslation(false);
    }
  };

  // 🔄 Mark word as reviewed - מעבר אוטומטי למילה הבאה
  const markWordAsReviewed = () => {
    const currentWordId = flashcards[currentIndex]?.WordId;
    if (currentWordId && !reviewedWords.includes(currentWordId)) {
      setReviewedWords(prev => [...prev, currentWordId]);
      
      // ✅ מעבר אוטומטי למילה הפעילה הבאה
      const activeCards = getActiveFlashcards().filter(card => card.WordId !== currentWordId);
      if (activeCards.length > 0) {
        // מצא את המילה הפעילה הבאה
        const nextActiveCard = activeCards.find(card => {
          const cardIndex = flashcards.findIndex(c => c.WordId === card.WordId);
          return cardIndex > currentIndex;
        }) || activeCards[0]; // אם אין מילה אחרי, קח את הראשונה
        
        const nextIndex = flashcards.findIndex(card => card.WordId === nextActiveCard.WordId);
        setCurrentIndex(nextIndex);
        setShowTranslation(false);
      }
    }
  };

  // 🔄 פונקציה להסרת מילה מהמילים שנסקרו
  const removeWordFromReviewed = (wordId: string) => {
    setReviewedWords(prev => prev.filter(id => id !== wordId));
    setAllWordsReviewed(false); // איפוס הסטטוס אם הוסרה מילה
  };

  // Format topic name for display
  const formatTopicName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = `${formatTopicName(topicName)} - level ${userLevel}`;

  // 🔄 חישוב מילים פעילות ואינדקס נוכחי
  const activeFlashcards = getActiveFlashcards();
  const currentActiveIndex = activeFlashcards.findIndex(card => 
    card.WordId === flashcards[currentIndex]?.WordId
  );

  // Debug rendering
  console.log('Rendering FlashcardTask. allWordsReviewed:', allWordsReviewed);
  console.log(`Reviewed ${reviewedWords.length}/${flashcards.length} words`);
  console.log(`Active cards: ${activeFlashcards.length}, Current active index: ${currentActiveIndex}`);

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
              href="/topics" 
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
            href="/topics" 
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 inline-block"
          >
            חזרה לנושאים
          </Link>
        </div>
      </div>
    );
  }

  // ✅ אם כל המילים נסקרו - הצג מסך סיום
  if (allWordsReviewed || activeFlashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-green-500 text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">כל הכבוד!</h2>
          <p className="text-gray-600 mb-6">סיימת לסקור את כל המילים בנושא זה.</p>
          <p className="text-lg font-semibold text-gray-700 mb-8">
            סקרת {reviewedWords.length} מתוך {flashcards.length} מילים
          </p>
          
          <div className="flex justify-center">
            <button
              onClick={startQuiz}
              className="px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
            >
              התחל בוחן! 🎯
            </button>
          </div>
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
              כרטיסיה {currentActiveIndex + 1} מתוך {activeFlashcards.length}
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
              disabled={currentActiveIndex === 0}
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
              disabled={currentActiveIndex === activeFlashcards.length - 1}
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
                      <div className="flex flex-col flex-1">
                        <span className="font-semibold text-gray-700">{word.Word}</span>
                        <span className="text-sm text-gray-500">{word.Translation}</span>
                      </div>
                      {/* ✅ כפתור הסרה */}
                      <button
                        onClick={() => removeWordFromReviewed(wordId)}
                        className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors ml-2"
                        title="הסר מהמילים שנסקרו"
                      >
                        <FaTimes className="text-sm" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-4">אין עדיין מילים שנסקרו.</p>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReviewedWordsModal(false)}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1"
              >
                סגור
              </button>
              
              {/* ✅ כפתור התחלת בוחן אם כל המילים נסקרו */}
              {reviewedWords.length === flashcards.length && (
                <button
                  onClick={() => {
                    setShowReviewedWordsModal(false);
                    startQuiz();
                  }}
                  className="flex-1 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1"
                >
                  התחל בוחן! 🎯
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}