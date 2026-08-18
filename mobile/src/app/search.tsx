import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, BASE_URL } from '../config/api';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ videos: any[], programs: any[] }>({ videos: [], programs: [] });
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Auto-focus al abrir
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ videos: [], programs: [] });
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/search?query=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (error) {
        console.error("Error en la búsqueda:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 500);
    return () => clearTimeout(debounce);
  }, [query]);

  const fixUrl = (url: string) => {
    if (url && url.startsWith('/')) {
      return `${BASE_URL}${url}`;
    }
    return url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop';
  };

  return (
    <View className="flex-1 bg-background pt-12">
      {/* Search Bar Header */}
      <View className="flex-row items-center px-4 pb-4 border-b border-outline-variant/20">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <MaterialIcons name="arrow-back" size={28} color="#C13535" />
        </TouchableOpacity>
        
        <View className="flex-1 flex-row items-center bg-white dark:bg-gray-100 dark:bg-surface-container rounded-full px-4 py-2">
          <MaterialIcons name="search" size={20} color="#C13535" className="mr-2" />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar programas o videos..."
            placeholderTextColor="#8a8a8a"
            className="flex-1 text-black dark:text-on-surface font-['Montserrat_500Medium'] ml-2"
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <MaterialIcons name="close" size={20} color="#C13535" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="py-10 items-center">
            <ActivityIndicator size="large" color="#C13535" />
          </View>
        ) : query.length >= 2 && results.programs.length === 0 && results.videos.length === 0 ? (
          <View className="py-10 items-center">
            <MaterialIcons name="search-off" size={48} color="#8a8a8a" />
            <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant mt-4 text-center">
              No encontramos nada para "{query}".
            </Text>
          </View>
        ) : (
          <View className="pb-20">
            {/* Resultados de Programas */}
            {results.programs.length > 0 && (
              <View className="mb-6">
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-primary text-sm tracking-widest uppercase mb-3">
                  Programas
                </Text>
                {results.programs.map((program) => (
                  <TouchableOpacity 
                    key={program.id}
                    onPress={() => {
                      router.back();
                      setTimeout(() => router.push(`/program/${program.id}`), 100);
                    }}
                    className="flex-row items-center mb-3 bg-white dark:bg-gray-100 dark:bg-surface-container p-2 rounded-xl"
                  >
                    <Image 
                      source={{ uri: fixUrl(program.thumbnail) }} 
                      className="w-16 h-16 rounded-lg bg-black"
                      resizeMode="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-on-surface" numberOfLines={1}>
                        {program.name}
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs mt-1" numberOfLines={1}>
                        {program.category || 'Programa'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Resultados de Videos */}
            {results.videos.length > 0 && (
              <View className="mb-6">
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-primary text-sm tracking-widest uppercase mb-3">
                  Videos / Episodios
                </Text>
                {results.videos.map((video) => (
                  <TouchableOpacity 
                    key={video.id}
                    onPress={() => {
                      router.back();
                      setTimeout(() => router.push(`/watch/${video.id}`), 100);
                    }}
                    className="flex-row mb-4 bg-white dark:bg-gray-100 dark:bg-surface-container rounded-xl overflow-hidden"
                  >
                    <View className="w-32 h-24 relative bg-black">
                      <Image 
                        source={{ uri: fixUrl(video.thumbnail) }} 
                        className="w-full h-full opacity-90"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 items-center justify-center">
                        <MaterialIcons name="play-circle-outline" size={24} color="#FFF" />
                      </View>
                    </View>
                    <View className="flex-1 p-3 justify-center">
                      <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-black dark:text-on-surface text-sm" numberOfLines={2}>
                        {video.title}
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-primary text-[10px] uppercase mt-2">
                        {video.category || 'Radio América'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
