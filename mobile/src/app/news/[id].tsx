import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '') : '';
};

const extractQuotes = (text: string): { type: 'paragraph' | 'quote'; text: string }[] => {
  const extractedBlocks: { type: 'paragraph' | 'quote'; text: string }[] = [];
  const quoteRegex = /([“"«].*?[”"»])/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = quoteRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index).trim();
      if (beforeText.length > 0) {
        extractedBlocks.push({ type: 'paragraph', text: beforeText });
      }
    }
    // Solo extraer citas significativas, evitar palabras sueltas entre comillas
    if (match[1].length > 25) {
      extractedBlocks.push({ type: 'quote', text: match[1] });
    } else {
      // Si es muy corta, tratarla como texto normal
      extractedBlocks.push({ type: 'paragraph', text: match[1] });
    }
    lastIndex = quoteRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex).trim();
    if (afterText.length > 0) {
      extractedBlocks.push({ type: 'paragraph', text: afterText });
    }
  }
  
  // Unir párrafos adyacentes que puedan haberse separado por citas cortas
  const merged: { type: 'paragraph' | 'quote'; text: string }[] = [];
  for (const block of extractedBlocks) {
    if (merged.length > 0 && merged[merged.length - 1].type === 'paragraph' && block.type === 'paragraph') {
      merged[merged.length - 1].text += ' ' + block.text;
    } else {
      merged.push(block);
    }
  }

  return merged.length > 0 ? merged : [{ type: 'paragraph' as const, text }];
};

const parseContent = (html: string) => {
  if (!html) return [];
  
  const content = html.replace(/\n/g, ' ');
  const blocks: { type: 'paragraph' | 'quote'; text: string }[] = [];
  
  const regex = /<(p|blockquote)[^>]*>(.*?)<\/\1>/gi;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const innerHtml = match[2];
    const text = stripHtml(innerHtml).trim();
    
    if (text.length > 0) {
      if (tag === 'blockquote') {
        blocks.push({ type: 'quote', text });
      } else {
        blocks.push(...extractQuotes(text));
      }
    }
  }
  
  if (blocks.length === 0) {
     const fallbackBlocks = html.split(/<\/p>|<br\s*\/?>/i)
      .map(block => stripHtml(block).trim())
      .filter(block => block.length > 0);
      
     fallbackBlocks.forEach(text => {
       blocks.push(...extractQuotes(text));
     });
  }

  return blocks;
};

export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const getThumbnail = (p: any) => {
    return p?._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop';
  };

  useEffect(() => {
    if (!id) return;

    // 1. Carga ultra rápida desde caché instantánea
    const loadCache = async () => {
      try {
        const [cachedSingle, cachedAll] = await Promise.all([
          AsyncStorage.getItem(`@cache_post_${id}`),
          AsyncStorage.getItem('@cache_news')
        ]);
        if (cachedSingle) {
          setPost(JSON.parse(cachedSingle));
          setLoading(false);
        } else if (cachedAll) {
          const list = JSON.parse(cachedAll);
          const found = list.find((p: any) => String(p.id) === String(id));
          if (found) {
            setPost(found);
            setLoading(false);
          }
        }

        // Verificar estado de bookmark
        const storedBookmarks = await AsyncStorage.getItem('@saved_bookmarks');
        if (storedBookmarks) {
          const bList = JSON.parse(storedBookmarks);
          setIsBookmarked(bList.some((item: any) => String(item.id) === String(id)));
        }
      } catch (_) {}
    };

    loadCache();

    // 2. Fetch en paralelo en segundo plano
    const fetchArticle = async () => {
      try {
        const [postRes, relatedRes] = await Promise.all([
          axios.get(`https://radioamerica.com.ve/wp-json/wp/v2/posts/${id}?_embed`),
          axios.get(`https://radioamerica.com.ve/wp-json/wp/v2/posts?_embed&per_page=3&exclude=${id}`).catch(() => ({ data: [] }))
        ]);
        
        if (postRes.data) {
          setPost(postRes.data);
          AsyncStorage.setItem(`@cache_post_${id}`, JSON.stringify(postRes.data)).catch(() => {});
        }
        if (relatedRes.data) {
          setRelatedPosts(relatedRes.data);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const handleShare = async () => {
    try {
      const postTitle = stripHtml(post?.title?.rendered || 'Radio América');
      const postUrl = post?.link || `https://radioamerica.com.ve/?p=${id}`;
      await Share.share({
        title: postTitle,
        message: `${postTitle}\n\nLee la noticia completa en Radio América:\n${postUrl}`,
        url: postUrl,
      });
    } catch (error) {
      console.error('Error sharing article:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!post) return;
    try {
      const stored = await AsyncStorage.getItem('@saved_bookmarks');
      let list = stored ? JSON.parse(stored) : [];
      if (isBookmarked) {
        list = list.filter((item: any) => String(item.id) !== String(id));
        setIsBookmarked(false);
        Alert.alert('Guardados', 'Noticia eliminada de tus guardados.');
      } else {
        const itemToSave = {
          id: String(post.id),
          title: post.title?.rendered,
          excerpt: post.excerpt?.rendered,
          date: post.date,
          thumbnail: getThumbnail(post),
          link: post.link,
          savedAt: new Date().toISOString(),
        };
        list = [itemToSave, ...list.filter((item: any) => String(item.id) !== String(id))];
        setIsBookmarked(true);
        Alert.alert('Guardado', 'Noticia guardada para leer más tarde.');
      }
      await AsyncStorage.setItem('@saved_bookmarks', JSON.stringify(list));
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  if (loading && !post) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#ffb3ad" />
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-on-surface">Artículo no encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 px-4 py-2 bg-primary rounded">
          <Text className="text-on-primary font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-VE', options);
  };

  const blocks = parseContent(post.content.rendered);

  return (
    <View className="flex-1 bg-background relative">
      <Stack.Screen options={{ headerShown: false }} />
      {/* TopAppBar */}
      <View className="absolute top-0 w-full z-50 flex-row justify-between items-center px-6 pt-12 pb-4 bg-white dark:bg-[#131314] border-b border-outline-variant/10 shadow-sm">
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/podcasts')} className="active:opacity-80 p-1">
          <MaterialIcons name="arrow-back" size={28} color="#C13535" />
        </TouchableOpacity>
        <View className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">
          <Text 
            style={{ 
              fontFamily: 'Montserrat_900Black',
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3
            }} 
            className="text-lg text-primary tracking-tighter"
          >
            RADIO AMÉRICA
          </Text>
        </View>
        <TouchableOpacity onPress={toggleBookmark} className="active:opacity-80 p-1">
          <MaterialIcons 
            name={isBookmarked ? "bookmark" : "bookmark-border"} 
            size={28} 
            color={isBookmarked ? "#C13535" : "#ffb3ad"} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* Hero Image Header with Gradient Fade */}
        <View className="relative w-full h-[442px] min-h-[400px]">
          <Image 
            source={{ uri: getThumbnail(post) }} 
            className="absolute inset-0 w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(19,19,20,0.6)', '#131314']}
            className="absolute inset-0"
            locations={[0, 0.6, 1]}
          />
          <View className="absolute bottom-0 left-0 w-full p-6 pb-2">
            <View className="self-start bg-white dark:bg-gray-100 dark:bg-gray-300 dark:bg-surface-container-highest px-3 py-1 rounded-full mb-4 shadow-sm shadow-tertiary/15">
              <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-tertiary text-[10px] uppercase tracking-widest">
                Destacadas
              </Text>
            </View>
            <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-3xl md:text-5xl text-black dark:text-on-surface leading-tight tracking-tight mb-4">
              {stripHtml(post.title.rendered)}
            </Text>
            
            <View className="flex-row items-center justify-between mt-6">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-[#131314] overflow-hidden items-center justify-center p-1">
                  <Image 
                    source={
                      post._embedded?.author?.[0]?.avatar_urls?.['96'] 
                      ? { uri: post._embedded.author[0].avatar_urls['96'] } 
                      : require('../../../assets/images/logo_blanco.png')
                    } 
                    className="w-full h-full" 
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-sm text-[#DDDADB]">
                    {post._embedded?.author?.[0]?.name || 'Radio América'}
                  </Text>
                  <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-xs text-[#DDDADB]/70">{formatDate(post.date)}</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={handleShare}
                activeOpacity={0.7}
                className="w-10 h-10 rounded-full bg-white/20 dark:bg-surface-container/50 items-center justify-center shadow-md active:scale-95"
              >
                <MaterialIcons name="share" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Article Body */}
        <View className="px-6 py-8">
          {blocks.map((block, idx) => {
            if (block.type === 'quote') {
              return (
                <View key={`block-${idx}`} className="my-10 pl-6 border-l-4 border-primary-container relative">
                  <MaterialIcons 
                    name="format-quote" 
                    size={60} 
                    color="rgba(193,53,53,0.2)" 
                    style={{ position: 'absolute', top: -16, left: -20 }}
                  />
                  <Text 
                    style={{ fontFamily: 'Montserrat_700Bold' }} 
                    className="text-xl italic text-black dark:text-on-surface z-10 relative"
                  >
                    {block.text}
                  </Text>
                </View>
              );
            }

            // For the first paragraph, make the first letter huge and colored (Drop Cap)
            if (idx === 0) {
              const firstLetter = block.text.charAt(0);
              const restOfText = block.text.slice(1);
              return (
                <Text 
                  key={`block-${idx}`} 
                  style={{ fontFamily: 'Montserrat_400Regular', lineHeight: 28 }} 
                  className="text-[#DDDADB] text-base md:text-lg mb-6 mt-2"
                >
                  <Text style={{ fontFamily: 'Montserrat_900Black', fontSize: 40 }} className="text-primary-container">
                    {firstLetter}
                  </Text>
                  {restOfText}
                </Text>
              );
            }

            return (
              <Text 
                key={`block-${idx}`} 
                style={{ fontFamily: 'Montserrat_400Regular', lineHeight: 28 }} 
                className="text-[#DDDADB] text-base md:text-lg mb-6"
              >
                {block.text}
              </Text>
            );
          })}
        </View>

        {/* Divider */}
        <LinearGradient
          colors={['#131314', '#1c1b1c']}
          className="h-16 w-full mt-4"
        />

        {/* Related News Section */}
        <View className="py-12 bg-white dark:bg-gray-100 dark:bg-gray-50 dark:bg-surface-container-low relative">
          <View className="px-6 mb-8 flex-row items-center">
            <View className="w-2 h-6 bg-primary-container mr-3 rounded-full" />
            <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-2xl text-black dark:text-on-surface">
              Noticias Relacionadas
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 24 }}>
            {relatedPosts.map(related => (
              <Link key={related.id} href={`/news/${related.id}`} asChild>
                <TouchableOpacity className="w-[280px] active:opacity-80">
                  <View className="w-full h-48 rounded-xl overflow-hidden mb-4 relative">
                    <Image source={{ uri: getThumbnail(related) }} className="w-full h-full" resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(42,42,43,0.9)']}
                      className="absolute inset-0 top-1/2"
                    />
                  </View>
                  <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-tertiary text-[10px] uppercase tracking-widest mb-2">
                    Sucesos
                  </Text>
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-lg text-black dark:text-on-surface leading-tight" numberOfLines={2}>
                    {stripHtml(related.title.rendered)}
                  </Text>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </View>
  );
}
