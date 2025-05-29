// apps/web/src/app/api/tasks/[taskId]/duration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateTaskWithDuration } from '../../../services/taskService';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;
    
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (body.duration === undefined) {
      return NextResponse.json(
        { message: 'Duration is required' },
        { status: 400 }
      );
    }
    
    // עדכון משך המשימה
    const success = await updateTaskWithDuration(taskId, 100, body.duration);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to update task duration' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Task duration updated successfully'
    });
  } catch (error) {
    console.error('Error updating task duration:', error);
    return NextResponse.json(
      { message: 'Failed to update task duration', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}