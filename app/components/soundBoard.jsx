"use client";
import React, { useEffect, useState } from "react";
import SoundButton from "./soundButton";
import AddSound from "./AddSound";
import DeleteSound from "./DeleteSound";
import { getSounds } from "../../api";
import Loading from "./Loading";
import { MdErrorOutline } from "react-icons/md";
import useSSE from "../hooks/useSSE";

function SoundBoard() {
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  const sseEvent = useSSE(process.env.NEXT_PUBLIC_OPENHOWL_API_URL + "/events");

  useEffect(function () {
    if (sseEvent) {
      if (sseEvent.state === "playing") {
        setCurrentlyPlayingId(sseEvent.sound_id);
      } else if (sseEvent.state === "stopped") {
        setCurrentlyPlayingId(null);
      }
    }
  }, [sseEvent]);

  useEffect(function () {
    var adminStatus = localStorage.getItem("isAdmin");
    setIsAdmin(adminStatus === "true");
  }, []);

  useEffect(function () {
    fetchAllSounds();
  }, []);

  function fetchAllSounds() {
    (async function () {
      try {
        setLoading(true);
        var data = await getSounds();
        setSounds(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }

  function handleSoundPlaying(soundId) {
    if (currentlyPlayingId && currentlyPlayingId !== soundId) {
      (async function () {
        try {
          await fetch(
            process.env.NEXT_PUBLIC_OPENHOWL_API_URL + "/discord/stop",
            { method: "POST" }
          );
        } catch (err) {
          console.error("Error stopping currently playing sound:", err);
        }
      })();
    }
    setCurrentlyPlayingId(soundId);
  }

  function handleSoundStopped() {
    setCurrentlyPlayingId(null);
  }

  function handleSoundDeleted(soundId) {
    setSounds(function (prevSounds) {
      return prevSounds.filter(function (sound) {
        return sound.id !== soundId;
      });
    });
    if (currentlyPlayingId === soundId) {
      setCurrentlyPlayingId(null);
    }
  }

  if (loading) {
    return <Loading />;
  }
  if (error) {
    return (
      <div className="flex flex-col my-10 justify-center items-center gap-2">
        <MdErrorOutline size={40} />
        {error}
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex justify-center gap-2 m-6">
        {isAdmin && (
          <>
            <AddSound
              onSoundAdded={function (newSound) {
                setSounds(function (prev) {
                  return prev.concat(newSound);
                });
              }}
            />
            <DeleteSound deleteMode={deleteMode} setDeleteMode={setDeleteMode} />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-5 justify-center">
        {sounds.map(function (sound) {
          return (
            <SoundButton
              key={sound.id}
              soundData={sound}
              onStartPlaying={handleSoundPlaying}
              onStopPlaying={handleSoundStopped}
              isCurrentlyPlaying={currentlyPlayingId === sound.id}
              deleteMode={deleteMode}
              onSoundDeleted={handleSoundDeleted}
            />
          );
        })}
      </div>
    </div>
  );
}

export default SoundBoard;
