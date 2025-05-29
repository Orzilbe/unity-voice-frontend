import {ReactNode} from "react";

// Mock AI context implementation
function createAI<T>(config: { initialUIState: T; initialAIState: T; actions: { submitUserMessage: () => Promise<ReactNode> } }) {
  return config;
}

async function submitUserMessage(): Promise<ReactNode> {
  // Mock implementation
  return <div>AI response placeholder</div>;
}

export const AIContext = createAI<ReactNode[]>({
  initialUIState: [],
  initialAIState: [],
  actions: { submitUserMessage },
});
