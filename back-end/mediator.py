#
# Media Handler - Centralized media file management
#
# This module provides a unified interface for all media operations:
# - File validation (type, size, format)
# - Image/video compression
# - Secure file storage with UUID-based naming
# - Path traversal protection
# - Support for multiple media types (avatars, paps media, spap media, category icons)
#

import os
import io
import uuid
import logging
import pathlib
import mimetypes
from typing import Optional, Tuple, Dict, Any, Union, BinaryIO
from dataclasses import dataclass
from enum import Enum

log = logging.getLogger(os.environ.get("APP_NAME", "mediator"))


class MediaType(Enum):
    """Supported media categories."""
    AVATAR = "avatar"
    PAPS = "paps"
    SPAP = "spap"
    ASAP = "asap"
    CATEGORY = "category"


@dataclass
class MediaResult:
    """Result of a media operation."""
    success: bool
    media_id: Optional[str] = None
    filepath: Optional[pathlib.Path] = None
    file_extension: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    media_type: Optional[str] = None  # image, video, document
    url: Optional[str] = None
    error: Optional[str] = None


class MediaHandler:
    """
    Centralized media file handler for the Underboss application.
    
    Handles:
    - File validation (type, size, format)
    - Image compression with configurable quality
    - Video validation (no compression - handled client-side)
    - Secure file storage with UUID-based naming
    - Path traversal protection
    
    Media Types:
    - AVATAR: User profile pictures (images only)
    - PAPS: Job posting media (images, videos, documents)
    - SPAP: Application media (images, videos, documents)
    - CATEGORY: Category icons (images only)
    """
    
    # Default configuration
    DEFAULT_CONFIG = {
        # File size limits (in bytes)
        "max_file_size": 50 * 1024 * 1024,  # 50MB general
        "max_avatar_size": 5 * 1024 * 1024,  # 5MB for avatars
        "max_image_size": 15 * 1024 * 1024,  # 15MB for images
        "max_video_size": 100 * 1024 * 1024,  # 100MB for videos
        
        # Allowed extensions by category
        "allowed_extensions": {"jpg", "jpeg", "png", "gif", "webp", "mp4", "avi", "mov", "mkv", "pdf"},
        "image_extensions": {"jpg", "jpeg", "png", "gif", "webp"},
        "video_extensions": {"mp4", "avi", "mov", "mkv", "webm"},
        "document_extensions": {"pdf"},
        "avatar_extensions": {"jpg", "jpeg", "png", "gif", "webp"},
        
        # Compression settings
        "image_quality": 85,  # JPEG/WebP quality (1-100)
        "avatar_quality": 85,
        "compression_enabled": True,
        "max_image_dimension": 4096,  # Max width/height for images
        "avatar_max_dimension": 512,  # Max avatar dimension
        
        # Media directory structure
        "media_base_dir": "media",
        "avatar_dir": "user/profile",
        "paps_dir": "post",
        "spap_dir": "spap",
        "asap_dir": "asap",
        "category_dir": "category",
        
        # Default files
        "default_avatar_url": "/media/user/profile/avatar.png",
    }
    
    def __init__(self, app=None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the MediaHandler.
        
        Args:
            app: Flask application (optional, for config loading)
            config: Configuration dictionary (optional, overrides app config)
        """
        self._config = self.DEFAULT_CONFIG.copy()
        self._app = app
        
        # Load config from app if provided
        if app and "MEDIA_CONFIG" in app.config:
            self._config.update(app.config["MEDIA_CONFIG"])
        
        # Override with explicit config
        if config:
            self._config.update(config)
        
        # Initialize PIL lazily
        self._pil_available = None
        
        # Setup media directories
        self._base_dir = pathlib.Path(self._config["media_base_dir"])
        self._dirs = {
            MediaType.AVATAR: self._base_dir / self._config["avatar_dir"],
            MediaType.PAPS: self._base_dir / self._config["paps_dir"],
            MediaType.SPAP: self._base_dir / self._config["spap_dir"],
            MediaType.ASAP: self._base_dir / self._config["asap_dir"],
            MediaType.CATEGORY: self._base_dir / self._config["category_dir"],
        }
    
    @property
    def pil_available(self) -> bool:
        """Check if PIL is available for image processing."""
        if self._pil_available is None:
            try:
                from PIL import Image
                self._pil_available = True
            except ImportError:
                self._pil_available = False
                log.warning("PIL not available - image compression disabled")
        return self._pil_available
    
    def configure(self, **kwargs):
        """Update configuration dynamically."""
        self._config.update(kwargs)
    
    def get_config(self, key: str, default=None):
        """Get a configuration value."""
        return self._config.get(key, default)
    
    # =========================================================================
    # DIRECTORY MANAGEMENT
    # =========================================================================
    
    def ensure_directories(self):
        """Create all media directories if they don't exist."""
        for dir_path in self._dirs.values():
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def get_directory(self, media_type: MediaType) -> pathlib.Path:
        """Get the directory path for a media type."""
        return self._dirs.get(media_type, self._base_dir)
    
    def get_media_url(self, media_type: MediaType, media_id: str, extension: str) -> str:
        """Generate the URL for accessing a media file."""
        if media_type == MediaType.AVATAR:
            return f"/media/user/profile/{media_id}.{extension}"
        elif media_type == MediaType.PAPS:
            return f"/paps/media/{media_id}"
        elif media_type == MediaType.SPAP:
            return f"/spap/media/{media_id}"
        elif media_type == MediaType.ASAP:
            return f"/asap/media/{media_id}"
        elif media_type == MediaType.CATEGORY:
            return f"/media/category/{media_id}.{extension}"
        return f"/media/{media_id}.{extension}"
    
    # =========================================================================
    # VALIDATION
    # =========================================================================
    
    def validate_extension(self, extension: str, media_type: Optional[MediaType] = None) -> Tuple[bool, str]:
        """
        Validate file extension.
        
        Args:
            extension: File extension (without dot)
            media_type: Optional media type for specific validation
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        ext = extension.lower().strip('.')
        
        # Security: prevent path traversal
        if not ext or '/' in ext or '\\' in ext or '..' in ext:
            return False, "Invalid extension format"
        
        # Alphanumeric check
        if not ext.isalnum() or len(ext) > 10:
            return False, "Extension must be alphanumeric and max 10 characters"
        
        # Type-specific validation
        if media_type == MediaType.AVATAR:
            allowed = self._config.get("avatar_extensions", self._config["image_extensions"])
            if ext not in allowed:
                return False, f"Avatar must be an image. Allowed: {', '.join(allowed)}"
        elif media_type == MediaType.CATEGORY:
            allowed = self._config.get("image_extensions")
            if ext not in allowed:
                return False, f"Category icon must be an image. Allowed: {', '.join(allowed)}"
        else:
            allowed = self._config.get("allowed_extensions")
            if ext not in allowed:
                return False, f"File type not allowed. Allowed: {', '.join(allowed)}"
        
        return True, ""
    
    def validate_size(self, size: int, media_type: Optional[MediaType] = None, 
                      file_category: Optional[str] = None) -> Tuple[bool, str]:
        """
        Validate file size.
        
        Args:
            size: File size in bytes
            media_type: Media type for specific limits
            file_category: "image", "video", or "document"
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if size <= 0:
            return False, "File is empty"
        
        # Determine max size
        if media_type == MediaType.AVATAR:
            max_size = self._config.get("max_avatar_size", 5 * 1024 * 1024)
        elif file_category == "video":
            max_size = self._config.get("max_video_size", 100 * 1024 * 1024)
        elif file_category == "image":
            max_size = self._config.get("max_image_size", 15 * 1024 * 1024)
        else:
            max_size = self._config.get("max_file_size", 50 * 1024 * 1024)
        
        if size > max_size:
            return False, f"File too large. Maximum: {max_size / 1024 / 1024:.1f}MB"
        
        return True, ""
    
    def get_file_category(self, extension: str) -> str:
        """
        Determine the category of a file based on extension.
        
        Returns: "image", "video", "document", or "unknown"
        """
        ext = extension.lower().strip('.')
        if ext in self._config.get("image_extensions", set()):
            return "image"
        elif ext in self._config.get("video_extensions", set()):
            return "video"
        elif ext in self._config.get("document_extensions", set()):
            return "document"
        return "unknown"
    
    def get_mime_type(self, extension: str) -> str:
        """Get MIME type for an extension."""
        ext = extension.lower().strip('.')
        mime_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp",
            "mp4": "video/mp4",
            "avi": "video/x-msvideo",
            "mov": "video/quicktime",
            "mkv": "video/x-matroska",
            "webm": "video/webm",
            "pdf": "application/pdf",
        }
        return mime_map.get(ext, mimetypes.guess_type(f"file.{ext}")[0] or "application/octet-stream")
    
    # =========================================================================
    # IMAGE COMPRESSION
    # =========================================================================
    
    def compress_image(self, data: bytes, extension: str, 
                       max_dimension: Optional[int] = None,
                       quality: Optional[int] = None,
                       max_size: Optional[int] = None) -> Tuple[bytes, str]:
        """
        Compress an image while maintaining quality.
        
        Args:
            data: Raw image bytes
            extension: Original file extension
            max_dimension: Maximum width/height (optional)
            quality: JPEG/WebP quality 1-100 (optional)
            max_size: Target max file size in bytes (optional)
            
        Returns:
            Tuple of (compressed_bytes, final_extension)
        """
        if not self.pil_available:
            return data, extension
        
        from PIL import Image
        
        ext = extension.lower().strip('.')
        
        # Open image
        try:
            img = Image.open(io.BytesIO(data))
        except Exception as e:
            log.warning(f"Failed to open image for compression: {e}")
            return data, extension
        
        # Determine format
        format_map = {
            "jpg": "JPEG",
            "jpeg": "JPEG",
            "png": "PNG",
            "gif": "GIF",
            "webp": "WEBP",
        }
        img_format = format_map.get(ext, "PNG")
        
        # Convert RGBA to RGB for JPEG
        if img_format == "JPEG" and img.mode in ("RGBA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
            img = background
        
        # Resize if needed
        max_dim = max_dimension or self._config.get("max_image_dimension", 4096)
        if img.width > max_dim or img.height > max_dim:
            ratio = min(max_dim / img.width, max_dim / img.height)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Compress with quality adjustment
        base_quality = quality or self._config.get("image_quality", 85)
        target_size = max_size or self._config.get("max_image_size", 15 * 1024 * 1024)
        
        if img_format in ("JPEG", "WEBP"):
            # Try progressively lower quality to meet size target
            for q in [base_quality, 80, 75, 70, 60, 50, 40]:
                output = io.BytesIO()
                img.save(output, format=img_format, quality=q, optimize=True)
                if output.tell() <= target_size:
                    return output.getvalue(), ext
            return output.getvalue(), ext
        else:
            # PNG, GIF - just optimize
            output = io.BytesIO()
            img.save(output, format=img_format, optimize=True)
            return output.getvalue(), ext
    
    def compress_avatar(self, data: bytes, extension: str) -> Tuple[bytes, str]:
        """
        Compress an avatar image with avatar-specific settings.
        
        Args:
            data: Raw image bytes
            extension: File extension
            
        Returns:
            Tuple of (compressed_bytes, final_extension)
        """
        max_dim = self._config.get("avatar_max_dimension", 512)
        quality = self._config.get("avatar_quality", 85)
        max_size = self._config.get("max_avatar_size", 5 * 1024 * 1024)
        
        return self.compress_image(
            data, extension,
            max_dimension=max_dim,
            quality=quality,
            max_size=max_size
        )
    
    # =========================================================================
    # FILE STORAGE
    # =========================================================================
    
    def store_file(self, data: Union[bytes, BinaryIO], extension: str, 
                   media_type: MediaType, entity_id: Optional[str] = None,
                   compress: bool = True) -> MediaResult:
        """
        Store a media file with validation and optional compression.
        
        Args:
            data: File data (bytes or file-like object)
            extension: File extension
            media_type: Type of media (AVATAR, PAPS, SPAP, CATEGORY)
            entity_id: Optional specific ID for the file (e.g., user_id for avatar)
            compress: Whether to compress images
            
        Returns:
            MediaResult with operation outcome
        """
        self.ensure_directories()
        
        # Read data if file-like
        if hasattr(data, 'read'):
            data = data.read()
        
        ext = extension.lower().strip('.')
        
        # Validate extension
        valid, error = self.validate_extension(ext, media_type)
        if not valid:
            return MediaResult(success=False, error=error)
        
        # Determine file category
        file_category = self.get_file_category(ext)
        
        # Validate size (before compression)
        valid, error = self.validate_size(len(data), media_type, file_category)
        if not valid:
            return MediaResult(success=False, error=error)
        
        # Compress images if enabled
        if compress and self._config.get("compression_enabled", True) and file_category == "image":
            if media_type == MediaType.AVATAR:
                data, ext = self.compress_avatar(data, ext)
            else:
                data, ext = self.compress_image(data, ext)
        
        # Generate or use provided ID
        if entity_id:
            media_id = entity_id
        else:
            media_id = str(uuid.uuid4())
        
        # Build filepath
        directory = self.get_directory(media_type)
        filename = f"{media_id}.{ext}"
        filepath = directory / filename
        
        # Write file
        try:
            filepath.write_bytes(data)
        except Exception as e:
            log.error(f"Failed to write media file: {e}")
            return MediaResult(success=False, error=f"Failed to store file: {str(e)}")
        
        # Build URL
        url = self.get_media_url(media_type, media_id, ext)
        
        return MediaResult(
            success=True,
            media_id=media_id,
            filepath=filepath,
            file_extension=ext,
            file_size=len(data),
            mime_type=self.get_mime_type(ext),
            media_type=file_category,
            url=url
        )
    
    def store_avatar(self, data: Union[bytes, BinaryIO], extension: str, 
                     user_id: str) -> MediaResult:
        """
        Store a user avatar with compression.
        
        Args:
            data: Image data
            extension: File extension
            user_id: User ID (used as filename)
            
        Returns:
            MediaResult
        """
        return self.store_file(data, extension, MediaType.AVATAR, entity_id=user_id)
    
    def store_paps_media(self, data: Union[bytes, BinaryIO], extension: str,
                         compress: bool = True) -> MediaResult:
        """
        Store PAPS media file.
        
        Args:
            data: File data
            extension: File extension
            compress: Whether to compress images
            
        Returns:
            MediaResult
        """
        return self.store_file(data, extension, MediaType.PAPS, compress=compress)
    
    def store_spap_media(self, data: Union[bytes, BinaryIO], extension: str,
                         compress: bool = True) -> MediaResult:
        """
        Store SPAP media file.
        
        Args:
            data: File data
            extension: File extension
            compress: Whether to compress images
            
        Returns:
            MediaResult
        """
        return self.store_file(data, extension, MediaType.SPAP, compress=compress)
    
    def store_asap_media(self, data: Union[bytes, BinaryIO], extension: str,
                         compress: bool = True) -> MediaResult:
        """
        Store ASAP media file.
        
        Args:
            data: File data
            extension: File extension
            compress: Whether to compress images
            
        Returns:
            MediaResult
        """
        return self.store_file(data, extension, MediaType.ASAP, compress=compress)
    
    def store_category_icon(self, data: Union[bytes, BinaryIO], extension: str,
                            category_id: str) -> MediaResult:
        """
        Store category icon.
        
        Args:
            data: Image data
            extension: File extension
            category_id: Category ID (used as filename)
            
        Returns:
            MediaResult
        """
        return self.store_file(data, extension, MediaType.CATEGORY, entity_id=category_id)
    
    # =========================================================================
    # FILE RETRIEVAL & DELETION
    # =========================================================================
    
    def get_file_path(self, media_type: MediaType, media_id: str, 
                      extension: str) -> Optional[pathlib.Path]:
        """
        Get the filesystem path for a media file.
        
        Args:
            media_type: Type of media
            media_id: Media ID
            extension: File extension
            
        Returns:
            Path if file exists, None otherwise
        """
        ext = extension.lower().strip('.')
        
        # Validate extension for security
        if not ext or '/' in ext or '\\' in ext or '..' in ext:
            return None
        
        directory = self.get_directory(media_type)
        filepath = directory / f"{media_id}.{ext}"
        
        if filepath.exists():
            return filepath
        return None
    
    def delete_file(self, media_type: MediaType, media_id: str, 
                    extension: str) -> bool:
        """
        Delete a media file from disk.
        
        Args:
            media_type: Type of media
            media_id: Media ID
            extension: File extension
            
        Returns:
            True if deleted, False otherwise
        """
        filepath = self.get_file_path(media_type, media_id, extension)
        if filepath and filepath.exists():
            try:
                filepath.unlink()
                return True
            except Exception as e:
                log.error(f"Failed to delete media file {filepath}: {e}")
        return False
    
    def delete_avatar(self, user_id: str, extension: str) -> bool:
        """Delete a user's avatar."""
        return self.delete_file(MediaType.AVATAR, user_id, extension)
    
    def delete_paps_media(self, media_id: str, extension: str) -> bool:
        """Delete PAPS media."""
        return self.delete_file(MediaType.PAPS, media_id, extension)
    
    def delete_spap_media(self, media_id: str, extension: str) -> bool:
        """Delete SPAP media."""
        return self.delete_file(MediaType.SPAP, media_id, extension)
    
    def delete_asap_media(self, media_id: str, extension: str) -> bool:
        """Delete ASAP media."""
        return self.delete_file(MediaType.ASAP, media_id, extension)
    
    def delete_category_icon(self, category_id: str, extension: str) -> bool:
        """Delete category icon."""
        return self.delete_file(MediaType.CATEGORY, category_id, extension)
    
    # =========================================================================
    # BATCH OPERATIONS
    # =========================================================================
    
    def delete_media_batch(self, media_type: MediaType, 
                           items: list[Dict[str, str]]) -> int:
        """
        Delete multiple media files.
        
        Args:
            media_type: Type of media
            items: List of dicts with 'media_id' and 'file_extension' keys
            
        Returns:
            Number of files deleted
        """
        deleted = 0
        for item in items:
            media_id = item.get('media_id', '')
            ext = item.get('file_extension', '')
            if media_id and ext and self.delete_file(media_type, media_id, ext):
                deleted += 1
        return deleted
    
    # =========================================================================
    # VALIDATION HELPERS FOR API USE
    # =========================================================================
    
    def validate_upload(self, filename: str, file_size: int,
                        media_type: Optional[MediaType] = None) -> Tuple[bool, str, str]:
        """
        Validate an upload before processing.
        
        Args:
            filename: Original filename
            file_size: File size in bytes
            media_type: Optional media type for specific validation
            
        Returns:
            Tuple of (is_valid, error_message, extension)
        """
        # Extract extension
        if '.' not in filename:
            return False, "File must have an extension", ""
        
        ext = filename.rsplit('.', 1)[1].lower()
        
        # Validate extension
        valid, error = self.validate_extension(ext, media_type)
        if not valid:
            return False, error, ext
        
        # Validate size
        file_category = self.get_file_category(ext)
        valid, error = self.validate_size(file_size, media_type, file_category)
        if not valid:
            return False, error, ext
        
        return True, "", ext
    
    def get_allowed_extensions_str(self, media_type: Optional[MediaType] = None) -> str:
        """Get comma-separated string of allowed extensions."""
        if media_type == MediaType.AVATAR:
            exts = self._config.get("avatar_extensions", self._config["image_extensions"])
        elif media_type == MediaType.CATEGORY:
            exts = self._config.get("image_extensions")
        else:
            exts = self._config.get("allowed_extensions")
        return ', '.join(sorted(exts))


# Global instance (can be initialized with app later)
_media_handler: Optional[MediaHandler] = None


def get_media_handler(app=None) -> MediaHandler:
    """
    Get or create the global MediaHandler instance.
    
    Args:
        app: Flask app (optional, for initial configuration)
        
    Returns:
        MediaHandler instance
    """
    global _media_handler
    if _media_handler is None:
        _media_handler = MediaHandler(app=app)
    elif app and _media_handler._app is None:
        _media_handler._app = app
        if "MEDIA_CONFIG" in app.config:
            _media_handler._config.update(app.config["MEDIA_CONFIG"])
    return _media_handler


def init_media_handler(app) -> MediaHandler:
    """
    Initialize the media handler with Flask app.
    
    Call this during app initialization.
    
    Args:
        app: Flask application
        
    Returns:
        Configured MediaHandler
    """
    global _media_handler
    _media_handler = MediaHandler(app=app)
    _media_handler.ensure_directories()
    return _media_handler
