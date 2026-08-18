import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useRadio } from '../../context/RadioContext';
import { useVideo } from '../../context/VideoContext';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config/api';

import AudioPlayerUI from '../../components/AudioPlayerUI';
import VideoPlayerUI from '../../components/VideoPlayerUI';

import { useDownloads } from '../../context/DownloadContext';

export default function WatchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { playMedia, isPlaying, togglePlayPause, activeMedia, isLoading } = useRadio();
  const { playVideo, minimizeVideo } = useVideo();
  const { getLocalUri } = useDownloads();
  const [video, setVideo] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await axios.get(`${API_URL}/videos`);
        const found = res.data.find((v: any) => String(v.id) === String(id));
        if (found) {
          setVideo(found);
          let mediaUrl = found.url || found.videoUrl;
          
          // A veces la API devuelve un string JSON con un array de audios
          try {
            const parsed = JSON.parse(mediaUrl);
            if (Array.isArray(parsed) && parsed.length > 0) {
              mediaUrl = parsed;
            }
          } catch (e) {
            // No es JSON, continuamos
          }

          if (Array.isArray(mediaUrl)) {
             mediaUrl = mediaUrl.map((url: string) => url.startsWith('/') ? `${BASE_URL}${url}` : url);
          } else if (typeof mediaUrl === 'string' && mediaUrl.startsWith('/')) {
            mediaUrl = `${BASE_URL}${mediaUrl}`;
          }
          
          let thumbUrl = found.thumbnail;
          if (thumbUrl && thumbUrl.startsWith('/')) {
            thumbUrl = `${BASE_URL}${thumbUrl}`;
          }
          
          const isAudioTrack = found.isAudio || found.category === 'Podcast' || found.category === 'Radio';

          if (isAudioTrack) {
            const localUri = getLocalUri(found.id);
            playMedia({
              id: found.id,
              title: found.title,
              subtitle: found.category || 'Podcast',
              thumbnail: thumbUrl,
              url: localUri || mediaUrl
            });
          } else {
            // Es un video: registrarlo en el VideoContext
            playVideo({
              ...found,
              thumbnail: thumbUrl,
              url: mediaUrl
            });
          }
        } else {
          throw new Error('Video no encontrado');
        }
      } catch (err) {
        console.warn('Error fetching video from API:', err);
        // Eliminado el fallback del "electro song".
      } finally {
        setFetching(false);
      }
    };
    
    fetchVideo();
  }, [id]);

  if (fetching || !video) {
    return (
      <View className="flex-1 bg-white dark:bg-surface justify-center items-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="#ffb3ad" size="large" />
      </View>
    );
  }

  const isCurrentMedia = activeMedia?.id === id;

  const handleBack = () => {
    const isAudioTrack = video?.isAudio || video?.category === 'Podcast' || video?.category === 'Radio';
    if (!isAudioTrack) {
      minimizeVideo();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Renderizar condicionalmente basado en si es Audio o Video
  if (video.isAudio || video.category === 'Podcast' || video.category === 'Radio') {
    return (
      <View className="flex-1 bg-white dark:bg-surface">
        <Stack.Screen options={{ headerShown: false }} />
        <AudioPlayerUI 
          video={video} 
          isPlaying={isPlaying} 
          isLoading={isLoading} 
          isCurrentMedia={isCurrentMedia} 
          togglePlayPause={togglePlayPause} 
          onBack={handleBack} 
        />
      </View>
    );
  }

  // Si no es audio, asumimos que es Video
  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <VideoPlayerUI 
        video={video} 
        onBack={handleBack} 
      />
    </View>
  );
}
