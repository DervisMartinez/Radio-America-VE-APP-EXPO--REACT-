import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideo } from '../context/VideoContext';
import { useSegments } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BASE_URL } from '../config/api';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (_) {}
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function FloatingVideoPlayer() {
  const { activeVideo, isMinimized, isPlaying, maximizeVideo, closeVideo, togglePlayPauseVideo } = useVideo();
  const segments = useSegments();

  // No mostrar si no hay video activo, o si no está minimizado, o si el usuario está en la pantalla completa de watch
  if (!activeVideo || !isMinimized || segments[0] === 'watch') {
    return null;
  }

  let videoUrl = activeVideo.url || activeVideo.videoUrl || '';
  if (typeof videoUrl === 'string' && videoUrl.startsWith('/')) {
    videoUrl = `${BASE_URL}${videoUrl}`;
  }
  const youtubeId = getYoutubeId(videoUrl);

  let thumbUrl = activeVideo.thumbnail || '';
  if (typeof thumbUrl === 'string' && thumbUrl.startsWith('/')) {
    thumbUrl = `${BASE_URL}${thumbUrl}`;
  }

  return (
    <View 
      className="absolute w-full z-50 px-4" 
      style={{ bottom: Platform.OS === 'ios' ? 95 : 75 }}
    >
      <View className="bg-white dark:bg-[#1f1f20] flex-row items-center justify-between p-2 rounded-2xl border border-outline-variant/30 shadow-2xl">
        
        {/* Contenedor táctil para expandir */}
        <TouchableOpacity 
          className="flex-row items-center gap-3 flex-1 overflow-hidden" 
          onPress={maximizeVideo}
          activeOpacity={0.85}
        >
          {/* Mini pantalla de Video 16:9 */}
          <View className="w-24 h-14 bg-black rounded-lg overflow-hidden relative shadow-md">
            {youtubeId ? (
              Platform.OS === 'web' ? (
                // @ts-ignore
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=0`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  style={{ border: 0, pointerEvents: 'none' }}
                />
              ) : WebView ? (
                <WebView
                  source={{ uri: `https://www.youtube.com/embed/${youtubeId}?playsinline=1&autoplay=1` }}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Image source={{ uri: thumbUrl }} className="w-full h-full" resizeMode="cover" />
              )
            ) : (
              <Image source={{ uri: thumbUrl }} className="w-full h-full" resizeMode="cover" />
            )}
            
            {/* Badge de Video */}
            <View className="absolute top-1 left-1 bg-primary/90 px-1 rounded">
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[8px] text-white">
                VIDEO
              </Text>
            </View>
          </View>

          {/* Info del Video */}
          <View className="flex-1 pr-2 justify-center">
            <View className="flex-row items-center gap-1.5 mb-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-primary" />
              <Text style={{ fontFamily: 'Montserrat_800ExtraBold' }} className="text-[9px] text-primary uppercase tracking-widest">
                {activeVideo.category || 'En Reproducción'}
              </Text>
            </View>
            <Text 
              style={{ fontFamily: 'Montserrat_700Bold' }} 
              className="text-xs text-black dark:text-white leading-tight" 
              numberOfLines={1}
            >
              {activeVideo.title}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Botones de Control */}
        <View className="flex-row items-center gap-1">
          <TouchableOpacity 
            onPress={maximizeVideo}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center active:opacity-70"
          >
            <MaterialIcons name="fullscreen" size={22} color="#C13535" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={closeVideo}
            className="w-9 h-9 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center active:opacity-70"
          >
            <MaterialIcons name="close" size={20} color="#8a8a8a" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}
