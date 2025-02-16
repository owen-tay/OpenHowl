// soundBoard.jsx
"use client";
import React, { useEffect, useState } from "react";
import SoundButton from "./soundButton";
import { getSounds } from "../../api";

function SoundBoard() {
  // State to hold the list of sounds, any error message, and a loading flag.
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect hook to fetch sounds when the component mounts.
  useEffect(() => {
    async function fetchSounds() {
      try {
        const data = await getSounds();
        setSounds(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSounds();
  }, []);

  // Show a loading message until the data is fetched.
  if (loading) {
    return <div>Loading sounds...</div>;
  }

  // If an error occurred, show the error.
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Render the list of SoundButtons.
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "20px",
      justifyContent: "center",
      margin: "20px"
    }}>
      {sounds.map((sound) => (
        <SoundButton key={sound.id} soundData={sound} />
      ))}
    </div>
  );
}

export default SoundBoard;
