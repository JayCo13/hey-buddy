import base64
import json
import os
from typing import Optional, List
import numpy as np
from sqlalchemy.orm import Session
from app.crud import crud_user
from app.models.user import User

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    FACE_RECOGNITION_AVAILABLE = False
    print("Warning: face_recognition library not available. Face login will not work.")


class FaceRecognitionService:
    def __init__(self):
        self.tolerance = 0.6  # Face recognition tolerance
        self.face_storage_path = "app/static/faces"  # Path to store face images
        
        # Create face storage directory if it doesn't exist
        os.makedirs(self.face_storage_path, exist_ok=True)
    
    def _base64_to_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 string to image array"""
        try:
            # Remove data URL prefix if present
            if base64_string.startswith('data:image'):
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            
            # Convert to numpy array (you might need to use PIL or cv2 here)
            # For now, we'll assume it's a simple conversion
            import cv2
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return image
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")
    
    def _get_face_encoding(self, image: np.ndarray) -> Optional[List[float]]:
        """Extract face encoding from image"""
        if not FACE_RECOGNITION_AVAILABLE:
            return None
        
        try:
            # Convert BGR to RGB (OpenCV uses BGR)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Find face locations
            face_locations = face_recognition.face_locations(rgb_image)
            
            if not face_locations:
                return None
            
            # Get face encodings
            face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not face_encodings:
                return None
            
            # Return the first face encoding
            return face_encodings[0].tolist()
        except Exception as e:
            print(f"Error extracting face encoding: {str(e)}")
            return None
    
    def _save_face_image(self, user_id: int, image: np.ndarray) -> str:
        """Save face image to storage"""
        import cv2
        
        filename = f"face_{user_id}.jpg"
        filepath = os.path.join(self.face_storage_path, filename)
        
        # Save image
        cv2.imwrite(filepath, image)
        
        return filepath
    
    def _compare_faces(self, encoding1: List[float], encoding2: List[float]) -> bool:
        """Compare two face encodings"""
        if not FACE_RECOGNITION_AVAILABLE:
            return False
        
        try:
            # Convert to numpy arrays
            enc1 = np.array(encoding1)
            enc2 = np.array(encoding2)
            
            # Compare faces
            distance = face_recognition.face_distance([enc1], enc2)[0]
            return distance <= self.tolerance
        except Exception as e:
            print(f"Error comparing faces: {str(e)}")
            return False
    
    def register_face(self, db: Session, user_id: int, base64_image: str, enable_face_login: bool = True) -> bool:
        """Register face for a user"""
        try:
            # Convert base64 to image
            image = self._base64_to_image(base64_image)
            
            # Extract face encoding
            face_encoding = self._get_face_encoding(image)
            
            if not face_encoding:
                return False
            
            # Save face image
            face_image_path = self._save_face_image(user_id, image)
            
            # Update user record
            user = crud_user.get(db, id=user_id)
            if not user:
                return False
            
            # Update user with face data
            user.face_encoding = json.dumps(face_encoding)
            user.face_image_path = face_image_path
            user.face_enabled = enable_face_login
            
            db.commit()
            return True
            
        except Exception as e:
            print(f"Error registering face: {str(e)}")
            return False
    
    def authenticate_by_face(self, db: Session, base64_image: str) -> Optional[User]:
        """Authenticate user by face"""
        try:
            # Convert base64 to image
            image = self._base64_to_image(base64_image)
            
            # Extract face encoding
            face_encoding = self._get_face_encoding(image)
            
            if not face_encoding:
                return None
            
            # Get all users with face login enabled
            users_with_face = db.query(User).filter(
                User.face_enabled == True,
                User.face_encoding.isnot(None)
            ).all()
            
            # Compare with each user's face
            for user in users_with_face:
                try:
                    stored_encoding = json.loads(user.face_encoding)
                    if self._compare_faces(face_encoding, stored_encoding):
                        return user
                except Exception as e:
                    print(f"Error comparing with user {user.id}: {str(e)}")
                    continue
            
            return None
            
        except Exception as e:
            print(f"Error authenticating by face: {str(e)}")
            return None
    
    def remove_face(self, db: Session, user_id: int) -> bool:
        """Remove face data for a user"""
        try:
            user = crud_user.get(db, id=user_id)
            if not user:
                return False
            
            # Remove face image file
            if user.face_image_path and os.path.exists(user.face_image_path):
                os.remove(user.face_image_path)
            
            # Clear face data
            user.face_encoding = None
            user.face_image_path = None
            user.face_enabled = False
            
            db.commit()
            return True
            
        except Exception as e:
            print(f"Error removing face: {str(e)}")
            return False
