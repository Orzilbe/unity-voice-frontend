// unity-voice-frontend/src/app/lib/api.ts - מתוקן עם טוכן אחיד
import { fetchWithAuth } from '../../lib/fetchWithAuth';
/**
 * שמירת מילים למשימה
 * @param taskId מזהה המשימה
 * @param wordIds מערך של מזהי מילים (או אובייקטים עם WordId)
 */
export async function saveWordsToTask(taskId: string, wordIds: (string | { WordId?: string; wordId?: string })[]): Promise<boolean> {
  try {
    // אם אין מזהה משימה, אין מה לשמור
    if (!taskId || taskId.startsWith('client_') || taskId.startsWith('temp_')) {
      console.log('Skipping word saving for temporary task ID');
      return true;
    }
    
    // בדיקה שיש מילים לשמירה
    if (!wordIds || wordIds.length === 0) {
      console.log('No words to save');
      return true;
    }
    
    // הכנת מערך המזהים
    let wordIdsArray: string[] = [];
    
    if (typeof wordIds[0] === 'string') {
      // אם קיבלנו מערך של מחרוזות (מזהים)
      wordIdsArray = wordIds as string[];
    } else {
      // אם קיבלנו מערך של אובייקטים
      wordIdsArray = (wordIds as { WordId?: string; wordId?: string }[])
        .filter(item => item && (item.WordId || item.wordId))
        .map(item => (item.WordId || item.wordId) as string);
    }
    
    console.log(`Prepared ${wordIdsArray.length} word IDs to save for task ${taskId}`);
    
    // 🔑 השגת טוכן אימות - מאוחד תחת 'token'
    let token = localStorage.getItem('token');
    if (!token) {
      // נסה גם עם השם הישן לתאימות אחורה
      token = localStorage.getItem('auth_token');
      if (token) {
        // העבר לשם החדש
        localStorage.setItem('token', token);
        localStorage.removeItem('auth_token');
      }
    }
    
    if (!token) {
      console.error('Missing authentication token');
      return false;
    }
    
    console.log('🔑 Using token for API call');
    
    // קריאה ל-API
    const response = await fetchWithAuth('/api/words-in-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 🔑 הוסף את הטוכן כ-Bearer token
      },
      body: JSON.stringify({
        taskId: taskId,
        wordIds: wordIdsArray
      })
    });
    
    // תגובה מוצלחת
    if (response.ok) {
      const result = await response.json();
      console.log('Words saved successfully:', result);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Failed to save words: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Error saving words to task:', error);
    return false;
  }
}

/**
 * השלמת משימה
 * @param taskId מזהה המשימה
 * @param score ציון המשימה
 * @param durationSeconds משך זמן המשימה בשניות
 */
export async function completeTask(
  taskId: string, 
  score: number = 100, 
  durationSeconds: number = 0
): Promise<boolean> {
  try {
    // אם אין מזהה משימה, אין מה להשלים
    if (!taskId || taskId.startsWith('client_') || taskId.startsWith('temp_')) {
      console.log('Skipping task completion for temporary task ID');
      return true;
    }
    
    // 🔑 השגת טוכן אימות - מאוחד תחת 'token'
    let token = localStorage.getItem('token');
    if (!token) {
      // נסה גם עם השם הישן לתאימות אחורה
      token = localStorage.getItem('auth_token');
      if (token) {
        // העבר לשם החדש
        localStorage.setItem('token', token);
        localStorage.removeItem('auth_token');
      }
    }
    
    if (!token) {
      console.error('Missing authentication token');
      return false;
    }
    
    console.log(`Completing task ${taskId} with score ${score} and duration ${durationSeconds}s`);
    console.log('🔑 Using token for API call');
    
    // ניסיון ראשון - עם נקודת קצה ספציפית
    try {
      const response = await fetchWithAuth(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔑 הוסף את הטוכן כ-Bearer token
        },
        body: JSON.stringify({
          TaskScore: score,
          DurationTask: durationSeconds,
          CompletionDate: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Task completed successfully (endpoint 1):', result);
        return true;
      } else {
        console.warn(`Endpoint 1 failed with status ${response.status}`);
      }
    } catch (error) {
      console.warn('Error with endpoint 1:', error);
    }
    
    // ניסיון שני - עם נקודת קצה כללית
    try {
      const response = await fetchWithAuth(`/api/tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 🔑 הוסף את הטוכן כ-Bearer token
        },
        body: JSON.stringify({
          taskId: taskId,
          TaskScore: score,
          DurationTask: durationSeconds,
          CompletionDate: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Task completed successfully (endpoint 2):', result);
        return true;
      } else {
        console.warn(`Endpoint 2 failed with status ${response.status}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('Error with endpoint 2:', error);
      return false;
    }
  } catch (error) {
    console.error('Error completing task:', error);
    return false;
  }
}
