import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config/api';
import { useRadio } from '../../context/RadioContext';
import { useDownloads } from '../../context/DownloadContext';

export default function ProgramProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { playMedia } = useRadio();
  const { isDownloaded, downloadingItems, downloadEpisode, deleteDownload } = useDownloads();
  const [activeTab, setActiveTab] = useState('Episodios');
  
  const [program, setProgram] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        setLoading(true);
        // Traemos todos los programas y videos de la API
        const [programsRes, videosRes] = await Promise.all([
          axios.get(`${API_URL}/programs`),
          axios.get(`${API_URL}/videos`)
        ]);
        
        // Encontramos el programa actual
        const currentProgram = programsRes.data.find((p: any) => String(p.id) === String(id));
        setProgram(currentProgram);

        // Filtramos los videos que correspondan estrictamente a este programa
        if (currentProgram) {
          const programVideos = videosRes.data.filter((v: any) => 
            v.programId && String(v.programId) === String(currentProgram.id)
          );
          setEpisodes(programVideos);
        }
      } catch (error) {
        console.error("Error cargando perfil del programa:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-surface items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#c13535" />
      </View>
    );
  }

  if (!program) {
    return (
      <View className="flex-1 bg-white dark:bg-surface items-center justify-center p-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white text-xl text-center mb-4">Programa no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="px-6 py-3 bg-[#c13535] rounded-full">
          <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-surface">
      {/* Ocultamos el header blanco por defecto de Expo Router que arruina el diseño */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* TopAppBar */}
      <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 pt-12 pb-4 bg-white dark:bg-[#131314]">
        <TouchableOpacity onPress={() => router.back()} className="active:opacity-80">
          <MaterialIcons name="arrow-back" size={28} color="#ffb3ad" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-xl text-[#c13535] dark:text-[#ffb3ad] tracking-tighter">
          RADIO AMÉRICA
        </Text>
        <TouchableOpacity onPress={() => router.push('/search')} className="bg-white dark:bg-white/30 dark:bg-surface/30 p-2 rounded-full backdrop-blur-md">
          <MaterialIcons name="search" size={28} color="#ffb3ad" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Section */}
        <View style={{ height: Dimensions.get('window').height * 0.55 }} className="relative w-full flex-col justify-end">
          <View className="absolute inset-0 z-0">
            <Image 
              source={{ uri: program.thumbnail || 'https://via.placeholder.com/500' }} 
              className="w-full h-full absolute"
              resizeMode="cover"
            />
            {/* Overlay */}
            <View className="absolute inset-0 bg-black/40" />
            <LinearGradient
              colors={['transparent', 'rgba(19, 19, 20, 0.6)', '#131314']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' }}
            />
          </View>

          <View className="relative z-10 px-6 pb-8">
            <View className="self-start px-3 py-1 mb-4 rounded-full bg-[#353436]">
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[#ffba29] text-[10px] uppercase tracking-widest">
                {program.category || 'Programa'}
              </Text>
            </View>

            <Text style={{ fontFamily: 'Montserrat_900Black', letterSpacing: -1 }} className="text-5xl text-[#e5e2e3] mb-1">
              {program.name}
            </Text>
            {program.host && (
              <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-xl text-[#e1bebb]">
                con {program.host}
              </Text>
            )}

            <View className="flex-row items-center gap-4 mt-6">
              <TouchableOpacity 
                onPress={() => {
                  if (episodes.length > 0) {
                    router.push(`/watch/${episodes[0].id}`);
                  }
                }}
                className="flex-row items-center gap-2 bg-[#c13535] px-8 py-3 rounded-full active:opacity-90 shadow-lg shadow-red-500/30"
              >
                <MaterialIcons name="play-arrow" size={24} color="#ffe4e1" />
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[#ffe4e1]">
                  Escuchar Último
                </Text>
              </TouchableOpacity>

              <TouchableOpacity className="w-12 h-12 rounded-full border border-[#59413f] items-center justify-center active:opacity-80">
                <MaterialIcons name="bookmark-add" size={24} color="#e1bebb" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View className="flex-row px-6 border-b border-[#2a2a2b] bg-white dark:bg-surface pt-2">
          {['Episodios', 'Sobre el Programa', 'Galería'].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              className="mr-8 py-4 relative"
            >
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className={`text-sm ${activeTab === tab ? 'text-[#ffba29]' : 'text-[#e1bebb]'}`}>
                {tab}
              </Text>
              {activeTab === tab && (
                <View className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#ffba29]" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Episodes List */}
        <View className="p-6 pb-24">
          {activeTab === 'Episodios' && episodes.length > 0 && episodes.map((ep) => {
            const isDled = isDownloaded(ep.id);
            const dlProgress = downloadingItems[ep.id];
            
            let mediaUrl = ep.url || ep.videoUrl;
            if (Array.isArray(mediaUrl)) mediaUrl = mediaUrl[0];
            if (typeof mediaUrl === 'string' && mediaUrl.startsWith('/')) {
              mediaUrl = `${BASE_URL}${mediaUrl}`;
            }

            const handleDownload = () => {
              if (isDled) {
                 deleteDownload(ep.id);
              } else {
                 downloadEpisode({
                   id: ep.id,
                   title: ep.title,
                   url: mediaUrl,
                   thumbnail: ep.thumbnail,
                   category: ep.category || program.name
                 });
              }
            };

            return (
              <View key={ep.id} className="flex-row items-center mb-6">
                <TouchableOpacity 
                  onPress={() => router.push(`/watch/${ep.id}`)}
                  className="flex-row gap-4 flex-1 active:opacity-70 pr-2"
                >
                  <View className="w-24 h-24 rounded-xl overflow-hidden bg-[#2a2a2b] relative">
                    <Image 
                      source={{ uri: ep.thumbnail }} 
                      className="w-full h-full opacity-80"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/30 items-center justify-center">
                      <MaterialIcons name="play-circle-outline" size={32} color="#e5e2e3" />
                    </View>
                  </View>

                  <View className="flex-1 justify-center">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[10px] text-[#ffba29] uppercase tracking-widest">
                        {ep.category}
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[10px] text-[#e1bebb] uppercase">
                        {ep.isLive ? 'EN VIVO' : 'VIDEO'}
                      </Text>
                    </View>

                    <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-base text-[#e5e2e3] leading-tight mb-1" numberOfLines={2}>
                      {ep.title}
                    </Text>
                    
                    <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-sm text-[#e1bebb]" numberOfLines={2}>
                      {ep.description}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity onPress={handleDownload} className="w-12 h-12 items-center justify-center">
                   {dlProgress !== undefined ? (
                     <View className="items-center justify-center">
                       <ActivityIndicator color="#c13535" size="small" />
                       <Text className="text-white text-[8px] mt-1">{dlProgress}%</Text>
                     </View>
                   ) : isDled ? (
                     <MaterialIcons name="offline-pin" size={28} color="#c13535" />
                   ) : (
                     <MaterialIcons name="cloud-download" size={28} color="#e1bebb" />
                   )}
                </TouchableOpacity>
              </View>
            );
          })}

          {activeTab === 'Episodios' && episodes.length === 0 && (
            <View className="items-center mt-4 mb-8">
              <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-sm text-[#e1bebb]">
                No hay episodios recientes.
              </Text>
            </View>
          )}

          {activeTab !== 'Episodios' && (
            <View className="items-center justify-center py-12">
              <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-[#e1bebb]">
                {activeTab === 'Sobre el Programa' ? program.description : 'Próximamente'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
