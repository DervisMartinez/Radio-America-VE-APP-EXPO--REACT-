import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../../config/api';

export default function MoreScreen() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile`).catch(() => ({ data: null }));
        if (res?.data) {
          setUserProfile(res.data);
        }
      } catch (_) {
        // Silenciar error si no está autenticado
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const openSocial = (url: string, platform: string) => {
    if (!url) return;
    let finalUrl = url;
    if (platform === 'instagram' && !url.startsWith('http')) finalUrl = `https://instagram.com/${url.replace('@', '')}`;
    if (platform === 'twitter' && !url.startsWith('http')) finalUrl = `https://twitter.com/${url.replace('@', '')}`;
    Linking.openURL(finalUrl).catch(err => console.error(`Error opening ${platform}:`, err));
  };

  return (
    <View className="flex-1 bg-white dark:bg-surface pt-12">
      {/* TopAppBar */}
      <View className="flex-row justify-between items-center px-6 pb-4 border-b border-outline-variant/20">
        <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-2xl text-primary tracking-tighter" adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>
          MÁS OPCIONES
        </Text>
        <TouchableOpacity onPress={() => router.push('/search')} className="bg-white dark:bg-gray-100 dark:bg-surface-container p-2 rounded-full shadow-sm">
          <MaterialIcons name="search" size={28} color="#C13535" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>

        {/* Servicios Section */}
        <View className="mb-8">
          <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-widest mb-4">Servicios</Text>
          
          <TouchableOpacity 
            onPress={() => Linking.openURL('https://radioamerica.com.ve/lostdocuments/buscar.php')}
            className="flex-row items-center justify-between bg-white dark:bg-gray-100 dark:bg-surface-container p-4 rounded-2xl mb-3 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
                <MaterialIcons name="find-in-page" size={24} color="#C13535" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-on-surface text-base">Documentos Extraviados</Text>
                <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs">Busca o reporta documentos</Text>
              </View>
            </View>
            <MaterialIcons name="open-in-new" size={20} color="#8a8a8a" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => Linking.openURL('https://clasificados.radioamerica.com.ve/')}
            className="flex-row items-center justify-between bg-white dark:bg-gray-100 dark:bg-surface-container p-4 rounded-2xl mb-3 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-tertiary/10 rounded-full items-center justify-center mr-4">
                <MaterialIcons name="storefront" size={24} color="#346c53" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-on-surface text-base">Clasificados</Text>
                <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs">Compra, venta y servicios</Text>
              </View>
            </View>
            <MaterialIcons name="open-in-new" size={20} color="#8a8a8a" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => Linking.openURL('https://radioamerica.com.ve/colectiveservice/index.html')}
            className="flex-row items-center justify-between bg-white dark:bg-gray-100 dark:bg-surface-container p-4 rounded-2xl mb-3 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-secondary/10 rounded-full items-center justify-center mr-4">
                <MaterialIcons name="volunteer-activism" size={24} color="#8f4c38" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-on-surface text-base">Servicios Colectivos</Text>
                <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs">Apoyo y servicio a la comunidad</Text>
              </View>
            </View>
            <MaterialIcons name="open-in-new" size={20} color="#8a8a8a" />
          </TouchableOpacity>
        </View>
        
        {/* Contacto Section */}
        <View className="mb-8">
          <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-widest mb-4">Ayuda y Soporte</Text>
          <TouchableOpacity 
            onPress={() => router.push('/contacto')}
            className="flex-row items-center justify-between bg-white dark:bg-gray-100 dark:bg-surface-container p-4 rounded-2xl mb-3 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-4">
                <MaterialIcons name="mail-outline" size={24} color="#C13535" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-on-surface text-base">Contáctanos</Text>
                <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs">Envíanos un mensaje directo</Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#8a8a8a" />
          </TouchableOpacity>
        </View>

        {/* Social Media Section */}
        <View className="mb-8">
          <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-sm text-black dark:text-gray-600 dark:text-on-surface-variant uppercase tracking-widest mb-4">Síguenos en Redes</Text>
          
          {loading ? (
            <ActivityIndicator color="#C13535" className="my-4" />
          ) : userProfile ? (
            <View className="gap-3">
              {userProfile.youtube && (
                <TouchableOpacity 
                  onPress={() => openSocial(userProfile.youtube, 'youtube')}
                  className="flex-row items-center bg-[#FF0000]/10 border border-[#FF0000]/20 p-4 rounded-2xl"
                >
                  <MaterialIcons name="smart-display" size={28} color="#FF0000" className="mr-4" />
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[#FF0000] text-base flex-1">YouTube</Text>
                  <MaterialIcons name="open-in-new" size={20} color="#FF0000" opacity={0.5} />
                </TouchableOpacity>
              )}
              
              {userProfile.instagram && (
                <TouchableOpacity 
                  onPress={() => openSocial(userProfile.instagram, 'instagram')}
                  className="flex-row items-center bg-[#d6249f]/10 border border-[#d6249f]/20 p-4 rounded-2xl"
                >
                  <MaterialIcons name="photo-camera" size={28} color="#d6249f" className="mr-4" />
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[#d6249f] text-base flex-1">Instagram</Text>
                  <MaterialIcons name="open-in-new" size={20} color="#d6249f" opacity={0.5} />
                </TouchableOpacity>
              )}

              {userProfile.facebook && (
                <TouchableOpacity 
                  onPress={() => openSocial(userProfile.facebook, 'facebook')}
                  className="flex-row items-center bg-[#1877F2]/10 border border-[#1877F2]/20 p-4 rounded-2xl"
                >
                  <MaterialIcons name="thumb-up" size={28} color="#1877F2" className="mr-4" />
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-[#1877F2] text-base flex-1">Facebook</Text>
                  <MaterialIcons name="open-in-new" size={20} color="#1877F2" opacity={0.5} />
                </TouchableOpacity>
              )}

              {userProfile.twitter && (
                <TouchableOpacity 
                  onPress={() => openSocial(userProfile.twitter, 'twitter')}
                  className="flex-row items-center bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 p-4 rounded-2xl"
                >
                  <Text className="text-2xl font-black text-black dark:text-white mr-4 leading-none w-7 text-center">𝕏</Text>
                  <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-black dark:text-white text-base flex-1">Twitter</Text>
                  <MaterialIcons name="open-in-new" size={20} color="#8a8a8a" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-sm">No se encontraron redes sociales.</Text>
          )}
        </View>

        {/* App Info */}
        <View className="items-center mt-8 opacity-50">
          <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-xl text-primary tracking-tighter">Radio América</Text>
          <Text style={{ fontFamily: 'Montserrat_500Medium' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant text-xs mt-1">Versión 1.0.0</Text>
        </View>

      </ScrollView>
    </View>
  );
}
