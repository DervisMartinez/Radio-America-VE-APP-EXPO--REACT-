import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRadio } from '../context/RadioContext';
import { useVideo } from '../context/VideoContext';
import { useRouter, useSegments } from 'expo-router';

export default function PersistentPlayer() {
  const { 
    isPlaying, 
    isLoading, 
    toggleRadio, 
    activeMedia, 
    togglePlayPause, 
    stopMediaAndRevertToRadio 
  } = useRadio();
  const { activeVideo, isMinimized } = useVideo();
  const segments = useSegments();
  const router = useRouter();
  
  // No mostrar en watch ni en rami, ni si hay un video flotante minimizado
  if (segments[0] === 'watch' || segments[0] === 'rami' || (activeVideo && isMinimized)) return null;
  
  return (
    <View className="absolute w-full z-50 px-4" style={{ bottom: Platform.OS === 'ios' ? 95 : 75 }}>
      <View className="bg-white dark:bg-surface/95 flex-row items-center justify-between px-4 py-3 rounded-2xl border border-outline-variant/30 shadow-lg">
        
        {activeMedia ? (
          // --- UI PARA VIDEO/AUDIO ACTIVO ---
          <>
            <TouchableOpacity 
              className="flex-row items-center gap-3 flex-1"
              onPress={() => router.push(`/watch/${activeMedia.id}`)}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 rounded-lg bg-white dark:bg-gray-100 dark:bg-surface-container overflow-hidden">
                <Image source={{ uri: activeMedia.thumbnail }} className="w-full h-full" resizeMode="cover" />
              </View>
              
              <View className="flex-1 pr-2">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <View className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-error' : 'bg-outline-variant'}`} />
                  <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-[10px] text-error tracking-widest uppercase">
                    Reproduciendo
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-black dark:text-on-surface" numberOfLines={1}>
                  {activeMedia.title}
                </Text>
              </View>
            </TouchableOpacity>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity 
                onPress={stopMediaAndRevertToRadio}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-100 dark:bg-surface-container items-center justify-center"
              >
                <MaterialIcons name="close" size={20} color="#ffb3ad" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={togglePlayPause}
                disabled={isLoading}
                className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={28} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // --- UI PARA RADIO STREAMING ---
          <>
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-12 h-12 rounded-lg bg-gray-800 dark:bg-black/20 items-center justify-center">
                 <Image source={require('../../assets/images/logo_blanco.png')} style={{width: 30, height: 30}} resizeMode="contain" />
              </View>
              
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <View className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-error' : 'bg-outline-variant'}`} />
                  <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-[10px] text-error tracking-widest uppercase">
                    En Vivo
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-black dark:text-on-surface" numberOfLines={1}>
                  Radio América 90.9 FM
                </Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={toggleRadio}
              disabled={isLoading}
              className="w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg"
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={28} color="#fff" />
              )}
            </TouchableOpacity>
          </>
        )}

      </View>
    </View>
  );
}
