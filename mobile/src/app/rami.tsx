import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Image, Keyboard, StyleSheet } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const RAMI_WEBHOOK_URL = 'https://hetzner-n8n.botinfy.com/webhook/4a534859-d3b7-4752-8951-126dde3d289b/chat';
const RAMI_ICON = { uri: 'https://radioamerica.com.ve/wp-content/plugins/RAMI-CHATBOT/assets/bot-icon.JPG' };

export default function RamiChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: '¡Hola! Soy RAMI, tu asistente virtual de Radio América. ¿En qué puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    Keyboard.dismiss();

    try {
      const payload = {
        chatInput: userMessage.text,
        message: userMessage.text,
        sessionId: 'mobile-app-session'
      };

      const response = await fetch(RAMI_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      
      let botResponseText = 'Lo siento, no pude procesar tu solicitud.';
      if (typeof data === 'string') {
        botResponseText = data;
      } else if (data.output) {
        botResponseText = data.output;
      } else if (data.text) {
        botResponseText = data.text;
      } else if (data.message) {
        botResponseText = data.message;
      } else if (Array.isArray(data) && data[0]?.output) {
        botResponseText = data[0].output;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.warn('Error connecting to RAMI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Hubo un problema al conectar con mis servidores. Por favor, intenta de nuevo más tarde.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#C13535" />
        </TouchableOpacity>
        
        <Image 
          source={RAMI_ICON} 
          style={styles.avatar}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.headerTitle}>RAMI</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>En línea</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.dateLabel}>Hoy</Text>
        
        {messages.map((msg) => {
          const isBot = msg.sender === 'bot';
          return (
            <View 
              key={msg.id} 
              style={[
                styles.bubble,
                isBot ? styles.botBubble : styles.userBubble
              ]}
            >
              <Text style={[styles.bubbleText, isBot ? styles.botText : styles.userText]}>
                {msg.text}
              </Text>
              <Text style={[styles.timestamp, isBot ? styles.botTimestamp : styles.userTimestamp]}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        })}
        
        {isTyping && (
          <View style={[styles.bubble, styles.botBubble, { flexDirection: 'row', alignItems: 'center' }]}>
            <ActivityIndicator size="small" color="#C13535" />
            <Text style={[styles.bubbleText, styles.botText, { marginLeft: 8 }]}>
              Escribiendo...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area - fixed at bottom */}
      <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#8E8E93"
            style={styles.textInput}
            multiline
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
            style={[
              styles.sendButton,
              inputText.trim() && !isTyping ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
          >
            <MaterialIcons name="send" size={20} color="#FFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#131314',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  headerTitle: {
    fontFamily: 'Montserrat_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  onlineText: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  dateLabel: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 16,
  },
  bubble: {
    maxWidth: '85%',
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2C2C2E',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#C13535',
    borderTopRightRadius: 4,
  },
  bubbleText: {
    fontFamily: 'Montserrat_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  botText: {
    color: '#FFFFFF',
  },
  userText: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontFamily: 'Montserrat_400Regular',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#6B7280',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#131314',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Montserrat_500Medium',
    color: '#FFFFFF',
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#C13535',
  },
  sendButtonInactive: {
    backgroundColor: '#4B5563',
  },
});
