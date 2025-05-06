"use client";

import React from "react";

interface PopupProps {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

const Popup: React.FC<PopupProps> = ({ message, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm text-center">
        <p className="text-lg font-medium mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Popup;
