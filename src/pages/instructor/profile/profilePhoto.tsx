import React, { useRef, useState } from 'react';

const ProfilePhoto = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhoto(ev.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white border border-[#E6E6E6] shadow-xl mt-[32px] flex flex-col items-center">
      <div className="public-profile-initials">
        {photo ? (
          <img src={photo} alt="Profile" className="w-full object-cover rounded-full" />
        ) : (
          'IN'
        )}
      </div>
      <button
        className="border border-[#ff7700] text-[#ff7700] bg-white py-2 px-4 font-medium text-base mb-4 hover:bg-[#fff7ef] transition-colors"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        Edit Profile Photo
      </button>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handlePhotoChange}
      />
    </div>
  );
};

export default ProfilePhoto;
