"use client";
import React, { useState, useEffect, useRef } from "react";
import { updateSound } from "../../api";
import { useSwipe } from "../hooks/useSwipe";       // Custom hook for swipe events
import { useSentValue } from "../hooks/useSentValue"; // Custom hook for debouncing
import {
  LuBarcode,
  LuWaves,
  LuArrowDown,
  LuArrowUp,
  LuRotateCcw,
  LuZap,
  LuPencil,
  LuPlay,
  LuPause,
} from "react-icons/lu";

export default function SoundEffectsModal({ isOpen, onClose, soundData }) {
  if (!isOpen) return null;

  // Destructure fields from soundData, with defaults if needed.
  const {
    id = "default-id",
    name = "Unnamed Sound",
    length = 10000,
    volume: initialVolume = 70,
    effects: initialEffects = {
      echo: false,
      reverb: false,
      lowpass: false,
      highpass: false,
      reverse: false,
      distort: false,
    },
    trim_start: initialTrimStart = 0,
    trim_end: initialTrimEnd = length,
    file_path = "",
    file_format = "",
    playing = false,
    soundUrl = "",
  } = soundData || {};

  if (!id || id === "default-id") {
    console.error("SoundEffectsModal: soundData.id is undefined or default");
  }

  // Initialize local state from the destructured fields.
  const [volume, setVolume] = useState(initialVolume);
  const [trimStart, setTrimStart] = useState(initialTrimStart);
  const [trimEnd, setTrimEnd] = useState(initialTrimEnd);
  const [effects, setEffects] = useState(initialEffects);
  // We'll keep the original playing state from soundData.
  const [isPlaying, setIsPlaying] = useState(false);

  // Function to build the update payload.
  const buildUpdatedSound = (updatedFields = {}) => ({
    id,
    name,
    length,
    volume,
    playing,
    effects,
    trim_start: trimStart,
    trim_end: trimEnd,
    file_path,
    file_format,
    ...updatedFields,
  });

  // Set up swipe handler for volume control.
  const swipeHandlers = useSwipe((delta) => {
    let newVolume = volume + delta * 0.2;
    newVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(Math.round(newVolume));
    console.log(`Sound ${id} volume adjusted to ${newVolume}`);
  });

  // Debounce volume and trim changes.
  const sentVolume = useSentValue(volume, 1000);
  const sentTrimStart = useSentValue(trimStart, 1000);
  const sentTrimEnd = useSentValue(trimEnd, 1000);

  // When the debounced volume changes, update the backend.
  useEffect(() => {
    console.log(`Updating volume for sound ${id}: ${sentVolume}`);
    const updatedSound = buildUpdatedSound({ volume: sentVolume });
    updateSound(updatedSound).catch((error) =>
      console.error("Failed to update volume:", error)
    );
  }, [sentVolume, id]);

  // When the debounced trim values change, update the backend.
  useEffect(() => {
    console.log(
      `Updating trim for sound ${id}: Start ${sentTrimStart} ms, End ${sentTrimEnd} ms`
    );
    const updatedSound = buildUpdatedSound({
      trim_start: sentTrimStart,
      trim_end: sentTrimEnd,
    });
    updateSound(updatedSound).catch((error) =>
      console.error("Failed to update trim values:", error)
    );
  }, [sentTrimStart, sentTrimEnd, id]);

  // Toggle an effect and update the backend immediately.
  const toggleEffect = async (effectName) => {
    const newEffects = { ...effects, [effectName]: !effects[effectName] };
    setEffects(newEffects);
    const updatedSound = buildUpdatedSound({ effects: newEffects });
    try {
      await updateSound(updatedSound);
    } catch (error) {
      console.error("Failed to update effects:", error);
    }
  };


  async function previewSound() {
    try {
      const audioUrl = `http://localhost:8000/sounds/preview/${id}`;
      
      // Ensure there's an audio element in the DOM
      let audioElement = document.getElementById(`audio-player-${id}`);
      if (!audioElement) {
        audioElement = document.createElement("audio");
        audioElement.id = `audio-player-${id}`;
        document.body.appendChild(audioElement); // Append to the document if not present
      }
  
      // Check if it's already playing
      if (!audioElement.paused) {
        audioElement.pause();
        audioElement.currentTime = 0; // Reset playback position
        setIsPlaying(false);
        console.log(`Stopped preview for sound ${id}`);
        return;
      }
  
      // Otherwise, play the sound
      audioElement.src = audioUrl;  // Set new source to API-generated sound
      audioElement.volume = volume / 100; // Apply volume control
      audioElement.play();  // Play the sound
  
      setIsPlaying(true); // Mark as playing
      console.log(`Started preview for sound ${id}`);
  
      // Handle when playback finishes
      audioElement.onended = () => {
        setIsPlaying(false);
        console.log(`Finished preview for sound ${id}, resetting button`);
      };
  
    } catch (error) {
      console.error("Error playing preview:", error);
      setIsPlaying(false); // Ensure reset on failure
    }
  }
  

  return (
    <dialog open className="modal animate-fadeIn">
      <div className="modal-box">
        <h3 className="font-bold text-lg flex items-center gap-2 animate-bounce">
          <LuPencil size={24} /> {name}
        </h3>
        <div className="py-6">
          {/* Volume Control Section */}
          <div
            className="flex flex-col items-center text-secondary mb-4 hover:scale-110 active:scale-110 ease-in-out duration-100 touch-none select-none hover:text-primary active:text-primary"
            {...swipeHandlers}
            style={{ touchAction: "none" }}
          >
            <div className="radial-progress" style={{ "--value": volume }} role="progressbar">
              {volume}%
            </div>
            <span className="text-sm mt-1">Drag right/left to adjust volume</span>
          </div>

          {/* Audio Effects Section */}
          <div className="mb-4">
            <p className="font-medium mb-2">Audio Effects</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                className={`btn w-12 h-12 p-0 ${effects.echo ? "btn-primary" : ""}`}
                onClick={() => toggleEffect("echo")}
              >
                <LuBarcode size={24} />
              </button>
              <button
                className={`btn w-12 h-12 p-0 ${effects.reverb ? "btn-primary" : ""}`}
                onClick={() => toggleEffect("reverb")}
              >
                <LuWaves size={24} />
              </button>
              <button
                className={`btn w-12 h-12 p-0 ${effects.lowpass ? "btn-primary" : ""}`}
                onClick={() => toggleEffect("lowpass")}
              >
                <LuArrowDown size={24} />
              </button>
              <button
                className={`btn w-12 h-12 p-0 ${effects.highpass ? "btn-primary" : ""}`}
                onClick={() => toggleEffect("highpass")}
              >
                <LuArrowUp size={24} />
              </button>
              <button
                className={`btn w-12 h-12 p-0 ${effects.reverse ? "btn-primary" : ""}`}
                onClick={() => toggleEffect("reverse")}
              >
                <LuRotateCcw size={24} />
              </button>
              <button
                className={`btn w-12 h-12 p-0 ${effects.distort ? "btn-primary" : ""}`}
                onClick={() => toggleEffect("distort")}
              >
                <LuZap size={24} />
              </button>
            </div>
          </div>

          {/* Audio Trim Section */}
          <div className="mb-4">
            <p className="font-medium mb-2">Audio Trim</p>
            <div className="mb-2">
              <label className="block text-sm">
                Start: {trimStart} ms
                <input
                  type="range"
                  min="0"
                  max={length}
                  value={trimStart}
                  onChange={(e) => {
                    const newStart = parseInt(e.target.value, 10);
                    if (newStart <= trimEnd) {
                      setTrimStart(newStart);
                      console.log(`Trim start set to ${newStart} ms`);
                    }
                  }}
                  className="range range-secondary"
                />
              </label>
            </div>
            <div className="mb-2">
              <label className="block text-sm">
                End: {trimEnd} ms
                <input
                  type="range"
                  min="0"
                  max={length}
                  value={trimEnd}
                  onChange={(e) => {
                    const newEnd = parseInt(e.target.value, 10);
                    if (newEnd >= trimStart) {
                      setTrimEnd(newEnd);
                      console.log(`Trim end set to ${newEnd} ms`);
                    }
                  }}
                  className="range range-primary"
                />
              </label>
            </div>
          </div>

          {/* Audio Preview Section */}
          <div className="mb-4 flex flex-col items-center">
            <p className="font-medium mb-2">Audio Preview</p>
{/* Always show the preview button, even if there's no direct soundUrl */}
<div className="mb-4 flex flex-col items-center">
<button className="btn mb-2" onClick={previewSound}>
  {isPlaying ? (
    <LuPause size={24} className="animate-spin" />
  ) : (
    <LuPlay size={24} className="animate-bounce" />
  )}
</button>

</div>

          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop backdrop-blur-md">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
