// unity-voice-frontend/src/types/index.ts
export enum EnglishLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
  }
  
  // טיפוס לקביעת קבוצת גיל
  export enum AgeRange {
    AGE_0_17 = "under_18",
    AGE_18_24 = "18-24",
    AGE_25_34 = "25-34",
    AGE_35_44 = "35-44",
    AGE_45_54 = "45-54",
    AGE_55_PLUS = "55+"
  }
  
  export enum UserRole {
    USER = "user",
    ADMIN = "admin",
  }

  export enum TaskType {
    FLASHCARD = "flashcard",
    POST = "post",
    CONVERSATION = "conversation",
    QUIZ = "quiz"
  }
  
export enum SessionType {
    PRESS_CONFERENCE = "pressConference",
    DIPLOMATIC_CONVERSATION = "diplomaticConversation",
    DEBATE_PRESENTATION = "debatePresentation",
    CAMPUS_ADVOCACY = "campusAdvocacy",
    PRONUNCIATION = "pronunciation",
    VOCABULARY_PRACTICE = "vocabularyPractice",
    GRAMMAR_PRACTICE = "grammarPractice",
    LISTENING_COMPREHENSION = "listeningComprehension",
    conversation = "conversation"
  } 

// Database result types
export interface RowDataPacket {
  [key: string]: unknown;
}

export interface QueryResult {
  [key: string]: unknown;
}

// API types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id?: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  age?: number;
  ageRange?: AgeRange;
  englishLevel?: EnglishLevel;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Task types
export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: string;
  topicId?: number;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// JWT Payload type
export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Database connection types
export interface DatabaseError extends Error {
  code?: string;
  errno?: number;
  sqlState?: string;
  sqlMessage?: string;
}

// Word types
export interface Word {
  id: number;
  word: string;
  translation?: string;
  definition?: string;
  example?: string;
  topic?: string;
  level?: EnglishLevel;
}

// Comment types
export interface Comment {
  id: number;
  content: string;
  userId: number;
  postId?: number;
  createdAt: string;
  updatedAt?: string;
}

// Post types
export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  topicId?: number;
  status?: string;
  createdAt: string;
  updatedAt?: string;
} 