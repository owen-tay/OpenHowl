"use client";
import React, { useState, useEffect, useRef } from "react";
import SoundEffectsModal from "./SoundEffectsModal";
import { useLongPress } from "../hooks/useLongPress";
import { updateSound } from "../../api";
import { FaTrashAlt } from "react-icons/fa"; // import delete icon
import { FaRegStopCircle } from "react-icons/fa";
import { MdOutlinePlayCircle } from "react-icons/md";
// Discord API endpoints
const DISCORD_API_BASE = "http://localhost:8000/discord";

async function sendDiscordPlay(soundId) {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/play/${soundId}`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log("Discord play response:", data);
    return true;
  } catch (error) {
    console.error("Error sending Discord play command:", error);
    return false;
  }
}

async function sendDiscordStop() {
  try {
    const response = await fetch(`${DISCORD_API_BASE}/stop`, {
      method: "POST",
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log("Discord stop response:", data);
    return true;
  } catch (error) {
    console.error("Error sending Discord stop command:", error);
    return false;
  }
}

export default function SoundButton({
  soundData,
  onStartPlaying,
  onStopPlaying,
  isCurrentlyPlaying,
  deleteMode,
  onSoundDeleted,
}) {
  const [isActive, setIsActive] = useState(soundData?.playing || false);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSoundData, setCurrentSoundData] = useState(soundData);
  // Ref to store the timer ID for auto-stop
  const stopTimerRef = useRef(null);

  // Long press handler for opening the effects modal
  const longPressEvent = useLongPress(async () => {
    try {
      const response = await fetch(`http://localhost:8000/sounds`);
      const allSounds = await response.json();
      const latestSoundData = allSounds.find((s) => s.id === soundData.id);
      if (latestSoundData) {
        setCurrentSoundData(latestSoundData);
      } else {
        console.error("Sound not found in backend");
      }
    } catch (error) {
      console.error("Error fetching latest sound data:", error);
    }
    setShowModal(true);
  }, 500);

  // If the parent indicates this sound is no longer active, update local state accordingly
  useEffect(() => {
    if (!isCurrentlyPlaying && isActive) {
      setIsActive(false);
      setIsPlaying(false);
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    }
  }, [isCurrentlyPlaying, isActive]);

  // Also update local isActive when the backend playing state changes
  useEffect(() => {
    setIsActive(soundData?.playing || false);
  }, [soundData?.playing]);

  // Handle starting playback
  async function handleStart() {
    console.log(`Starting sound ${soundData.id}: ${soundData.name}`);

    // Clear any existing timer
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    // Notify parent so that any previously playing sound can be stopped
    if (onStartPlaying) {
      onStartPlaying(soundData.id);
    }

    const success = await sendDiscordPlay(soundData.id);

    if (success) {
      setIsActive(true);
      setIsPlaying(true);

      // Update the playing state in the backend
      try {
        const response = await fetch(`http://localhost:8000/sounds`);
        const allSounds = await response.json();
        const currentSound = allSounds.find((s) => s.id === soundData.id);
        if (currentSound) {
          const updatedSound = { ...currentSound, playing: true };
          await updateSound(updatedSound);
        } else {
          console.error("Sound not found in backend");
        }
      } catch (error) {
        console.error("Error updating playing status:", error);
      }

      // Calculate effective duration from trim values if available; fallback to soundData.length
      const effectiveDuration =
        typeof soundData.trim_start === "number" &&
        typeof soundData.trim_end === "number"
          ? soundData.trim_end - soundData.trim_start
          : soundData.length;

      // Set up automatic stop after the effective duration
      stopTimerRef.current = setTimeout(() => {
        handleStop();
      }, effectiveDuration);
    }
  }

  // Handle stopping playback
  async function handleStop() {
    console.log(`Stopping sound ${soundData.id}: ${soundData.name}`);

    // Clear the auto-stop timer if it exists
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    const success = await sendDiscordStop();

    if (success) {
      setIsActive(false);
      setIsPlaying(false);

      // Notify parent that playback has stopped
      if (onStopPlaying) {
        onStopPlaying();
      }

      // Update the playing state in the backend
      try {
        const response = await fetch(`http://localhost:8000/sounds`);
        const allSounds = await response.json();
        const currentSound = allSounds.find((s) => s.id === soundData.id);
        if (currentSound) {
          const updatedSound = { ...currentSound, playing: false };
          await updateSound(updatedSound);
        } else {
          console.error("Sound not found in backend");
        }
      } catch (error) {
        console.error("Error updating playing status:", error);
      }
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Are you sure you want to delete "${soundData.name}"?`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/sounds/${soundData.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log(`Deleted sound ${soundData.id}`);
      if (onSoundDeleted) {
        onSoundDeleted(soundData.id);
      }
    } catch (error) {
      console.error("Error deleting sound:", error);
    }
  }
  

  // Handle button click: if in delete mode, delete; otherwise, toggle play/stop.
  function handleClick() {
    if (deleteMode) {
      handleDelete();
    } else {
      if (isActive) {
        handleStop();
      } else {
        handleStart();
      }
    }
  }

  return (
    <>
      <div
        {...longPressEvent}
        onClick={handleClick}
        className={`
          relative  rounded-2xl  bg-gradient-to-l from-accent via-accent to-accentoff 
          hover:shadow-2xl transition-all duration-300 
          ease-out transform hover:scale-105 cursor-pointer 
          flex items-center justify-center h-28 w-56 
          text-lg font-bold overflow-hidden select-none  text-base-100
          ${isActive ? "border-4  border-accentoff bg-gradient-to-l from-base-100 via-base-100 to-base-100" : ""}
        `}
      >
                                        <FaRegStopCircle size={40}
            className={` absolute w-56 top-8 
              transform transition-transform z-10 text-accent 
              ${isActive ? "scale-100 " : "scale-0 "}
            `}
            />
                                                    <MdOutlinePlayCircle size={40}
            className={` absolute w-56 
              transform transition-transform z-20 text-base-100 
              ${isActive ? "scale-0 " : "scale-100 "}
            `}
            />
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Show delete icon overlay if delete mode is active */}
          {deleteMode && (
            <div className="absolute top-1 right-1 z-20">
              <FaTrashAlt size={20} className="text-secondary hover:scale-110 hover:text-error active:scale-110 active:text-error" />
            </div>
          )}

          {/* Animated Sound Wave */}
          <div
            className={`
              absolute w-56  h-28 top-5 overflow-hidden duration-0
              transform transition-transform 
              ${isActive ? "scale-100" : "scale-0"}
            `}
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="400"
              height="90"
              viewBox="0 0 400 65"
              className={`
                text-secondary filter drop-shadow-md
                ${isActive ? "moving-wave" : ""}
              `}
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M 0 30 
                c 10 0 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20"
              />
            </svg>
          </div>
          {/* Button Text */}
          <span
            className={`
              text-center absolute  transition-all duration-300 ease-out text-sm line top-3  

              ${isActive ? "scale-0 opacity-0" : "scale-100 opacity-100"}
            `}
          >
            {soundData.name}
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

      {showModal && (
        <SoundEffectsModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          soundData={currentSoundData}
        />
      )}
    </>
  );
}
