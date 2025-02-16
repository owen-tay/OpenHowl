// SoundEffectsModal.jsx
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
  LuPause
} from "react-icons/lu";

function SoundEffectsModal({ isOpen, onClose, soundData }) {
  // Return null if the modal is not open.
  if (!isOpen) {
    return null;
  }

  // Initialize local state using values from soundData.
  const [volume, setVolume] = useState(soundData.volume);
  const [trimStart, setTrimStart] = useState(soundData.trim_start);
  const [trimEnd, setTrimEnd] = useState(soundData.trim_end);
  const [effects, setEffects] = useState(soundData.effects);
  const [isPlaying, setIsPlaying] = useState(false);

  // Set up swipe handlers for adjusting the volume.
  const swipeHandlers = useSwipe((delta) => {
    let newVolume = volume + delta * 0.2;
    if (newVolume < 0) {
      newVolume = 0;
    }
    if (newVolume > 100) {
      newVolume = 100;
    }
    setVolume(Math.round(newVolume));
  });

  // Use custom hooks to debounce volume and trim changes.
  const debouncedVolume = useSentValue(volume, 1000);
  const debouncedTrimStart = useSentValue(trimStart, 1000);
  const debouncedTrimEnd = useSentValue(trimEnd, 1000);

  // When the debounced volume changes, update the backend.
  useEffect(() => {
    async function updateVolume() {
      const updatedSound = { ...soundData, volume: debouncedVolume };
      try {
        await updateSound(updatedSound);
      } catch (error) {
        console.error("Failed to update volume:", error);
      }
    }
    updateVolume();
  }, [debouncedVolume, soundData]);

  // When the debounced trim values change, update the backend.
  useEffect(() => {
    async function updateTrim() {
      const updatedSound = {
        ...soundData,
        trim_start: debouncedTrimStart,
        trim_end: debouncedTrimEnd
      };
      try {
        await updateSound(updatedSound);
      } catch (error) {
        console.error("Failed to update trim values:", error);
      }
    }
    updateTrim();
  }, [debouncedTrimStart, debouncedTrimEnd, soundData]);

  // Toggle an effect and update the backend immediately.
  const toggleEffect = async (effectName) => {
    const newEffects = { ...effects, [effectName]: !effects[effectName] };
    setEffects(newEffects);
    const updatedSound = { ...soundData, effects: newEffects };
    try {
      await updateSound(updatedSound);
    } catch (error) {
      console.error("Failed to update effects:", error);
    }
  };

  // Audio preview functionality using a ref.
  const audioRef = useRef(null);
  const togglePreview = () => {
    if (!audioRef.current) {
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // The modal structure is kept simple and clear.
  return (
    <dialog
      open
      style={{
        padding: "20px",
        border: "none",
        borderRadius: "10px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
      }}
    >
      <div>
        <h3 style={{
          fontWeight: "bold",
          fontSize: "20px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center"
        }}>
          <LuPencil style={{ marginRight: "8px" }} /> {soundData.name}
        </h3>
        <div style={{ marginBottom: "20px" }}>
          {/* Volume Control Section */}
          <div
            {...swipeHandlers}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "10px"
            }}
          >
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              backgroundColor: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "5px"
            }}>
              {volume}%
            </div>
            <div style={{ fontSize: "12px" }}>Drag left/right to adjust volume</div>
          </div>

          {/* Audio Effects Section */}
          <div style={{ marginBottom: "20px" }}>
            <p>Audio Effects</p>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              <button
                onClick={() => toggleEffect("echo")}
                style={{
                  backgroundColor: effects.echo ? "#0070f3" : "#ccc",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LuBarcode />
              </button>
              <button
                onClick={() => toggleEffect("reverb")}
                style={{
                  backgroundColor: effects.reverb ? "#0070f3" : "#ccc",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LuWaves />
              </button>
              <button
                onClick={() => toggleEffect("lowpass")}
                style={{
                  backgroundColor: effects.lowpass ? "#0070f3" : "#ccc",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LuArrowDown />
              </button>
              <button
                onClick={() => toggleEffect("highpass")}
                style={{
                  backgroundColor: effects.highpass ? "#0070f3" : "#ccc",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LuArrowUp />
              </button>
              <button
                onClick={() => toggleEffect("reverse")}
                style={{
                  backgroundColor: effects.reverse ? "#0070f3" : "#ccc",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LuRotateCcw />
              </button>
              <button
                onClick={() => toggleEffect("distort")}
                style={{
                  backgroundColor: effects.distort ? "#0070f3" : "#ccc",
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <LuZap />
              </button>
            </div>
          </div>

          {/* Audio Trim Section */}
          <div style={{ marginBottom: "20px" }}>
            <p>Audio Trim</p>
            <div>
              <label>
                Start: {trimStart} ms<br />
                <input
                  type="range"
                  min="0"
                  max={soundData.length}
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseInt(e.target.value, 10))}
                />
              </label>
            </div>
            <div>
              <label>
                End: {trimEnd} ms<br />
                <input
                  type="range"
                  min="0"
                  max={soundData.length}
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(parseInt(e.target.value, 10))}
                />
              </label>
            </div>
          </div>

          {/* Audio Preview Section */}
          <div style={{ marginBottom: "20px" }}>
            <p>Audio Preview</p>
            {soundData.file_path ? (
              <div>
                <button onClick={togglePreview} style={{
                  padding: "10px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#0070f3",
                  color: "#fff",
                  cursor: "pointer"
                }}>
                  {isPlaying ? <LuPause /> : <LuPlay />}
                </button>
                <audio ref={audioRef} src={soundData.file_path} onEnded={() => setIsPlaying(false)} />
              </div>
            ) : (
              <p>No sound file available for preview.</p>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{
          padding: "10px 20px",
          borderRadius: "5px",
          border: "none",
          backgroundColor: "#ccc",
          cursor: "pointer"
        }}>
          Close
        </button>
      </div>
    </dialog>
  );
}

export default SoundEffectsModal;
