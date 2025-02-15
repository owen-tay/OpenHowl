// File: components/SoundEffectsModal.jsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSwipe } from "../hooks/useSwipe"; // Adjust the path as needed
import { useSentValue } from "../hooks/useSentValue"; // Our debouncing hook
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

export default function SoundEffectsModal({
  isOpen,
  onClose,
  soundId,
  soundName,      // Received sound name from parent
  soundLength,    // in ms
  soundUrl,       // The sound URL from your JSON DB; if absent, no preview is available.
  initialVolume = 70,
  initialTrimStart = 0,
  initialTrimEnd = soundLength,
}) {
  if (!isOpen) return null;

  const [volume, setVolume] = useState(initialVolume);
  const [trimStart, setTrimStart] = useState(initialTrimStart);
  const [trimEnd, setTrimEnd] = useState(initialTrimEnd);

  // Effects state for toggling various audio effects.
  const [effects, setEffects] = useState({
    echo: false,
    reverb: false,
    lowpass: false,
    highpass: false,
    reverse: false,
    distort: false,
  });

  const toggleEffect = (effectName) => {
    setEffects((prev) => {
      const newEffects = { ...prev, [effectName]: !prev[effectName] };
      console.log(`Effect ${effectName} toggled to ${newEffects[effectName]}`);
      return newEffects;
    });
  };

  // Use the unified hook to track horizontal swipe for volume control.
  const swipeHandlers = useSwipe((delta) => {
    let newVolume = volume + delta * 0.2;
    newVolume = Math.max(0, Math.min(100, newVolume));
    setVolume(Math.round(newVolume));
    console.log(`Sound ${soundId} volume adjusted to ${newVolume}`);
  });

  // Handlers for the trim sliders.
  const handleTrimStartChange = (e) => {
    const newStart = parseInt(e.target.value, 10);
    if (newStart <= trimEnd) {
      setTrimStart(newStart);
      console.log(`Trim start set to ${newStart} ms`);
    }
  };

  const handleTrimEndChange = (e) => {
    const newEnd = parseInt(e.target.value, 10);
    if (newEnd >= trimStart) {
      setTrimEnd(newEnd);
      console.log(`Trim end set to ${newEnd} ms`);
    }
  };

  // Debounced (sent) values.
  const sentVolume = useSentValue(volume, 1000);
  const sentTrimStart = useSentValue(trimStart, 1000);
  const sentTrimEnd = useSentValue(trimEnd, 1000);

  useEffect(() => {
    console.log(`Updating volume for sound ${soundId}: ${sentVolume}`);
    // TODO: Replace with an actual API call.
  }, [sentVolume, soundId]);

  useEffect(() => {
    console.log(
      `Updating trim for sound ${soundId}: Start ${sentTrimStart} ms, End ${sentTrimEnd} ms`
    );
    // TODO: Replace with an actual API call.
  }, [sentTrimStart, sentTrimEnd, soundId]);

  // Audio preview functionality.
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePreview = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <dialog open className="modal animate-fadeIn">
      <div className="modal-box">
        <h3 className="font-bold text-lg flex items-center gap-2 animate-bounce">
          <LuPencil size={24} />
          {soundName}
        </h3>
        <div className="py-6">
          <div
            className="flex flex-col items-center text-secondary mb-4 hover:scale-110 active:scale-110 ease-in-out duration-100 touch-none select-none hover:text-primary active:text-primary"
            {...swipeHandlers}
            style={{ touchAction: "none" }}
          >
            <div
              className="radial-progress"
              style={{ "--value": volume }}
              role="progressbar"
            >
              {volume}%
            </div>
            <span className="text-sm mt-1">
              Drag right/left to adjust volume
            </span>
          </div>

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

          <div className="mb-4">
            <p className="font-medium mb-2">Audio Trim</p>
            <div className="mb-2">
              <label className="block text-sm">
                Start: {trimStart} ms
                <input
                  type="range"
                  min="0"
                  max={soundLength}
                  value={trimStart}
                  onChange={handleTrimStartChange}
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
                  max={soundLength}
                  value={trimEnd}
                  onChange={handleTrimEndChange}
                  className="range range-primary"
                />
              </label>
            </div>
          </div>

          <div className="mb-4 flex flex-col items-center">
            <p className="font-medium mb-2">Audio Preview</p>
            {soundUrl ? (
              <>
                <button className="btn mb-2" onClick={togglePreview}>
                  {isPlaying ? (
                    <LuPause size={24} className="animate-spin" />
                  ) : (
                    <LuPlay size={24} className="animate-bounce" />
                  )}
                </button>
                <audio
                  ref={audioRef}
                  src={soundUrl}
                  onEnded={() => setIsPlaying(false)}
                />
              </>
            ) : (
              <p className="text-sm">Cannot find sound URL to Preview. Please check the Json file or create the sound again.</p>
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop backdrop-blur-md">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
