"""Google Cloud Storage utilities for file uploads"""
import os
import uuid
from typing import Optional
from google.cloud import storage
from app.config import settings
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)


class GCPStorage:
    """Google Cloud Platform Storage handler"""
    
    def __init__(self):
        self.credentials_path = settings.GCP_CREDENTIALS_PATH
        self.bucket_name = settings.GCP_BUCKET_NAME
        self.client = None
        self.bucket = None
        
        # Initialize GCP client if credentials are provided
        if self.credentials_path and os.path.exists(self.credentials_path):
            try:
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = self.credentials_path
                self.client = storage.Client()
                self.bucket = self.client.bucket(self.bucket_name)
                logger.info(f"GCP Storage initialized with bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"Failed to initialize GCP Storage: {e}")
        else:
            logger.warning("GCP credentials not found. File uploads will be disabled.")
    
    def upload_file(
        self, 
        file_content: bytes, 
        filename: str, 
        content_type: str = "application/pdf",
        folder: str = "resumes"
    ) -> Optional[str]:
        """
        Upload a file to GCP Storage
        
        Args:
            file_content: File content as bytes
            filename: Original filename
            content_type: MIME type of the file
            folder: Folder/prefix in the bucket
            
        Returns:
            Public URL of the uploaded file or None if upload fails
        """
        if not self.client or not self.bucket:
            logger.error("GCP Storage not initialized")
            return None
        
        try:
            # Generate unique filename
            file_extension = os.path.splitext(filename)[1]
            unique_filename = f"{folder}/{uuid.uuid4()}{file_extension}"
            
            # Create blob and upload
            blob = self.bucket.blob(unique_filename)
            blob.upload_from_string(file_content, content_type=content_type)
            
            # Return the blob path (not a URL, we'll generate signed URLs on demand)
            logger.info(f"File uploaded successfully: {unique_filename}")
            return unique_filename
            
        except Exception as e:
            logger.error(f"Failed to upload file to GCP: {e}")
            return None
    
    def generate_signed_url(
        self, 
        blob_path: str, 
        expiration_minutes: int = 60
    ) -> Optional[str]:
        """
        Generate a signed URL for a file that allows temporary access
        
        Args:
            blob_path: Path to the blob in the bucket (e.g., "resumes/uuid.pdf") or full URL
            expiration_minutes: How long the URL should be valid (default 60 minutes)
            
        Returns:
            Signed URL that can be used to access the file, or None if generation fails
        """
        if not self.client or not self.bucket:
            logger.error("GCP Storage not initialized")
            return None
        
        try:
            # Extract blob path if full URL is provided
            if blob_path.startswith('https://storage.googleapis.com/'):
                # Extract blob path from full URL
                # Format: https://storage.googleapis.com/bucket-name/path/to/file
                blob_path = blob_path.split(f'{self.bucket_name}/', 1)[-1]
                logger.info(f"Extracted blob path: {blob_path}")
            
            blob = self.bucket.blob(blob_path)
            
            # Generate signed URL valid for the specified time
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=expiration_minutes),
                method="GET"
            )
            
            logger.info(f"Generated signed URL for: {blob_path}")
            return signed_url
            
        except Exception as e:
            logger.error(f"Failed to generate signed URL for {blob_path}: {e}")
            return None
    
    def delete_file(self, blob_path: str) -> bool:
        """
        Delete a file from GCP Storage
        
        Args:
            blob_path: Path to the blob in the bucket
            
        Returns:
            True if successful, False otherwise
        """
        if not self.client or not self.bucket:
            return False
        
        try:
            blob = self.bucket.blob(blob_path)
            blob.delete()
            logger.info(f"File deleted successfully: {blob_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file from GCP: {e}")
            return False


# Singleton instance
gcp_storage = GCPStorage()

