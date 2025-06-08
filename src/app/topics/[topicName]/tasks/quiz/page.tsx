//apps/web/src/app/topics/[topicName]/tasks/quiz/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaTrophy, FaStopwatch } from 'react-icons/fa';
import { getAuthToken } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';
import { formatTopicNameForDb } from '../../../../lib/topicUtils';
import { fetchWithAuth } from '../../../../../lib/fetchWithAuth';
interface WordData {
  WordId?: string;
  wordId?: string;
  Word: string;
  Translation: string;
  TopicName?: string;
  topicName?: string;
  ExampleUsage?: string;
}

interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

export default function QuizTask() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  const level = searchParams?.get('level') || '1';
  const taskId = searchParams?.get('taskId');
  
  // Get user ID from auth context
  const userId = user?.UserId || user?.userId || user?.id || '';
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<{ word: string, translation: string }[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<{ word: string, translation: string, userAnswer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // בדיקת אימות
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Add validation for required taskId
  useEffect(() => {
    if (!authLoading && !taskId) {
      console.error('No taskId provided in URL');
      router.push(`/topics/${topicName}/tasks/flashcard?level=${level}`);
    }
  }, [authLoading, taskId, topicName, level, router]);

  // Format the topic name for display
  const formatTopicName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = `${formatTopicName(topicName)} Quiz - Level ${level}`;

  // 🔥 Generate quiz questions - מתוקן לקחת בדיוק את המילים שנלמדו
  useEffect(() => {
    const generateQuizQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.group('🎯 Generating Quiz Questions');
        console.log('📋 Quiz parameters:');
        console.log('  - topicName:', topicName);
        console.log('  - level:', level);
        console.log('  - taskId:', taskId);
        console.log('  - userId:', userId);
        
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication token missing');
        }
        
        if (!userId) {
          throw new Error('User ID missing');
        }
        
        // 🔥 שלב 1: מצא את משימת הכרטיסיות האחרונה שהושלמה בנושא הזה
        console.log('🔍 Step 1: Finding completed flashcard task...');
        const dbTopicName = formatTopicNameForDb(topicName);
        
        const flashcardTaskResponse = await fetchWithAuth(`/api/tasks/completed-flashcard?topicName=${encodeURIComponent(dbTopicName)}&level=${level}&userId=${encodeURIComponent(userId)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!flashcardTaskResponse.ok) {
          throw new Error('לא נמצאה משימת כרטיסיות שהושלמה. אנא השלם קודם את משימת הכרטיסיות.');
        }
        
        const flashcardTaskData = await flashcardTaskResponse.json();
        console.log('📊 Flashcard task data:', flashcardTaskData);
        
        if (!flashcardTaskData.success || !flashcardTaskData.taskId) {
          throw new Error('לא נמצאה משימת כרטיסיות שהושלמה. אנא השלם קודם את משימת הכרטיסיות.');
        }
        
        const flashcardTaskId = flashcardTaskData.taskId;
        console.log(`✅ Found completed flashcard task: ${flashcardTaskId}`);
        
        // 🔥 שלב 2: קבל את המילים שנלמדו במשימת הכרטיסיות
        console.log('🔍 Step 2: Fetching learned words from flashcard task...');
        const wordsResponse = await fetch(`/api/words/in-task?taskId=${encodeURIComponent(flashcardTaskId)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📡 Words response status:', wordsResponse.status);
        
        if (!wordsResponse.ok) {
          const errorText = await wordsResponse.text();
          console.error('❌ Failed to fetch words:', errorText);
          throw new Error('נכשל בטעינת המילים שנלמדו. אנא נסה שוב.');
        }
        
        const wordsData = await wordsResponse.json();
        console.log('📊 Words data:', wordsData);
        
        if (!wordsData.success || !Array.isArray(wordsData.data) || wordsData.data.length === 0) {
          throw new Error('לא נמצאו מילים שנלמדו במשימת הכרטיסיות. אנא השלם קודם את משימת הכרטיסיות.');
        }
        
        const learnedWords: WordData[] = wordsData.data;
        console.log(`✅ Retrieved ${learnedWords.length} learned words:`, learnedWords.map(w => w.Word));
        
        // 🔥 שלב 3: בדיקת תקינות המילים
        const validWords = learnedWords.filter((word: WordData) => 
          word && 
          word.Word && 
          word.Translation && 
          (word.WordId || word.wordId)
        );
        
        if (validWords.length === 0) {
          throw new Error('לא נמצאו מילים תקינות עם כל השדות הנדרשים.');
        }
        
        console.log(`✅ ${validWords.length} valid words available for quiz`);
        console.log('📝 Valid words:', validWords.map(w => `${w.Word} = ${w.Translation}`));
        
        // 🔥 שלב 4: יצירת שאלות הבוחן מהמילים שנלמדו
        console.log('🔍 Step 4: Creating quiz questions from learned words...');
        const questions = validWords.map((word: WordData) => {
          // נרמול מבנה המילים
          const normalizedWord = {
            id: word.WordId || word.wordId || '',
            word: word.Word,
            correctAnswer: word.Translation,
            topicName: word.TopicName || word.topicName || dbTopicName
          };
          
          // יצירת 3 תשובות שגויות מתוך המילים האחרות שנלמדו
          const incorrectOptions = generateIncorrectOptions(normalizedWord.correctAnswer, validWords);
          
          // שילוב התשובה הנכונה עם השגויות וערבוב
          const options = [normalizedWord.correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5);
          
          console.log(`📝 Generated question for word "${normalizedWord.word}":`, {
            correctAnswer: normalizedWord.correctAnswer,
            options: options
          });
          
          return {
            id: normalizedWord.id,
            word: normalizedWord.word,
            correctAnswer: normalizedWord.correctAnswer,
            options
          };
        });
        
        // ערבוב השאלות
        const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
        
        console.log(`🎲 Generated ${shuffledQuestions.length} quiz questions from learned words`);
        console.log('📋 Final quiz questions:', shuffledQuestions.map((q: QuizQuestion) => ({
          word: q.word,
          correctAnswer: q.correctAnswer,
          optionsCount: q.options.length
        })));
        
        if (shuffledQuestions.length === 0) {
          throw new Error('לא ניתן לייצר שאלות מהמילים שנלמדו.');
        }
        
        setQuizQuestions(shuffledQuestions);
        console.groupEnd();
        
      } catch (error) {
        console.error('💥 Error generating quiz questions:', error);
        setError(error instanceof Error ? error.message : 'נכשל בטעינת שאלות הבוחן');
        console.groupEnd();
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && topicName && userId) {
      generateQuizQuestions();
    }
  }, [isAuthenticated, topicName, taskId, level, userId]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && !showResultModal) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, showResultModal]);

  // 🔥 Function to generate incorrect options - מתוקן לקחת רק מהמילים שנלמדו
  const generateIncorrectOptions = (correctAnswer: string, learnedWords: WordData[]) => {
    // קבלת כל התרגומים ממילים אחרות שנלמדו (לא כל המילים בנושא!)
    const allLearnedTranslations = learnedWords
      .map(w => w.Translation)
      .filter(translation => translation !== correctAnswer);
    
    console.log(`🔍 Generating incorrect options for "${correctAnswer}"`);
    console.log(`📚 Available learned translations:`, allLearnedTranslations);
    
    // אם יש פחות מ-3 אפשרויות מהמילים שנלמדו, הוסף כמה כלליות
    let availableOptions = [...allLearnedTranslations];
    
    if (availableOptions.length < 3) {
      console.log(`⚠️ Only ${availableOptions.length} learned translations available, adding generic options`);
      const genericOptions = [
        'קהילה', 'חברה', 'תרבות', 'מסורת', 'זהות', 
        'שוויון', 'כבוד', 'הבנה', 'שיתוף', 'אחדות'
      ].filter(option => option !== correctAnswer && !availableOptions.includes(option));
      
      availableOptions.push(...genericOptions);
    }
    
    // ערבוב וקח 3
    const shuffled = availableOptions.sort(() => Math.random() - 0.5);
    const selectedOptions = shuffled.slice(0, 3);
    
    console.log(`✅ Selected incorrect options:`, selectedOptions);
    return selectedOptions;
  };

  // Format timer display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate score based on time and streak
  const calculateQuestionScore = (timeSpent: number, currentStreak: number) => {
    let baseScore = 10;
    
    // Time bonus (faster = more points)
    if (timeSpent <= 3) baseScore += 5;
    else if (timeSpent <= 5) baseScore += 3;
    else if (timeSpent <= 10) baseScore += 1;
    
    // Streak bonus
    const streakBonus = Math.min(currentStreak * 2, 10);
    
    return baseScore + streakBonus;
  };

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !quizQuestions[currentQuestion]) return;
    
    const currentQuestionData = quizQuestions[currentQuestion];
    const isCorrect = selectedAnswer === currentQuestionData.correctAnswer;
    
    if (isCorrect) {
      const questionScore = calculateQuestionScore(timer, streak);
      setScore(prev => prev + questionScore);
      setStreak(prev => prev + 1);
      
      setCorrectAnswers(prev => [...prev, {
        word: currentQuestionData.word,
        translation: currentQuestionData.correctAnswer
      }]);
    } else {
      setStreak(0);
      setIncorrectAnswers(prev => [...prev, {
        word: currentQuestionData.word,
        translation: currentQuestionData.correctAnswer,
        userAnswer: selectedAnswer
      }]);
    }
    
    setSelectedAnswer('');
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setIsTimerActive(false);
      setShowResultModal(true);
      
      // Calculate final score including the last question
      const finalScore = isCorrect ? score + calculateQuestionScore(timer, streak) : score;
      setScore(finalScore);
      
      // Use the final score for task completion
      completeQuizTask(finalScore);
    }
  };

  // Complete the quiz task and record results
  const completeQuizTask = async (finalScore: number) => {
    if (!taskId) {
      console.log('⚠️ No taskId provided, cannot update task status');
      return;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No authentication token found');
        return;
      }
      
      const payload = {
        taskId: taskId,
        TaskScore: finalScore,
        DurationTask: timer,
        CompletionDate: new Date().toISOString()
      };
      
      console.log('📊 Updating quiz task with payload:', payload);
      
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('✅ Quiz task updated successfully');
      } else {
        const errorData = await response.text();
        console.error('❌ Failed to update quiz task:', errorData);
      }
    } catch (error) {
      console.error('💥 Error updating quiz task:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer('');
    setScore(0);
    setStreak(0);
    setTimer(0);
    setIsTimerActive(true);
    setShowResultModal(false);
    setCorrectAnswers([]);
    setIncorrectAnswers([]);
  };

  const navigateToNextTask = async () => {
    if ((correctAnswers.length / quizQuestions.length) < 0.6) return;
  
    try {
      const token = getAuthToken();
      const response = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId, topicName, level, finalScore: score,
          duration: timer, correctAnswers: correctAnswers.length,
          totalQuestions: quizQuestions.length
        })
      });
  
      if (response.ok) {
        const result = await response.json();
        router.push(`/topics/${topicName}/tasks/post?level=${level}&taskId=${result.newTaskId}`);
      } else {
        alert('שגיאה בסיום הבוחן. אנא נסה שוב.');
      }
    } catch (error) {
      alert('שגיאה בסיום הבוחן. אנא נסה שוב.');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">טוען בוחן...</p>
        </div>
      </div>
    );
  }

  if (!taskId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">שגיאה בטעינת המבחן</h2>
          <p className="text-gray-600 mb-6">לא נמצא מזהה מבחן. אנא התחילו את המבחן מחדש דרך כרטיסיות הלימוד.</p>
          <Link 
            href={`/topics/${topicName}/tasks/flashcard?level=${level}`}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 inline-block"
          >
            חזרה לכרטיסיות
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">אנא השלם את תרגיל הכרטיסיות קודם כדי ללמוד מילים.</p>
          <div className="flex flex-col gap-4">
            <Link 
              href={`/topics/${topicName}/tasks/flashcard?level=${level}`}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              עבור לכרטיסיות
            </Link>
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
  
  if (quizQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-orange-500 text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">אין שאלות זמינות לבוחן</h2>
          <p className="text-gray-600 mb-6">אנא השלם את תרגיל הכרטיסיות קודם כדי ללמוד מילים.</p>
          <div className="flex flex-col gap-4">
            <Link 
              href={`/topics/${topicName}/tasks/flashcard?level=${level}`}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              עבור לכרטיסיות
            </Link>
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

      {/* Stats Header */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="flex justify-between items-center">
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaStar className="text-yellow-500 text-3xl mb-2 mx-auto" />
            <div className="text-3xl font-bold text-orange-500 mb-1">{score}</div>
            <div className="text-sm text-gray-600">ניקוד</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaTrophy className="text-orange-500 text-3xl mb-2 mx-auto" />
            <div className="text-3xl font-bold text-orange-500 mb-1">{streak}</div>
            <div className="text-sm text-gray-600">רצף</div>
          </div>
          <div className="text-center transform hover:scale-110 transition-all duration-300">
            <FaStopwatch className="text-blue-500 text-3xl mb-2 mx-auto" />
            <div className="text-3xl font-bold text-orange-500 mb-1">{formatTime(timer)}</div>
            <div className="text-sm text-gray-600">זמן</div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <main className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        {/* Quiz info banner */}
        <div className="bg-orange-50 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-700">
              בחן את עצמך על המילים שלמדת בכרטיסיות
            </h2>
          </div>
          <div className="text-orange-600 font-semibold">
            {quizQuestions.length} שאלות
          </div>
        </div>
        
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
          שאלה {currentQuestion + 1} מתוך {quizQuestions.length}
        </h2>
        <p className="text-xl text-gray-700 mb-8">
          בחר את התרגום הנכון למילה: <span className="font-bold text-2xl text-orange-600">{quizQuestions[currentQuestion].word}</span>
        </p>
        <div className="w-full max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizQuestions[currentQuestion]?.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`p-6 rounded-xl text-lg font-semibold transition-all duration-300 ${
                  selectedAnswer === option 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white transform scale-105' 
                  : 'bg-white text-gray-700 border-2 border-orange-200 hover:border-orange-400 hover:scale-105'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="mt-8 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl text-lg font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          שלח תשובה
        </button>
      </main>

      {/* Results Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
              תוצאות המבחן! 🎉
            </h2>
            <div className="bg-orange-50 rounded-xl p-6 mb-8">
              <p className="text-2xl text-gray-800 font-semibold mb-2">
                הניקוד שלך: <span className="text-orange-600">{score}</span> נקודות
              </p>
              <p className="text-xl text-gray-700 mb-1">
                תשובות נכונות: <span className="text-green-600 font-bold">{correctAnswers.length}</span> מתוך {quizQuestions.length} ({Math.round((correctAnswers.length / quizQuestions.length) * 100)}%)
              </p>
              <p className="text-gray-600 mt-2">זמן שחלף: {formatTime(timer)}</p>
              
              {/* Passing criteria explanation */}
              {(correctAnswers.length / quizQuestions.length) < 0.6 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700 font-medium">
                    לא ניתן להמשיך למשימה הבאה עם ציון נמוך מ-60%.
                  </p>
                  <p className="text-red-600 text-sm">
                    אתה צריך לענות נכון על לפחות {Math.ceil(quizQuestions.length * 0.6)} שאלות מתוך {quizQuestions.length} כדי להמשיך.
                  </p>
                </div>
              )}
            </div>
            
            {/* Results breakdown: Correct and Incorrect Answers */}
            <div className="mt-6 space-y-6">
              {/* Correct Answers Section */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-green-800 mb-3">תשובות נכונות ({correctAnswers.length})</h3>
                {correctAnswers.length > 0 ? (
                  <ul className="space-y-2">
                    {correctAnswers.map((answer, idx) => (
                      <li key={`correct-${idx}`} className="flex justify-between items-center bg-white px-4 py-2 rounded-lg shadow-sm">
                        <span className="font-medium">{answer.word}</span>
                        <span className="text-green-600">{answer.translation}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-2">אין תשובות נכונות.</p>
                )}
              </div>

              {/* Incorrect Answers Section */}
              <div className="bg-red-50 rounded-xl p-4">
                <h3 className="text-lg font-medium text-red-800 mb-3">תשובות שגויות ({incorrectAnswers.length})</h3>
                {incorrectAnswers.length > 0 ? (
                  <ul className="space-y-2">
                    {incorrectAnswers.map((answer, idx) => (
                      <li key={`incorrect-${idx}`} className="flex flex-col bg-white px-4 py-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{answer.word}</span>
                          <span className="text-red-600 line-through">{answer.userAnswer}</span>
                        </div>
                        <div className="text-right text-sm mt-1">
                          <span className="text-gray-500">התשובה הנכונה: </span>
                          <span className="text-green-600 font-medium">{answer.translation}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-center py-2">אין תשובות שגויות!</p>
                )}
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <button
                onClick={restartQuiz}
                className="w-full py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl"
              >
                נסה שוב 🔄
              </button>
              
              {/* Only enable "Next Challenge" if score is at least 60% */}
              <button
                onClick={navigateToNextTask}
                disabled={(correctAnswers.length / quizQuestions.length) < 0.6}
                className={`w-full py-3 ${
                  (correctAnswers.length / quizQuestions.length) >= 0.6
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-xl`}
              >
                האתגר הבא 🎯
              </button>
              
              {/* Passing score message below Next Challenge button */}
              {(correctAnswers.length / quizQuestions.length) < 0.6 && (
                <p className="text-red-600 text-sm text-center mt-2">
                  נדרש לפחות 60% תשובות נכונות כדי להמשיך לאתגר הבא
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}