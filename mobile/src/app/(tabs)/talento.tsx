import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL, BASE_URL } from '../../config/api';

export default function TalentScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTalent = async () => {
      try {
        const res = await axios.get(`${API_URL}/programs`);
        // Filtrar programas que tienen host
        const withHosts = res.data.filter((p: any) => p.host);
        setPrograms(withHosts);
      } catch (err) {
        console.error('Error fetching talent:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalent();
  }, []);

  const fixUrl = (url: string) => {
    if (url && url.startsWith('/')) {
      return `${BASE_URL}${url}`;
    }
    return url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop';
  };

  return (
    <View className="flex-1 bg-white dark:bg-surface pt-12">
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-6 pb-4 border-b border-outline-variant/20">
        <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-primary tracking-tighter" adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>
          TALENTO AMÉRICA
        </Text>
        <TouchableOpacity onPress={() => router.push('/search')} className="bg-white dark:bg-gray-100 dark:bg-surface-container p-2 rounded-full shadow-sm">
          <MaterialIcons name="search" size={28} color="#C13535" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-sm mb-6 px-2">
          Conoce a las voces y personalidades que dan vida a Estudio Radio América.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#C13535" className="mt-10" />
        ) : programs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <MaterialIcons name="mic-none" size={64} color="#8a8a8a" />
            <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant mt-4 text-center px-8">
              Actualmente no hay información de talento disponible.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {programs.map((program) => (
              <TouchableOpacity
                key={program.id}
                onPress={() => router.push(`/program/${program.id}`)}
                className="w-[48%] mb-6"
              >
                <View className="aspect-[4/5] bg-white dark:bg-gray-100 dark:bg-surface-container rounded-2xl overflow-hidden mb-3 relative shadow-md">
                  <Image 
                    source={{ uri: fixUrl(program.hostImage || program.thumbnail) }} 
                    className="w-full h-full absolute"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <View className="absolute bottom-3 left-3 right-3">
                    <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-white text-base leading-tight mb-1" numberOfLines={2}>
                      {program.host}
                    </Text>
                    <View className="flex-row items-center">
                      <MaterialIcons name="mic" size={12} color="#F07D00" className="mr-1" />
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[#F07D00] text-[10px] tracking-widest uppercase" numberOfLines={1}>
                        {program.name}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
