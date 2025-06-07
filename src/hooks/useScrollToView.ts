import {useEffect, useRef} from "react";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

export function useScrollToView(messages: Message[]) {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [messages]);

  return messageEndRef;
}
