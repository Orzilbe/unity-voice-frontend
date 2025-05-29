//apps/web/src/app/topics/[topicName]/tasks/conversation/page.tsx
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getAuthToken } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';

export default function ConversationPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  const level = searchParams?.get('level') || '1';
  const taskId = searchParams?.get('taskId');
  const postId = searchParams?.get('postId');
  
  const recognitionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generate required words for topic
  const generateRequiredWords = useCallback((topic: string): string[] => {
    const topicWords: Record<string, string[]> = {
      'innovation': ['technology', 'development', 'research', 'solution', 'advancement'],
      'economy': ['business', 'market', 'growth', 'investment', 'entrepreneurship'],
      'diplomacy': ['relations', 'cooperation', 'negotiation', 'partnership', 'dialogue'],
      'default': ['important', 'example', 'experience', 'opinion', 'interesting']
    };
    
    const key = Object.keys(topicWords).find(k => topic.toLowerCase().includes(k)) || 'default';
    return topicWords[key];
  }, []);

  // Initialize task on component mount
  useEffect(() => {
    const initializeTask = async () => {
      if (!isAuthenticated || authLoading) return;
      
      try {
        console.log('Initializing conversation task...');
        
        // Check if speech recognition is supported
        const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
        
        if (!isSupported) {
          console.error('Speech recognition not supported');
          return;
        }

        // Set required words for the topic
        const words = generateRequiredWords(topicName);
        console.log(`Required words for ${topicName}:`, words);
        
        // If we have a post ID, try to get the post content to inform our conversation
        if (postId) {
          try {
            const token = getAuthToken();
            if (token) {
              const postResponse = await fetch(`/api/posts/${postId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              
              if (postResponse.ok) {
                const postData = await postResponse.json();
                console.log('Post data loaded for conversation context:', postData);
                // You could use this data to inform conversation topics
              }
            }
          } catch {
            console.log('Could not load post data, continuing with general conversation');
          }
        }
        
      } catch (error) {
        console.error('Error initializing task:', error);
      }
    };
    
    initializeTask();
  }, [isAuthenticated, authLoading, topicName, postId, generateRequiredWords]);

  // Cleanup on unmount
  useEffect(() => {
    const timeoutRef = recognitionTimeout.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Render placeholder component
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 flex justify-center items-center">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <div className="text-blue-500 text-5xl mb-4">🎤</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Conversation Practice</h2>
        <p className="text-gray-600 mb-6">
          Interactive conversation feature is under development. Please check back soon!
        </p>
        <div className="text-sm text-gray-500">
          Topic: {topicName} | Level: {level}
        </div>
        {taskId && (
          <div className="text-xs text-gray-400 mt-2">
            Task ID: {taskId}
          </div>
        )}
      </div>
    </div>
  );
}