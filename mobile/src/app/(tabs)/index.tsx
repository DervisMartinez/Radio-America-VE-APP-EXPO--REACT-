import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Animated, Platform, RefreshControl, Linking, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { API_URL } from '../../config/api';
import { useRadio } from '../../context/RadioContext';
import GlobalLoader from '../../components/GlobalLoader';
import BannersCarousel from '../../components/BannersCarousel';

export interface VideoProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  isLive?: boolean;
  isFeatured?: boolean;
  isShort?: boolean;
}

export interface ProgramProps {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  host?: string;
}

const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '') : '';
};

const safeFetchJson = async (url: string, cacheKey?: string) => {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && cacheKey && Array.isArray(data) && data.length > 0) {
        AsyncStorage.setItem(cacheKey, JSON.stringify(data)).catch(() => {});
      }
      return data;
    }
  } catch (_) {}

  try {
    const aRes = await axios.get(url);
    if (aRes.data) {
      if (cacheKey && Array.isArray(aRes.data) && aRes.data.length > 0) {
        AsyncStorage.setItem(cacheKey, JSON.stringify(aRes.data)).catch(() => {});
      }
      return aRes.data;
    }
  } catch (_) {}

  if (cacheKey) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
  }
  return [];
};

export default function HomeScreen() {
  const router = useRouter();
  const { toggleRadio, isPlaying } = useRadio();
  const [videos, setVideos] = useState<VideoProps[]>([]);
  const [programs, setPrograms] = useState<ProgramProps[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animación Hero Slider (Acordeón)
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const [activeCategory, setActiveCategory] = useState('Todo');

  const fetchData = async () => {
    try {
      const [videosData, programsData, newsData, bannersData] = await Promise.all([
        safeFetchJson(`${API_URL}/videos`, '@cache_videos'),
        safeFetchJson(`${API_URL}/programs`, '@cache_programs'),
        safeFetchJson('https://radioamerica.com.ve/wp-json/wp/v2/posts?_embed&per_page=5', '@cache_news'),
        safeFetchJson(`${API_URL}/banners`, '@cache_banners')
      ]);
      if (videosData && Array.isArray(videosData) && videosData.length > 0) setVideos(videosData);
      if (programsData && Array.isArray(programsData) && programsData.length > 0) setPrograms(programsData);
      if (newsData && Array.isArray(newsData) && newsData.length > 0) setNews(newsData);
      if (bannersData && Array.isArray(bannersData)) setBanners(bannersData);
    } catch (err) {
      console.error("Error general al cargar datos:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Carga inicial rápida desde caché
    const loadCache = async () => {
      try {
        const [cVids, cProgs, cNews] = await Promise.all([
          AsyncStorage.getItem('@cache_videos'),
          AsyncStorage.getItem('@cache_programs'),
          AsyncStorage.getItem('@cache_news')
        ]);
        if (cVids) setVideos(JSON.parse(cVids));
        if (cProgs) setPrograms(JSON.parse(cProgs));
        if (cNews) setNews(JSON.parse(cNews));
      } catch (_) {}
    };
    loadCache();
    fetchData();
    const intervalId = setInterval(fetchData, 30000); // Polling every 30s
    return () => clearInterval(intervalId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Seleccionar videos destacados o en vivo para rotar
  const liveVideos = videos.filter(v => v.isLive);
  const featuredVideos = videos.filter(v => v.isFeatured || v.isLive);
  const activeHeroVideos = featuredVideos.length > 0 ? featuredVideos : videos.slice(0, 5);

  useEffect(() => {
    if (activeHeroVideos.length <= 1) return;

    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        setCurrentFeaturedIndex(prev => (prev + 1) % activeHeroVideos.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [activeHeroVideos.length]);

  if (loading && !refreshing) {
    return <GlobalLoader />;
  }

  const heroVideo = activeHeroVideos[currentFeaturedIndex] || videos[0];
  
  const categories = ['Todo', 'Historia', 'Personajes', 'Sociedad', 'Deportes'];
  const nonFeaturedVideos = videos.filter(v => !v.isFeatured && !v.isShort);
  const filteredVideos = activeCategory === 'Todo' ? nonFeaturedVideos : nonFeaturedVideos.filter(v => v.category === activeCategory);

  return (
    <View className="flex-1 bg-white dark:bg-surface">
      {/* TopAppBar */}
      <View className="absolute top-0 w-full z-50 flex-row justify-end items-center px-6 pt-12 pb-4 pointer-events-box-none">
          <TouchableOpacity onPress={() => router.push('/search')} className="active:opacity-80 bg-gray-100 dark:bg-surface-container p-2 rounded-full shadow-sm pointer-events-auto">
            <MaterialIcons name="search" size={28} color="#C13535" />
          </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C13535" />
        }
      >
        
        {/* Hero Section */}
        {heroVideo && (
          <Animated.View style={{ height: Dimensions.get('window').height * 0.75, opacity: fadeAnim, justifyContent: 'flex-end' }} className="relative w-full flex-col">
            <View className="absolute inset-0 z-0">
              <Image 
                source={{ uri: heroVideo.thumbnail }} 
                className="w-full h-full absolute"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/20" />
              <View className="absolute inset-0 bg-gradient-to-t from-[#131314] via-[#131314]/80 to-transparent" />
            </View>

            <View className="relative z-20 px-6 pb-12 w-full pt-32">
              {heroVideo.isLive && (
                <View className="flex-row items-center gap-2 px-3 py-1 bg-primary-container rounded-full mb-4 self-start">
                  <View className="w-2 h-2 rounded-full bg-error" />
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-on-primary-container text-[10px] tracking-widest uppercase">
                    En Vivo Ahora
                  </Text>
                </View>
              )}

              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-3xl sm:text-4xl text-white mb-3 leading-tight" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
                {heroVideo.title}
              </Text>

              <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-white/80 text-base mb-6" numberOfLines={2}>
                {heroVideo.description || "Análisis profundo, entrevistas exclusivas y cobertura total desde el corazón de Carabobo."}
              </Text>

              <View className="flex-row items-center gap-4">
                {heroVideo.isLive ? (
                  <TouchableOpacity 
                    onPress={toggleRadio}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-primary px-6 py-3 rounded-full"
                  >
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={24} color="#fff" />
                    <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white">
                      {isPlaying ? 'PAUSAR RADIO' : 'SINTONIZAR RADIO'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={() => router.push(`/watch/${heroVideo.id}`)}
                    className="flex-1 flex-row items-center justify-center gap-2 bg-primary-container px-6 py-3 rounded-full"
                  >
                    <MaterialIcons name="play-arrow" size={24} color="#ffe4e1" />
                    <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-on-primary-container">
                      VER VIDEO
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity className="items-center justify-center w-12 h-12 rounded-full border border-outline-variant/30">
                  <MaterialIcons name="add" size={24} color="#e1bebb" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Programas Destacados */}
        {programs.length > 0 && (
          <View className="py-8 bg-gray-50 dark:bg-surface-container-low">
            <View className="px-6 flex-row justify-between items-end mb-4">
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xl text-black dark:text-on-surface tracking-tight" adjustsFontSizeToFit numberOfLines={1}>Programas Destacados</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
              {programs.map(program => (
                <TouchableOpacity 
                  key={program.id} 
                  className="w-72 rounded-lg overflow-hidden bg-gray-100 dark:bg-surface-container shadow-md"
                  onPress={() => router.push(`/program/${program.id}`)}
                >
                  <View className="w-full aspect-video relative">
                    <Image 
                      source={{ uri: program.thumbnail }} 
                      className="w-full h-full absolute"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/30" />
                    <View className="absolute bottom-3 left-3 w-10 h-10 rounded-full bg-gray-100/80 dark:bg-surface-container/80 items-center justify-center">
                      <MaterialIcons name="play-arrow" size={24} color="#ffb3ad" />
                    </View>
                  </View>
                  <View className="p-4 bg-gray-50 dark:bg-surface-container-low">
                    <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[10px] text-tertiary tracking-widest uppercase mb-1" numberOfLines={1}>
                      {program.category || "General"}
                    </Text>
                    <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-base text-black dark:text-on-surface leading-tight" numberOfLines={1}>
                      {program.name}
                    </Text>
                    <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-sm text-gray-600 dark:text-on-surface-variant mt-1" numberOfLines={1}>
                      {program.host ? `Con ${program.host}` : program.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Banners Publicitarios */}
        <BannersCarousel banners={banners} />

      {/* Archivo de Video por Categorías */}
        {nonFeaturedVideos.length > 0 && (
          <View className="py-8 bg-white dark:bg-surface">
            <View className="px-6 mb-4">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-primary tracking-tighter uppercase mb-1" adjustsFontSizeToFit numberOfLines={1}>Archivo de Video</Text>
              <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-sm text-gray-600 dark:text-on-surface-variant mb-4">
                Explora el mejor contenido categorizado.
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                <View className="flex-row gap-2">
                  {categories.map(category => (
                    <TouchableOpacity 
                      key={category}
                      onPress={() => setActiveCategory(category)}
                      className={`px-5 py-2 rounded-full ${
                        activeCategory === category 
                          ? 'bg-primary text-on-primary' 
                          : 'bg-gray-100 dark:bg-surface-container text-gray-600 dark:text-on-surface-variant'
                      }`}
                    >
                      <Text 
                        style={{ fontFamily: 'Montserrat_700Bold' }} 
                        className={`text-xs ${activeCategory === category ? 'text-white' : 'text-black dark:text-on-surface'}`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {filteredVideos.length === 0 ? (
              <View className="px-6 py-4">
                <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-gray-600 dark:text-on-surface-variant text-center">
                  No hay videos disponibles en esta categoría.
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
                {filteredVideos.map(video => (
                  <TouchableOpacity 
                    key={video.id} 
                    className="w-48"
                    onPress={() => router.push(`/watch/${video.id}`)}
                  >
                    <View className="aspect-video rounded-lg overflow-hidden relative mb-3 bg-gray-100 dark:bg-surface-container shadow-md">
                      <Image 
                        source={{ uri: video.thumbnail || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop' }} 
                        className="w-full h-full absolute"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 bg-black/20 items-center justify-center">
                        <MaterialIcons name="play-circle-filled" size={40} color="white" />
                      </View>
                      <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded">
                         <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[9px] text-white tracking-widest uppercase">
                           {video.category || 'General'}
                         </Text>
                      </View>
                    </View>
                    <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-black dark:text-on-surface leading-tight" numberOfLines={2}>
                      {video.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Asistente Virtual RAMI */}
        <View className="px-6 py-8 bg-gray-50 dark:bg-surface-container-low mb-8 mx-4 mt-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <View className="flex-row items-center gap-4 mb-4">
            <View className="w-14 h-14 rounded-full bg-gray-200 shadow-md shadow-black/10 overflow-hidden">
              <Image 
                source={{ uri: 'https://radioamerica.com.ve/wp-content/plugins/RAMI-CHATBOT/assets/bot-icon.JPG' }} 
                className="w-full h-full" 
                resizeMode="cover"
              />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-xl text-black dark:text-on-surface">
                Hola, soy RAMI 👋
              </Text>
              <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-sm text-gray-600 dark:text-on-surface-variant">
                Tu asistente virtual de Radio América
              </Text>
            </View>
          </View>
          <View className="bg-gray-100 dark:bg-surface-container p-4 rounded-xl rounded-tl-sm mb-4">
             <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-black dark:text-on-surface leading-relaxed">
               ¿En qué te puedo ayudar hoy? Pregúntame sobre nuestra programación, noticias de Carabobo o cómo sintonizarnos.
             </Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/rami')}
            className="flex-row items-center bg-primary/10 border border-primary/30 py-3 px-4 rounded-full"
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color="#C13535" style={{ marginRight: 12 }} />
            <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-primary flex-1">
              Escribe un mensaje...
            </Text>
            <MaterialIcons name="send" size={20} color="#C13535" />
          </TouchableOpacity>
        </View>

        {/* Noticias Destacadas */}
        {news.length > 0 && (
          <View className="mb-8">
            <View className="px-6 flex-row justify-between items-center mb-4">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-xl text-black dark:text-on-surface">
                Noticias Destacadas
              </Text>
              <TouchableOpacity onPress={() => router.push('/podcasts')}>
                <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-primary text-sm">Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
              {news.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  className="w-64 bg-white dark:bg-surface-container rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20"
                  onPress={() => router.push(`/news/${item.id}`)}
                >
                  <View className="h-36 w-full relative">
                    <Image 
                      source={{ uri: item._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop' }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/20" />
                  </View>
                  <View className="p-4">
                    <Text 
                      style={{ fontFamily: 'Montserrat_700Bold' }} 
                      className="text-sm text-black dark:text-on-surface leading-tight mb-2" 
                      numberOfLines={2}
                    >
                      {stripHtml(item.title.rendered)}
                    </Text>
                    <Text 
                      style={{ fontFamily: 'Montserrat_400Regular' }} 
                      className="text-xs text-gray-600 dark:text-on-surface-variant mb-4" 
                      numberOfLines={2}
                    >
                      {stripHtml(item.excerpt.rendered)}
                    </Text>
                    <View className="flex-row items-center">
                      <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-primary text-xs uppercase tracking-wider">
                        Leer artículo
                      </Text>
                      <MaterialIcons name="chevron-right" size={16} color="#C13535" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Redes Sociales */}
        <View className="px-6 mb-12">
          <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-lg text-black dark:text-on-surface mb-6 text-center">
            Síguenos en nuestras redes
          </Text>
          <View className="flex-row justify-center items-center gap-6">
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.instagram.com/radioamericave/')} 
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center shadow-sm"
            >
              <FontAwesome5 name="instagram" size={24} color="#C13535" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://twitter.com/radioamericave')} 
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center shadow-sm"
            >
              <FontAwesome5 name="twitter" size={24} color="#C13535" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.facebook.com/radioamericave')} 
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center shadow-sm"
            >
              <FontAwesome5 name="facebook-f" size={22} color="#C13535" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.tiktok.com/@radioamericave')} 
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center shadow-sm"
            >
              <FontAwesome5 name="tiktok" size={22} color="#C13535" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.youtube.com/@radioamericave')} 
              className="w-12 h-12 rounded-full bg-gray-100 dark:bg-surface-container items-center justify-center shadow-sm"
            >
              <FontAwesome5 name="youtube" size={22} color="#C13535" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
