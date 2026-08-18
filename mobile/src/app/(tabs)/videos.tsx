import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config/api';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const columnWidth = (width - 48 - 16) / 2; // Margen horizontal 24 a cada lado (48) y espaciado de 16

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchPrograms = async () => {
    try {
      let data: any = null;
      try {
        const fRes = await fetch(`${API_URL}/programs`, { headers: { 'Accept': 'application/json' } });
        if (fRes.ok) data = await fRes.json();
      } catch (_) {}
      
      if (!data) {
        try {
          const aRes = await axios.get(`${API_URL}/programs`);
          data = aRes.data;
        } catch (_) {}
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setPrograms(data);
        AsyncStorage.setItem('@cache_programs', JSON.stringify(data)).catch(() => {});
      } else {
        const cached = await AsyncStorage.getItem('@cache_programs');
        if (cached) setPrograms(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cache_programs');
        if (cached) setPrograms(JSON.parse(cached));
      } catch (_) {}
    };
    loadCache();
    fetchPrograms();
    const intervalId = setInterval(fetchPrograms, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPrograms();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPrograms();
  };

  const podcastList = programs.filter(p => p.type === 'Podcast');
  const programList = programs.filter(p => p.type !== 'Podcast');

  const fixUrl = (url: string) => {
    if (url && url.startsWith('/')) {
      return `${BASE_URL}${url}`;
    }
    return url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=600&auto=format&fit=crop';
  };

  const renderCard = (program: any) => (
    <TouchableOpacity 
      key={program.id}
      activeOpacity={0.8}
      onPress={() => router.push(`/program/${program.id}`)}
      style={{ width: columnWidth, height: columnWidth * 1.5 }}
      className="mb-4 rounded-xl overflow-hidden border border-outline-variant/10 shadow-lg relative bg-white dark:bg-gray-100 dark:bg-surface-container"
    >
      <Image 
        source={{ uri: fixUrl(program.thumbnail) }} 
        className="w-full h-full absolute inset-0"
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.8)']}
        className="absolute inset-0"
        locations={[0, 0.4, 1]}
      />
      <View className="absolute bottom-4 left-3 right-3">
        <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[9px] text-[#FFB91F] uppercase tracking-widest mb-1">
          {program.category || 'Categoría'}
        </Text>
        <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white text-sm leading-tight" numberOfLines={2}>
          {program.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-surface">
        <ActivityIndicator size="large" color="#C13535" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-surface">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C13535" />
        }
      >
        
        {/* Header */}
        <View className="px-6 pt-16 pb-8 items-center text-center">
          <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-3xl text-primary text-center tracking-tighter mb-2">
            CATÁLOGO DE <Text className="text-secondary-container">CONTENIDO</Text>
          </Text>
          <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-sm text-primary/80 text-center max-w-[280px]">
            Explora toda nuestra parrilla, desde programas de información general hasta podcasts de nicho.
          </Text>
        </View>

        {/* Programas */}
        {programList.length > 0 && (
          <View className="px-6 mb-10">
            <View className="flex-row items-center border-b border-outline-variant/20 pb-4 mb-6">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-primary mr-4 tracking-tighter">
                PROGRAMAS
              </Text>
              <View className="h-1 w-12 bg-primary rounded-full" />
            </View>

            <View className="flex-row flex-wrap justify-between">
              {programList.map(renderCard)}
            </View>
          </View>
        )}

        {/* Podcasts */}
        {podcastList.length > 0 && (
          <View className="px-6 mb-10">
            <View className="flex-row items-center border-b border-outline-variant/20 pb-4 mb-6">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-primary mr-4 tracking-tighter">
                PODCASTS
              </Text>
              <View className="h-1 w-12 bg-secondary-container rounded-full" />
            </View>

            <View className="flex-row flex-wrap justify-between">
              {podcastList.map(renderCard)}
            </View>
          </View>
        )}
        
        {programList.length === 0 && podcastList.length === 0 && (
           <View className="px-6 py-10 items-center">
             <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant">
               No hay contenido disponible en el catálogo.
             </Text>
           </View>
        )}

      </ScrollView>
    </View>
  );
}
