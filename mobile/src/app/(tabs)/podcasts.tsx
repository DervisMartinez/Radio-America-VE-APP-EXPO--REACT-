import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Link, useRouter } from 'expo-router';
import CurrencyTicker from '../../components/CurrencyTicker';
import GlobalLoader from '../../components/GlobalLoader';
import { useFocusEffect } from 'expo-router';

// Función para remover etiquetas HTML de los títulos o extractos
const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '') : '';
};

export default function NewsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (posts.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex === 4 ? 0 : prevIndex + 1; // 5 posts (0 to 4)
          scrollViewRef.current?.scrollTo({ x: nextIndex * Dimensions.get('window').width, animated: true });
          return nextIndex;
        });
      }, 5000); // Cambiar cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [posts]);

  const fetchNews = async () => {
    try {
      // Obtenemos 50 noticias para poder clasificar en varias categorías
      const res = await axios.get('https://radioamerica.com.ve/wp-json/wp/v2/posts?_embed&per_page=50');
      setPosts(res.data);
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const intervalId = setInterval(fetchNews, 30000); // Polling background every 30s
    return () => clearInterval(intervalId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNews();
  };

  if (loading && !refreshing) {
    return <GlobalLoader />;
  }

  if (posts.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-surface">
        <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-on-surface">No hay noticias disponibles</Text>
      </View>
    );
  }

  // Filtros de categorías
  const hasKeyword = (post: any, words: string[]) => {
    const title = post.title?.rendered?.toLowerCase() || '';
    return words.some(w => title.includes(w));
  };

  // Dividimos las noticias dinámicamente
  const heroPosts = posts.slice(0, 5); // Las 5 más recientes para el carrusel
  const remainingPosts = posts.slice(5);

  const sucesosPosts = remainingPosts.filter(p => p.categories?.includes(43)).slice(0, 5);
  const deportesPosts = remainingPosts.filter(p => p.categories?.includes(37)).slice(0, 5);
  
  // Sismos o Internacionales (Cat 52 o palabras clave)
  const sismosPosts = remainingPosts.filter(p => 
    p.categories?.includes(52) || hasKeyword(p, ['terremoto', 'sismo', 'réplica', 'temblor'])
  ).slice(0, 5);

  // Excluir los ya usados para surtidas
  const usedIds = new Set([
    ...heroPosts.map(p => p.id),
    ...sucesosPosts.map(p => p.id),
    ...deportesPosts.map(p => p.id),
    ...sismosPosts.map(p => p.id)
  ]);
  const surtidasPosts = posts.filter(p => !usedIds.has(p.id)).slice(0, 10);

  const getAuthorName = (post: any) => {
    return post._embedded?.author?.[0]?.name || 'Radio América';
  };

  // Extraer la imagen destacada de la respuesta de WordPress o null
  const getThumbnail = (post: any) => {
    return post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
  };

  const renderImage = (post: any, className: string) => {
    const thumb = getThumbnail(post);
    if (thumb) {
      return <Image source={{ uri: thumb }} className={className} resizeMode="cover" />;
    } else {
      return (
        <View className={`${className} bg-primary items-center justify-center`}>
          <Image source={require('../../../assets/images/logo_blanco.png')} className="w-1/2 h-1/2 opacity-50" resizeMode="contain" />
        </View>
      );
    }
  };

  // Formatear la fecha
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-VE', options);
  };

  return (
    <View className="flex-1 bg-white dark:bg-surface">
      {/* TopAppBar */}
      <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 pt-12 pb-4 pointer-events-box-none">
        <View className="flex-row items-center bg-black/60 dark:bg-black/70 px-4 py-1.5 rounded-full border border-white/15 shadow-lg shadow-black/80 backdrop-blur-md">
          <Text 
            style={{ 
              fontFamily: 'Montserrat_900Black',
              textShadowColor: 'rgba(0, 0, 0, 0.95)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4,
              letterSpacing: -0.5
            }} 
            className="text-lg text-white font-extrabold" 
            adjustsFontSizeToFit 
            minimumFontScale={0.8} 
            numberOfLines={1}
          >
            RADIO <Text className="text-primary">AMÉRICA</Text>
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/search')} className="active:opacity-80 bg-black/60 dark:bg-black/70 p-2.5 rounded-full border border-white/15 shadow-lg shadow-black/80 backdrop-blur-md pointer-events-auto">
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ffb3ad" />
        }
      >
        
        {/* Hero Section (Carrusel) */}
        {heroPosts.length > 0 && (
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            className="mb-8"
          >
            {heroPosts.map((post) => (
              <Link key={`hero-${post.id}`} href={`/news/${post.id}`} asChild>
                <TouchableOpacity activeOpacity={0.9} className="relative w-screen h-[530px]">
                  {renderImage(post, "absolute w-full h-full")}
                  <LinearGradient
                    colors={['rgba(19,19,20,0)', 'rgba(19,19,20,0.8)', 'rgba(19,19,20,1)']}
                    className="absolute inset-0"
                    locations={[0, 0.6, 1]}
                  />
                  
                  <View className="absolute bottom-0 left-0 w-full p-6 pb-8 z-10 flex-col justify-end">
                    <View className="mb-4 self-start bg-primary-container px-3 py-1 rounded-full">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-on-primary-container text-[10px] uppercase tracking-widest">
                        Destacada
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-3xl text-black dark:text-on-surface leading-tight tracking-tight mb-3" numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {stripHtml(post.title.rendered)}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xs text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                        {getAuthorName(post)}
                      </Text>
                      <Text className="text-xs text-black dark:text-gray-600 dark:text-on-surface-variant">•</Text>
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xs text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                        {formatDate(post.date)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        )}

        <CurrencyTicker />

        {/* Sucesos */}
        {sucesosPosts.length > 0 && (
          <View className="px-6 mb-12">
            <View className="border-l-4 border-primary-container pl-3 mb-6">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-black dark:text-on-surface" adjustsFontSizeToFit numberOfLines={1}>Sucesos</Text>
            </View>
            <View className="flex-col gap-6">
              {sucesosPosts.map((post) => (
                <Link key={`suceso-${post.id}`} href={`/news/${post.id}`} asChild>
                  <TouchableOpacity className="flex-row gap-4 active:opacity-80">
                    <View className="w-1/3 aspect-square rounded-lg overflow-hidden">
                      {renderImage(post, "w-full h-full")}
                    </View>
                    <View className="flex-1 flex-col justify-center">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-primary-container text-[10px] uppercase tracking-widest mb-2">
                        Sucesos
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-base text-black dark:text-on-surface leading-snug mb-2" numberOfLines={3}>
                        {stripHtml(post.title.rendered)}
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-[10px] text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                        Por {getAuthorName(post)} • {formatDate(post.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        )}

        {/* Deportivas */}
        {deportesPosts.length > 0 && (
          <View className="px-6 mb-12">
            <View className="border-l-4 border-tertiary pl-3 mb-6">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-black dark:text-on-surface" adjustsFontSizeToFit numberOfLines={1}>Deportes</Text>
            </View>
            <View className="flex-col gap-6">
              {deportesPosts.map((post) => (
                <Link key={`depor-${post.id}`} href={`/news/${post.id}`} asChild>
                  <TouchableOpacity className="flex-row gap-4 active:opacity-80">
                    <View className="w-1/3 aspect-square rounded-lg overflow-hidden">
                      {renderImage(post, "w-full h-full")}
                    </View>
                    <View className="flex-1 flex-col justify-center">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-tertiary text-[10px] uppercase tracking-widest mb-2">
                        Deportes
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-base text-black dark:text-on-surface leading-snug mb-2" numberOfLines={3}>
                        {stripHtml(post.title.rendered)}
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-[10px] text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                        Por {getAuthorName(post)} • {formatDate(post.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        )}

        {/* Terremoto / Internacionales */}
        {sismosPosts.length > 0 && (
          <View className="px-6 mb-12">
            <View className="border-l-4 border-error pl-3 mb-6">
              <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-black dark:text-on-surface" adjustsFontSizeToFit numberOfLines={1}>Terremoto / Internacional</Text>
            </View>
            <View className="flex-col gap-6">
              {sismosPosts.map((post) => (
                <Link key={`sismo-${post.id}`} href={`/news/${post.id}`} asChild>
                  <TouchableOpacity className="flex-row gap-4 active:opacity-80">
                    <View className="w-1/3 aspect-square rounded-lg overflow-hidden">
                      {renderImage(post, "w-full h-full")}
                    </View>
                    <View className="flex-1 flex-col justify-center">
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-error text-[10px] uppercase tracking-widest mb-2">
                        Alerta
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-base text-black dark:text-on-surface leading-snug mb-2" numberOfLines={3}>
                        {stripHtml(post.title.rendered)}
                      </Text>
                      <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-[10px] text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                        Por {getAuthorName(post)} • {formatDate(post.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        )}

        {/* Surtidas / Más Noticias */}
        {surtidasPosts.length > 0 && (
          <View className="px-4 mb-8">
            <View className="bg-white dark:bg-gray-100 dark:bg-gray-50 dark:bg-surface-container-low py-8 px-4 rounded-2xl">
              <View className="border-l-4 border-outline pl-3 mb-6">
                <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-black dark:text-on-surface" adjustsFontSizeToFit numberOfLines={1}>Más Noticias</Text>
              </View>
              
              <View className="flex-col gap-6">
                {surtidasPosts.map((post) => (
                  <Link key={`surtida-${post.id}`} href={`/news/${post.id}`} asChild>
                    <TouchableOpacity className="bg-white dark:bg-gray-100 dark:bg-surface-container rounded-xl overflow-hidden active:opacity-80">
                      <View className="aspect-video w-full">
                        {renderImage(post, "w-full h-full")}
                      </View>
                      <View className="p-5">
                        <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-base text-black dark:text-on-surface leading-snug mb-3">
                          {stripHtml(post.title.rendered)}
                        </Text>
                        <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-[10px] text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-wider">
                          Por {getAuthorName(post)} • {formatDate(post.date)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
