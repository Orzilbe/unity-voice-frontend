// unity-voice-frontend/src/app/topics/[topicName]/tasks/post/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { FaHeart, FaComment, FaShare, FaInfoCircle, FaRedo } from 'react-icons/fa';
import { getAuthToken } from '../../../../../lib/auth';
import { useAuth } from '../../../../../hooks/useAuth';
import { fetchWithAuth } from '../../../../../lib/fetchWithAuth';
interface FeedbackResult {
  totalScore: number;
  clarityScore: number;
  grammarScore: number;
  vocabularyScore: number;
  contentRelevanceScore: number;
  clarityFeedback: string;
  grammarFeedback: string;
  vocabularyFeedback: string;
  contentRelevanceFeedback: string;
  overallFeedback: string;
  wordUsage: { word: string; used: boolean; context: string }[];
}

export default function PostTask() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const topicName = params?.topicName as string;
  const level = searchParams?.get('level') || '1';
  const taskId = searchParams?.get('taskId');
  
  const [post, setPost] = useState<string>('');
  const [userComment, setUserComment] = useState('');
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiredWords, setRequiredWords] = useState<string[]>([]);
  const [feedbackResults, setFeedbackResults] = useState<FeedbackResult | null>(null);
  const [socialMetrics, setSocialMetrics] = useState({
    likes: Math.floor(Math.random() * 50) + 10,
    comments: 0,
    shares: Math.floor(Math.random() * 10) + 5
  });
  const [isLiked, setIsLiked] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [postSource, setPostSource] = useState<string>('');

  // Authentication check
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

  const pageTitle = `${formatTopicName(topicName)} - Social Post Task`;

  // 🎯 Fetch post data for task
  const fetchPostData = useCallback(async () => {
    if (!isAuthenticated || !topicName || !taskId) return;
    
    const token = getAuthToken();
    if (!token) {
      setError('Authentication required');
      return;
    }
    
    try {
      setIsLoadingPost(true);
      setError(null);
      
      console.log(`🎯 Fetching post data for task: ${taskId}`);
      
      const response = await fetchWithAuth(`/api/posts/${encodeURIComponent(taskId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Post data received:', data);
        
        if (data.success && data.postData) {
          setPost(data.postData.PostContent || '');
          setRequiredWords(data.postData.RequiredWords || []);
          setImageUrl(data.postData.Picture);
          setPostSource(data.meta?.source || 'unknown');
          
          console.log(`✅ Post loaded successfully (source: ${data.meta?.source})`);
        } else {
          throw new Error('Invalid response format');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load post');
      }
    } catch (err) {
      console.error('❌ Error loading post:', err);
      setError('Failed to load social post. Please try again.');
      
      // Fallback content
      setPost(createFallbackPost(topicName));
      setRequiredWords(generateFallbackWords(topicName));
      setImageUrl(getReliableImageUrl(topicName));
      setPostSource('fallback');
    } finally {
      setIsLoadingPost(false);
    }
  }, [isAuthenticated, topicName, taskId]);

  // Load post data on component mount
  useEffect(() => {
    fetchPostData();
  }, [fetchPostData]);

  // Track task start time
  useEffect(() => {
    if (taskId) {
      sessionStorage.setItem(`task_start_${taskId}`, Date.now().toString());
    }
  }, [taskId]);

  // 🔄 Regenerate post
  const handleRegeneratePost = async () => {
    if (!taskId) return;
    
    const token = getAuthToken();
    if (!token) return;
    
    try {
      setIsRegenerating(true);
      console.log('🔄 Regenerating post...');
      
      const response = await fetchWithAuth(`/api/posts/regenerate/${encodeURIComponent(taskId)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🆕 New post generated:', data);
        
        if (data.success && data.postData) {
          setPost(data.postData.PostContent || '');
          setRequiredWords(data.postData.RequiredWords || []);
          setImageUrl(data.postData.Picture);
          setPostSource('regenerated');
          
          // Reset form
          setUserComment('');
          setFeedbackResults(null);
        }
      } else {
        console.error('Failed to regenerate post');
      }
    } catch (error) {
      console.error('Error regenerating post:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle like button click
  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
    setSocialMetrics(prev => ({
      ...prev,
      likes: prev.likes + (isLiked ? -1 : 1)
    }));
  };

  // 💬 Handle comment submission
  const handleSubmitComment = async () => {
    if (!userComment.trim() || !taskId) return;
    
    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const startTime = parseInt(sessionStorage.getItem(`task_start_${taskId}`) || '0');
      const durationTask = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      
      console.log('💬 Submitting comment...');
      
      const response = await fetchWithAuth('/api/comments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          taskId: taskId,
          commentContent: userComment.trim(),
          requiredWords: requiredWords,
          postContent: post,
          durationTask: durationTask
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Comment submitted successfully:', result);
        
        if (result.success && result.feedback) {
          setFeedbackResults({
            totalScore: result.feedback.totalScore,
            clarityScore: result.feedback.clarityScore,
            grammarScore: result.feedback.grammarScore,
            vocabularyScore: result.feedback.vocabularyScore,
            contentRelevanceScore: result.feedback.contentRelevanceScore,
            clarityFeedback: result.feedback.clarityFeedback,
            grammarFeedback: result.feedback.grammarFeedback,
            vocabularyFeedback: result.feedback.vocabularyFeedback,
            contentRelevanceFeedback: result.feedback.contentRelevanceFeedback,
            overallFeedback: result.feedback.overallFeedback,
            wordUsage: result.feedback.wordUsage || []
          });
          
          setSocialMetrics(prev => ({ ...prev, comments: prev.comments + 1 }));
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Comment submission failed:', errorData);
        
        // Show validation errors if any
        if (errorData.issues) {
          alert(`Please fix these issues:\n${errorData.issues.join('\n')}`);
        } else {
          alert('Failed to submit comment. Please try again.');
        }
      }
    } catch (err) {
      console.error('❌ Error submitting comment:', err);
      alert('Failed to submit comment. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to next task
  const navigateToNextTask = async () => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');
  
      console.log('🚀 Creating conversation task...');
      
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
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Created conversation task:', data);
        
        if (data.TaskId) {
          router.push(`/topics/${topicName}/tasks/conversation?level=${level}&taskId=${data.TaskId}`);
          return;
        }
      } else {
        console.error('Failed to create conversation task');
      }
    } catch (error) {
      console.error('Error creating conversation task:', error);
    }
    
    // Fallback navigation
    router.push(`/topics/${topicName}/tasks/conversation?level=${level}`);
  };
  
  const formatTopicNameForDB = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Loading state
  if (authLoading || isLoadingPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading post...</p>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 flex justify-center items-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
          <p className="text-gray-600 mb-6">We&apos;re having trouble loading the post. Let&apos;s try again.</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={fetchPostData}
              disabled={isLoadingPost}
              className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 disabled:opacity-50"
            >
              {isLoadingPost ? 'Loading...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6 relative" dir="ltr">
      {/* Google Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Rubik', sans-serif;
        }
      `}</style>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
          
          {/* Regenerate button */}
          {!feedbackResults && (
            <button
              onClick={handleRegeneratePost}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              title="Generate a new post"
            >
              <FaRedo className={isRegenerating ? 'animate-spin' : ''} />
              {isRegenerating ? 'Generating...' : 'New Post'}
            </button>
          )}
        </div>
        
        {/* Post source indicator */}
        {postSource && (
          <div className="mb-4 text-sm text-gray-600">
            Post source: <span className="font-medium capitalize">{postSource}</span>
          </div>
        )}
        
        {/* Post Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-xl">
              👤
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Israel Expert</h2>
              <p className="text-gray-600 text-sm font-medium">2 hours ago • 🌍</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="prose text-gray-800 md:w-3/5">
              <p className="whitespace-pre-line">{post}</p>
            </div>
            <div className="md:w-2/5">
            {imageUrl && (
  <img
    src={imageUrl}
    alt="Post Image"
    className="w-full rounded-lg object-cover h-64"
    onError={(e) => {
      e.currentTarget.src = getReliableImageUrl(topicName);
    }}
  />
)}
            </div>
          </div>
          
          <div className="flex items-center space-x-12 text-gray-600">
            <button 
              onClick={handleLikeToggle}
              className="flex items-center space-x-2 hover:text-red-500 transition-colors"
            >
              <FaHeart className={isLiked ? 'text-red-500' : ''} />
              <span className="ml-2">{socialMetrics.likes}</span>
            </button>
            <div className="flex items-center space-x-2">
              <FaComment />
              <span className="ml-2">{socialMetrics.comments}</span>
            </div>
            <button className="flex items-center space-x-2 hover:text-blue-500 transition-colors">
              <FaShare />
              <span className="ml-2">{socialMetrics.shares}</span>
            </button>
          </div>
        </div>
        
        {/* Required Words Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <FaInfoCircle className="text-orange-500 mr-3 text-xl" />
            <h3 className="text-xl font-bold text-gray-800">Required Words:</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {requiredWords.map(word => (
              <span key={word} className="px-6 py-3 bg-orange-500 text-white rounded-full text-base font-medium shadow-sm">
                {word}
              </span>
            ))}
          </div>
        </div>
        
        {/* Comment Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {!feedbackResults ? (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Write a response to this post:</h3>
              <p className="text-gray-600 mb-4">Use the required words in your response. We&apos;ll provide feedback on your comment.</p>
              
              <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder={`Write your response about ${formatTopicName(topicName)} using the required words...`}
                className="w-full p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-32 text-gray-900 mb-4"
                rows={6}
                disabled={isSubmitting}
              />
              
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !userComment.trim()}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Response'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Your Response:</h3>
                <p className="text-gray-700 whitespace-pre-line">{userComment}</p>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Feedback:</h3>
                  <div className="text-2xl font-bold text-orange-600">
                    {feedbackResults.totalScore}/200 points
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="font-bold text-gray-700">Content Relevance ({feedbackResults.contentRelevanceScore}/100):</h4>
                    <p className="text-gray-600">{feedbackResults.contentRelevanceFeedback}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-700">Clarity ({feedbackResults.clarityScore}/100):</h4>
                    <p className="text-gray-600">{feedbackResults.clarityFeedback}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-700">Grammar ({feedbackResults.grammarScore}/100):</h4>
                    <p className="text-gray-600">{feedbackResults.grammarFeedback}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-700">Vocabulary ({feedbackResults.vocabularyScore}/100):</h4>
                    <p className="text-gray-600">{feedbackResults.vocabularyFeedback}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 mb-2">Required Words Usage:</h4>
                  <ul className="space-y-2">
                    {feedbackResults.wordUsage.map(({ word, used, context }) => (
                      <li key={word} className="flex items-start">
                        <span className={`mr-2 ${used ? 'text-green-500' : 'text-red-500'}`}>
                          {used ? '✓' : '✗'}
                        </span>
                        <div>
                          <span className="font-medium">{word}:</span>
                          <span className="ml-2 text-gray-500">
                            {used ? context : 'Not found in your response'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="text-center p-4 bg-white rounded-lg mb-6">
                  <p className="text-xl font-bold text-orange-600">{feedbackResults.overallFeedback}</p>
                </div>
                
                <div className="text-center">
                  <button
                    onClick={navigateToNextTask}
                    className="px-8 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md hover:shadow-lg text-lg"
                  >
                    Continue to Interactive Conversation 🎙️
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// Helper Functions
// ================================================================

function createFallbackPost(topicName: string): string {
  const formattedTopic = topicName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return `🇮🇱 Let's explore ${formattedTopic}! 

This is an important topic that affects many aspects of Israeli society and culture. There are fascinating developments happening in this area that impact our daily lives.

What are your thoughts on this subject? How do you think recent changes in ${formattedTopic.toLowerCase()} have influenced Israeli society? 

I'd love to hear your perspective on this! 💭`;
}

function generateFallbackWords(topicName: string): string[] {
  const lowerTopic = topicName.toLowerCase();
  
  if (lowerTopic.includes('diplomacy')) {
    return ['diplomacy', 'peace', 'negotiation', 'agreement', 'international'];
  } else if (lowerTopic.includes('economy')) {
    return ['startup', 'innovation', 'entrepreneur', 'investment', 'technology'];
  } else if (lowerTopic.includes('innovation')) {
    return ['technology', 'startup', 'innovation', 'research', 'development'];
  } else if (lowerTopic.includes('history')) {
    return ['heritage', 'tradition', 'ancient', 'archaeological', 'civilization'];
  } else if (lowerTopic.includes('holocaust')) {
    return ['remembrance', 'survivor', 'memorial', 'testimony', 'resilience'];
  } else if (lowerTopic.includes('iron') || lowerTopic.includes('sword')) {
    return ['security', 'defense', 'protection', 'resilience', 'strength'];
  } else if (lowerTopic.includes('society')) {
    return ['diversity', 'culture', 'community', 'tradition', 'integration'];
  } else if (lowerTopic.includes('environment')) {
    return ['environment', 'sustainability', 'renewable', 'green', 'conservation'];
  }
  
  return ['culture', 'heritage', 'history', 'innovation', 'community'];
}

function getReliableImageUrl(topicName: string): string {
  const lowerTopic = topicName.toLowerCase();
  
  // Use placeholder.com for reliable, always-working images
  const imageMap: Record<string, string> = {
    'diplomacy': 'https://via.placeholder.com/800x600/2563eb/ffffff?text=Diplomacy',
    'international': 'https://via.placeholder.com/800x600/0ea5e9/ffffff?text=International+Relations',
    'economy': 'https://via.placeholder.com/800x600/059669/ffffff?text=Economy',
    'entrepreneur': 'https://via.placeholder.com/800x600/16a34a/ffffff?text=Entrepreneurship',
    'innovation': 'https://via.placeholder.com/800x600/7c3aed/ffffff?text=Innovation',
    'technology': 'https://via.placeholder.com/800x600/6366f1/ffffff?text=Technology',
    'history': 'https://via.placeholder.com/800x600/92400e/ffffff?text=History',
    'heritage': 'https://via.placeholder.com/800x600/a16207/ffffff?text=Heritage',
    'holocaust': 'https://via.placeholder.com/800x600/374151/ffffff?text=Memorial',
    'revival': 'https://via.placeholder.com/800x600/065f46/ffffff?text=Revival',
    'iron': 'https://via.placeholder.com/800x600/991b1b/ffffff?text=Defense',
    'sword': 'https://via.placeholder.com/800x600/991b1b/ffffff?text=Security',
    'society': 'https://via.placeholder.com/800x600/dc2626/ffffff?text=Society',
    'multicultural': 'https://via.placeholder.com/800x600/ea580c/ffffff?text=Multiculturalism',
    'environment': 'https://via.placeholder.com/800x600/16a34a/ffffff?text=Environment',
    'sustainability': 'https://via.placeholder.com/800x600/15803d/ffffff?text=Sustainability'
  };
  
  // Find best match
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerTopic.includes(key)) {
      return url;
    }
  }
  
  // Default fallback
  return 'https://via.placeholder.com/800x600/3b82f6/ffffff?text=Israeli+Culture';
}