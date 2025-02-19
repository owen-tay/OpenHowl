"use client";
import React, { useState, useEffect } from "react";
import { updateSound } from "../../api";
import { useSwipe } from "../hooks/useSwipe";
import { useSentValue } from "../hooks/useSentValue";
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

// Get the API URL from the environment variable
const API_URL = process.env.NEXT_PUBLIC_OPENHOWL_API_URL;

export default function SoundEffectsModal(props) {
  var isOpen = props.isOpen;
  var onClose = props.onClose;
  var soundData = props.soundData;

  if (!isOpen) {
    return null;
  }

  var id = soundData && soundData.id ? soundData.id : "default-id";
  var name = soundData && soundData.name ? soundData.name : "Unnamed Sound";
  var length = soundData && soundData.length ? soundData.length : 10000;
  var initialVolume =
    soundData && soundData.volume !== undefined ? soundData.volume : 70;
  var initialEffects =
    soundData && soundData.effects
      ? soundData.effects
      : {
          echo: false,
          reverb: false,
          lowpass: false,
          highpass: false,
          reverse: false,
          distort: false,
        };
  var initialTrimStart =
    soundData && soundData.trim_start !== undefined ? soundData.trim_start : 0;
  var initialTrimEnd =
    soundData && soundData.trim_end !== undefined ? soundData.trim_end : length;
  var file_path = soundData && soundData.file_path ? soundData.file_path : "";
  var file_format =
    soundData && soundData.file_format ? soundData.file_format : "";
  var playing = soundData && soundData.playing ? soundData.playing : false;
  var soundUrl = soundData && soundData.soundUrl ? soundData.soundUrl : "";

  if (!id || id === "default-id") {
    console.error("SoundEffectsModal: soundData.id is undefined or default");
  }

  const [volume, setVolume] = useState(initialVolume);
  const [trimStart, setTrimStart] = useState(initialTrimStart);
  const [trimEnd, setTrimEnd] = useState(initialTrimEnd);
  const [effects, setEffects] = useState(initialEffects);
  const [isPlaying, setIsPlaying] = useState(false);

  function buildUpdatedSound(updatedFields) {
    if (!updatedFields) {
      updatedFields = {};
    }
    return {
      id: id,
      name: name,
      length: length,
      volume: volume,
      playing: playing,
      effects: effects,
      trim_start: trimStart,
      trim_end: trimEnd,
      file_path: file_path,
      file_format: file_format,
      ...updatedFields,
    };
  }

  var swipeHandlers = useSwipe(function (delta) {
    var newVolume = volume + delta * 0.2;
    if (newVolume < 0) {
      newVolume = 0;
    }
    if (newVolume > 100) {
      newVolume = 100;
    }
    setVolume(Math.round(newVolume));
    console.log("Sound " + id + " volume adjusted to " + newVolume);
  });

  var sentVolume = useSentValue(volume, 1000);
  var sentTrimStart = useSentValue(trimStart, 1000);
  var sentTrimEnd = useSentValue(trimEnd, 1000);

  useEffect(function () {
    console.log("Updating volume for sound " + id + ": " + sentVolume);
    var updatedSound = buildUpdatedSound({ volume: sentVolume });
    updateSound(updatedSound).catch(function (error) {
      console.error("Failed to update volume:", error);
    });
  }, [sentVolume, id]);

  useEffect(function () {
    console.log(
      "Updating trim for sound " +
        id +
        ": Start " +
        sentTrimStart +
        " ms, End " +
        sentTrimEnd +
        " ms"
    );
    var updatedSound = buildUpdatedSound({
      trim_start: sentTrimStart,
      trim_end: sentTrimEnd,
    });
    updateSound(updatedSound).catch(function (error) {
      console.error("Failed to update trim values:", error);
    });
  }, [sentTrimStart, sentTrimEnd, id]);

  function toggleEffect(effectName) {
    var newEffects = Object.assign({}, effects);
    newEffects[effectName] = !effects[effectName];
    setEffects(newEffects);
    var updatedSound = buildUpdatedSound({ effects: newEffects });
    updateSound(updatedSound).catch(function (error) {
      console.error("Failed to update effects:", error);
    });
  }

  function previewSound() {
    (async function () {
      try {
        // Use the API URL from the environment variable
        var audioUrl = `${API_URL}/sounds/preview/${id}`;
        var audioElement = document.getElementById("audio-player-" + id);
        if (!audioElement) {
          audioElement = document.createElement("audio");
          audioElement.id = "audio-player-" + id;
          document.body.appendChild(audioElement);
        }
        if (!audioElement.paused) {
          audioElement.pause();
          audioElement.currentTime = 0;
          setIsPlaying(false);
          console.log("Stopped preview for sound " + id);
          return;
        }
        audioElement.src = audioUrl;
        audioElement.volume = volume / 100;
        audioElement.play();
        setIsPlaying(true);
        console.log("Started preview for sound " + id);
        audioElement.onended = function () {
          setIsPlaying(false);
          console.log("Finished preview for sound " + id + ", resetting button");
        };
      } catch (error) {
        console.error("Error playing preview:", error);
        setIsPlaying(false);
      }
    })();
  }

  return (
    <dialog open className="modal animate-fadeIn">
      <div className="modal-box">
        <h3 className="font-bold text-lg flex items-center gap-2 animate-bounce justify-center">
          <LuPencil size={24} /> {name}
        </h3>
        <div className="py-6">
          <div
            className="flex flex-col items-center text-accent mb-4 hover:scale-110 active:scale-110 ease-in-out duration-100 touch-none select-none hover:text-secondary active:text-secondary"
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
                className={"btn w-12 h-12 p-0 " + (effects.echo ? "btn-accent" : "")}
                onClick={function () {
                  toggleEffect("echo");
                }}
              >
                <LuBarcode size={24} />
              </button>

              <button
                className={"btn w-12 h-12 p-0 " + (effects.lowpass ? "btn-accent" : "")}
                onClick={function () {
                  toggleEffect("lowpass");
                }}
              >
                <LuArrowDown size={24} />
              </button>
              <button
                className={"btn w-12 h-12 p-0 " + (effects.highpass ? "btn-accent" : "")}
                onClick={function () {
                  toggleEffect("highpass");
                }}
              >
                <LuArrowUp size={24} />
              </button>
              <button
                className={"btn w-12 h-12 p-0 " + (effects.reverse ? "btn-accent" : "")}
                onClick={function () {
                  toggleEffect("reverse");
                }}
              >
                <LuRotateCcw size={24} />
              </button>
              <button
                className={"btn w-12 h-12 p-0 " + (effects.distort ? "btn-accent" : "")}
                onClick={function () {
                  toggleEffect("distort");
                }}
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
                  max={length}
                  value={trimStart}
                  onChange={function (e) {
                    var newStart = parseInt(e.target.value, 10);
                    if (newStart <= trimEnd) {
                      setTrimStart(newStart);
                      console.log("Trim start set to " + newStart + " ms");
                    }
                  }}
                  className="range range-accent hover:range-secondary active:range-secondary"
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
                  onChange={function (e) {
                    var newEnd = parseInt(e.target.value, 10);
                    if (newEnd >= trimStart) {
                      setTrimEnd(newEnd);
                      console.log("Trim end set to " + newEnd + " ms");
                    }
                  }}
                  className="range range-accent hover:range-secondary active:range-secondary"
                />
              </label>
            </div>
          </div>
          <div className="mb-4 flex flex-col items-center">
            <p className="font-medium mb-2">Audio Preview</p>
            <div className="mb-4 flex flex-col items-center">
              <button className="btn mb-2" onClick={previewSound}>
                {isPlaying ? <LuPause size={24} /> : <LuPlay size={24} />}
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
