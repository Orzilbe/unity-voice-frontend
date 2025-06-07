// unity-voice-frontend/src/app/api/tasks/create-conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '../../auth/verifyAuth';
import { getSafeDbPool } from '../../../lib/db';

interface CreateConversationTaskRequest {
  topicName: string;
  level: string;
  previousTaskId?: string;
}

/**
 * Create a new conversation task - POST /api/tasks/create-conversation
 */
export async function POST(request: NextRequest) {
  console.group('POST /api/tasks/create-conversation');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.isValid) {
      console.error('Authentication failed');
      console.groupEnd();
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = authResult.userId;
    
    // Parse request body
    let body: CreateConversationTaskRequest;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      console.groupEnd();
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }
    
    const { topicName, level, previousTaskId } = body;
    
    // Validate required fields
    if (!topicName || !level) {
      console.error('Missing required fields');
      console.groupEnd();
      return NextResponse.json({ error: 'Missing required fields: topicName and level' }, { status: 400 });
    }

    // Get DB connection
    const pool = await getSafeDbPool();
    if (!pool) {
      console.error('Database connection not available');
      console.groupEnd();
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    try {
      // Generate new task ID
      const newTaskId = generateTaskId();
      
      console.log(`Creating conversation task: ${newTaskId} for user: ${userId}`);
      
      // Create new conversation task
      await pool.query(
        `INSERT INTO tasks (TaskId, UserId, TopicName, Level, TaskType, StartDate, Status, CreatedAt)
         VALUES (?, ?, ?, ?, 'conversation', NOW(), 'active', NOW())`,
        [newTaskId, userId, topicName, level]
      );

      // If there's a previous task, we could optionally link them or copy relevant data
      if (previousTaskId) {
        console.log(`Linking to previous task: ${previousTaskId}`);
        
        // Optionally store the relationship or copy relevant data from previous task
        // This could be useful for conversation context or progress tracking
        try {
          await pool.query(
            `INSERT INTO task_relationships (CurrentTaskId, PreviousTaskId, RelationType, CreatedAt)
             VALUES (?, ?, 'sequential', NOW())`,
            [newTaskId, previousTaskId]
          );
        } catch (relationError) {
          // If the task_relationships table doesn't exist, just log and continue
          console.log('Task relationships table not available, skipping relationship tracking');
        }
      }

      console.log('Conversation task created successfully');
      console.groupEnd();

      return NextResponse.json({
        success: true,
        taskId: newTaskId,
        taskType: 'conversation',
        topicName: topicName,
        level: level,
        message: 'Conversation task created successfully'
      });

    } catch (dbError) {
      console.error('Database error during conversation task creation:', dbError);
      console.groupEnd();
      return NextResponse.json({
        error: 'Database error occurred',
        error_details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error creating conversation task:', error);
    console.groupEnd();
    return NextResponse.json({
      error: 'An error occurred during conversation task creation',
      error_details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to generate unique task ID
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}