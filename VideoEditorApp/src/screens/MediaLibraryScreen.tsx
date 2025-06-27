import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: { videoUri: string; videoName: string };
  MediaLibrary: undefined;
};

type MediaLibraryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MediaLibrary'
>;

interface Props {
  navigation: MediaLibraryScreenNavigationProp;
}

interface MediaItem {
  id: string;
  filename: string;
  uri: string;
  type: string;
  size: number;
}

const MediaLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickVideo = async () => {
    try {
      setIsLoading(true);
      console.log('📁 비디오 파일 선택 시작...');

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        allowMultiSelection: false,
      });

      console.log('✅ 선택된 파일:', result);

      if (result && result.length > 0) {
        const file = result[0];
        const mediaItem: MediaItem = {
          id: file.uri,
          filename: file.name || 'unknown_video',
          uri: file.uri,
          type: 'video',
          size: file.size || 0,
        };

        // 선택된 비디오를 VideoEdit 화면으로 전달
        navigation.navigate('VideoEdit', {
          videoUri: file.uri,
          videoName: file.name || 'unknown_video',
        });
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('사용자가 파일 선택을 취소했습니다.');
      } else {
        console.error('❌ 파일 선택 오류:', error);
        Alert.alert('오류', '비디오 파일을 선택하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const pickMultipleVideos = async () => {
    try {
      setIsLoading(true);
      console.log('📁 여러 비디오 파일 선택 시작...');

      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
        allowMultiSelection: true,
      });

      console.log('✅ 선택된 파일들:', result);

      if (result && result.length > 0) {
        const items: MediaItem[] = result.map((file, index) => ({
          id: file.uri + index,
          filename: file.name || `video_${index}`,
          uri: file.uri,
          type: 'video',
          size: file.size || 0,
        }));

        setMediaItems(items);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('사용자가 파일 선택을 취소했습니다.');
      } else {
        console.error('❌ 파일 선택 오류:', error);
        Alert.alert('오류', '비디오 파일을 선택하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => {
        // 비디오 편집 화면으로 이동
        navigation.navigate('VideoEdit', {
          videoUri: item.uri,
          videoName: item.filename,
        });
      }}
    >
      <View style={styles.mediaIcon}>
        <Text style={styles.mediaIconText}>🎥</Text>
      </View>
      <View style={styles.mediaInfo}>
        <Text style={styles.mediaFilename} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.mediaDetails}>
          VIDEO • {formatFileSize(item.size)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          navigation.navigate('VideoEdit', {
            videoUri: item.uri,
            videoName: item.filename,
          });
        }}
      >
        <Text style={styles.editButtonText}>편집</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📁 비디오 파일 선택</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.pickButton}
          onPress={pickVideo}
          disabled={isLoading}
        >
          <Text style={styles.pickButtonText}>
            {isLoading ? '🔄 선택 중...' : '📁 비디오 파일 선택'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pickMultipleButton}
          onPress={pickMultipleVideos}
          disabled={isLoading}
        >
          <Text style={styles.pickMultipleButtonText}>
            {isLoading ? '🔄 선택 중...' : '📁 여러 비디오 선택'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>파일을 선택하는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={mediaItems}
          renderItem={renderMediaItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📭 선택된 비디오가 없습니다</Text>
              <Text style={styles.emptySubtext}>
                위의 버튼을 눌러서 비디오 파일을 선택해보세요
              </Text>
              <Text style={styles.emptySubtext}>
                지원 형식: MP4, MOV, AVI, MKV 등
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2c3e50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
  },
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  pickButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickMultipleButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  pickMultipleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ecf0f1',
    fontSize: 16,
    marginTop: 10,
  },
  listContainer: {
    padding: 10,
  },
  mediaItem: {
    flexDirection: 'row',
    backgroundColor: '#2c3e50',
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  mediaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  mediaIconText: {
    fontSize: 20,
  },
  mediaInfo: {
    flex: 1,
  },
  mediaFilename: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 5,
  },
  mediaDetails: {
    fontSize: 14,
    color: '#bdc3c7',
  },
  editButton: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#ecf0f1',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default MediaLibraryScreen;
