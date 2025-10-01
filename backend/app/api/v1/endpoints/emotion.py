from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, BackgroundTasks, Form, Request
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
import asyncio
import json
from app.services.emotion_recognition_service import emotion_service
from app.core.deps import get_current_user
from app.schemas.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Handle OPTIONS requests for CORS preflight
@router.options("/test/initialize-model")
async def options_initialize_model():
    """Handle CORS preflight for initialize model"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@router.options("/test/analyze-audio")
async def options_analyze_audio():
    """Handle CORS preflight for analyze audio"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@router.options("/test/emotion-info")
async def options_emotion_info():
    """Handle CORS preflight for emotion info"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400"
        }
    )

@router.post("/analyze-audio")
async def analyze_audio_emotion(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze emotion from uploaded audio file
    """
    try:
        # Validate file type
        if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an audio file."
            )
        
        # Read audio data
        audio_data = await audio_file.read()
        
        if len(audio_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file"
            )
        
        # Process audio for emotion recognition
        result = await emotion_service.process_audio_file(audio_data)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing audio: {result['error']}"
            )
        
        # Add UI-friendly information
        result["emotion_color"] = emotion_service.get_emotion_color(result["dominant_emotion"])
        result["emotion_emoji"] = emotion_service.get_emotion_emoji(result["dominant_emotion"])
        
        return JSONResponse(content={
            "success": True,
            "data": result,
            "user_id": current_user.id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_audio_emotion: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.post("/analyze-stream")
async def analyze_audio_stream(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(...),
    sample_rate: int = Form(16000),
    current_user: User = Depends(get_current_user)
):
    """
    Analyze emotion from streaming audio chunks
    """
    try:
        # Read audio data
        audio_data = await audio_file.read()
        
        if len(audio_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file"
            )
        
        # Process audio stream for emotion recognition
        result = await emotion_service.process_audio_file(audio_data, sample_rate)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing audio stream: {result['error']}"
            )
        
        # Add UI-friendly information
        result["emotion_color"] = emotion_service.get_emotion_color(result["dominant_emotion"])
        result["emotion_emoji"] = emotion_service.get_emotion_emoji(result["dominant_emotion"])
        
        return JSONResponse(content={
            "success": True,
            "data": result,
            "user_id": current_user.id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_audio_stream: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.get("/emotion-info")
async def get_emotion_info():
    """
    Get information about available emotions and their properties
    """
    try:
        emotions_info = []
        
        for emotion in emotion_service.emotion_labels:
            emotions_info.append({
                "emotion": emotion,
                "color": emotion_service.get_emotion_color(emotion),
                "emoji": emotion_service.get_emotion_emoji(emotion)
            })
        
        return JSONResponse(content={
            "success": True,
            "data": {
                "emotions": emotions_info,
                "total_emotions": len(emotion_service.emotion_labels)
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting emotion info: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.post("/initialize-model")
async def initialize_emotion_model(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Initialize the emotion recognition model (admin endpoint)
    """
    try:
        # Initialize model in background
        background_tasks.add_task(emotion_service.initialize_model)
        
        return JSONResponse(content={
            "success": True,
            "message": "Emotion recognition model initialization started"
        })
        
    except Exception as e:
        logger.error(f"Error initializing emotion model: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

# Test endpoints without authentication for easier testing
@router.post("/test/analyze-audio")
async def test_analyze_audio_emotion(
    audio_file: UploadFile = File(...)
):
    """
    Test endpoint: Analyze emotion from uploaded audio file (no auth required)
    """
    try:
        # Validate file type
        if not audio_file.content_type or not audio_file.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an audio file."
            )
        
        # Read audio data
        audio_data = await audio_file.read()
        
        if len(audio_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file"
            )
        
        # Process audio for emotion recognition
        result = await emotion_service.process_audio_file(audio_data)
        
        if "error" in result:
            raise HTTPException(
                status_code=500,
                detail=f"Error processing audio: {result['error']}"
            )
        
        # Add UI-friendly information
        result["emotion_color"] = emotion_service.get_emotion_color(result["dominant_emotion"])
        result["emotion_emoji"] = emotion_service.get_emotion_emoji(result["dominant_emotion"])
        
        return JSONResponse(
            content={
                "success": True,
                "data": result,
                "test_mode": True
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in test_analyze_audio_emotion: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.get("/test/emotion-info")
async def test_get_emotion_info():
    """
    Test endpoint: Get information about available emotions (no auth required)
    """
    try:
        emotions_info = []
        
        for emotion in emotion_service.emotion_labels:
            emotions_info.append({
                "emotion": emotion,
                "color": emotion_service.get_emotion_color(emotion),
                "emoji": emotion_service.get_emotion_emoji(emotion)
            })
        
        return JSONResponse(
            content={
                "success": True,
                "data": {
                    "emotions": emotions_info,
                    "total_emotions": len(emotion_service.emotion_labels)
                },
                "test_mode": True
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting emotion info: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )

@router.post("/test/initialize-model")
async def test_initialize_emotion_model():
    """
    Test endpoint: Initialize the emotion recognition model (no auth required)
    """
    try:
        # Initialize model directly (not in background for testing)
        await emotion_service.initialize_model()
        
        return JSONResponse(
            content={
                "success": True,
                "message": "Emotion recognition model initialized successfully",
                "test_mode": True
            },
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
        
    except Exception as e:
        logger.error(f"Error initializing emotion model: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

