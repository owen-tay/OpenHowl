"use client";
import React, { useState, useEffect, useRef } from "react";
import SoundEffectsModal from "./SoundEffectsModal";
import { useLongPress } from "../hooks/useLongPress";
import { updateSound } from "../../api";
import { FaTrashAlt } from "react-icons/fa";
import { FaRegStopCircle } from "react-icons/fa";
import { MdOutlinePlayCircle } from "react-icons/md";

const API_URL = process.env.NEXT_PUBLIC_OPENHOWL_API_URL;
const DISCORD_API_BASE = `${API_URL}/discord`;

function sendDiscordPlay(soundId) {
  return (async function () {
    try {
      var response = await fetch(`${DISCORD_API_BASE}/play/${soundId}`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("HTTP error! status: " + response.status);
      }
      var data = await response.json();
      console.log("Discord play response:", data);
      return true;
    } catch (error) {
      console.error("Error sending Discord play command:", error);
      return false;
    }
  })();
}

function sendDiscordStop() {
  return (async function () {
    try {
      var response = await fetch(`${DISCORD_API_BASE}/stop`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("HTTP error! status: " + response.status);
      }
      var data = await response.json();
      console.log("Discord stop response:", data);
      return true;
    } catch (error) {
      console.error("Error sending Discord stop command:", error);
      return false;
    }
  })();
}

export default function SoundButton(props) {
  var soundData = props.soundData;
  var onStartPlaying = props.onStartPlaying;
  var onStopPlaying = props.onStopPlaying;
  var isCurrentlyPlaying = props.isCurrentlyPlaying;
  var deleteMode = props.deleteMode;
  var onSoundDeleted = props.onSoundDeleted;

  const [isActive, setIsActive] = useState(
    soundData && soundData.playing ? soundData.playing : false
  );
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSoundData, setCurrentSoundData] = useState(soundData);
  const stopTimerRef = useRef(null);
  
  // Get the color from soundData, or use a default if not present
  const buttonColor = soundData && soundData.color ? soundData.color : "#65C3C8";

  var longPressEvent = useLongPress(
    function () {
      (async function () {
        try {
          var response = await fetch(`${API_URL}/sounds`);
          var allSounds = await response.json();
          var latestSoundData = allSounds.find(function (s) {
            return s.id === soundData.id;
          });
          if (latestSoundData) {
            setCurrentSoundData(latestSoundData);
          } else {
            console.error("Sound not found in backend");
          }
        } catch (error) {
          console.error("Error fetching latest sound data:", error);
        }
      })();
      setShowModal(true);
    },
    500
  );

  useEffect(function () {
    setIsActive(isCurrentlyPlaying);
  }, [isCurrentlyPlaying]);

  useEffect(function () {
    setIsActive(soundData && soundData.playing ? soundData.playing : false);
  }, [soundData && soundData.playing]);

  async function handleStart() {
    console.log("Starting sound " + soundData.id + ": " + soundData.name);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (onStartPlaying) {
      onStartPlaying(soundData.id);
    }
    var success = await sendDiscordPlay(soundData.id);
    if (success) {
      setIsActive(true);
      setIsPlaying(true);
      try {
        var response = await fetch(`${API_URL}/sounds`);
        var allSounds = await response.json();
        var currentSound = allSounds.find(function (s) {
          return s.id === soundData.id;
        });
        if (currentSound) {
          var updatedSound = Object.assign({}, currentSound, { playing: true });
          await updateSound(updatedSound);
        } else {
          console.error("Sound not found in backend");
        }
      } catch (error) {
        console.error("Error updating playing status:", error);
      }
      var effectiveDuration = 0;
      if (
        typeof soundData.trim_start === "number" &&
        typeof soundData.trim_end === "number"
      ) {
        effectiveDuration = soundData.trim_end - soundData.trim_start;
      } else {
        effectiveDuration = soundData.length;
      }
      stopTimerRef.current = setTimeout(function () {
        handleStop();
      }, effectiveDuration);
    }
  }

  async function handleStop() {
    console.log("Stopping sound " + soundData.id + ": " + soundData.name);
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    var success = await sendDiscordStop();
    if (success) {
      setIsActive(false);
      setIsPlaying(false);
      if (onStopPlaying) {
        onStopPlaying();
      }
      try {
        var response = await fetch(`${API_URL}/sounds`);
        var allSounds = await response.json();
        var currentSound = allSounds.find(function (s) {
          return s.id === soundData.id;
        });
        if (currentSound) {
          var updatedSound = Object.assign({}, currentSound, {
            playing: false,
          });
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
    var confirmDelete = window.confirm(
      'Are you sure you want to delete "' + soundData.name + '"?'
    );
    if (!confirmDelete) {
      return;
    }
    try {
      var response = await fetch(`${API_URL}/sounds/${soundData.id}`, {
        method: "DELETE",
        headers: {
          Authorization:
            "Bearer " + (localStorage.getItem("authToken") || ""),
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("HTTP error! status: " + response.status);
      }
      console.log("Deleted sound " + soundData.id);
      if (onSoundDeleted) {
        onSoundDeleted(soundData.id);
      }
    } catch (error) {
      console.error("Error deleting sound:", error);
    }
  }

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

  // Generate color for the active state (a darker version of the button color)
  const getOffColor = (color) => {
    // Helper function to darken a hex color
    const darkenColor = (hex) => {
      // Remove # if present
      hex = hex.replace('#', '');
      let r = parseInt(hex.substr(0, 2), 16);
      let g = parseInt(hex.substr(2, 2), 16);
      let b = parseInt(hex.substr(4, 2), 16);
      
      // Darken each component by 20%
      r = Math.max(0, Math.floor(r * 0.8));
      g = Math.max(0, Math.floor(g * 0.8));
      b = Math.max(0, Math.floor(b * 0.8));
      
      // Convert back to hex
      return '#' + 
        ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1);
    };
    
    return darkenColor(color);
  };

  return (
    <>
      <div
        {...longPressEvent}
        onClick={handleClick}
        className={
          "relative rounded-2xl hover:shadow-2xl transition-all duration-300 ease-out transform hover:scale-105 cursor-pointer flex items-center justify-center h-28 w-56 text-lg font-bold overflow-hidden select-none text-base-100 " +
          (isActive
            ? "border-4 bg-gradient-to-l from-base-100 via-base-100 to-base-100"
            : "")
        }
        style={{
          backgroundColor: isActive ? 'transparent' : buttonColor,
          borderColor: isActive ? getOffColor(buttonColor) : 'transparent'
        }}
      >
        <FaRegStopCircle
          size={40}
          className={
            "absolute w-56 top-8 transform transition-transform z-10 " +
            (isActive ? "scale-100" : "scale-0")
          }
          style={{ color: buttonColor }}
        />
        <MdOutlinePlayCircle
          size={40}
          className={
            "absolute w-56 transform transition-transform z-20 text-base-100 " +
            (isActive ? "scale-0" : "scale-100")
          }
        />
        <div className="relative flex items-center justify-center w-full h-full">
          {deleteMode && (
            <div className="absolute top-1 right-1 z-20">
              <FaTrashAlt
                size={20}
                className="text-secondary hover:scale-110 hover:text-error active:scale-110 active:text-error"
              />
            </div>
          )}
          <div
            className={
              "absolute w-56 h-28 top-5 overflow-hidden duration-0 transform transition-transform " +
              (isActive ? "scale-100" : "scale-0")
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="400"
              height="90"
              viewBox="0 0 400 65"
              className={
                "filter drop-shadow-md " +
                (isActive ? "moving-wave" : "")
              }
              style={{ color: buttonColor }}
            >
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M 0 30 
                c 10 0 10 -20 20 -20 
                s 10 20 20 20 
                s 10 -20 20 -20 
                s 10 20 20 20 
                s 10 -20 20 -20 
                s 10 20 20 20 
                s 10 -20 20 -20 
                s 10 20 20 20 
                s 10 -20 20 -20 
                s 10 20 20 20 
                s 10 -20 20 -20
                s 10 20 20 20 
                s 10 -20 20 -20
                s 10 20 20 20 
                s 10 -20 20 -20
                s 10 20 20 20 
                s 10 -20 20 -20"
              />
            </svg>
          </div>
          <span
            className={
              "text-center absolute transition-all duration-300 ease-out text-sm line top-3 " +
              (isActive ? "scale-0 opacity-0" : "scale-100 opacity-100")
            }
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
          onClose={function () {
            setShowModal(false);
          }}
          soundData={currentSoundData}
        />
      )}
    </>
  );
}