import React, { useRef } from "react";
import { Camera } from "lucide-react";

interface ReceiptUploaderProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({
  onUpload,
  isProcessing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === "Enter" || e.key === " ") && !isProcessing) {
      e.preventDefault(); // Prevent page scroll on spacebar
      fileInputRef.current?.click();
    }
  };

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleBlur = () => {
    // Reset focus ring after blur for better UX
  };

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all group outline-none ${
        isProcessing
          ? "border-gray-300 bg-gray-50 cursor-not-allowed opacity-60"
          : "border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 cursor-pointer focus:ring-4 focus:ring-indigo-500 focus:ring-offset-2 focus:border-indigo-500"
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      role="button"
      tabIndex={0}
      aria-label="Upload receipt image"
      aria-disabled={isProcessing}
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
      <div className={`p-4 rounded-full mb-4 transition-transform ${
        isProcessing 
          ? "bg-gray-200 text-gray-400" 
          : "bg-indigo-100 text-indigo-600 group-hover:scale-110"
      }`}>
        <Camera size={32} />
      </div>
      <h3 className={`text-lg font-semibold mb-2 transition-colors ${
        isProcessing ? "text-gray-500" : "text-gray-700 group-hover:text-indigo-700"
      }`}>
        {isProcessing ? "Processing..." : "Upload Receipt"}
      </h3>
      <p className="text-sm text-center max-w-xs transition-colors">
        {isProcessing 
          ? "Analyzing your receipt..." 
          : "Click to select or take a photo of your receipt to begin parsing."
        }
      </p>
    </div>
  );
};

export default ReceiptUploader;
