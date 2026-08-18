import React, { createContext, useContext, useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import { Alert } from 'react-native';

import { BASE_URL } from '../config/api';

export interface DownloadedItem {
  id: string;
  title: string;
  thumbnail: string;
  category: string;
  localUri: string;
  remoteUrl: string;
  dateDownloaded: string;
}

interface DownloadContextProps {
  downloads: DownloadedItem[];
  downloadingItems: { [id: string]: number }; // progress percentage 0-100
  downloadEpisode: (item: { id: string; title: string; url: string; thumbnail?: string; category?: string }) => Promise<void>;
  deleteDownload: (id: string) => Promise<void>;
  isDownloaded: (id: string) => boolean;
  getLocalUri: (id: string) => string | null;
}

const DownloadContext = createContext<DownloadContextProps>({
  downloads: [],
  downloadingItems: {},
  downloadEpisode: async () => {},
  deleteDownload: async () => {},
  isDownloaded: () => false,
  getLocalUri: () => null,
});

export const useDownloads = () => useContext(DownloadContext);

export const DownloadProvider = ({ children }: { children: React.ReactNode }) => {
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [downloadingItems, setDownloadingItems] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const stored = await AsyncStorage.getItem('@radioamerica_downloads');
      if (stored) {
        setDownloads(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading downloads', error);
    }
  };

  const saveDownloads = async (newDownloads: DownloadedItem[]) => {
    try {
      await AsyncStorage.setItem('@radioamerica_downloads', JSON.stringify(newDownloads));
      setDownloads(newDownloads);
    } catch (error) {
      console.error('Error saving downloads', error);
    }
  };

  const downloadEpisode = async (item: { id: string; title: string; url: string; thumbnail?: string; category?: string }) => {
    if (isDownloaded(item.id)) return;

    // Normalizar la URL remota del audio
    let targetUrl = item.url;
    if (Array.isArray(targetUrl)) {
      targetUrl = targetUrl[0];
    }
    if (typeof targetUrl === 'string') {
      try {
        const parsed = JSON.parse(targetUrl);
        if (Array.isArray(parsed) && parsed.length > 0) targetUrl = parsed[0];
      } catch (_) {}
    }
    if (typeof targetUrl === 'string' && targetUrl.startsWith('/')) {
      targetUrl = `${BASE_URL}${targetUrl}`;
    }

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
      Alert.alert('Error', 'El enlace del audio no es válido para descargar.');
      return;
    }

    // Normalizar thumbnail
    let thumbUrl = item.thumbnail || '';
    if (thumbUrl && typeof thumbUrl === 'string' && thumbUrl.startsWith('/')) {
      thumbUrl = `${BASE_URL}${thumbUrl}`;
    }

    // Verificación segura de conexión a internet
    let isCellular = false;
    let isConnected = true;

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (networkState) {
        if (networkState.type === Network.NetworkStateType.CELLULAR) {
          isCellular = true;
        }
        if (networkState.isConnected === false) {
          isConnected = false;
        }
      }
    } catch (netErr) {
      console.warn('No se pudo verificar el estado de red, continuando...', netErr);
    }

    const startDownload = async () => {
      try {
        setDownloadingItems(prev => ({ ...prev, [item.id]: 0 }));
        
        const fileExtension = targetUrl.split('.').pop()?.split('?')[0] || 'mp3';
        const fileUri = `${FileSystem.documentDirectory}episode_${item.id}.${fileExtension}`;
        
        const downloadResumable = FileSystem.createDownloadResumable(
          targetUrl,
          fileUri,
          {},
          (downloadProgress) => {
            if (downloadProgress.totalBytesExpectedToWrite > 0) {
              const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
              setDownloadingItems(prev => ({ ...prev, [item.id]: Math.min(100, Math.round(progress * 100)) }));
            } else {
              // Si el servidor no envía Content-Length
              setDownloadingItems(prev => ({ ...prev, [item.id]: 50 }));
            }
          }
        );

        const result = await downloadResumable.downloadAsync();
        
        if (result?.uri) {
          const newItem: DownloadedItem = {
            id: item.id,
            title: item.title,
            thumbnail: thumbUrl,
            category: item.category || 'Audio',
            localUri: result.uri,
            remoteUrl: targetUrl,
            dateDownloaded: new Date().toISOString()
          };
          
          setDownloads(prev => {
            const updated = [...prev.filter(d => d.id !== item.id), newItem];
            AsyncStorage.setItem('@radioamerica_downloads', JSON.stringify(updated)).catch(() => {});
            return updated;
          });
          Alert.alert('Éxito', `"${item.title}" se ha descargado correctamente.`);
        }
      } catch (e) {
        console.error('Download error:', e);
        Alert.alert('Error', 'No se pudo completar la descarga del audio.');
      } finally {
        setDownloadingItems(prev => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }
    };

    if (isCellular) {
      Alert.alert(
        'Conexión de Datos Móviles',
        'Estás usando datos móviles. La descarga consumirá datos de tu plan. ¿Deseas continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descargar', onPress: startDownload }
        ]
      );
    } else if (isConnected) {
      startDownload();
    } else {
      Alert.alert('Sin Conexión', 'Necesitas conexión a internet para descargar.');
    }
  };

  const deleteDownload = async (id: string) => {
    const item = downloads.find(d => d.id === id);
    if (!item) return;

    try {
      await FileSystem.deleteAsync(item.localUri, { idempotent: true });
      const newDownloads = downloads.filter(d => d.id !== id);
      await saveDownloads(newDownloads);
    } catch (e) {
      console.error('Error deleting file', e);
      Alert.alert('Error', 'No se pudo eliminar el archivo.');
    }
  };

  const isDownloaded = (id: string) => downloads.some(d => d.id === id);
  const getLocalUri = (id: string) => downloads.find(d => d.id === id)?.localUri || null;

  return (
    <DownloadContext.Provider value={{ downloads, downloadingItems, downloadEpisode, deleteDownload, isDownloaded, getLocalUri }}>
      {children}
    </DownloadContext.Provider>
  );
};
