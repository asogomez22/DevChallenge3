import { useState, useCallback } from 'react';

// Tipos para los audios
type SoundMap = {
  [key: string]: HTMLAudioElement;
};

// Hook
export const useSound = (sounds: { [key: string]: string }) => {
  const [audioCache] = useState<SoundMap>(() => {
    // Precargar los audios
    const cache: SoundMap = {};
    Object.keys(sounds).forEach(key => {
      cache[key] = new Audio(sounds[key]);
      cache[key].preload = 'auto';
    });
    return cache;
  });

  const playSound = useCallback((soundName: keyof SoundMap) => {
    const audio = audioCache[soundName];
    if (audio) {
      audio.currentTime = 0; // Rebobinar si ya estaba sonando
      audio.play().catch(e => console.error("Error al reproduir so:", e));
    }
  }, [audioCache]);

  return [playSound];
};