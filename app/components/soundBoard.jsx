// soundBoard.jsx

"use client";
import React, { useEffect, useState } from "react";
import SoundButton from "./soundButton";
import AddSound from "./AddSound";
import { getSounds } from "../../api";

function SoundBoard() {
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // We'll store whether the user is admin in this local state.
  const [isAdmin, setIsAdmin] = useState(false);

  // On mount, check localStorage for "isAdmin"
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin");
    if (adminStatus === "true") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
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

  function handleSoundAdded(newSound) {
    // Just append to local array
    setSounds((prev) => [...prev, newSound]);
  }

  if (loading) {
    return <div>Loading sounds...</div>;
  }
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ margin: "20px" }}>
      {/* Conditionally show the add button only if isAdmin === true */}
      {isAdmin && (
        <div style={{ marginBottom: "20px" }}>
          <AddSound onSoundAdded={handleSoundAdded} />
        </div>
      )}

      {/* Render existing sounds */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          justifyContent: "center",
        }}
      >
        {sounds.map((sound) => (
          <SoundButton key={sound.id} soundData={sound} />
        ))}
      </div>
    </div>
  );
}

export default SoundBoard;
