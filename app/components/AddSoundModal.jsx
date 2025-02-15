"use client";
import React, { useState } from "react";
import { FaYoutube, FaFolderOpen, FaArrowLeft } from "react-icons/fa";

function AddSoundModal(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var onSoundAdded = props.onSoundAdded;
  
  if (!isOpen) {
    return null;
  }
  
  var [selectedOption, setSelectedOption] = useState(null);
  var [youtubeUrl, setYoutubeUrl] = useState("");
  var [file, setFile] = useState(null);
  var [soundName, setSoundName] = useState("");
  var [isLoading, setIsLoading] = useState(false);
  
  function handleOptionSelect(option) {
    setSelectedOption(option);
  }
  
  function handleFileChange(event) {
    setFile(event.target.files[0]);
  }
  
  function handleYoutubeUrlChange(event) {
    setYoutubeUrl(event.target.value);
  }
  
  function handleSoundNameChange(event) {
    setSoundName(event.target.value);
  }
  
  function handleAddSound() {
    if (selectedOption === "youtube" && youtubeUrl.trim() === "") {
      return;
    }
    if (selectedOption === "local" && !file) {
      return;
    }
    setIsLoading(true);
    
    // TODO: Replace this dummy code with an actual API call to your Python backend.
    // For example, call the endpoint that converts the YouTube URL or handles file upload.
    var newSound = {
      id: Date.now(),  // Dummy id for testing.
      name: soundName || "New Sound",
      status: "loading"  // Starts as "loading" until processing completes.
    };
    
    onSoundAdded(newSound);
    setIsLoading(false);
    onClose();
  }
  
  return (
    <dialog open className="modal animate-fadeIn">
      <div className="modal-box relative">
        <h3 className="font-bold text-lg mb-4">Add New Sound</h3>
        
        {/* Back Button: appears only when an option is selected */}
        {selectedOption !== null && (
          <button
            className="btn absolute top-2 left-2"
            onClick={function() { setSelectedOption(null); }}
          >
            <FaArrowLeft size={24} className="text-current" />
            <span className="ml-2">Back</span>
          </button>
        )}
        
        {/* Option Selector */}
        {selectedOption === null && (
          <div className="flex justify-around mb-4">
            <button
              className="btn"
              onClick={function() { handleOptionSelect("youtube"); }}
            >
              <FaYoutube size={40} className="text-current" />
            </button>
            <button
              className="btn"
              onClick={function() { handleOptionSelect("local"); }}
            >
              <FaFolderOpen size={40} className="text-current" />
            </button>
          </div>
        )}
        
        {/* YouTube URL Input */}
        {selectedOption === "youtube" && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Paste YouTube URL here..."
              className="input input-bordered w-full mb-4"
              value={youtubeUrl}
              onChange={handleYoutubeUrlChange}
            />
          </div>
        )}
        
        {/* File Input for Local Upload */}
        {selectedOption === "local" && (
          <div className="mb-4">
            <input
              type="file"
              className="file-input file-input-bordered w-full mb-4"
              onChange={handleFileChange}
            />
          </div>
        )}
        
        {/* Sound Name Input */}
        {selectedOption !== null && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Enter sound name..."
              className="input input-bordered w-full mb-4"
              value={soundName}
              onChange={handleSoundNameChange}
            />
          </div>
        )}
        
        {/* Add Sound Button with Loading */}
        {selectedOption !== null && (
          <button
            className="btn w-full"
            onClick={handleAddSound}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>
                <span className="loading loading-bars loading-sm"></span>
                Please wait for upload to be complete.
              </span>
            ) : (
              "Add Sound"
            )}
          </button>
        )}
      </div>
      {/* Modal Backdrop */}
      <form method="dialog" className="modal-backdrop backdrop-blur-md">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}

export default AddSoundModal;
