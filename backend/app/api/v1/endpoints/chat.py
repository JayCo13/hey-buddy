from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import requests
import os
from app.core.config import settings

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: str

# Configuration for different AI providers
AI_CONFIG = {
    # OpenAI-compatible API configuration (for local models like Ollama, LM Studio, etc.)
    "openai_compatible": {
        "url": os.getenv("LOCAL_AI_URL", "http://127.0.0.1:3000/v1/openai/chat/completions"),
        "api_key": os.getenv("LOCAL_AI_KEY", ""),
        "model": os.getenv("LOCAL_AI_MODEL", "thenhan"),
    },
    # Mock responses for development
    "mock": {
        "enabled": os.getenv("NODE_ENV", "development") == "development" and not os.getenv("LOCAL_AI_URL"),
    },
}

# Mock responses for development/testing
MOCK_RESPONSES = [
    "That's an interesting question! Let me think about that...",
    "I understand what you're asking. Here's my perspective on that topic.",
    "Great point! I'd be happy to help you with that.",
    "That's a thoughtful question. Based on what I know...",
    "Thanks for asking! Here's what I think about that subject.",
]

async def call_openai_compatible(message: str) -> str:
    """Call OpenAI-compatible API (for local models like Ollama, LM Studio, etc.)"""
    config = AI_CONFIG["openai_compatible"]
    
    try:
        headers = {
            "Content-Type": "application/json",
        }
        if config["api_key"]:
            headers["Authorization"] = f"Bearer {config['api_key']}"
        
        payload = {
            "model": config["model"],
            "messages": [
                {
                    "role": "system",
                    "content": "You are a friendly AI assistant named Hey Buddy. Always answer in English, clearly and concisely. You help users with their tasks and provide helpful information.",
                },
                {
                    "role": "user",
                    "content": message,
                },
            ],
            "temperature": 0.7,
        }
        
        response = requests.post(config["url"], headers=headers, json=payload, timeout=30)
        
        if not response.ok:
            raise Exception(f"OpenAI-compatible API error: {response.status_code}")
        
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, I could not process your request.")
        
    except Exception as e:
        print(f"OpenAI-compatible API error: {e}")
        raise e

def get_mock_response(message: str) -> str:
    """Generate mock response for development"""
    lower_message = message.lower()
    
    if "hello" in lower_message or "hi" in lower_message:
        return "Hello! How can I help you today?"
    
    if "time" in lower_message or "date" in lower_message:
        from datetime import datetime
        return f"The current time is {datetime.now().strftime('%H:%M:%S')}."
    
    if "weather" in lower_message:
        return "I don't have access to weather data, but I'd recommend checking a weather app!"
    
    # Random response
    import random
    random_index = random.randint(0, len(MOCK_RESPONSES) - 1)
    return MOCK_RESPONSES[random_index] + f' You said: "{message}"'

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle chat requests and return AI responses"""
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message is required and must not be empty")
        
        message = request.message.strip()
        response_text = ""
        
        # Try different AI providers in order of preference
        if AI_CONFIG["openai_compatible"]["url"]:
            try:
                response_text = await call_openai_compatible(message)
            except Exception as error:
                print(f"OpenAI-compatible API failed, trying mock: {error}")
                if AI_CONFIG["mock"]["enabled"]:
                    response_text = get_mock_response(message)
                else:
                    raise error
        elif AI_CONFIG["mock"]["enabled"]:
            # Use mock responses for development
            import asyncio
            await asyncio.sleep(0.5)  # Simulate API delay
            response_text = get_mock_response(message)
        else:
            # Fallback to mock response
            response_text = get_mock_response(message)
        
        from datetime import datetime
        return ChatResponse(
            response=response_text,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
