import {ReactNode} from "react";

// Mock AI context implementation
function createAI<T, U>(config: { initialUIState: T; initialAIState: T; actions: any }) {
  return config;
}

async function submitUserMessage(message: string): Promise<ReactNode> {
  // Mock implementation
  return <div>AI response placeholder</div>;
}

export const AIContext = createAI<any[], ReactNode[]>({
  initialUIState: [],
  initialAIState: [],
  actions: { submitUserMessage },
});
