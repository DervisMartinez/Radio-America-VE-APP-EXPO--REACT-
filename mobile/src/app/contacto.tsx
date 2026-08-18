import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../config/api';

export default function ContactScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/contact`, formData);
      if (res.status === 200 || res.status === 201) {
        Alert.alert('Éxito', 'Mensaje enviado correctamente. Te contactaremos pronto.');
        setFormData({ name: '', email: '', subject: '', message: '' });
        router.back();
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos enviar tu mensaje en este momento. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-surface pt-12">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4 border-b border-outline-variant/20">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <MaterialIcons name="arrow-back" size={28} color="#C13535" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Montserrat_900Black' }} className="text-xl text-black dark:text-on-surface tracking-tighter">
          CONTÁCTANOS
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-2xl text-primary mb-2">¡Escríbenos!</Text>
        <Text style={{ fontFamily: 'Montserrat_400Regular' }} className="text-black dark:text-gray-600 dark:text-on-surface-variant mb-8">
          ¿Tienes alguna duda, sugerencia o quieres anunciarte con nosotros? Llena el formulario y nos pondremos en contacto contigo.
        </Text>

        <View className="space-y-4 gap-4">
          <View>
            <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-black dark:text-on-surface text-sm mb-2">Nombre Completo *</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor="#8a8a8a"
              className="bg-white dark:bg-gray-100 dark:bg-surface-container text-black dark:text-on-surface p-4 rounded-xl font-['Montserrat_500Medium']"
            />
          </View>

          <View>
            <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-black dark:text-on-surface text-sm mb-2">Correo Electrónico *</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#8a8a8a"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white dark:bg-gray-100 dark:bg-surface-container text-black dark:text-on-surface p-4 rounded-xl font-['Montserrat_500Medium']"
            />
          </View>

          <View>
            <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-black dark:text-on-surface text-sm mb-2">Asunto</Text>
            <TextInput
              value={formData.subject}
              onChangeText={(text) => setFormData({ ...formData, subject: text })}
              placeholder="¿De qué trata tu mensaje?"
              placeholderTextColor="#8a8a8a"
              className="bg-white dark:bg-gray-100 dark:bg-surface-container text-black dark:text-on-surface p-4 rounded-xl font-['Montserrat_500Medium']"
            />
          </View>

          <View>
            <Text style={{ fontFamily: 'Montserrat_600SemiBold' }} className="text-black dark:text-on-surface text-sm mb-2">Mensaje *</Text>
            <TextInput
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              placeholder="Escribe tu mensaje aquí..."
              placeholderTextColor="#8a8a8a"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="bg-white dark:bg-gray-100 dark:bg-surface-container text-black dark:text-on-surface p-4 rounded-xl font-['Montserrat_500Medium'] min-h-[120px]"
            />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={loading}
            className={`mt-4 bg-primary p-4 rounded-xl items-center justify-center flex-row ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={{ fontFamily: 'Montserrat_700Bold' }} className="text-white text-base mr-2">ENVIAR MENSAJE</Text>
                <MaterialIcons name="send" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
