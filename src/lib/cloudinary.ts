// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dg9yh82rf';
const CLOUDINARY_UPLOAD_PRESET = 'rihaab';

export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || CLOUDINARY_CLOUD_NAME,
  UPLOAD_PRESET: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || CLOUDINARY_UPLOAD_PRESET,
  API_KEY: process.env.REACT_APP_CLOUDINARY_API_KEY || '',
  API_SECRET: process.env.REACT_APP_CLOUDINARY_API_SECRET || '',
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

// Cloudinary upload function
export const uploadToCloudinary = async (
  file: File,
  resourceType: 'video' | 'image' | 'raw' | 'auto' = 'auto',
  onProgress?: (percent: number) => void
): Promise<{ url: string; publicId: string; duration?: number }> => {
  if (!file) {
    throw new Error('File is required');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
  
  // Auto-detect resource type if 'auto' is specified
  let actualResourceType: 'video' | 'image' | 'raw' = 'raw';
  if (resourceType === 'auto') {
    actualResourceType = getResourceTypeFromFile(file);
  } else {
    actualResourceType = resourceType;
  }
  
  formData.append('resource_type', actualResourceType);
  
  // For unsigned uploads, we can only use basic parameters
  // No eager transformations or async processing allowed
  
  try {
    console.log('Uploading to Cloudinary:', {
      cloudName: CLOUDINARY_CONFIG.CLOUD_NAME,
      uploadPreset: CLOUDINARY_CONFIG.UPLOAD_PRESET,
      resourceType: actualResourceType,
      fileName: file.name,
      fileSize: file.size,
      usingProgress: !!onProgress
    });

    // If caller provided an onProgress callback, use XHR to get upload progress events
    if (onProgress) {
      return await new Promise((resolve, reject) => {
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/upload`);

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              try { onProgress(percent); } catch (e) { /* ignore callback errors */ }
            }
          };

          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              let data: any;
              try {
                data = JSON.parse(xhr.responseText);
              } catch (err) {
                return reject(new Error('Invalid JSON response from Cloudinary'));
              }

              if (!data.secure_url || !data.public_id) {
                return reject(new Error('Invalid response from Cloudinary'));
              }

              let duration: number | undefined;
              if (actualResourceType === 'video') {
                if (data.duration && typeof data.duration === 'number' && data.duration > 0) {
                  duration = data.duration;
                } else {
                  try {
                    duration = await getVideoDuration(file);
                  } catch (e) {
                    duration = 0;
                  }
                }
              }

              resolve({ url: data.secure_url, publicId: data.public_id, duration });
            } else {
              reject(new Error(`Upload failed: ${xhr.status} - ${xhr.statusText}`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));

          const fd2 = new FormData();
          fd2.append('file', file);
          fd2.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
          fd2.append('resource_type', actualResourceType);
          xhr.send(fd2);
        } catch (err) {
          reject(err);
        }
      });
    }

    // Fallback: use fetch for simple uploads (no progress)
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Cloudinary upload response:', data);

    if (!data.secure_url || !data.public_id) {
      throw new Error('Invalid response from Cloudinary');
    }

    // For videos, try to get duration from Cloudinary response
    let duration: number | undefined;
    if (actualResourceType === 'video') {
      if (data.duration && typeof data.duration === 'number' && data.duration > 0) {
        duration = data.duration;
        console.log('Duration from Cloudinary:', duration);
      } else {
        console.log('No duration from Cloudinary, getting from file...');
        duration = await getVideoDuration(file);
      }
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      duration
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Function to validate Cloudinary URL format
export const validateCloudinaryUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Check if it's a valid Cloudinary URL format
  const cloudinaryPattern = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(?:video|image|raw)\/upload\/.*$/;
  return cloudinaryPattern.test(url);
};

// Function to get Cloudinary public ID from URL
export const getCloudinaryPublicId = (url: string): string | null => {
  if (!validateCloudinaryUrl(url)) {
    return null;
  }
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
      // Get everything after 'upload/' and before the file extension
      const publicIdPart = urlParts.slice(uploadIndex + 1).join('/');
      // Remove file extension
      return publicIdPart.replace(/\.[^/.]+$/, '');
    }
  } catch (error) {
    console.error('Error extracting Cloudinary public ID:', error);
  }
  
  return null;
};

// Function to delete file from Cloudinary
export const deleteFromCloudinary = async (publicId: string, resourceType: 'video' | 'image' | 'raw' = 'raw'): Promise<boolean> => {
  if (!publicId) {
    throw new Error('Public ID is required');
  }

  try {
    const response = await fetch(`/api/cloudinary/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicId,
        resourceType
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} - ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

// Function to get Cloudinary URL with transformations
export const getCloudinaryUrl = (
  publicId: string, 
  transformations: string = '', 
  resourceType: 'video' | 'image' | 'raw' = 'image'
): string => {
  if (!publicId) {
    throw new Error('Public ID is required');
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.CLOUD_NAME}`;
  const resourcePath = resourceType;
  
  if (transformations) {
    return `${baseUrl}/${resourcePath}/upload/${transformations}/${publicId}`;
  }
  
  return `${baseUrl}/${resourcePath}/upload/${publicId}`;
};

// Utility function to check if a URL is from Cloudinary
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('res.cloudinary.com');
};

// Utility function to extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!isCloudinaryUrl(url)) {
    return null;
  }
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1 && uploadIndex + 1 < urlParts.length) {
      return urlParts[uploadIndex + 1];
    }
  } catch (error) {
    console.error('Error extracting public ID:', error);
  }
  
  return null;
};

// Utility function to get optimized image URL
export const getOptimizedImageUrl = (publicId: string, width?: number, height?: number, quality: number = 80): string => {
  let transformations = `f_auto,q_${quality}`;
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  
  return getCloudinaryUrl(publicId, transformations, 'image');
};

// Utility function to get video thumbnail URL
export const getVideoThumbnailUrl = (publicId: string, width: number = 300, height: number = 200): string => {
  const transformations = `f_auto,w_${width},h_${height},c_fill`;
  return getCloudinaryUrl(publicId, transformations, 'video');
};
