import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, Dimensions, Platform, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';

export default function CurrencyTicker() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#C13535';

  const [rates, setRates] = useState<string>('TASA BCV DEL DIA : Consultando tasas oficiales...');
  const screenWidth = Dimensions.get('window').width;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Cargar caché inmediatamente
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cache_currency_rates');
        if (cached) setRates(cached);
      } catch (_) {}
    };
    loadCache();

    // 2. Fetch fresh rates
    const fetchRates = async () => {
      try {
        let usdVal = null;
        let eurVal = null;

        // Try fetch first
        try {
          const uRes = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
          if (uRes.ok) {
            const uData = await uRes.json();
            usdVal = uData.promedio;
          }
          const eRes = await fetch('https://ve.dolarapi.com/v1/euros');
          if (eRes.ok) {
            const eData = await eRes.json();
            const officialEur = Array.isArray(eData) ? (eData.find((e: any) => e.fuente === 'oficial') || eData[0]) : eData;
            eurVal = officialEur?.promedio;
          }
        } catch (_) {}

        // Fallback to axios if fetch failed
        if (!usdVal) {
          try {
            const [uRes, eRes] = await Promise.all([
              axios.get('https://ve.dolarapi.com/v1/dolares/oficial'),
              axios.get('https://ve.dolarapi.com/v1/euros')
            ]);
            usdVal = uRes.data?.promedio;
            const officialEur = eRes.data?.find((e: any) => e.fuente === 'oficial') || eRes.data?.[0];
            eurVal = officialEur?.promedio;
          } catch (_) {}
        }

        if (usdVal) {
          const formattedRates = `TASA BCV DEL DIA :  USD Bs. ${Number(usdVal).toFixed(2)}    •    EUR Bs. ${eurVal ? Number(eurVal).toFixed(2) : '--'}`;
          setRates(formattedRates);
          AsyncStorage.setItem('@cache_currency_rates', formattedRates).catch(() => {});
        }
      } catch (e) {
        console.warn('Error fetching rates:', e);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000); // 1 min update
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollX.setValue(screenWidth);
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -screenWidth * 1.5,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    animation.start();

    return () => animation.stop();
  }, [screenWidth, rates]);

  return (
    <View className="bg-red-50/80 dark:bg-[#1a1a1b] h-11 justify-center overflow-hidden mb-6 px-4 border-y border-primary/20 dark:border-white/10 shadow-sm">
      <Animated.View style={{ transform: [{ translateX: scrollX }], flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name="trending-up" size={20} color={textColor} />
        <Text 
          style={{ 
            fontFamily: 'Montserrat_800ExtraBold', 
            color: textColor, 
            fontSize: 13, 
            marginLeft: 8,
            minWidth: screenWidth * 1.5,
            letterSpacing: 0.3
          }}
          className="text-[#C13535] dark:text-white"
          numberOfLines={1}
        >
          {rates}
        </Text>
      </Animated.View>
    </View>
  );
}
