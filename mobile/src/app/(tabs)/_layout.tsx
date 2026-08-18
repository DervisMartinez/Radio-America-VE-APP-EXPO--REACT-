import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ffb783', // secondary from tailwind
        tabBarInactiveTintColor: isDark ? '#e1bebb' : '#a88987', // on-surface-variant / outline
        tabBarStyle: {
          backgroundColor: isDark ? '#131314' : '#ffffff',
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 15,
          left: 15,
          right: 15,
          borderRadius: 24,
          height: 65,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat_700Bold',
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: 0, // Removido para que 'Programas' quepa sin cortarse
          marginTop: 2,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'En Vivo',
          tabBarIcon: ({ color }) => <MaterialIcons name="radio" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: 'Programas',
          tabBarIcon: ({ color }) => <MaterialIcons name="play-circle-filled" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="podcasts"
        options={{
          title: 'Noticias',
          tabBarIcon: ({ color }) => <MaterialIcons name="article" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="talento"
        options={{
          title: 'Talento',
          tabBarIcon: ({ color }) => <MaterialIcons name="groups" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Descargas',
          tabBarIcon: ({ color }) => <MaterialIcons name="download" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mas"
        options={{
          title: 'Más',
          tabBarIcon: ({ color }) => <MaterialIcons name="menu" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
