"use client";
import React, { useState, useEffect } from "react";
import SoundEffectsModal from "./SoundEffectsModal";
import { useLongPress } from "../hooks/useLongPress";
import { updateSound } from "../../api";

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

export default function SoundButton({ soundData }) {
  const [isActive, setIsActive] = useState(soundData?.playing || false);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Long press handler for effects modal
  const longPressEvent = useLongPress(() => {
    setShowModal(true);
  }, 500);

  // Update local state when soundData changes
  useEffect(() => {
    setIsActive(soundData?.playing || false);
  }, [soundData?.playing]);

  // Handle starting playback
  async function handleStart() {
    console.log(`Starting sound ${soundData.id}: ${soundData.name}`);
    
    const success = await sendDiscordPlay(soundData.id);
    
    if (success) {
      setIsActive(true);
      setIsPlaying(true);
      
      // Update the sound's playing state in the backend
      const updatedSound = { ...soundData, playing: true };
      try {
        await updateSound(updatedSound);
      } catch (error) {
        console.error("Error updating playing status:", error);
      }

      // Set up automatic stop after sound length
      setTimeout(() => {
        handleStop();
      }, soundData.length);
    }
  }

  // Handle stopping playback
  async function handleStop() {
    console.log(`Stopping sound ${soundData.id}: ${soundData.name}`);
    
    const success = await sendDiscordStop();
    
    if (success) {
      setIsActive(false);
      setIsPlaying(false);
      
      // Update the sound's playing state in the backend
      const updatedSound = { ...soundData, playing: false };
      try {
        await updateSound(updatedSound);
      } catch (error) {
        console.error("Error updating playing status:", error);
      }
    }
  }

  // Handle button click
  function handleClick() {
    if (isActive) {
      handleStop();
    } else {
      handleStart();
    }
  }

  return (
    <>
      <div
        {...longPressEvent}
        onClick={handleClick}
        className={`
          relative border-2 rounded-2xl shadow-md 
          hover:shadow-2xl transition-all duration-300 
          ease-out transform hover:scale-105 cursor-pointer 
          flex items-center justify-center h-20 w-40 
          text-lg font-bold overflow-hidden select-none
          ${isActive ? "ring-2 ring-secondary" : ""}
        `}
      >
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Animated Sound Wave */}
          <div
            className={`
              absolute w-24 h-12 top-5 overflow-hidden 
              transform transition-transform duration-300 ease-out
              ${isActive ? "scale-100" : "scale-0"}
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="60"
              viewBox="0 0 200 60"
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
                d="M 0 30 c 10 0 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                   s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20"
              />
            </svg>
          </div>
          {/* Button Text */}
          <span
            className={`
              relative z-10 transition-all duration-300 ease-out transform
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
          soundData={soundData}
        />
      )}
    </>
  );
}