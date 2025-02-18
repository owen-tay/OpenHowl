"use client";
import React, { useEffect, useState } from "react";
import SoundButton from "./soundButton";
import AddSound from "./AddSound";
import DeleteSound from "./DeleteSound";
import { getSounds } from "../../api";
import Loading from "./Loading";
import { MdErrorOutline } from "react-icons/md";
import { FaTrash } from "react-icons/fa"; // import trash icon

function SoundBoard() {
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  // On mount, check localStorage for "isAdmin"
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin");
    setIsAdmin(adminStatus === "true");
  }, []);

  useEffect(() => {
    fetchAllSounds();
  }, []);

  async function fetchAllSounds() {
    try {
      setLoading(true);
      const data = await getSounds();
      setSounds(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Function to handle when a sound starts playing
  const handleSoundPlaying = (soundId) => {
    if (currentlyPlayingId && currentlyPlayingId !== soundId) {
      // Stop the previously playing sound
      // (The SoundButton components call the Discord stop endpoint, so here we simply update state)
    }
    setCurrentlyPlayingId(soundId);
  };

  // Function to handle when a sound stops playing
  const handleSoundStopped = () => {
    setCurrentlyPlayingId(null);
  };

  // Function to handle deletion of a sound: remove it from the list
  const handleSoundDeleted = (soundId) => {
    setSounds((prevSounds) => prevSounds.filter((sound) => sound.id !== soundId));
    if (currentlyPlayingId === soundId) {
      setCurrentlyPlayingId(null);
    }
  };

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
        {/* Show add button only for admin */}
        {isAdmin && (
          <>
            <AddSound onSoundAdded={(newSound) => setSounds((prev) => [...prev, newSound])} />
            <DeleteSound deleteMode={deleteMode} setDeleteMode={setDeleteMode} />
          </>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          justifyContent: "center",
        }}
      >
        {sounds.map((sound) => (
          <SoundButton
            key={sound.id}
            soundData={sound}
            onStartPlaying={handleSoundPlaying}
            onStopPlaying={handleSoundStopped}
            isCurrentlyPlaying={currentlyPlayingId === sound.id}
            deleteMode={deleteMode}
            onSoundDeleted={handleSoundDeleted}
          />
        ))}
      </div>
    </div>
  );
}

export default SoundBoard;
