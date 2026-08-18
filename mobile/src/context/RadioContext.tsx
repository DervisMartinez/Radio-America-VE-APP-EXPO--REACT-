import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';

export interface ActiveMedia {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  url: string | string[]; // Can be an array of URLs for ads
}

interface RadioContextProps {
  isPlaying: boolean;
  isLoading: boolean;
  activeMedia: ActiveMedia | null;
  positionMillis: number;
  durationMillis: number;
  toggleRadio: () => void;
  playMedia: (media: ActiveMedia) => void;
  stopMediaAndRevertToRadio: () => void;
  togglePlayPause: () => void;
  seekTo: (position: number) => void;
}

const RadioContext = createContext<RadioContextProps>({
  isPlaying: false,
  isLoading: false,
  activeMedia: null,
  positionMillis: 0,
  durationMillis: 0,
  toggleRadio: () => {},
  playMedia: () => {},
  stopMediaAndRevertToRadio: () => {},
  togglePlayPause: () => {},
  seekTo: () => {},
});

export const useRadio = () => useContext(RadioContext);

export const RadioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMedia, setActiveMedia] = useState<ActiveMedia | null>(null);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  
  const playerRef = useRef<AudioPlayer | null>(null);
  const playlistUrlsRef = useRef<string[]>([]);
  const currentTrackIndexRef = useRef<number>(0);
  const activeMediaRef = useRef<ActiveMedia | null>(null);
  const lastErrorRef = useRef<string>('');
  const loadingLockRef = useRef<boolean>(false);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix'
        });
      } catch (e) {
        // Silenciar en Expo Go - esto solo funciona en build nativo
      }
    };
    setupAudio();
    
    return () => {
      destroyPlayer();
    };
  }, []);

  // Destruir el player actual de forma segura
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.pause();
      } catch (_) {}
      try {
        playerRef.current.remove();
      } catch (_) {}
      playerRef.current = null;
    }
  }, []);

  const playNextTrack = useCallback(() => {
    if (playlistUrlsRef.current.length > 0 && currentTrackIndexRef.current < playlistUrlsRef.current.length - 1) {
      currentTrackIndexRef.current += 1;
      const nextUrl = playlistUrlsRef.current[currentTrackIndexRef.current];
      
      destroyPlayer();
      
      try {
        const player = createAudioPlayer(nextUrl);
        player.addListener('playbackStatusUpdate', onPlaybackStatusUpdate);
        playerRef.current = player;
        player.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn("Error creating next track player:", e);
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(false);
      setPositionMillis(0);
    }
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: any) => {
    if (status) {
      if (status.error) {
        // Solo loguear si el error es diferente al último (evita spam)
        if (status.error !== lastErrorRef.current) {
          lastErrorRef.current = status.error;
          console.warn("Audio Playback Error:", status.error);
        }
        return; // No actualizar estado con datos de un player en error
      }
      // expo-audio uses seconds, convert to milliseconds
      setPositionMillis((status.currentTime || 0) * 1000);
      setDurationMillis((status.duration || 0) * 1000);
      setIsPlaying(status.playing);
      if (status.duration > 0 && status.currentTime > 0 && status.currentTime >= status.duration) {
        playNextTrack();
      }
    }
  }, []);

  const loadAndPlay = async (urls: string | string[], metadata?: any) => {
    // Evitar llamadas simultáneas que causen superposición
    if (loadingLockRef.current) return;
    loadingLockRef.current = true;
    
    try {
      setIsLoading(true);
      
      // PASO 1: Destruir completamente el player anterior
      destroyPlayer();
      lastErrorRef.current = ''; // Resetear último error
      
      // PASO 2: Pequeña pausa para que el sistema libere recursos
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let targetUrl = '';
      if (Array.isArray(urls)) {
        playlistUrlsRef.current = urls;
        currentTrackIndexRef.current = 0;
        targetUrl = urls[0];
      } else {
        playlistUrlsRef.current = [];
        currentTrackIndexRef.current = 0;
        targetUrl = urls;
      }
      
      // PASO 3: Crear nuevo player
      const player = createAudioPlayer(targetUrl);
      player.addListener('playbackStatusUpdate', onPlaybackStatusUpdate);
      playerRef.current = player;
      
      // PASO 4: Configurar lock screen (solo en builds nativos)
      if (metadata) {
        try {
          player.setActiveForLockScreen(true, {
            title: metadata.title || 'Radio América',
            artist: metadata.artist || '90.9 FM',
            artworkUrl: metadata.artworkUrl
          });
        } catch (_) {
          // Silenciar - no funciona en Expo Go
        }
      }

      // PASO 5: Reproducir
      player.play();
      setIsPlaying(true);
      setPositionMillis(0);
      setDurationMillis(0);
    } catch (error) {
      console.warn('Error loading audio:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
      loadingLockRef.current = false;
    }
  };

  const toggleRadio = async () => {
    if (activeMediaRef.current) {
      activeMediaRef.current = null;
      setActiveMedia(null);
    }
    
    if (isPlaying && !activeMediaRef.current && playerRef.current) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      activeMediaRef.current = null;
      setActiveMedia(null);
      await loadAndPlay('https://transmision.radioamerica.com.ve:8087/RA909FM', {
        title: 'Radio América 90.9 FM',
        artist: 'En Vivo',
        artworkUrl: 'https://radioamerica.com.ve/images/logo.png'
      });
    }
  };

  const playMedia = async (media: ActiveMedia) => {
    if (activeMediaRef.current?.id === media.id && isPlaying) {
      // Ya se está reproduciendo este medio, no reiniciar
      return;
    }
    
    activeMediaRef.current = media;
    setActiveMedia(media);

    // Contabilizar reproducción (no bloquear la reproducción si falla)
    fetch('https://api.radioamerica.com.ve/api/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: media.id })
    }).catch(() => {});

    await loadAndPlay(media.url, {
      title: media.title,
      artist: media.subtitle,
      artworkUrl: media.thumbnail
    });
  };

  const stopMediaAndRevertToRadio = async () => {
    destroyPlayer();
    setIsPlaying(false);
    setPositionMillis(0);
    setDurationMillis(0);
    activeMediaRef.current = null;
    setActiveMedia(null);
  };

  const togglePlayPause = async () => {
    if (!playerRef.current) return;
    
    try {
      if (isPlaying) {
        playerRef.current.pause();
        setIsPlaying(false);
      } else {
        playerRef.current.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Error toggling play/pause:", e);
    }
  };

  const seekTo = async (position: number) => {
    if (playerRef.current) {
      try {
        const seconds = position / 1000;
        await playerRef.current.seekTo(seconds);
        setPositionMillis(position);
      } catch (e) {
        console.warn("Error seeking:", e);
      }
    }
  };

  return (
    <RadioContext.Provider value={{ 
      isPlaying, 
      isLoading, 
      activeMedia,
      positionMillis,
      durationMillis,
      toggleRadio,
      playMedia,
      stopMediaAndRevertToRadio,
      togglePlayPause,
      seekTo
    }}>
      {children}
    </RadioContext.Provider>
  );
};
