import { View, Text, TextInput, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function Header() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-row justify-between items-center px-4 h-20 bg-white/90 dark:bg-white dark:bg-white/90 dark:bg-surface/90 border-b border-zinc-200 dark:border-transparent">
      {/* Logo y Título */}
      <View className="flex-row items-center gap-2">
        <Image 
          source={{ uri: 'https://ui-avatars.com/api/?name=RA&background=C13535&color=fff&rounded=true' }} 
          className="w-10 h-10"
        />
        <Text className="text-lg font-black text-ra-red dark:text-[#DDDADB] tracking-tighter">
          Radio América
        </Text>
        {/* Indicador En Vivo (Ejemplo) */}
        <View className="w-2.5 h-2.5 bg-red-600 rounded-full ml-1" />
      </View>

      {/* Barra de Búsqueda */}
      <View className="relative">
        <View className="absolute left-3 top-2 z-10">
          <MaterialIcons name="search" size={18} color={isDark ? '#DDDADB' : '#C13535'} />
        </View>
        <TextInput 
          placeholder="Buscar..."
          placeholderTextColor={isDark ? '#888' : '#999'}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-full py-1.5 pl-9 pr-4 text-sm text-ra-red dark:text-[#DDDADB] w-32"
        />
      </View>
    </View>
  );
}
