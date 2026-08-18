import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Animated, ScrollView, GestureResponderEvent } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRadio } from '../context/RadioContext';
import { BASE_URL, API_URL } from '../config/api';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useDownloads } from '../context/DownloadContext';

const formatTime = (millis: number) => {
  if (!millis) return '00:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface AudioPlayerUIProps {
  video: any;
  isPlaying: boolean;
  isLoading: boolean;
  isCurrentMedia: boolean;
  togglePlayPause: () => void;
  onBack: () => void;
}

export default function AudioPlayerUI({ video, isPlaying, isLoading, isCurrentMedia, togglePlayPause, onBack }: AudioPlayerUIProps) {
  const { positionMillis, durationMillis, seekTo, playMedia } = useRadio();
  const [scrubberWidth, setScrubberWidth] = React.useState(0);
  const router = useRouter();
  const { isDownloaded, downloadingItems, downloadEpisode, deleteDownload } = useDownloads();

  const isDled = isDownloaded(video.id);
  const dlProgress = downloadingItems[video.id];
  
  let mediaUrl = video.url || video.videoUrl;
  if (Array.isArray(mediaUrl)) {
    mediaUrl = mediaUrl[0]; // just get first for download
  }
  if (typeof mediaUrl === 'string' && mediaUrl.startsWith('/')) {
    mediaUrl = `${BASE_URL}${mediaUrl}`;
  }

  const handleDownload = () => {
    if (isDled) {
       deleteDownload(video.id);
    } else {
       downloadEpisode({
         id: video.id,
         title: video.title,
         url: mediaUrl,
         thumbnail: video.thumbnail,
         category: video.category
       });
    }
  };

  // Related Content State
  const [activeTab, setActiveTab] = useState<'next' | 'related'>('next');
  const [relatedVideos, setRelatedVideos] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Equalizer bars
  const bars = useRef(Array.from({ length: 10 }).map(() => new Animated.Value(5))).current;

  // Fetch related content
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        setLoadingRelated(true);
        const res = await axios.get(`${API_URL}/videos`);
        // Filtrar solo audios o podcasts de la misma categoría o similar
        const audios = res.data.filter((v: any) => 
          (v.isAudio || v.category === 'Podcast' || v.category === 'Radio') && String(v.id) !== String(video.id)
        );
        setRelatedVideos(audios);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [video.id]);

  const handleNext = () => {
    if (relatedVideos.length > 0) {
      router.replace(`/watch/${relatedVideos[0].id}`);
    }
  };

  const handlePrev = () => {
    if (positionMillis > 3000) {
      seekTo(0);
    } else if (relatedVideos.length > 0) {
      // Ir al último relacionado como "previo" por ahora (o a un historial si existiese)
      router.replace(`/watch/${relatedVideos[relatedVideos.length - 1].id}`);
    }
  };

  const handleTrackSelect = (track: any) => {
    router.replace(`/watch/${track.id}`);
  };

  useEffect(() => {
    let anims: Animated.CompositeAnimation[] = [];
    
    if (isPlaying && isCurrentMedia) {
      bars.forEach((bar) => {
        const anim = Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: Math.random() * 30 + 10,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false, 
            }),
            Animated.timing(bar, {
              toValue: 5,
              duration: 300 + Math.random() * 200,
              useNativeDriver: false,
            })
          ])
        );
        anim.start();
        anims.push(anim);
      });
    } else {
      bars.forEach(bar => {
        bar.stopAnimation();
        Animated.timing(bar, { toValue: 5, duration: 300, useNativeDriver: false }).start();
      });
    }
    return () => anims.forEach(a => a.stop());
  }, [isPlaying, isCurrentMedia, bars]);

  let coverUrl = video.thumbnail;
  if (coverUrl && coverUrl.startsWith('/')) {
    coverUrl = `${BASE_URL}${coverUrl}`;
  }

  return (
    <LinearGradient 
      colors={['#4a4a4a', '#121212']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* TopAppBar */}
      <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-4 pt-14 pb-4">
        <TouchableOpacity onPress={onBack} className="w-10 h-10 items-center justify-center">
          <MaterialIcons name="keyboard-arrow-down" size={36} color="#fff" />
        </TouchableOpacity>
        <View className="items-center">
           <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-xs text-white/70 uppercase tracking-widest">
             REPRODUCIENDO DESDE
           </Text>
           <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-white">
             {video.category || 'Radio América'}
           </Text>
        </View>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <MaterialIcons name="more-vert" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-32" 
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Art - Spotify Style */}
        <View className="w-full aspect-square mb-8 rounded-lg shadow-2xl shadow-black/50 overflow-hidden bg-white dark:bg-gray-100 dark:bg-surface-container">
          <Image 
            source={{ uri: coverUrl }} 
            className="w-full h-full" 
            resizeMode="cover" 
          />
          {video.isLive && (
             <View className="absolute top-4 left-4 bg-error px-2 py-1 rounded">
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white text-xs">EN VIVO</Text>
             </View>
          )}
        </View>

        {/* Title and Artist Info */}
        <View className="w-full mb-6 flex-row items-center justify-between">
           <View className="flex-1 pr-4">
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-2xl text-white mb-1 leading-tight" numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-base text-white/70" numberOfLines={1}>
                {video.host || video.category || 'Radio América'}
              </Text>
           </View>
           <TouchableOpacity onPress={handleDownload} className="w-12 h-12 items-center justify-center">
             {dlProgress !== undefined ? (
               <View className="items-center justify-center">
                 <ActivityIndicator color="#C13535" size="small" />
                 <Text className="text-white text-[8px] mt-1">{dlProgress}%</Text>
               </View>
             ) : isDled ? (
               <MaterialIcons name="offline-pin" size={32} color="#C13535" />
             ) : (
               <MaterialIcons name="cloud-download" size={32} color="#fff" />
             )}
           </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View className="w-full mb-6">
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e: GestureResponderEvent) => {
              if (durationMillis > 0 && isCurrentMedia && scrubberWidth > 0) {
                const tapX = e.nativeEvent.locationX;
                const percentage = Math.max(0, Math.min(1, tapX / scrubberWidth));
                seekTo(durationMillis * percentage);
              }
            }}
            onLayout={(e) => {
               setScrubberWidth(e.nativeEvent.layout.width);
            }}
            className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-2"
          >
            <View 
              style={{ width: isCurrentMedia && durationMillis > 0 ? `${(positionMillis / durationMillis) * 100}%` : '0%' }}
              className="h-full bg-white rounded-full" 
            />
          </TouchableOpacity>
          <View className="flex-row justify-between">
            <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-xs text-white/50">
              {isCurrentMedia ? formatTime(positionMillis) : '00:00'}
            </Text>
            <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-xs text-white/50">
              {isCurrentMedia && durationMillis > 0 ? formatTime(durationMillis) : '--:--'}
            </Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View className="flex-row items-center justify-between w-full mb-10 px-2">
          <TouchableOpacity className="active:scale-90 opacity-80">
            <Ionicons name="shuffle" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handlePrev} className="active:scale-90">
            <Ionicons name="play-skip-back" size={36} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={togglePlayPause}
            disabled={isLoading && isCurrentMedia}
            className="w-16 h-16 rounded-full bg-white items-center justify-center active:scale-95"
          >
            {isLoading && isCurrentMedia ? (
              <ActivityIndicator color="#000" size="large" />
            ) : (
              <Ionicons name={isPlaying && isCurrentMedia ? 'pause' : 'play'} size={32} color="#000" style={{ marginLeft: isPlaying && isCurrentMedia ? 0 : 4 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} className="active:scale-90">
            <Ionicons name="play-skip-forward" size={36} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity className="active:scale-90 opacity-80" onPress={() => seekTo(0)}>
            <Ionicons name="repeat" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* About Episode */}
        <View className="w-full bg-[#242424] p-5 rounded-xl mb-8">
          <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white mb-2">
            Acerca del episodio
          </Text>
          <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-sm text-white/70 leading-relaxed">
            {video.description || "Escucha este increíble episodio en Radio América. Disfruta de la mejor calidad y contenido seleccionado para ti."}
          </Text>
        </View>

        {/* Tabs: A continuación / Relacionados */}
        <View className="w-full mt-4">
          <View className="flex-row border-b border-white/10 mb-4">
            <TouchableOpacity 
              onPress={() => setActiveTab('next')}
              className={`pb-3 mr-6 ${activeTab === 'next' ? 'border-b-2 border-white' : ''}`}
            >
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className={`text-sm ${activeTab === 'next' ? 'text-white' : 'text-white/50'}`}>
                A CONTINUACIÓN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveTab('related')}
              className={`pb-3 ${activeTab === 'related' ? 'border-b-2 border-white' : ''}`}
            >
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className={`text-sm ${activeTab === 'related' ? 'text-white' : 'text-white/50'}`}>
                RELACIONADOS
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content List */}
          {loadingRelated ? (
            <ActivityIndicator color="#fff" size="small" className="mt-4" />
          ) : (
            relatedVideos.slice(0, activeTab === 'next' ? 5 : 10).map((track, index) => (
              <TouchableOpacity 
                key={track.id || index}
                onPress={() => handleTrackSelect(track)}
                className="flex-row items-center mb-4 bg-white/5 p-3 rounded-xl"
              >
                <Image 
                  source={{ uri: track.thumbnail?.startsWith('/') ? `${BASE_URL}${track.thumbnail}` : track.thumbnail }} 
                  className="w-14 h-14 rounded-md bg-white/10" 
                />
                <View className="flex-1 ml-4">
                  <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-white text-sm" numberOfLines={1}>
                    {track.title}
                  </Text>
                  <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-white/50 text-xs mt-1" numberOfLines={1}>
                    {track.host || track.category || 'Podcast'}
                  </Text>
                </View>
                <MaterialIcons name="play-arrow" size={24} color="#fff" className="opacity-50" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Audio Visualizer - Small subtle at the very bottom */}
      <View className="absolute bottom-6 w-full flex-row items-end justify-center gap-1 h-6 px-4 pointer-events-none opacity-30 z-40">
        {bars.map((bar, i) => (
          <Animated.View 
            key={i} 
            style={{ height: bar }}
            className="w-1 bg-white rounded-full" 
          />
        ))}
      </View>
    </LinearGradient>
  );
}
