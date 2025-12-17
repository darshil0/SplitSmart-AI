import React, { useRef } from 'react';
import { Camera } from 'lucide-react';

interface ReceiptUploaderProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ onUpload, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Upload receipt image"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isProcessing}
        tabIndex={-1}
      />
      <div className="bg-indigo-100 p-4 rounded-full text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
        <Camera size={32} />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Receipt</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Click to select or take a photo of your receipt to begin parsing.
      </p>
    </div>
  );
};

export default ReceiptUploader;