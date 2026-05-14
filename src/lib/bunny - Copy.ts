// Bunny.net Stream Configuration
// Documentation: https://docs.bunny.net/docs/stream-api-overview

// Default configuration (can be overridden by environment variables)
const BUNNY_LIBRARY_ID = '583461';
const BUNNY_API_KEY = '66115f44-5a8f-4db5-a631c8d48ef3-4fd0-40a7';
const BUNNY_CDN_HOSTNAME = 'vz-232b1154-bc1.b-cdn.net';

// Storage Zone configuration (for non-video files like images, documents)
const BUNNY_STORAGE_ZONE = 'rihaab';
const BUNNY_STORAGE_PASSWORD = '591fed2c-2294-423e-87a540caba58-d0a2-4012';
const BUNNY_STORAGE_HOSTNAME = 'storage.bunnycdn.com';

export const BUNNY_CONFIG = {
  LIBRARY_ID: process.env.REACT_APP_BUNNY_LIBRARY_ID || BUNNY_LIBRARY_ID,
  API_KEY: process.env.REACT_APP_BUNNY_API_KEY || BUNNY_API_KEY,
  CDN_HOSTNAME: process.env.REACT_APP_BUNNY_CDN_HOSTNAME || BUNNY_CDN_HOSTNAME,
  STORAGE_ZONE: process.env.REACT_APP_BUNNY_STORAGE_ZONE || BUNNY_STORAGE_ZONE,
  STORAGE_PASSWORD: process.env.REACT_APP_BUNNY_STORAGE_PASSWORD || BUNNY_STORAGE_PASSWORD,
  STORAGE_HOSTNAME: process.env.REACT_APP_BUNNY_STORAGE_HOSTNAME || BUNNY_STORAGE_HOSTNAME,
};

// Helper function to get resource type from file
export const getResourceTypeFromFile = (file: File): 'video' | 'image' | 'raw' => {
  if (file.type.startsWith('video/')) {
    return 'video';
  } else if (file.type.startsWith('image/')) {
    return 'image';
  } else {
    return 'raw';
  }
};

// Helper function to get video duration from file
export const getVideoDuration = async (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      console.log('Video duration detected from file:', duration);
      video.remove();
      resolve(duration);
    };

    video.onerror = (e) => {
      console.log('Failed to get video duration from file:', e);
      video.remove();
      resolve(0);
    };

    video.src = URL.createObjectURL(file);

    // Set a timeout in case the video doesn't load
    setTimeout(() => {
      if (video.duration === undefined || isNaN(video.duration)) {
        console.log('Video duration timeout, using 0');
        video.remove();
        resolve(0);
      }
    }, 5000);
  });
};

// Generate a unique filename with timestamp
const generateUniqueFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${baseName}_${timestamp}_${randomStr}.${extension}`;
};

// Interface for video upload response
interface BunnyVideoResponse {
  guid: string;
  title: string;
  dateUploaded: string;
  status: number;
  length: number;
  thumbnailUrl?: string;
}

// Interface for upload result
interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
  videoId?: string;
  thumbnailUrl?: string;
}

/**
 * Upload video to Bunny Stream
 * This is for video files - uses the Stream API for transcoding and delivery
 */
export const uploadVideoToBunnyStream = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  if (!file) {
    throw new Error('File is required');
  }

  try {
    console.log('Uploading video to Bunny Stream:', {
      libraryId: BUNNY_CONFIG.LIBRARY_ID,
      fileName: file.name,
      fileSize: file.size,
    });

    // Step 1: Create video entry in Bunny Stream
    const videoTitle = file.name.replace(/\.[^/.]+$/, ''); // Remove extension for title

    const createResponse = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_CONFIG.LIBRARY_ID}/videos`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'AccessKey': BUNNY_CONFIG.API_KEY,
        },
        body: JSON.stringify({
          title: videoTitle,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Failed to create video entry:', createResponse.status, errorText);
      throw new Error(`Failed to create video: ${createResponse.status} - ${errorText}`);
    }

    const videoData: BunnyVideoResponse = await createResponse.json();
    console.log('Video entry created:', videoData);

    // Step 2: Upload the actual video file
    const uploadUrl = `https://video.bunnycdn.com/library/${BUNNY_CONFIG.LIBRARY_ID}/videos/${videoData.guid}`;

    // Use XMLHttpRequest for progress tracking
    const uploadResult = await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('AccessKey', BUNNY_CONFIG.API_KEY);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          try { onProgress(percent); } catch (e) { /* ignore callback errors */ }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during Bunny upload'));
      xhr.send(file);
    });

    // Get video duration from file
    let duration = 0;
    try {
      duration = await getVideoDuration(file);
    } catch (e) {
      console.log('Could not get video duration:', e);
    }

    // Construct the playback URL
    // Format for Bunny Stream MP4: https://{CDN_HOSTNAME}/{VIDEO_ID}/{resolution}.mp4
    // Available resolutions: 720.mp4, 480.mp4, 360.mp4, 240.mp4
    // OR use HLS for adaptive streaming: https://{CDN_HOSTNAME}/{VIDEO_ID}/playlist.m3u8
    const playbackUrl = `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoData.guid}/playlist.m3u8`;
    const thumbnailUrl = `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoData.guid}/thumbnail.jpg`;

    console.log('Video uploaded successfully:', {
      videoId: videoData.guid,
      playbackUrl,
      thumbnailUrl,
      duration,
    });

    return {
      url: playbackUrl,
      publicId: videoData.guid,
      duration,
      videoId: videoData.guid,
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Bunny Stream upload error:', error);
    throw error;
  }
};

/**
 * Upload file to Bunny Storage (for images and documents)
 * This is for non-video files that don't need transcoding
 */
export const uploadFileToBunnyStorage = async (
  file: File,
  folder: string = 'uploads',
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  if (!file) {
    throw new Error('File is required');
  }

  try {
    const uniqueFileName = generateUniqueFileName(file.name);
    const filePath = `${folder}/${uniqueFileName}`;

    console.log('Uploading file to Bunny Storage:', {
      storageZone: BUNNY_CONFIG.STORAGE_ZONE,
      fileName: file.name,
      filePath,
      fileSize: file.size,
    });

    const uploadUrl = `https://${BUNNY_CONFIG.STORAGE_HOSTNAME}/${BUNNY_CONFIG.STORAGE_ZONE}/${filePath}`;

    // Use XMLHttpRequest for progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('AccessKey', BUNNY_CONFIG.STORAGE_PASSWORD);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          try { onProgress(percent); } catch (e) { /* ignore callback errors */ }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during Bunny Storage upload'));
      xhr.send(file);
    });

    // Construct the CDN URL for the uploaded file
    // You'll need to create a Pull Zone connected to your storage zone
    // For now, using the storage URL format
    const cdnUrl = `https://${BUNNY_CONFIG.STORAGE_ZONE}.b-cdn.net/${filePath}`;

    console.log('File uploaded to Bunny Storage:', {
      filePath,
      cdnUrl,
    });

    return {
      url: cdnUrl,
      publicId: filePath,
    };
  } catch (error) {
    console.error('Bunny Storage upload error:', error);
    throw error;
  }
};

/**
 * Main upload function that routes to the appropriate upload method
 * This replaces the Cloudinary uploadToCloudinary function
 */
export const uploadToBunny = async (
  file: File,
  resourceType: 'video' | 'image' | 'raw' | 'auto' = 'auto',
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  // Auto-detect resource type if 'auto' is specified
  let actualResourceType: 'video' | 'image' | 'raw' = 'raw';
  if (resourceType === 'auto') {
    actualResourceType = getResourceTypeFromFile(file);
  } else {
    actualResourceType = resourceType;
  }

  console.log('Upload to Bunny - detected type:', actualResourceType);

  // Route to appropriate upload method
  if (actualResourceType === 'video') {
    return uploadVideoToBunnyStream(file, onProgress);
  } else {
    // Images and documents go to Bunny Storage
    const folder = actualResourceType === 'image' ? 'images' : 'documents';
    return uploadFileToBunnyStorage(file, folder, onProgress);
  }
};

/**
 * Delete video from Bunny Stream
 */
export const deleteVideoFromBunnyStream = async (videoId: string): Promise<boolean> => {
  if (!videoId) {
    throw new Error('Video ID is required');
  }

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_CONFIG.LIBRARY_ID}/videos/${videoId}`,
      {
        method: 'DELETE',
        headers: {
          'AccessKey': BUNNY_CONFIG.API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to delete video:', response.status, errorText);
      return false;
    }

    console.log('Video deleted from Bunny Stream:', videoId);
    return true;
  } catch (error) {
    console.error('Bunny Stream delete error:', error);
    return false;
  }
};

/**
 * Delete file from Bunny Storage
 */
export const deleteFileFromBunnyStorage = async (filePath: string): Promise<boolean> => {
  if (!filePath) {
    throw new Error('File path is required');
  }

  try {
    const deleteUrl = `https://${BUNNY_CONFIG.STORAGE_HOSTNAME}/${BUNNY_CONFIG.STORAGE_ZONE}/${filePath}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'AccessKey': BUNNY_CONFIG.STORAGE_PASSWORD,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to delete file:', response.status, errorText);
      return false;
    }

    console.log('File deleted from Bunny Storage:', filePath);
    return true;
  } catch (error) {
    console.error('Bunny Storage delete error:', error);
    return false;
  }
};

/**
 * Delete file from Bunny (routes to appropriate delete method)
 * This replaces the Cloudinary deleteFromCloudinary function
 */
export const deleteFromBunny = async (
  publicId: string,
  resourceType: 'video' | 'image' | 'raw' = 'raw'
): Promise<boolean> => {
  if (resourceType === 'video') {
    return deleteVideoFromBunnyStream(publicId);
  } else {
    return deleteFileFromBunnyStorage(publicId);
  }
};

/**
 * Get Bunny Stream video URL
 */
export const getBunnyVideoUrl = (
  videoId: string,
  format: 'mp4' | 'hls' | 'thumbnail' | '720p' | '480p' | '360p' | '240p' = 'hls'
): string => {
  if (!videoId) {
    throw new Error('Video ID is required');
  }

  switch (format) {
    case 'hls':
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
    case 'thumbnail':
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
    case '720p':
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/720.mp4`;
    case '480p':
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/480.mp4`;
    case '360p':
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/360.mp4`;
    case '240p':
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/240.mp4`;
    case 'mp4':
    default:
      // Default to HLS for best compatibility and adaptive streaming
      return `https://${BUNNY_CONFIG.CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
  }
};

/**
 * Get Bunny Storage file URL
 */
export const getBunnyStorageUrl = (filePath: string): string => {
  if (!filePath) {
    throw new Error('File path is required');
  }
  return `https://${BUNNY_CONFIG.STORAGE_ZONE}.b-cdn.net/${filePath}`;
};

/**
 * Transform Bunny Stream video URL to use correct format
 * Fixes old URLs that used incorrect /play.mp4 format
 */
export const transformBunnyVideoUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Check if this is a Bunny Stream URL with the incorrect /play.mp4 format
  if (url.includes('.b-cdn.net') && url.endsWith('/play.mp4')) {
    // Replace /play.mp4 with /playlist.m3u8 for HLS streaming (more compatible)
    return url.replace('/play.mp4', '/playlist.m3u8');
  }

  return url;
};

/**
 * Check if a URL is from Bunny CDN
 */
export const isBunnyUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes('.b-cdn.net') || url.includes('bunnycdn.com');
};

/**
 * Validate Bunny URL format
 */
export const validateBunnyUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  return isBunnyUrl(url);
};

/**
 * Get video status from Bunny Stream
 */
export const getVideoStatus = async (videoId: string): Promise<{
  status: 'processing' | 'ready' | 'failed';
  progress?: number;
}> => {
  if (!videoId) {
    throw new Error('Video ID is required');
  }

  try {
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_CONFIG.LIBRARY_ID}/videos/${videoId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'AccessKey': BUNNY_CONFIG.API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.status}`);
    }

    const videoData = await response.json();

    // Bunny Stream status codes:
    // 0 = Created, 1 = Uploaded, 2 = Processing, 3 = Transcoding, 4 = Finished, 5 = Error
    const statusMap: { [key: number]: 'processing' | 'ready' | 'failed' } = {
      0: 'processing',
      1: 'processing',
      2: 'processing',
      3: 'processing',
      4: 'ready',
      5: 'failed',
    };

    return {
      status: statusMap[videoData.status] || 'processing',
      progress: videoData.encodeProgress,
    };
  } catch (error) {
    console.error('Failed to get video status:', error);
    return { status: 'failed' };
  }
};

// ============================================
// LEGACY COMPATIBILITY FUNCTIONS
// These are aliases to maintain compatibility with existing code
// that uses Cloudinary function names
// ============================================

/**
 * @deprecated Use uploadToBunny instead
 * Legacy alias for compatibility with code that used Cloudinary
 */
export const uploadToCloudinary = uploadToBunny;

/**
 * @deprecated Use deleteFromBunny instead
 * Legacy alias for compatibility with code that used Cloudinary
 */
export const deleteFromCloudinary = deleteFromBunny;

/**
 * @deprecated Use validateBunnyUrl instead
 * Legacy alias for compatibility
 */
export const validateCloudinaryUrl = validateBunnyUrl;

/**
 * @deprecated Use isBunnyUrl instead
 * Legacy alias for compatibility
 */
export const isCloudinaryUrl = isBunnyUrl;
