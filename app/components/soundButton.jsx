"use client";
import React, { useState, useEffect } from "react";
import SoundEffectsModal from "./SoundEffectsModal";
import { useLongPress } from "../hooks/useLongPress";

export default function SoundButton({
  soundId,
  soundName = "SOUND NAME",
  soundLength = 10000, // in ms
}) {
  var [isActive, setIsActive] = useState(false);
  var [showModal, setShowModal] = useState(false);

  var longPressEvent = useLongPress(function () {
    console.log("Long press detected on sound " + soundId);
    setShowModal(true);
  }, 500);

  // Handler for starting the sound.
  function handleStart() {
    console.log("Starting sound " + soundId + ": " + soundName);
    // TODO: Send a POST request to the backend to start the sound.
    setIsActive(true);
  }

  // Handler for stopping the sound.
  function handleStop() {
    console.log("Stopping sound " + soundId + ": " + soundName);
    // TODO: Send a POST request to the backend to stop the sound.
    setIsActive(false);
  }

  // Toggle between starting and stopping the sound.
  function handleClick() {
    if (isActive) {
      handleStop();
    } else {
      handleStart();
    }
  }

  // Automatically stop the sound after its duration.
  useEffect(function () {
    var timer;
    if (isActive) {
      timer = setTimeout(function () {
        console.log("Sound " + soundId + " finished playing");
        setIsActive(false);
      }, soundLength);
    }
    return function () {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isActive, soundLength, soundId]);

  
  /*
This is for websockets. I will deal with this later.


  useEffect(function () {
    var ws = new WebSocket("ws://your-backend-websocket-url");
    ws.onmessage = function (event) {
      var data = JSON.parse(event.data);
      // Check if the message corresponds to this sound.
      if (data.soundId === soundId) {
        // For example, update isActive based on the backend's status.
        setIsActive(data.isPlaying);
      }
    };
    return function () {
      ws.close();
    };
  }, [soundId]);
  */

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
                   s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 s 10 20 20 20 s 10 -20 20 -20 
                   s 10 20 20 20 s 10 -20 20 -20"
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
          onClose={function () {
            setShowModal(false);
          }}
          soundId={soundId}
          // pass in the current trimmed start/end values to json idk
          initialTrimStart={0}
          initialTrimEnd={Math.floor(soundLength / 1000)}
        />
      )}
    </>
  );
}
