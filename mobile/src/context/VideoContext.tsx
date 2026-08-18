import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

export interface VideoItem {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  url?: string;
  videoUrl?: string;
  description?: string;
  views?: number;
  likes?: number;
}

interface VideoContextProps {
  activeVideo: VideoItem | null;
  isMinimized: boolean;
  isPlaying: boolean;
  currentTime: number;
  playVideo: (video: VideoItem) => void;
  minimizeVideo: () => void;
  maximizeVideo: () => void;
  closeVideo: () => void;
  togglePlayPauseVideo: () => void;
  setIsPlaying: (playing: boolean) => void;
  updateCurrentTime: (time: number) => void;
}

const VideoContext = createContext<VideoContextProps>({
  activeVideo: null,
  isMinimized: false,
  isPlaying: false,
  currentTime: 0,
  playVideo: () => {},
  minimizeVideo: () => {},
  maximizeVideo: () => {},
  closeVideo: () => {},
  togglePlayPauseVideo: () => {},
  setIsPlaying: () => {},
  updateCurrentTime: () => {},
});

export const useVideo = () => useContext(VideoContext);

export const VideoProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const router = useRouter();

  const playVideo = (video: VideoItem) => {
    // Si es un video diferente, reiniciar tiempo a 0; si es el mismo, conservar tiempo
    if (!activeVideo || String(activeVideo.id) !== String(video.id)) {
      setCurrentTime(0);
    }
    setActiveVideo(video);
    setIsMinimized(false);
    setIsPlaying(true);
  };

  const minimizeVideo = () => {
    if (activeVideo) {
      setIsMinimized(true);
    }
  };

  const maximizeVideo = () => {
    if (activeVideo) {
      setIsMinimized(false);
      router.push(`/watch/${activeVideo.id}`);
    }
  };

  const closeVideo = () => {
    setActiveVideo(null);
    setIsMinimized(false);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPauseVideo = () => {
    setIsPlaying(prev => !prev);
  };

  const updateCurrentTime = (time: number) => {
    if (time >= 0) {
      setCurrentTime(time);
    }
  };

  return (
    <VideoContext.Provider
      value={{
        activeVideo,
        isMinimized,
        isPlaying,
        currentTime,
        playVideo,
        minimizeVideo,
        maximizeVideo,
        closeVideo,
        togglePlayPauseVideo,
        setIsPlaying,
        updateCurrentTime,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};
