//apps/web/src/app/topics/[topicName]/tasks/quiz/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaStar, FaTrophy, FaStopwatch } from 'react-icons/fa';
import { getAuthToken } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';
import { formatTopicNameForDb } from '../../../../lib/topicUtils';

interface WordData {
  WordId?: string;
  wordId?: string;
  Word: string;
  Translation: string;
  TopicName?: string;
  topicName?: string;
}

interface QuizQuestion {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

export default function QuizTask() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  const level = searchParams?.get('level') || '1';
  const taskId = searchParams?.get('taskId');
  
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

  // Format the topic name for display
  const formatTopicName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pageTitle = `${formatTopicName(topicName)} Quiz - Level ${level}`;

  // Generate mock quiz questions based on a task ID
  useEffect(() => {
    const generateQuizQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.group('Generating Quiz Questions');
        console.log('Original topicName from URL:', topicName);
        
        // Ensure consistent topic name formats
        const urlTopicName = topicName; // Keep the original for URL navigation
        const dbTopicName = formatTopicNameForDb(topicName);
        
        console.log('Formatted topic names - URL:', urlTopicName, 'DB:', dbTopicName);
        
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication token missing');
        }
        
        // First try to get words from the task if we have a taskId
        let taskWords: WordData[] = [];
        if (taskId) {
          try {
            console.log(`Attempting to fetch words associated with flashcard task ${taskId}`);
            const taskWordsResponse = await fetch(`/api/words-in-task?taskId=${encodeURIComponent(taskId)}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (taskWordsResponse.ok) {
              const taskWordsData = await taskWordsResponse.json();
              if (taskWordsData.success && Array.isArray(taskWordsData.data)) {
                taskWords = taskWordsData.data;
                console.log(`Retrieved ${taskWords.length} words from task ${taskId}`);
              } else {
                console.warn('Task words endpoint returned success, but no data array');
              }
            } else {
              console.warn(`Could not fetch task words: ${taskWordsResponse.status}`);
            }
          } catch (taskWordsError) {
            console.error('Error fetching task words:', taskWordsError);
          }
        }
        
        // If we couldn't get words from the task, try both formats of topic name
        if (taskWords.length === 0) {
          console.log('No task words found, fetching from topic instead');
          
          // Try with DB format (spaces and capital letters)
          const dbFormatResponse = await fetch(`/api/words?topic=${encodeURIComponent(dbTopicName)}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (dbFormatResponse.ok) {
            const dbWords = await dbFormatResponse.json();
            if (Array.isArray(dbWords) && dbWords.length > 0) {
              console.log(`Retrieved ${dbWords.length} words using DB format topic name`);
              taskWords = dbWords;
            }
          }
          
          // If still no words, try URL format (hyphens and lowercase)
          if (taskWords.length === 0) {
            console.log('No words found with DB format, trying URL format');
            const urlFormatResponse = await fetch(`/api/words?topic=${encodeURIComponent(urlTopicName)}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (urlFormatResponse.ok) {
              const urlWords = await urlFormatResponse.json();
              if (Array.isArray(urlWords) && urlWords.length > 0) {
                console.log(`Retrieved ${urlWords.length} words using URL format topic name`);
                taskWords = urlWords;
              }
            }
          }
        }
        
        // If we still have no words, throw an error
        if (taskWords.length === 0) {
          throw new Error('No words found for this topic. Please complete flashcard learning first.');
        }
        
        // Validate word structure to ensure they have the required fields
        const validWords = taskWords.filter((word: WordData) => 
          word && 
          word.Word && 
          word.Translation && 
          (word.WordId || word.wordId)
        );
        
        if (validWords.length === 0) {
          throw new Error('No valid words found with required fields.');
        }
        
        console.log(`${validWords.length} valid words available for quiz`);
        
        // Normalize word structure (some might have different casing for fields)
        const normalizedWords = validWords.map((word: WordData) => ({
          id: word.WordId || word.wordId || '',
          word: word.Word,
          correctAnswer: word.Translation,
          topicName: word.TopicName || word.topicName || dbTopicName
        }));
        
        // Transform words into quiz questions
        const questions = normalizedWords.map((word: { id: string; word: string; correctAnswer: string; topicName: string }) => {
          // Generate 3 random incorrect options
          const incorrectOptions = generateIncorrectOptions(word.correctAnswer, normalizedWords);
          
          // Combine correct answer with incorrect options and shuffle
          const options = [word.correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5);
          
          console.log(`Generated options for word "${word.word}":`, options);
          
          return {
            id: word.id,
            word: word.word,
            correctAnswer: word.correctAnswer,
            options
          };
        });
        
        // Shuffle questions
        const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
        
        // Use all available questions instead of limiting to 5
        const quizQuestions = shuffledQuestions;
        console.log(`Generated ${quizQuestions.length} quiz questions`);
        
        // Debug log the final questions with their options
        console.log("Final quiz questions:", quizQuestions.map((q: QuizQuestion) => ({
          word: q.word,
          correctAnswer: q.correctAnswer,
          optionsCount: q.options.length,
          options: q.options
        })));
        
        setQuizQuestions(quizQuestions);
        console.groupEnd();
      } catch (error) {
        console.error('Error generating quiz questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to load quiz questions');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isAuthenticated && topicName) {
      generateQuizQuestions();
    }
  }, [isAuthenticated, topicName, taskId, level]);

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

  // Function to generate incorrect options for a word
  const generateIncorrectOptions = (correctAnswer: string, allWords: { id: string; word: string; correctAnswer: string; topicName: string }[]) => {
    // Get all translations from other words
    const allTranslations = allWords
      .map(w => w.correctAnswer)
      .filter(translation => translation !== correctAnswer);
    
    // If we have fewer than 3 options, add some generic ones
    if (allTranslations.length < 3) {
      const genericOptions = ['תרגום', 'מילה', 'ביטוי', 'מושג', 'רעיון'];
      allTranslations.push(...genericOptions);
    }
    
    // Shuffle and take 3
    const shuffled = allTranslations.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
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
    
    // הזה את התשובה שנבחרה ועבור לשאלה הבאה
    setSelectedAnswer('');
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // סיים את הקוויז
      setIsTimerActive(false);
      setShowResultModal(true);
      completeQuizTask();
    }
  };

// Complete the quiz task and record results
const completeQuizTask = async () => {
  if (!taskId) {
    console.log('No taskId provided, cannot update task status');
    return;
  }
  
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    const payload = {
      TaskScore: score,
      DurationTask: timer,
      CompletionDate: new Date().toISOString()
    };
    
    console.log('Updating quiz task with payload:', payload);
    
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      console.log('Quiz task updated successfully');
    } else {
      const errorData = await response.json();
      console.error('Failed to update quiz task:', errorData);
    }
  } catch (error) {
    console.error('Error updating quiz task:', error);
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

  const navigateToNextTask = () => {
    const nextLevel = (parseInt(level) + 1).toString();
    const hasMoreLevels = parseInt(level) < 3;
    
    if (hasMoreLevels) {
      router.push(`/topics/${topicName}/tasks/flashcard?level=${nextLevel}`);
    } else {
      router.push(`/topics/${topicName}`);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading Quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">Please complete the flashcard exercise first to learn some words.</p>
          <div className="flex flex-col gap-4">
            <Link 
              href={`/topics/${topicName}/tasks/flashcard?level=${level}`}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              Go to Flashcards
            </Link>
            <Link 
              href="#" 
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              Back to Topics
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (quizQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-orange-500 text-5xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Quiz Questions Available</h2>
          <p className="text-gray-600 mb-6">Please complete the flashcard exercise first to learn some words.</p>
          <div className="flex flex-col gap-4">
            <Link 
              href={`/topics/${topicName}/tasks/flashcard?level=${level}`}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              Go to Flashcards
            </Link>
            <Link 
              href="#" 
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              Back to Topics
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

      {/* Profile Icon - Removed */}

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
              בחן את עצמך על המילים שלמדת
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

            <div className="space-y-4">
              <button
                id="try-again-btn"
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
                <p className="text-red-600 text-sm mt-2">
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