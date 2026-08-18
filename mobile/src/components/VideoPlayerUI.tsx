import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Linking, Image, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, BASE_URL } from '../config/api';

import { useVideo } from '../context/VideoContext';

let WebView: any = null;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

interface VideoPlayerUIProps {
  video: any;
  onBack: () => void;
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'RECIENTE';
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now.getTime() - past.getTime();
  
  if (isNaN(diffInMs) || diffInMs < 0) return 'RECIENTE';

  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHours = Math.floor(diffInMin / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSec < 60) return 'HACE UN MOMENTO';
  if (diffInMin === 1) return 'HACE 1 MINUTO';
  if (diffInMin < 60) return `HACE ${diffInMin} MINUTOS`;
  if (diffInHours === 1) return 'HACE 1 HORA';
  if (diffInHours < 24) return `HACE ${diffInHours} HORAS`;
  if (diffInDays === 1) return 'AYER';
  if (diffInDays < 7) return `HACE ${diffInDays} DÍAS`;
  if (diffInWeeks === 1) return 'HACE 1 SEMANA';
  if (diffInWeeks < 4) return `HACE ${diffInWeeks} SEMANAS`;
  if (diffInMonths === 1) return 'HACE 1 MES';
  if (diffInMonths < 12) return `HACE ${diffInMonths} MESES`;
  if (diffInYears === 1) return 'HACE 1 AÑO';
  return `HACE ${diffInYears} AÑOS`;
};

export default function VideoPlayerUI({ video, onBack }: VideoPlayerUIProps) {
  const router = useRouter();
  const { currentTime, updateCurrentTime } = useVideo();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(video.likes || 0);

  let videoUrl = video.url || video.videoUrl || '';
  if (videoUrl.startsWith('/')) {
    videoUrl = `${BASE_URL}${videoUrl}`;
  }
  const youtubeId = getYoutubeId(videoUrl);

  // Only pass actual video file URLs to the native player, not YouTube links
  const nativeVideoSource = youtubeId ? '' : videoUrl;
  const player = useVideoPlayer(nativeVideoSource, (player) => {
    if (!youtubeId) {
      if (currentTime > 0) {
        player.currentTime = currentTime;
      }
      player.play();
    }
  });

  useEffect(() => {
    if (player && !youtubeId) {
      const interval = setInterval(() => {
        try {
          if (player.currentTime) {
            updateCurrentTime(player.currentTime);
          }
        } catch (_) {}
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [player, youtubeId]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(`${API_URL}/videos`);
        let related = res.data.filter((v: any) => v.category === video.category && String(v.id) !== String(video.id));
        // Tomar hasta 5 sugerencias aleatorias o las primeras 5
        setSuggestions(related.slice(0, 5));
      } catch (err) {
        console.warn('Error fetching related videos:', err);
      }
    };
    fetchSuggestions();
  }, [video]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `¡Mira este increíble video en Radio América: ${video.title}!\n\nEnlace: https://radioamerica.com.ve/videos/${video.id}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLike = async () => {
    // Si ya le dio me gusta en esta sesión localmente, se podría quitar, pero asumiremos toggle
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikesCount(newStatus ? likesCount + 1 : likesCount - 1);
    
    try {
      // TODO: Reemplazar con el endpoint real de estadísticas de likes
      // await axios.post(`${API_URL}/videos/${video.id}/like`, { status: newStatus });
      console.log(`Enviando Like (${newStatus}) del video ${video.id} a la API...`);
    } catch (error) {
      console.error("Error enviando like a la API", error);
      // Revertir si falla
      setIsLiked(!newStatus);
      setLikesCount(!newStatus ? likesCount + 1 : likesCount - 1);
    }
  };

  const goToVideo = (id: string) => {
    // Para navegar a otra ruta de watch y desmontar el actual
    router.replace(`/watch/${id}`);
  };

  const startSec = Math.floor(currentTime);
  const ytParams = `autoplay=1&playsinline=1${startSec > 0 ? `&start=${startSec}` : ''}`;

  return (
    <View className="flex-1 bg-white dark:bg-surface">
      {/* Top App Bar - Fixed */}
      <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-4 pt-12 pb-4 bg-white/80 dark:bg-surface/80" style={{ backdropFilter: 'blur(10px)' } as any}>
        <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center">
          <MaterialIcons name="keyboard-arrow-down" size={32} color="#ffb3ad" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-xl text-[#ffb3ad] tracking-tighter" adjustsFontSizeToFit numberOfLines={1}>
          RADIO AMÉRICA
        </Text>
        <TouchableOpacity onPress={() => router.push('/search')} className="w-10 h-10 items-center justify-center">
          <MaterialIcons name="search" size={28} color="#ffb3ad" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 pt-24" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Video Player Section */}
        <View className="w-full aspect-video bg-black overflow-hidden relative">
          {youtubeId ? (
            Platform.OS === 'web' ? (
              // @ts-ignore: Renderizamos iframe directamente en la web
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeId}?${ytParams}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0 }}
              />
            ) : (
              <WebView
                source={{ uri: `https://www.youtube.com/embed/${youtubeId}?${ytParams}&origin=https://radioamerica.com.ve` }}
                allowsFullscreenVideo
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                style={{ width: '100%', height: '100%' }}
              />
            )
          ) : (
            <VideoView 
              player={player} 
              style={{ width: '100%', height: '100%' }} 
            />
          )}
        </View>

        {/* Video Metadata / Description */}
        <View className="px-6 py-6 bg-white dark:bg-surface-container-low gap-4">
          <View>
            <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-2xl text-black dark:text-on-surface tracking-tight leading-tight mb-1">
              {video.title}
            </Text>
            <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-sm uppercase tracking-wider">
              {formatTimeAgo(video.createdAt || video.created_at || video.date)} • {video.category || 'PROGRAMA'}
            </Text>
          </View>
          <Text className="text-base text-black dark:text-black/80 dark:text-on-surface/80 leading-relaxed">
            {video.description || 'Sin descripción disponible para este video.'}
          </Text>
          
          {/* Actions */}
          <View className="flex-row gap-4 mt-2">
            <TouchableOpacity onPress={handleLike} className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${isLiked ? 'bg-primary/20 border border-primary/30' : 'bg-gray-100 dark:bg-surface-container-high'}`}>
              <MaterialIcons name="thumb-up" size={20} color={isLiked ? "#C13535" : "#a88987"} />
              <Text className={`${isLiked ? 'text-primary' : 'text-black dark:text-on-surface'} font-semibold text-sm`}>
                {isLiked ? 'Te gusta' : 'Me gusta'} {likesCount > 0 && `(${likesCount})`}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} className="flex-row items-center gap-2 bg-gray-100 dark:bg-surface-container-high px-4 py-2 rounded-full">
              <MaterialIcons name="share" size={20} color="#a88987" />
              <Text className="text-black dark:text-on-surface font-semibold text-sm">Compartir</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center gap-2 bg-gray-100 dark:bg-surface-container-high px-4 py-2 rounded-full ml-auto">
              <MaterialIcons name="bookmark" size={20} color="#a88987" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sugerencias Similares */}
        {suggestions.length > 0 && (
          <View className="mt-8 px-6 pb-8">
            <View className="flex-row items-center mb-4 border-l-4 border-primary-container pl-3">
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xl text-black dark:text-on-surface tracking-tight">
                Sugerencias Similares
              </Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible">
              {suggestions.map((item, index) => (
                <TouchableOpacity onPress={() => goToVideo(item.id)} key={item.id} className={`w-64 ${index !== suggestions.length - 1 ? 'mr-4' : 'mr-6'}`}>
                  <View className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-surface-container mb-3 relative">
                    <Image source={{ uri: item.thumbnail?.startsWith('/') ? `${BASE_URL}${item.thumbnail}` : item.thumbnail }} className="w-full h-full" resizeMode="cover" />
                    <View className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-[10px] font-bold">12:00</Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-on-surface leading-snug" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs mt-1">
                    {item.category} • {item.views || '1K vistas'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
