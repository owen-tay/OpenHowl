"use client";
import React, { useState, useEffect } from "react";

export default function SoundButton({
  soundId,
  soundName = "SOUND NAME",
  soundLength = 2000, 
}) {
  const [isActive, setIsActive] = useState(false);

  const handleStart = () => {
    console.log(`Starting sound ${soundId}: ${soundName}`);
    // TODO: Send a POST request to backend to start the sound.
    setIsActive(true);
  };

  const handleStop = () => {
    console.log(`Stopping sound ${soundId}: ${soundName}`);
    // TODO: Send a POST request to backend to stop the sound.
    setIsActive(false);
  };

  const handleClick = () => {
    if (isActive) {
      handleStop();
    } else {
      handleStart();
    }
  };

  useEffect(() => {
    let timer;
    if (isActive) {
      timer = setTimeout(() => {
        console.log(`Sound ${soundId} finished playing`);
        setIsActive(false);
      }, soundLength);
    }
    return () => timer && clearTimeout(timer);
  }, [isActive, soundLength, soundId]);

  return (
    <div
      className={`relative border-2 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 ease-out transform hover:scale-105 cursor-pointer flex items-center justify-center h-20 w-40 text-lg font-bold overflow-hidden  ${
        isActive ? "ring-2 ring-secondary" : ""
      }`}
      onClick={handleClick}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Animated Sound Wave */}
        <div
          className={`absolute w-24 h-12 top-5 overflow-hidden transform transition-transform duration-300 ease-out ${
            isActive ? "scale-100" : "scale-0"
          }`}
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
                 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                 s 10 20 20 20 s 10 -20 20 -20"
            />
          </svg>
        </div>

        {/* Button Text */}
        <span
          className={`relative z-10 transition-all duration-300 ease-out transform ${
            isActive ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
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
  );
}
