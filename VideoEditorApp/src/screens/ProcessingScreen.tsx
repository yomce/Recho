import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import { RootStackParamList } from '../types';

type ProcessingScreenRouteProp = RouteProp<RootStackParamList, 'Processing'>;

const ProcessingScreen: React.FC = () => {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'Processing'>>();
  const route = useRoute<ProcessingScreenRouteProp>();

  const { sourceVideos, localVideos } = route.params;

  useEffect(() => {
    const downloadAndNavigate = async () => {
      console.log('[ProcessingScreen] Starting video download...');

      try {
        const downloadPromises = sourceVideos.map(async video => {
          const urlWithoutQuery = video.video_url.split('?')[0];
          const filenameFromUrl = urlWithoutQuery.substring(
            urlWithoutQuery.lastIndexOf('/') + 1,
          );
          const extension = filenameFromUrl.includes('.')
            ? filenameFromUrl.split('.').pop()
            : 'mp4';

          const finalExtension =
            extension && extension.length < 5 ? extension : 'mp4';

          const localPath = `${RNFS.DocumentDirectoryPath}/${video.id}.${finalExtension}`;

          console.log(
            `[ProcessingScreen] Downloading ${video.video_url} to ${localPath}`,
          );

          const download = RNFS.downloadFile({
            fromUrl: video.video_url,
            toFile: localPath,
          });

          await download.promise;

          console.log(`[ProcessingScreen] Download finished for ${video.id}`);

          return {
            id: video.id,
            uri: `file://${localPath}`, // 로컬 파일 경로 사용
            filename: `${video.id}.${finalExtension}`,
            type: 'video',
            size: 0, // 다운로드된 파일 크기를 가져올 수 있지만 일단 0으로 둡니다.
          };
        });

        const downloadedMediaItems = await Promise.all(downloadPromises);

        console.log(
          '[ProcessingScreen] All videos downloaded. Navigating to VideoEditScreen...',
        );

        navigation.replace('VideoEdit', {
          sourceVideos: sourceVideos,
          videos: [...downloadedMediaItems, ...localVideos],
        });
      } catch (error) {
        console.error('[ProcessingScreen] Failed to download videos:', error);
        // 사용자에게 오류 알림
      }
    };

    downloadAndNavigate();
  }, [navigation, sourceVideos, localVideos]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={styles.text}>합주 영상을 준비 중입니다...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#ffffff',
  },
});

export default ProcessingScreen;
 