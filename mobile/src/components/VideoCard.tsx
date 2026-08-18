import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BASE_URL } from '../config/api';

export interface VideoProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  views: number;
}

export default function VideoCard({ video }: { video: VideoProps }) {
  const router = useRouter();

  // Asegurar que la miniatura use la IP correcta si es relativa
  const imageUrl = video.thumbnail?.startsWith('http') ? video.thumbnail : `${BASE_URL}${video.thumbnail || '/placeholder.png'}`;

  return (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => router.push(`/watch/${video.id}`)}
      className="flex-col gap-2 mb-6 w-full"
    >
      <View className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800">
        <Image 
          source={{ uri: imageUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="px-1">
        <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2" numberOfLines={2}>
          {video.title}
        </Text>
        <Text className="text-xs font-semibold text-ra-red mt-1">
          {video.category} • {video.views} vistas
        </Text>
      </View>
    </TouchableOpacity>
  );
}
