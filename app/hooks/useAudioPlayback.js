import { useState, useEffect } from 'react';

export function useAudioPlayback(audioLength, onFinish) {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = () => {
    console.log("Starting playback");
    // Here you can add your API call to the backend to actually start the sound.
    setIsPlaying(true);
  };

  const stop = () => {
    console.log("Stopping playback");
    // And here you would call your API to stop the sound.
    setIsPlaying(false);
  };

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setTimeout(() => {
        console.log("Playback finished");
        setIsPlaying(false);
        if (onFinish) {
          onFinish();
        }
      }, audioLength);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, audioLength, onFinish]);

  return { isPlaying, play, stop };
}
