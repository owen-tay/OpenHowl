import { useState, useEffect } from 'react';

export function useAudioPlayback(audioLength, onFinish) {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = () => {
    console.log("Starting playback");
    setIsPlaying(true);
  };

  const stop = () => {
    console.log("Stopping playback");
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
