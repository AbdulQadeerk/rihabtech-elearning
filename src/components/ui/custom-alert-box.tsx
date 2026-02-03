import React, { useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

// Custom Alert Component
const CustomAlert = ({ isOpen, onClose, type, title, message, onConfirm }:{isOpen:any, onClose:any, type:any, title:any, message:any, onConfirm:any}) => {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';
  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isSuccess ? 'border-green-100' : isError ? 'border-red-100' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isSuccess && <CheckCircle className="h-6 w-6 text-green-500" />}
            {isError && <AlertCircle className="h-6 w-6 text-red-500" />}
            {isConfirm && <AlertCircle className="h-6 w-6 text-orange-500" />}
            <h3 className={`text-lg font-semibold ${
              isSuccess ? 'text-green-800' : isError ? 'text-red-800' : 'text-gray-800'
            }`}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          {isConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};