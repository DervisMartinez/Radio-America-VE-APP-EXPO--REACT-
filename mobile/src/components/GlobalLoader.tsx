import React from 'react';
import { View, Image, ActivityIndicator } from 'react-native';

export default function GlobalLoader() {
  return (
    <View className="flex-1 justify-center items-center bg-[#131314]">
      {/* Container con sombra sutil y centrado */}
      <View className="items-center justify-center p-8 rounded-3xl bg-[#1c1b1c] shadow-2xl border border-white/5">
        
        {/* Logo de Radio América Animado */}
        <View className="mb-8 w-32 h-32 justify-center items-center">
          <Image 
            source={require('../../assets/images/logo_blanco.png')} 
            style={{ width: 100, height: 100 }} 
            resizeMode="contain" 
          />
        </View>

        {/* Spinner Rojo Primario */}
        <ActivityIndicator size="large" color="#c13535" />
      </View>
    </View>
  );
}
