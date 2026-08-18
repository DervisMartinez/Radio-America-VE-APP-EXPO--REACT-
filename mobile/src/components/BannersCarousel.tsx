import React, { useRef, useEffect, useState } from 'react';
import { View, Image, FlatList, Dimensions, TouchableOpacity, Linking, Text } from 'react-native';
import { BASE_URL } from '../config/api';

const { width } = Dimensions.get('window');

interface Banner {
  id: string | number;
  title?: string;
  imageUrl?: string;
  url?: string;
  image_url?: string; // Por si la API usa snake_case
  link?: string;
}

interface BannersCarouselProps {
  banners: Banner[];
}

export default function BannersCarousel({ banners }: BannersCarouselProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Si no hay banners del backend, mostramos un placeholder para que el cliente vea el espacio
  const displayBanners = banners && banners.length > 0 ? banners : [
    {
      id: 'placeholder-1',
      imageUrl: 'https://images.unsplash.com/photo-1598555319985-64f33160e1d0?q=80&w=600&auto=format&fit=crop', // Imagen dummy de publicidad
      url: 'https://radioamerica.com.ve'
    },
    {
      id: 'placeholder-2',
      imageUrl: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=600&auto=format&fit=crop', // Otra imagen dummy
      url: 'https://radioamerica.com.ve'
    }
  ];

  useEffect(() => {
    // Si solo hay un banner, no necesitamos auto-scroll
    if (displayBanners.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1 >= displayBanners.length ? 0 : prevIndex + 1;
        try {
          flatListRef.current?.scrollToOffset({
            offset: nextIndex * width,
            animated: true,
          });
        } catch (_) {}
        return nextIndex;
      });
    }, 4000); // Cambia cada 4 segundos

    return () => clearInterval(intervalId);
  }, [displayBanners.length]);

  const handlePress = (banner: Banner) => {
    const link = banner.url || banner.link;
    if (link) {
      Linking.openURL(link).catch(err => console.error("Error al abrir URL del banner", err));
    }
  };

  const renderItem = ({ item }: { item: Banner }) => {
    let imgSource = item.imageUrl || item.image_url;
    if (typeof imgSource === 'string' && imgSource.startsWith('/')) {
      imgSource = `${BASE_URL}${imgSource}`;
    }
    if (!imgSource) return <View style={{ width }} />; // Espacio vacío de seguridad si no hay imagen
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => handlePress(item)}
        style={{ width, paddingHorizontal: 24 }}
      >
        <View 
          style={{ width: '100%', aspectRatio: 1000 / 160 }} 
          className="bg-gray-100 dark:bg-surface-container rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 items-center justify-center"
        >
          <Image 
            source={{ uri: imgSource }} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="py-6 bg-gray-50 dark:bg-surface-container-low w-full overflow-hidden">
      <View className="px-6 flex-row justify-between items-end mb-4">
        <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-xl text-black dark:text-on-surface tracking-tight" adjustsFontSizeToFit numberOfLines={1}>Presentado Por</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={displayBanners}
        renderItem={renderItem}
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        scrollEnabled={displayBanners.length > 1}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          }, 100);
        }}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      {displayBanners.length > 1 && (
        <View className="flex-row justify-center mt-4 gap-2">
          {displayBanners.map((_, i) => (
            <View 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-5 bg-primary' : 'w-1.5 bg-gray-300 dark:bg-gray-700'}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}
