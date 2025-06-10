//apps/web/src/app/topics/[topicName]/tasks/conversation/page.tsx
'use client';

import { v4 as uuidv4 } from 'uuid';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getAuthToken } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';
import { fetchWithAuth } from '../../../../../lib/fetchWithAuth';

// Polyfill AbortSignal.timeout for browsers that don't support it
if (!AbortSignal.timeout) {
  AbortSignal.timeout = function timeout(ms: number) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(new DOMException("TimeoutError", "TimeoutError")), ms);
    return controller.signal;
  };
}

// Add Web Speech API type declarations
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onend: () => void;
  onstart: () => void;
  onerror: (event: any) => void;
  onspeechstart: () => void;
  onspeechend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ConversationMessage {
  type: 'user' | 'ai' | 'feedback';
  content: string;
  feedback?: string;
  score?: number;
  pronunciationTips?: string[];
  grammarTips?: string[];
  suggestions?: string[];
  isTemporary?: boolean;
}

interface WordUsage {
  word: string;
  used: boolean;
  context?: string;
}

interface FeedbackResponse {
  text: string;
  feedback: string;
  usedWords: WordUsage[];
  nextQuestion: string;
  score: number;
  pronunciationTips?: string[];
  grammarTips?: string[];
  suggestions?: string[];
}

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  const level = searchParams?.get('level') || '1';
  const taskId = searchParams?.get('taskId');
  
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requiredWords, setRequiredWords] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState({
    messagesExchanged: 0,
    correctWords: 0,
    averageScore: 0,
    totalScore: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // State variables for speech and conversation tracking
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [userTurn, setUserTurn] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);
  
  // State for session tracking
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const microphoneTimeoutRef = useRef<number | null>(null);
  const speechEndTimeoutRef = useRef<number | null>(null);
  const speakingUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const inactivityTimeoutRef = useRef<number | null>(null);
  
  // New state for voice selection
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  // Initialize task when component mounts
  useEffect(() => {
    const initializeTask = async () => {
      if (!isAuthenticated) return;
      
      if (!taskId && topicName && level) {
        try {
          const token = getAuthToken();
          if (!token) {
            throw new Error('Authentication required');
          }
  
          console.log('Creating new conversation task');
          console.log('Topic Name:', topicName);
          console.log('Formatted Topic Name:', formatTopicNameForDB(topicName));
          console.log('Level:', level);
          
          // Create a new conversation task
          const response = await fetchWithAuth('/api/tasks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              TopicName: formatTopicNameForDB(topicName),
              Level: parseInt(level),
              TaskType: 'conversation'
            })
          });
  
          console.log('API Response status:', response.status);
  
          if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error Response:', errorText);
            
            let errorMessage = 'Failed to create conversation task';
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
              // Use default error message if JSON parsing fails
            }
            
            throw new Error(errorMessage);
          }
  
          const data = await response.json();
          console.log('Created conversation task:', data);
          
          if (data.TaskId) {
            // 🔧 תיקון: הפניה לכתובת החדשה עם taskId
            const newUrl = `/topics/${topicName}/tasks/conversation?level=${level}&taskId=${data.TaskId}`;
            console.log('Redirecting to:', newUrl);
            
            // שמירת זמן התחלה
            sessionStorage.setItem(`task_start_${data.TaskId}`, Date.now().toString());
            
            // הפניה לכתובת החדשה
            router.push(newUrl);
          } else {
            throw new Error('No TaskId returned from server');
          }
        } catch (error) {
          console.error('Error creating conversation task:', error);
          setError(`Failed to initialize conversation task: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (taskId) {
        // אם יש כבר taskId, שמור את זמן ההתחלה
        sessionStorage.setItem(`task_start_${taskId}`, Date.now().toString());
      }
    };
  
    initializeTask();
  }, [isAuthenticated, taskId, topicName, level, router]);
  
  // 🔧 הוספת useEffect נוסף לטיפול במקרה שאין taskId
  useEffect(() => {
    if (!authLoading && isAuthenticated && !taskId && topicName && level) {
      console.log('No taskId found in URL, need to create or redirect');
      // הקוד ליצירת המשימה כבר יפעל ב-useEffect הקודם
    }
  }, [authLoading, isAuthenticated, taskId, topicName, level]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          
          // When final speech is recognized
          recognitionRef.current.onresult = (event: any) => {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
              const transcript = lastResult[0].transcript.trim();
              
              if (transcript.length > 1) {
                // Check if this might be echo of AI's speech
                const lastAIMessage = messages.find(m => m.type === 'ai')?.content || '';
                const similarity = calculateTextSimilarity(transcript, lastAIMessage);
                
                if (similarity > 0.7) {
                  console.log("Detected echo of AI's own speech, ignoring");
                  return;
                }
                
                console.log("Final transcript:", transcript);
                handleUserResponse(transcript);
              }
            }
          };
          
          // Set up other recognition event handlers
          recognitionRef.current.onstart = () => {
            console.log("Recognition started");
            setUserSpeaking(false);
          };
          
          recognitionRef.current.onspeechstart = () => {
            console.log("Speech detected");
            setUserSpeaking(true);
            
            if (speechEndTimeoutRef.current) {
              clearTimeout(speechEndTimeoutRef.current);
              speechEndTimeoutRef.current = null;
            }
          };
          
          recognitionRef.current.onspeechend = () => {
            console.log("Speech ended");
            
            speechEndTimeoutRef.current = window.setTimeout(() => {
              setUserSpeaking(false);
              try {
                recognitionRef.current.stop();
              } catch (e) {
                console.log("Error stopping recognition", e);
              }
            }, 1000) as unknown as number;
          };
          
          recognitionRef.current.onend = () => {
            console.log("Recognition ended");
            
            if (userTurn && !userSpeaking) {
              console.log("Restarting recognition");
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log("Error restarting recognition", e);
                setTimeout(() => {
                  if (userTurn) {
                    try {
                      recognitionRef.current.start();
                    } catch (err) {
                      console.log("Failed to restart recognition again", err);
                    }
                  }
                }, 500);
              }
            }
          };
          
          recognitionRef.current.onerror = (event: any) => {
            console.error("Recognition error:", event.error);
            
            if (event.error === 'no-speech' && userTurn) {
              try {
                recognitionRef.current.stop();
                setTimeout(() => {
                  if (userTurn) {
                    try {
                      recognitionRef.current.start();
                      setMessages(prev => {
                        const hasReminder = prev.some(m => 
                          m.type === 'ai' && m.content.includes('waiting for your response')
                        );
                        
                        if (!hasReminder) {
                          return [...prev, {
                            type: 'ai',
                            content: "I'm waiting for your response. Please speak clearly when the microphone is active.",
                            feedback: "Microphone is listening"
                          }];
                        }
                        return prev;
                      });
                    } catch (err) {
                      console.log("Error restarting after no-speech", err);
                    }
                  }
                }, 300);
              } catch (e) {
                console.log("Error handling no-speech", e);
              }
            }
          };
        }
        
        // Initialize speech synthesis
        synthRef.current = window.speechSynthesis;
      } catch (err) {
        console.error("Error initializing speech APIs:", err);
        setError("Speech recognition not available in your browser");
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log("Error stopping recognition on cleanup", e);
        }
      }
      
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      
      [microphoneTimeoutRef.current, speechEndTimeoutRef.current, inactivityTimeoutRef.current].forEach(timeout => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
    };
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthenticated || !topicName) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Load required words for this topic and level
        try {
          const wordsResponse = await fetchWithAuth(`/api/words/required?topic=${encodeURIComponent(formatTopicNameForDB(topicName))}&level=${level}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (wordsResponse.ok) {
            const wordsData = await wordsResponse.json();
            console.log('Required words response:', wordsData);
            
            if (wordsData.success && Array.isArray(wordsData.data)) {
              setRequiredWords(wordsData.data);
              console.log(`Loaded ${wordsData.data.length} required words`);
            } else if (Array.isArray(wordsData)) {
              setRequiredWords(wordsData);
            } else {
              console.warn('No required words found for this topic and level');
              setRequiredWords([]);
            }
          } else {
            console.error('Failed to fetch required words:', wordsResponse.status);
            setRequiredWords([]);
          }
        } catch (err) {
          console.error('Error loading required words:', err);
          setRequiredWords([]);
        }
        
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [isAuthenticated, topicName, level]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process pending messages
  useEffect(() => {
    const processNextMessage = () => {
      if (pendingMessages.length > 0 && !aiSpeaking && isActive) {
        const nextMessage = pendingMessages[0];
        
        setPendingMessages(prev => prev.slice(1));
        
        speakTextWithTracking(nextMessage, () => {
          if (pendingMessages.length <= 1 && isActive) {
            setTimeout(() => {
              setUserTurn(true);
              activateMicrophone();
            }, 500);
          }
        });
      }
    };

    processNextMessage();
  }, [pendingMessages, aiSpeaking, isActive]);

  // Helper function to calculate text similarity
  function calculateTextSimilarity(str1: string, str2: string): number {
    const cleanStr1 = str1.toLowerCase().replace(/[^\w\s]/g, '');
    const cleanStr2 = str2.toLowerCase().replace(/[^\w\s]/g, '');
    
    const words1 = cleanStr1.split(/\s+/).filter(word => word.length > 2);
    const words2 = cleanStr2.split(/\s+/).filter(word => word.length > 2);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    let matchCount = 0;
    const shortestLength = Math.min(words1.length, words2.length);
    const checkLength = Math.min(6, shortestLength);
    let startingMatches = 0;
    
    for (let i = 0; i < checkLength; i++) {
      if (i < words1.length && i < words2.length && words1[i] === words2[i]) {
        startingMatches++;
      }
    }
    
    if (startingMatches >= 3 || (checkLength > 0 && startingMatches / checkLength >= 0.5)) {
      return 0.9;
    }
    
    for (const word of words1) {
      if (words2.includes(word) && word.length > 3) {
        matchCount++;
      }
    }
    
    return matchCount / Math.max(words1.length, 1);
  }

  // Format topic name for database (convert from URL format to proper format)
  const formatTopicNameForDB = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format topic name for display
  const formatTopicName = (name: string) => {
    return formatTopicNameForDB(name);
  };

  // Activate microphone with visual feedback
  const activateMicrophone = () => {
    if (!recognitionRef.current) return;
    
    try {
      console.log("Activating microphone");
      recognitionRef.current.start();
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.type === 'ai' && lastMessage.content.includes('Microphone is active')) {
          return prev;
        }
        
        return [...prev, {
          type: 'ai',
          content: "🎤 Microphone is active. Please speak now.",
          feedback: "Your turn to speak"
        }];
      });
      
      if (microphoneTimeoutRef.current) {
        clearTimeout(microphoneTimeoutRef.current);
      }
      
      microphoneTimeoutRef.current = window.setTimeout(() => {
        if (userTurn && !userSpeaking) {
          try {
            recognitionRef.current?.stop();
            setUserTurn(false);
          } catch (e) {
            console.log("Error stopping recognition on timeout", e);
          }
          
          const timeoutMessage = "I didn't hear your response. Let's move on to the next question.";
          
          setMessages(prev => [...prev, {
            type: 'ai',
            content: timeoutMessage
          }]);
          
          setPendingMessages(prev => [
            ...prev, 
            timeoutMessage, 
            "Let's try again. " + generateFirstQuestion()
          ]);
        }
      }, 20000) as unknown as number;
    } catch (e) {
      console.error("Could not start speech recognition:", e);
      setMessages(prev => [...prev, {
        type: 'ai',
        content: "I'm having trouble with the microphone. Please try refreshing the page.",
        feedback: "Microphone error"
      }]);
    }
  };

  // Handle user response
  const handleUserResponse = async (transcript: string) => {
    setUserTurn(false);
    setUserSpeaking(false);
    
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }

    inactivityTimeoutRef.current = window.setTimeout(() => {
      if (userTurn && isActive) {
        const reminderMessage = "Are you still there? I'm waiting for your response.";
        setMessages(prev => [...prev, {
          type: 'ai',
          content: reminderMessage
        }]);
        
        setPendingMessages(prev => [...prev, reminderMessage]);
      }
    }, 30000) as unknown as number;
    
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (e) {
      console.log("Error stopping recognition after response", e);
    }
    
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: transcript }]);

    try {
      // Show loading indicator
      setMessages(prev => [
        ...prev,
        { type: 'ai', content: '...', feedback: 'Analyzing your response...' }
      ]);

      // Process the response with the API
      const response = await analyzeResponse(transcript);
      
      // Add learning tips if available
      if (response.pronunciationTips?.length || response.grammarTips?.length || response.suggestions?.length) {
        let tipsText = "";
        if (response.pronunciationTips?.length) {
          tipsText += `💡 Pronunciation: ${response.pronunciationTips[0]}\n`;
        }
        if (response.grammarTips?.length) {
          tipsText += `✍️ Grammar: ${response.grammarTips[0]}\n`;
        }
        if (response.suggestions?.length) {
          tipsText += `💭 Suggestion: ${response.suggestions[0]}`;
        }
        
        if (tipsText) {
          setMessages(prev => {
            const newMessages = [...prev];
            const loadingIndex = newMessages.findIndex(m => 
              m.type === 'ai' && m.content === '...' && m.feedback === 'Analyzing your response...'
            );
            
            if (loadingIndex !== -1) {
              newMessages.splice(loadingIndex, 1);
            }
            
            return [
              ...newMessages, 
              { 
                type: 'feedback', 
                content: tipsText,
                feedback: 'Quick learning tip',
                isTemporary: true
              }
            ];
          });
          
          setTimeout(() => {
            setMessages(prev => prev.filter(m => !m.isTemporary));
          }, 5000);
        }
      }

      const combinedResponse = `${response.text}\n\n${response.nextQuestion}`;

      // Remove loading indicator and add real response  
      setMessages(prev => {
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex(m => 
          m.type === 'ai' && m.content === '...' && m.feedback === 'Analyzing your response...'
        );
        
        if (loadingIndex !== -1) {
          newMessages.splice(loadingIndex, 1);
        }
        
        return [
          ...newMessages, 
          { 
            type: 'ai', 
            content: combinedResponse, 
            feedback: response.feedback,
            score: response.score,
            pronunciationTips: response.pronunciationTips,
            grammarTips: response.grammarTips,
            suggestions: response.suggestions
          }
        ];
      });
      
      // Add to speech queue
      setPendingMessages(prev => {
        if (!prev.some(msg => msg.includes(response.text.substring(0, 20)))) {
          return [...prev, combinedResponse];
        }
        return prev;
      });

      // Record the answer in the database
      if (currentQuestionId) {
        await recordAnswer(
          currentQuestionId, 
          transcript, 
          JSON.stringify({
            feedback: response.feedback,
            score: response.score,
            usedWords: response.usedWords,
            pronunciationTips: response.pronunciationTips,
            grammarTips: response.grammarTips,
            suggestions: response.suggestions
          })
        );
      }
      
      recordQuestion(response.nextQuestion);
      
      // Update user progress
      setUserProgress(prev => {
        const newTotal = prev.totalScore + response.score;
        const newCount = prev.messagesExchanged + 1;
        return {
          messagesExchanged: newCount,
          correctWords: prev.correctWords + response.usedWords.filter(w => w.used).length,
          totalScore: newTotal,
          averageScore: Math.round(newTotal / newCount)
        };
      });

      // Show completion option after 3 exchanges
      if (userProgress.messagesExchanged >= 3 && 
          !messages.some(m => m.content.includes('complete this exercise')) &&
          !pendingMessages.some(m => m.includes('complete this exercise'))) {
        setTimeout(() => {
          const completionMessage = 'You\'re doing great! Would you like to continue practicing or complete this exercise?';
          
          setMessages(prev => [
            ...prev,
            { 
              type: 'ai', 
              content: completionMessage,
              feedback: 'You can say "complete" to finish or continue responding to practice more.'
            }
          ]);
          
          recordQuestion(completionMessage);
          setPendingMessages(prev => [...prev, completionMessage]);
        }, 7000);
      }

    } catch (error) {
      console.error('Error processing response:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const loadingIndex = newMessages.findIndex(m => 
          m.type === 'ai' && m.content === '...' && m.feedback === 'Analyzing your response...'
        );
        
        if (loadingIndex !== -1) {
          newMessages.splice(loadingIndex, 1);
        }
        
        const errorMessage = "I'm having trouble understanding. Let's try again.";
        
        setPendingMessages(prev => [...prev, errorMessage]);
        
        return [
          ...newMessages,
          { 
            type: 'ai', 
            content: errorMessage, 
            feedback: "Technical issue occurred. Please try responding again."
          }
        ];
      });
    }
  };

  // Speak text with tracking
  const speakTextWithTracking = (text: string, onComplete?: () => void) => {
    if (!synthRef.current) return;
    
    if (aiSpeaking && speakingUtteranceRef.current) {
      console.log("Already speaking, not starting new utterance");
      if (onComplete) setTimeout(onComplete, 500);
      return;
    }
    
    setAiSpeaking(true);
    synthRef.current.cancel();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Error stopping recognition during AI speech", e);
      }
    }
    
    const processText = (inputText: string): string => {
      const sentences = inputText.match(/[^\.!\?]+[\.!\?]+|\s*$/g) || [];
      const uniqueSentences: string[] = [];
      const seenSentences = new Set<string>();
      
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 0) {
          const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
          if (!seenSentences.has(normalized)) {
            seenSentences.add(normalized);
            uniqueSentences.push(trimmed);
          }
        }
      });
      
      return uniqueSentences.join(' ');
    };
    
    const cleanedText = processText(text);
    const chunks = cleanedText.match(/[^\.!\?]+[\.!\?]+|\s*$/g) || [];
    const cleanedChunks = chunks.filter(chunk => chunk.trim().length > 0);
    
    if (cleanedChunks.length === 0) {
      console.log("No speech chunks to process");
      setAiSpeaking(false);
      if (onComplete) setTimeout(onComplete, 100);
      return;
    }
    
    let currentChunkIndex = 0;
    
    const speakNextChunk = () => {
      if (currentChunkIndex >= cleanedChunks.length) {
        setAiSpeaking(false);
        speakingUtteranceRef.current = null;
        
        if (onComplete) {
          setTimeout(onComplete, 300);
        }
        return;
      }
      
      const chunk = cleanedChunks[currentChunkIndex];
      const utterance = new SpeechSynthesisUtterance(chunk);
      
      const voices = synthRef.current?.getVoices() || [];
      const preferredVoice = voices.find(voice => voice.name === selectedVoice) || 
                           voices.find(voice => voice.lang === 'en-US');
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      
      utterance.onend = () => {
        currentChunkIndex++;
        speakNextChunk();
      };
      
      utterance.onerror = (event) => {
        console.error(`Speech error in chunk ${currentChunkIndex}:`, event);
        currentChunkIndex++;
        speakNextChunk();
      };
      
      speakingUtteranceRef.current = utterance;
      if (synthRef.current) {
        synthRef.current.speak(utterance);
      }
    };
    
    speakNextChunk();
    
    const watchdogTimeout = setTimeout(() => {
      if (aiSpeaking) {
        setAiSpeaking(false);
        if (synthRef.current) synthRef.current.cancel();
        if (onComplete) onComplete();
      }
    }, 30000);
    
    return () => clearTimeout(watchdogTimeout);
  };

  // Analyze response using the API
  const analyzeResponse = async (userInput: string): Promise<FeedbackResponse> => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetchWithAuth('/api/analyze-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: userInput,
          topicName: formatTopicNameForDB(topicName),
          level: parseInt(level),
          previousMessages: messages.map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      if (response.status === 429) {
        console.warn('Rate limit reached, using fallback response');
        return generateFallbackResponse(userInput);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API response error:', response.status, errorData);
        return generateFallbackResponse(userInput);
      }

      try {
        const data = await response.json();
        
        if (!data.text || !data.feedback || !data.nextQuestion) {
          console.error('Invalid API response format:', data);
          return generateFallbackResponse(userInput);
        }
        
        return data;
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        return generateFallbackResponse(userInput);
      }
    } catch (error) {
      console.error('API request error:', error);
      return generateFallbackResponse(userInput);
    }
  };

  // Generate fallback response
  const generateFallbackResponse = (userInput: string): FeedbackResponse => {
    return {
      text: "I understand what you're saying. Thank you for sharing your thoughts!",
      feedback: "Good effort! Keep practicing your conversation skills.",
      usedWords: requiredWords.map(word => ({
        word,
        used: userInput.toLowerCase().includes(word.toLowerCase()),
        context: userInput.toLowerCase().includes(word.toLowerCase()) ? 
          `Found "${word}" in your response` : undefined
      })),
      nextQuestion: generateFirstQuestion(),
      score: 200,
      pronunciationTips: [],
      grammarTips: [],
      suggestions: ["Try to elaborate more on your ideas"]
    };
  };

  // Start conversation
  const startConversation = async () => {
    setIsActive(true);
    setMessages([]);
    setAiSpeaking(false);
    setUserSpeaking(false);
    setUserTurn(false);
    setPendingMessages([]);
    
    setUserProgress({
      messagesExchanged: 0,
      correctWords: 0,
      averageScore: 0,
      totalScore: 0
    });
    
    try {
      const createdSessionId = await createInteractiveSession();
      
      if (!createdSessionId) {
        setError('Failed to create conversation session');
        setIsActive(false);
        return;
      }
      
      setSessionId(createdSessionId);
      console.log(`Setting sessionId state to: ${createdSessionId}`);
      
      const welcomeMessage = `Welcome to our conversation about ${formatTopicName(topicName)}! I'll help you practice English while giving you supportive feedback to improve your speaking skills. Let's begin!`;
      setMessages([{ type: 'ai', content: welcomeMessage }]);
      
      const firstQuestion = generateFirstQuestion();
      setPendingMessages([welcomeMessage, firstQuestion]);
      
      const recordFirstQuestion = async () => {
        try {
          if (!createdSessionId) {
            console.error('Cannot record first question: sessionId not available');
            return null;
          }
          
          const questionId = await recordQuestion(firstQuestion, createdSessionId);
          setMessages(prev => [...prev, { type: 'ai', content: firstQuestion }]);
        } catch (recordError) {
          console.error('Error recording first question:', recordError);
          setMessages(prev => [...prev, { type: 'ai', content: firstQuestion }]);
        }
      };
      
      setTimeout(recordFirstQuestion, 500);
      
    } catch (error) {
      console.error('Error in startConversation:', error);
      setError('Failed to start conversation. Please try again.');
      setIsActive(false);
    }
  };

  // Generate first question
  const generateFirstQuestion = () => {
    const topic = topicName.toLowerCase();
    
    const questionMap: Record<string, string> = {
      'history': `What do you think about Israel's historical development?`,
      'heritage': `What aspects of cultural heritage interest you most?`,
      'innovation': `What Israeli technological innovations are you familiar with?`,
      'technology': `How do you think technology is changing our lives?`,
      'economy': `What interests you about Israel's economy or startup ecosystem?`,
      'entrepreneurship': `What makes a successful entrepreneur in your opinion?`,
      'diplomacy': `What do you think about Israel's diplomatic relations with other countries?`,
      'relations': `How important is international cooperation?`
    };
    
    for (const [key, question] of Object.entries(questionMap)) {
      if (topic.includes(key)) {
        return question;
      }
    }
    
    return `What aspects of ${formatTopicName(topicName)} interest you the most?`;
  };

  // Stop conversation audio
  const stopConversationAudio = () => {
    setUserTurn(false);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log("Error stopping recognition", e);
      }
    }
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    setAiSpeaking(false);
    
    if (microphoneTimeoutRef.current) {
      clearTimeout(microphoneTimeoutRef.current);
      microphoneTimeoutRef.current = null;
    }
    
    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }
  };

  // Stop conversation and redirect
  const stopConversation = async () => {
    setIsActive(false);
    stopConversationAudio();
    
    setMessages(prev => [
      ...prev,
      { 
        type: 'ai', 
        content: 'Saving your progress...',
        feedback: 'Please wait while we update your level.'
      }
    ]);
    
    try {
      let finalScore = userProgress.averageScore;
      if (finalScore <= 0 && userProgress.messagesExchanged > 0) {
        finalScore = Math.round((userProgress.correctWords / userProgress.messagesExchanged) * 100);
      }
      finalScore = Math.max(150, finalScore); // Minimum score for conversation
      
      if (taskId) {
        const taskStartTime = sessionStorage.getItem(`task_start_${taskId}`);
        let durationTask = 0;
        
        if (taskStartTime) {
          durationTask = Math.floor((Date.now() - parseInt(taskStartTime)) / 1000);
        }
        
        const token = getAuthToken();
        
        if (token) {
          await fetchWithAuth(`/api/tasks`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              taskId: taskId,
              TaskScore: finalScore,
              DurationTask: durationTask,
              CompletionDate: new Date().toISOString(),
              SessionId: sessionId,
              QuestionsCount: questionsCount,
              MessagesExchanged: userProgress.messagesExchanged
            })
          });
        }
      }
      
      window.location.href = '/topics';
    } catch (error) {
      console.error('Error in stopConversation:', error);
      window.location.href = '/topics';
    }
  };

  // Complete task
  const completeTask = async () => {
    if (isCompleting || !taskId) return;
    
    try {
      setIsCompleting(true);
      stopConversationAudio();
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const completionMessage = 'Great job! You\'ve completed the conversation practice.';
      const feedbackMessage = `Your average score: ${userProgress.averageScore}/400. You showed great improvement in your speaking skills!`;
      
      setMessages(prev => [
        ...prev,
        { 
          type: 'ai', 
          content: completionMessage,
          feedback: feedbackMessage
        }
      ]);
      
      if (sessionId) {
        await recordQuestion(completionMessage, sessionId);
      }
      
      speakTextWithTracking(completionMessage + " " + feedbackMessage, () => {
        setTimeout(() => {
          window.location.href = '/topics';
        }, 2000);
      });
      
      const taskStartTime = sessionStorage.getItem(`task_start_${taskId}`);
      let durationTask = 0;
      
      if (taskStartTime) {
        durationTask = Math.floor((Date.now() - parseInt(taskStartTime)) / 1000);
      }
      
      try {
        await fetchWithAuth(`/api/tasks`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            taskId: taskId,
            TaskScore: userProgress.averageScore || 150,
            DurationTask: durationTask,
            CompletionDate: new Date().toISOString(),
            SessionId: sessionId,
            QuestionsCount: questionsCount,
            MessagesExchanged: userProgress.messagesExchanged
          })
        });
      } catch (taskError) {
        console.error('Error completing task:', taskError);
      }
      
      try {
        const formattedTopicName = formatTopicNameForDB(topicName);
        
await fetchWithAuth('/api/user-level/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    topicName: formattedTopicName,
    currentLevel: parseInt(level || '1'),
    earnedScore: userProgress.averageScore || 150,
    taskId: taskId,
    isCompleted: true
  })
});

// יצירת רשומה חדשה לרמה הבאה
await fetchWithAuth('/api/user-level/update', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    topicName: formattedTopicName,
    currentLevel: parseInt(level || '1') + 1, // רמה הבאה
    taskId: taskId,
    isCompleted: false
  })
});
      } catch (levelError) {
        console.error('Error updating user level:', levelError);
      }
      
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Create interactive session
  const createInteractiveSession = async () => {
    if (!taskId) {
      console.error('Cannot create session: missing taskId');
      return null;
    }
    
    const newSessionId = uuidv4();
    sessionIdRef.current = newSessionId;
    setSessionId(newSessionId);
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token available for session creation');
        return newSessionId;
      }
      
      const response = await fetchWithAuth('/api/interactive-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          SessionId: newSessionId,
          TaskId: taskId,
          SessionType: 'conversation'
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        console.error('Interactive session creation failed');
        return newSessionId;
      }
      
      const data = await response.json();
      console.log('Interactive session created:', data);
      
      if (data.SessionId && data.SessionId !== newSessionId) {
        sessionIdRef.current = data.SessionId;
        setSessionId(data.SessionId);
        return data.SessionId;
      }
      
      return newSessionId;
    } catch (error) {
      console.error('Error creating interactive session:', error);
      return newSessionId;
    }
  };
  
  // Record a question in the conversation
  const recordQuestion = async (questionText: string, useSessionId?: string): Promise<string | null> => {
    const currentSessionId = useSessionId || sessionIdRef.current || sessionId;
    
    if (!currentSessionId) {
      console.error('Cannot record question: missing sessionId');
      return null;
    }
    
    const questionId = uuidv4();
    setCurrentQuestionId(questionId);
    setQuestionsCount(prev => prev + 1);
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token available for question recording');
        return questionId;
      }
      
      const truncatedText = questionText.length > 1000 
        ? questionText.substring(0, 997) + '...' 
        : questionText;
      
      const response = await fetchWithAuth('/api/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          QuestionId: questionId,
          SessionId: currentSessionId,
          QuestionText: truncatedText
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        console.error('Question recording failed');
        return questionId;
      }
      
      const data = await response.json();
      console.log('Question recorded successfully:', data);
      return questionId;
    } catch (error) {
      console.error('Error recording question:', error);
      return questionId;
    }
  };

  // Record an answer to a question
  const recordAnswer = async (questionId: string, answerText: string, feedback: string | object): Promise<boolean> => {
    if (!questionId) {
      console.error('Cannot record answer: missing questionId');
      return false;
    }
    
    try {
      const token = getAuthToken();
      if (!token) {
        console.warn('No authentication token available for answer recording');
        return false;
      }
      
      const truncatedAnswer = answerText.length > 1000 
        ? answerText.substring(0, 997) + '...' 
        : answerText;
      
      let processedFeedback = feedback;
      if (typeof feedback !== 'string') {
        try {
          processedFeedback = JSON.stringify(feedback);
        } catch (e) {
          console.warn('Error stringifying feedback, using empty string:', e);
          processedFeedback = '';
        }
      }
      
      const response = await fetchWithAuth(`/api/question/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          AnswerText: truncatedAnswer,
          Feedback: processedFeedback
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (!response.ok) {
        console.error('Answer recording failed');
        return false;
      }
      
      const data = await response.json();
      console.log('Answer recorded successfully:', data);
      return true;
    } catch (error) {
      console.error('Error recording answer:', error);
      return false;
    }
  };

  // Initialize voices when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const englishVoices = voices.filter(voice => 
            voice.lang.includes('en-')
          );
          setAvailableVoices(englishVoices);
          
          const defaultVoice = englishVoices.find(v => 
            v.name.includes('Female') || v.name.includes('female')
          );
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.name);
          } else if (englishVoices.length > 0) {
            setSelectedVoice(englishVoices[0].name);
          }
        }
      };
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
      
      loadVoices();
    }
  }, []);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading conversation...</p>
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
          <p className="text-gray-600 mb-6">We couldn't load the conversation at this time. Please try again later.</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300"
            >
              Try Again
            </button>
            <Link 
              href="/topics" 
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Rubik', sans-serif;
        }
      `}</style>

      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6 mt-2">
        {formatTopicName(topicName)} - Conversation Practice
      </h1>

      <div className="max-w-4xl mx-auto mt-4">
        {/* Start/Stop Button */}
        {!isActive && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Conversation Practice</h2>
            <p className="text-gray-600 mb-6">
              Practice speaking English about <span className="font-bold">{formatTopicName(topicName)}</span>. 
              Our AI conversation partner will listen to your responses, provide real-time feedback on pronunciation, 
              grammar, and fluency, while helping you improve your speaking skills naturally.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">What to expect:</h3>
              <ul className="text-sm text-blue-700 text-left max-w-md mx-auto">
                <li>• Real-time pronunciation hints</li>
                <li>• Grammar suggestions</li>
                <li>• Supportive feedback after each response</li>
                <li>• Natural conversation flow</li>
                <li>• Score range: 0-400 points per response</li>
              </ul>
            </div>
            
            {requiredWords.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-3">Try to use these words:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {requiredWords.map((word, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={startConversation}
              className="px-8 py-4 bg-orange-500 text-white text-xl font-bold rounded-full hover:bg-orange-600 transition-colors shadow-lg"
            >
              Start Conversation
            </button>
          </div>
        )}

        {/* Active Conversation */}
        {isActive && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={stopConversation}
                className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg"
              >
                End Conversation
              </button>
              
              {userProgress.messagesExchanged >= 3 && (
                <button
                  onClick={completeTask}
                  disabled={isCompleting}
                  className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isCompleting ? 'Completing...' : 'Complete Task'}
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    aiSpeaking 
                      ? 'bg-green-100 animate-pulse' 
                      : userTurn 
                        ? 'bg-red-100 animate-pulse' 
                        : 'bg-orange-100'
                  }`}>
                    {aiSpeaking 
                      ? '🔊' 
                      : userTurn 
                        ? '🎙️' 
                        : '💬'}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-bold text-gray-900">AI Conversation Partner</h2>
                    <p className="text-gray-500 text-sm">
                      {aiSpeaking 
                        ? "AI is speaking... Please listen" 
                        : userTurn 
                          ? "Your turn to speak - Microphone active" 
                          : isActive 
                            ? "Processing..." 
                            : "Click Start to begin"}
                    </p>
                  </div>
                </div>
                
                {userProgress.messagesExchanged > 0 && (
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="text-sm text-gray-500">Your score</div>
                    <div className="text-2xl font-bold text-orange-600">{userProgress.averageScore}/400</div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-orange-100 ml-12'
                        : message.type === 'feedback'
                          ? 'bg-green-50 border border-green-200'
                          : message.content.includes('Microphone is active')
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-gray-100 mr-12'
                    }`}
                  >
                    {message.type === 'feedback' && (
                      <div className="flex items-start">
                        <div className="text-green-500 mr-2 text-lg">💡</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">Learning Feedback:</p>
                          <p className="text-sm text-green-800 whitespace-pre-line">{message.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {message.type === 'ai' && message.content.includes('Microphone is active') ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <p className="text-gray-800 font-medium">{message.content}</p>
                      </div>
                    ) : message.type !== 'feedback' && (
                      <p className="text-gray-800">{message.content}</p>
                    )}
                    
                    {message.feedback && message.type !== 'feedback' && (
                      <p className="mt-2 text-sm text-orange-600 italic">
                        {message.feedback}
                      </p>
                    )}
                    {message.score !== undefined && (
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Score:</span>
                        <span className={`text-sm font-medium ${
                          message.score >= 320 ? 'text-green-600' : 
                          message.score >= 240 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {message.score}/400
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Speech Status Indicator */}
              <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Conversation Status:</h3>
                <div className="flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      aiSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-600">AI Speaking</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      userTurn ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-600">Your Turn to Speak</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      userSpeaking ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'
                    }`}></div>
                    <span className="text-sm text-gray-600">Speech Detected</span>
                  </div>
                </div>
              </div>
              
              {/* Voice Settings */}
              {isActive && (
                <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Voice Settings:</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-2">Voice:</span>
                    <select 
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {availableVoices.map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Word usage suggestions */}
            {requiredWords.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Try to use these words:</h3>
                <div className="flex flex-wrap gap-2">
                  {requiredWords.map((word, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}