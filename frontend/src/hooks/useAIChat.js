import { useState, useCallback } from 'react';

export const useAIChat = () => {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim() || isProcessing) return;

      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLastUserMessage(content.trim());
      setIsProcessing(true);

      try {
        // Since we don't have a backend, we'll use mock responses
        // In a real implementation, you might integrate with an AI service
        const mockResponse = getMockResponse(content.trim());
        const aiMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: mockResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error sending message:", error);

        // Fallback to mock response for development
        const mockResponse = getMockResponse(content.trim());
        const aiMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          content: mockResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing],
  );

  const retryLastMessage = useCallback(async () => {
    if (lastUserMessage && !isProcessing) {
      // Remove the last AI message if it was an error
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.type === "ai" && lastMessage?.error) {
          return prev.slice(0, -1);
        }
        return prev;
      });

      await sendMessage(lastUserMessage);
    }
  }, [lastUserMessage, isProcessing, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastUserMessage("");
  }, []);

  return {
    messages,
    isProcessing,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
};

// Mock responses for development/testing
const MOCK_RESPONSES = [
  "That's an interesting question! Let me think about that...",
  "I understand what you're asking. Here's my perspective on that topic.",
  "Great point! I'd be happy to help you with that.",
  "That's a thoughtful question. Based on what I know...",
  "Thanks for asking! Here's what I think about that subject.",
];

function getMockResponse(message) {
  // Simple mock logic based on message content
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! How can I help you today?";
  }
  
  if (lowerMessage.includes("time") || lowerMessage.includes("date")) {
    return `The current time is ${new Date().toLocaleTimeString()}.`;
  }
  
  if (lowerMessage.includes("weather")) {
    return "I don't have access to weather data, but I'd recommend checking a weather app!";
  }
  
  // Random response
  const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
  return MOCK_RESPONSES[randomIndex] + ` You said: "${message}"`;
}
