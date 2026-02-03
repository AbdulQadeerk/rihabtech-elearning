import LearnerProfileSidebar from '../../../components/ui/LearnerProfileSidebar';
import GradientHeader from '../../../components/ui/GradientHeader';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axiosClient from '../../../utils/axiosClient';
import { API_BASE_URL_IMG } from '../../../lib/api';
import { toast } from 'sonner';

const ProfilePhoto = () => {
  const [photo, setPhoto] = useState<string | null>(null); // Current uploaded photo
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null); // Preview of selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Selected file before upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout, user, refreshAuth } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);


  // Allowed file types
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        const allowedTypes = ['JPEG', 'JPG', 'PNG', 'WEBP', 'GIF'];
        const errorMsg = `File type .${fileExtension.toUpperCase()} is not allowed. Please select an image in ${allowedTypes.join(', ')} format.`;
        setUploadError(errorMsg);
        toast.error(`File type .${fileExtension.toUpperCase()} is not allowed. Please select a ${allowedTypes.join(', ')} image.`);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `File size is too large. Please select an image smaller than ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
        setUploadError(errorMsg);
        toast.error(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // File is valid, proceed with preview
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewPhoto(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewPhoto(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

    useEffect(() => {
      const fetchProfile = async () => {
        setLoading(true);
        setError("");
        try {
          const res = await axiosClient.get("/user-profile", {
            timeout: 30000 // 30 seconds timeout for profile fetch
          });
          setProfile(res.data);
            // if profile has image path, set preview
            if (res.data?.profileImage) {
              setPhoto(API_BASE_URL_IMG+res.data.profileImage);
            }
        } catch (err: any) {
          console.error('Profile fetch error:', err);
          if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            setError("Request timed out. Please refresh the page.");
            toast.error('Failed to load profile: Request timed out. Please try again.');
          } else {
            setError("Failed to load profile");
            toast.error('Failed to load profile. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }, []);

  // compute initials from profile (userName, name or email)
  const getInitials = () => {
    const name = profile?.userName || profile?.name || profile?.email || '';
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleUpload = async () => {
    setUploadError(null);
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      const form = new FormData();
      // API expects field name 'profileImageFile' with binary string
      form.append('profileImageFile', selectedFile);

      await axiosClient.post('/upload-profile-photo', form, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000, // 60 seconds timeout for file uploads (larger files may take longer)
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      });

      // Upload successful - fetch updated profile to get the new image path
      try {
        const profileRes = await axiosClient.get("/user-profile", {
          timeout: 30000
        });
        
        const newImage = profileRes.data?.profileImage || null;
        
        if (newImage) {
          // Update photo state with the uploaded image URL
          const imageUrl = newImage.startsWith('http') ? newImage : (API_BASE_URL_IMG + newImage);
          setPhoto(imageUrl);
          // Clear preview photo so we only show the uploaded photo
          setPreviewPhoto(null);
          // update local profile object so other UI reads new value
          setProfile((prev: any) => ({ ...(prev || {}), profileImage: newImage }));
          
          // Update token in localStorage with new ProfileImage
          const tokenData = localStorage.getItem('token');
          if (tokenData) {
            try {
              const userData = JSON.parse(tokenData);
              // Update ProfileImage in token
              userData.ProfileImage = newImage;
              // Save updated token back to localStorage
              localStorage.setItem('token', JSON.stringify(userData));
              
              // Trigger storage event to update other components/tabs
              window.dispatchEvent(new StorageEvent('storage', {
                key: 'token',
                newValue: JSON.stringify(userData),
                storageArea: localStorage
              }));
              
              // Refresh auth context to update header and other components
              refreshAuth();
            } catch (error) {
              console.error('Error updating token with new profile image:', error);
            }
          }
        } else {
          // If no path returned, keep showing preview as it was already uploaded
          setPhoto(previewPhoto); // Use preview as the photo
        }
      } catch (profileError) {
        console.error('Error fetching updated profile:', profileError);
        // Even if profile fetch fails, show success and use preview
        setPhoto(previewPhoto);
      }
      
      // Always clear selected file and hide buttons after successful upload
      setSelectedFile(null);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Always show success message
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error', err);
      
      let errorMessage = 'Upload failed. Please try again.';
      
      // Handle timeout errors specifically
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMessage = 'Upload timed out. The file may be too large or the connection is slow. Please try again.';
        setUploadError(errorMessage);
        toast.error('Upload timed out. Please try again with a smaller image or check your connection.');
      } 
      // Handle 400 Bad Request errors (file type, validation errors, etc.)
      else if (err.response?.status === 400) {
        // Try to extract error message from different possible response formats
        const responseData = err.response?.data;
        
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          errorMessage = responseData.errors[0];
        } else if (responseData?.errors && typeof responseData.errors === 'string') {
          errorMessage = responseData.errors;
        } else {
          errorMessage = 'Invalid file format or file is too large. Please select a valid image file (JPEG, JPG, PNG, WEBP, or GIF).';
        }
        
        setUploadError(errorMessage);
        toast.error(errorMessage);
      } 
      // Handle other errors
      else {
        errorMessage = err?.response?.data?.message || err?.response?.data?.error || err.message || errorMessage;
        setUploadError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      // Always reset upload state
      setUploading(false);
    }
  };

  // Determine which photo to display (preview takes priority if available)
  const displayPhoto = previewPhoto || photo;

  return (
    <div className="bg-white border border-[#E6E6E6] shadow-xl mt-[32px] flex flex-col items-center p-6 gap-4">
      <div className="public-profile-initials w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 text-2xl font-semibold text-gray-700 relative">
        {displayPhoto ? (
          // show remote image or local data URL preview
          <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span>{getInitials()}</span>
        )}
      </div>

      {/* Select Photo Button */}
      <button
        className="border border-[#ff7700] text-[#ff7700] bg-white py-2 px-4 font-medium text-base hover:bg-[#fff7ef] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => fileInputRef.current?.click()}
        type="button"
        disabled={uploading}
      >
        Select Photo
      </button>

      <input
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        ref={fileInputRef}
        className="hidden"
        onChange={handlePhotoChange}
      />

      {/* Upload and Clear Buttons - Only show when a file is selected */}
      {selectedFile && (
        <div className="flex gap-3 w-full max-w-xs">
          <button
            className="flex-1 bg-[#ff7700] text-white py-2 px-4 font-medium text-base hover:bg-[#e66900] transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
            onClick={handleUpload}
            type="button"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
          <button
            className="flex-1 border border-gray-300 text-gray-700 bg-white py-2 px-4 font-medium text-base hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
            onClick={handleClear}
            type="button"
            disabled={uploading}
          >
            Clear
          </button>
        </div>
      )}

      {uploadError && (
        <div className="text-sm text-red-600 text-center max-w-xs">{uploadError}</div>
      )}
    </div>
  );
};

export default ProfilePhoto;