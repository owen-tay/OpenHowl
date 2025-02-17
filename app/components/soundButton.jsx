"use client";
import React, { useState, useEffect } from "react";
import SoundEffectsModal from "./SoundEffectsModal";
import { useLongPress } from "../hooks/useLongPress";
// Import updateSound API for updating playing status (if backend integration is desired)
import { updateSound } from "../../api";

export default function SoundButton(props) {
  // Use soundData if available; otherwise fallback to individual props.
  const soundId = props.soundData ? props.soundData.id : props.soundId;
  const soundName = props.soundData ? props.soundData.name : props.soundName;
  const soundLength = props.soundData
    ? props.soundData.length
    : props.soundLength || 10000; // in ms

  // Initialize isActive state based on soundData.playing if provided, else false.
  const [isActive, setIsActive] = useState(
    props.soundData ? props.soundData.playing : false
  );
  const [showModal, setShowModal] = useState(false);

  // Set up long press to show the modal.
  const longPressEvent = useLongPress(() => {
    console.log("Long press detected on sound " + soundId);
    setShowModal(true);
  }, 500);

  // Handler for starting the sound.
  function handleStart() {
    console.log("Starting sound " + soundId + ": " + soundName);
    setIsActive(true);
    if (props.soundData) {
      const updatedSound = { ...props.soundData, playing: true };
      updateSound(updatedSound).catch((error) =>
        console.error("Error updating playing status:", error)
      );
    }
  }

  // Handler for stopping the sound.
  function handleStop() {
    console.log("Stopping sound " + soundId + ": " + soundName);
    setIsActive(false);
    if (props.soundData) {
      const updatedSound = { ...props.soundData, playing: false };
      updateSound(updatedSound).catch((error) =>
        console.error("Error updating playing status:", error)
      );
    }
  }

  // Toggle between starting and stopping the sound.
  function handleClick() {
    isActive ? handleStop() : handleStart();
  }

  // Automatically stop the sound after its duration.
  useEffect(() => {
    let timer;
    if (isActive) {
      timer = setTimeout(() => {
        console.log("Sound " + soundId + " finished playing");
        setIsActive(false);
      }, soundLength);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isActive, soundLength, soundId]);

  // Build a complete soundData object to pass to the modal.
  // If props.soundData exists, use it; otherwise, create a default object.
  const fullSoundData = props.soundData || {
    id: soundId,
    name: soundName,
    length: soundLength,
    volume: 70,
    playing: false,
    effects: {
      echo: false,
      reverb: false,
      lowpass: false,
      highpass: false,
      reverse: false,
      distort: false,
      
    },
    trim_start: 0,
    trim_end: Math.floor(soundLength / 1000),
    file_path: "",
    file_format: "",
  };

  return (
    <>
      <div
        {...longPressEvent} // Attach the long press handlers.
        onClick={handleClick} // Click to toggle play/stop.
        className={
          "relative border-2 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out transform hover:scale-105 cursor-pointer flex items-center justify-center h-20 w-40 text-lg font-bold overflow-hidden select-none " +
          (isActive ? "ring-2 ring-secondary" : "")
        }
      >
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Animated Sound Wave */}
          <div
            className={
              "absolute w-24 h-12 top-5 overflow-hidden transform transition-transform duration-300 ease-out " +
              (isActive ? "scale-100" : "scale-0")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="60"
              viewBox="0 0 200 60"
              className="moving-wave text-secondary filter drop-shadow-md"
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M 0 30 c 10 0 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                   s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20"
              />
            </svg>
          </div>

          {/* Button Text */}
          <span
            className={
              "relative z-10 transition-all duration-300 ease-out transform " +
              (isActive ? "scale-0 opacity-0" : "scale-100 opacity-100")
            }
          >
            {soundName}
          </span>
        </div>

        <style jsx>{`
          .moving-wave {
            animation: waveScroll 2s linear infinite;
            position: absolute;
          }
          @keyframes waveScroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-80px);
            }
          }
        `}</style>
      </div>

      {/* Render the modal for audio settings */}
      {showModal && (
        <SoundEffectsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          soundData={fullSoundData}
        />
      )}
    </>
  );
}
