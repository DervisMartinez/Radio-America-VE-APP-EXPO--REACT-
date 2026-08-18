import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDownloads } from '../../context/DownloadContext';
import { useRadio } from '../../context/RadioContext';

const stripHtml = (html: string) => {
  return html ? html.replace(/<[^>]*>?/gm, '') : '';
};

export default function DownloadsScreen() {
  const router = useRouter();
  const { downloads, deleteDownload } = useDownloads();
  const { playMedia } = useRadio();
  const [activeTab, setActiveTab] = useState<'audios' | 'noticias'>('audios');
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  const loadBookmarks = async () => {
    try {
      const stored = await AsyncStorage.getItem('@saved_bookmarks');
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  const handlePlay = (item: any) => {
    playMedia({
      id: item.id,
      title: item.title,
      subtitle: item.category || 'Descarga Offline',
      thumbnail: item.thumbnail,
      url: item.localUri,
    });
  };

  const confirmDeleteDownload = (id: string, title: string) => {
    Alert.alert(
      'Eliminar Descarga',
      `¿Seguro que deseas eliminar "${title}" de tu dispositivo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteDownload(id) }
      ]
    );
  };

  const removeBookmark = async (id: string, title: string) => {
    Alert.alert(
      'Quitar de Guardados',
      `¿Deseas quitar "${stripHtml(title)}" de tus noticias guardadas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const updated = bookmarks.filter((b: any) => String(b.id) !== String(id));
            setBookmarks(updated);
            await AsyncStorage.setItem('@saved_bookmarks', JSON.stringify(updated));
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-surface">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 bg-white dark:bg-surface border-b border-outline-variant/20 z-10">
        <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-3xl text-black dark:text-on-surface tracking-tighter">
          Guardados
        </Text>
        <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-gray-600 dark:text-on-surface-variant mt-1 text-sm">
          Tus contenidos para escuchar y leer sin conexión
        </Text>

        {/* Tab switcher */}
        <View className="flex-row mt-4 bg-gray-100 dark:bg-surface-container rounded-full p-1 border border-outline-variant/20">
          <TouchableOpacity 
            onPress={() => setActiveTab('audios')}
            className={`flex-1 py-2 rounded-full items-center justify-center flex-row gap-1.5 ${
              activeTab === 'audios' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <MaterialIcons 
              name="headphones" 
              size={18} 
              color={activeTab === 'audios' ? '#fff' : '#8a8a8a'} 
            />
            <Text 
              style={{ fontFamily: 'Montserrat_700Bold' }} 
              className={`text-xs ${activeTab === 'audios' ? 'text-white' : 'text-gray-600 dark:text-on-surface-variant'}`}
            >
              Audios ({downloads.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveTab('noticias')}
            className={`flex-1 py-2 rounded-full items-center justify-center flex-row gap-1.5 ${
              activeTab === 'noticias' ? 'bg-primary shadow-sm' : 'bg-transparent'
            }`}
          >
            <MaterialIcons 
              name="bookmark" 
              size={18} 
              color={activeTab === 'noticias' ? '#fff' : '#8a8a8a'} 
            />
            <Text 
              style={{ fontFamily: 'Montserrat_700Bold' }} 
              className={`text-xs ${activeTab === 'noticias' ? 'text-white' : 'text-gray-600 dark:text-on-surface-variant'}`}
            >
              Noticias ({bookmarks.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audios Tab Content */}
      {activeTab === 'audios' && (
        downloads.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <MaterialIcons name="cloud-off" size={70} color="#ffb3ad" className="mb-4" />
            <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xl text-black dark:text-on-surface text-center mb-2">
              No tienes audios descargados
            </Text>
            <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-gray-600 dark:text-on-surface-variant text-center">
              Explora los programas y descarga episodios para escucharlos sin gastar datos.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/videos')}
              className="mt-6 bg-primary px-8 py-3 rounded-full shadow-md active:opacity-90"
            >
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white text-base">Explorar Programas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {downloads.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handlePlay(item)}
                className="flex-row items-center bg-gray-50 dark:bg-surface-container mb-4 rounded-xl p-3 border border-outline-variant/10 shadow-sm active:opacity-80"
              >
                <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                  <Image 
                    source={{ uri: item.thumbnail || 'https://via.placeholder.com/150' }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/20 items-center justify-center">
                    <MaterialIcons name="play-arrow" size={30} color="white" />
                  </View>
                </View>
                
                <View className="flex-1 ml-4 justify-center">
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xs text-primary mb-1 uppercase tracking-wider">
                    {item.category}
                  </Text>
                  <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-sm text-black dark:text-on-surface" numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={() => confirmDeleteDownload(item.id, item.title)}
                  className="p-3"
                >
                  <MaterialIcons name="delete-outline" size={24} color="#C13535" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      )}

      {/* Bookmarked News Tab Content */}
      {activeTab === 'noticias' && (
        bookmarks.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <MaterialIcons name="bookmark-border" size={70} color="#ffb3ad" className="mb-4" />
            <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xl text-black dark:text-on-surface text-center mb-2">
              No tienes noticias guardadas
            </Text>
            <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-gray-600 dark:text-on-surface-variant text-center">
              Toca el icono de marcador en la esquina superior de cualquier noticia para guardarla y leerla más tarde.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/podcasts')}
              className="mt-6 bg-primary px-8 py-3 rounded-full shadow-md active:opacity-90"
            >
              <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white text-base">Ver Noticias</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
            {bookmarks.map((item: any) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/news/${item.id}`)}
                className="flex-row items-center bg-gray-50 dark:bg-surface-container mb-4 rounded-xl p-3 border border-outline-variant/10 shadow-sm active:opacity-80"
              >
                <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                  <Image 
                    source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=300&auto=format&fit=crop' }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                
                <View className="flex-1 ml-4 justify-center">
                  <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-sm text-black dark:text-on-surface" numberOfLines={2}>
                    {stripHtml(item.title)}
                  </Text>
                  {item.excerpt && (
                    <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-xs text-gray-600 dark:text-on-surface-variant mt-1" numberOfLines={1}>
                      {stripHtml(item.excerpt)}
                    </Text>
                  )}
                </View>

                <TouchableOpacity 
                  onPress={() => removeBookmark(item.id, item.title)}
                  className="p-3"
                >
                  <MaterialIcons name="bookmark-remove" size={24} color="#C13535" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      )}
    </View>
  );
}
