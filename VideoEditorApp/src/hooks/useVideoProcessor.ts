/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { WEB_FRONTEND_URL } from '@env';

import {
  TrimmerState,
  RootStackParamList,
  EditData,
  Video as ServerVideo,
  CustomJwtPayload,
} from '../types';
import { generateCollageFilterComplex } from '../utils/ffmpegFilters';
import axiosInstance from '../api/axiosInstance';

// =================================================================================
// 1. 헬퍼 함수
// =================================================================================

const cleanUri = (uri: string): string => {
  if (!uri) return '';
  let path = uri;
  path = decodeURIComponent(path);
  if (path.startsWith('file://')) {
    path = path.substring(7);
  }
  return path;
};

// =================================================================================
// 2. 커스텀 훅 정의
// =================================================================================

export const useVideoProcessor = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (
    url: string,
    file: { uri: string; type: string },
  ) => {
    try {
      const fileUri = file.uri.startsWith('file://')
        ? file.uri
        : `file://${file.uri}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: {
          uri: fileUri,
          type: file.type,
          name: 'upload',
        } as any,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      console.log('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const startVideoProcessing = async (
    trimmers: TrimmerState[],
    serverVideos: ServerVideo[],
    parentVideoId: string | null,
    startTime: number,
    endTime: number,
    timelinePosition: number,
  ) => {
    setIsProcessing(true);

    try {
      console.log('[useVideoProcessor] Starting collage creation...');
      const activeTrimmers = trimmers.filter(t => t.sourceVideo);
      if (activeTrimmers.length === 0) {
        Alert.alert('오류', '편집할 비디오가 없습니다.');
        setIsProcessing(false);
        return;
      }

      // ... (processVideoForUpload 로직 전체를 여기에 복사) ...
      const editData: EditData = {
        trimmers: activeTrimmers.map(t => ({
          startTime: t.startTime,
          endTime: t.endTime,
          volume: t.volume,
          aspectRatio:
            t.aspectRatio === 'original' && t.originalAspectRatioValue
              ? t.originalAspectRatioValue
              : t.aspectRatio,
          equalizer: t.equalizer.map(({ frequency, gain }) => ({
            frequency,
            gain,
          })),
        })),
      };

      const filterComplexString =
        generateCollageFilterComplex(editData).join('; ');
      const inputCommands = activeTrimmers
        .map(t => `-i "${cleanUri(t.sourceVideo!.uri)}"`)
        .join(' ');
      const collageOutputPath = `${
        RNFS.DocumentDirectoryPath
      }/collage_${Date.now()}.mp4`;
      const hasAudio = activeTrimmers.some(t => t.volume > 0);
      const mapCommand = hasAudio ? '-map "[v]" -map "[a]"' : '-map "[v]"';
      const encoder =
        Platform.OS === 'ios' ? 'h264_videotoolbox' : 'h264_mediacodec';
      const command = `${inputCommands} -filter_complex "${filterComplexString}" ${mapCommand} -c:v ${encoder} -c:a aac -b:a 192k -movflags +faststart "${collageOutputPath}"`;

      console.log('[useVideoProcessor] Executing FFmpeg command:', command);
      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        const logs = await session.getLogsAsString();
        console.error('[useVideoProcessor] FFmpeg process failed. Logs:', logs);
        Alert.alert('오류', 'FFmpeg 처리 중 오류가 발생했습니다.');
        throw new Error('FFmpeg process failed');
      }

      Alert.alert('성공', '비디오 콜라주가 성공적으로 생성되었습니다.');
      console.log(
        `[useVideoProcessor] Collage video saved to: ${collageOutputPath}`,
      );

      // Thumbnail Extraction
      const thumbnailOutputPath = `${
        RNFS.DocumentDirectoryPath
      }/thumbnail_${Date.now()}.jpg`;
      const thumbnailCommand = `-i "${collageOutputPath}" -ss 00:00:01.000 -vframes 1 -q:v 2 "${thumbnailOutputPath}"`;
      const thumbnailSession = await FFmpegKit.execute(thumbnailCommand);
      const thumbnailReturnCode = await thumbnailSession.getReturnCode();

      if (!ReturnCode.isSuccess(thumbnailReturnCode)) {
        const logs = await thumbnailSession.getLogsAsString();
        console.error(
          '[useVideoProcessor] Thumbnail extraction failed. Logs:',
          logs,
        );
        Alert.alert('오류', '썸네일 추출 중 오류가 발생했습니다.');
        throw new Error('Thumbnail extraction failed');
      }
      console.log(
        `[useVideoProcessor] Thumbnail saved to: ${thumbnailOutputPath}`,
      );

      // Source Video Optimization
      const lastVideo = activeTrimmers[activeTrimmers.length - 1].sourceVideo;
      if (!lastVideo) {
        Alert.alert('오류', '최적화할 원본 비디오를 찾지 못했습니다.');
        throw new Error('Source video for optimization not found');
      }

      const optimizedSourceOutputPath = `${
        RNFS.DocumentDirectoryPath
      }/optimized_source_${Date.now()}.mp4`;
      const optimizedSourceCommand = `-i "${cleanUri(
        lastVideo.uri,
      )}" -c:v ${encoder} -vf "scale=540:-2" -c:a aac -b:a 128k -y "${optimizedSourceOutputPath}"`;
      const optimizedSession = await FFmpegKit.execute(optimizedSourceCommand);
      const optimizedReturnCode = await optimizedSession.getReturnCode();

      if (!ReturnCode.isSuccess(optimizedReturnCode)) {
        const logs = await optimizedSession.getLogsAsString();
        console.error(
          '[useVideoProcessor] Source optimization failed. Logs:',
          logs,
        );
        Alert.alert('오류', '소스 비디오 최적화 중 오류가 발생했습니다.');
        throw new Error('Source optimization failed');
      }
      console.log(
        `[useVideoProcessor] Optimized source video saved to: ${optimizedSourceOutputPath}`,
      );

      // Verification (Save to gallery)
      try {
        await CameraRoll.save(`file://${collageOutputPath}`, { type: 'video' });
        await CameraRoll.save(`file://${thumbnailOutputPath}`, {
          type: 'photo',
        });
        await CameraRoll.save(`file://${optimizedSourceOutputPath}`, {
          type: 'video',
        });
        Alert.alert('저장 완료', '생성된 파일들이 갤러리에 저장되었습니다.');
      } catch (saveError) {
        console.error(
          '[useVideoProcessor] Failed to save files to device:',
          saveError,
        );
        Alert.alert(
          '저장 실패',
          '파일을 갤러리에 저장하는 중 오류가 발생했습니다.',
        );
      }

      // Presigned URL Request
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('로그인 토큰을 찾을 수 없습니다.');
      const decodedToken = jwtDecode<CustomJwtPayload>(token);
      const userId = decodedToken.id;

      const filesToUpload = [
        { purpose: 'RESULT_VIDEO', fileType: 'video/mp4' },
        { purpose: 'THUMBNAIL', fileType: 'image/jpeg' },
        { purpose: 'SOURCE_VIDEO', fileType: 'video/mp4' },
      ];

      const presignedUrlResponse = await axiosInstance.post(
        '/video-insert/upload-urls',
        { purposes: filesToUpload },
      );
      const responseData = presignedUrlResponse.data;

      if (
        !responseData.RESULT_VIDEO ||
        !responseData.THUMBNAIL ||
        !responseData.SOURCE_VIDEO
      ) {
        console.error(
          '[useVideoProcessor] Missing URLs in response:',
          responseData,
        );
        throw new Error('백엔드에서 필요한 URL을 모두 받지 못했습니다.');
      }

      // Parallel Upload
      setUploading(true);
      const urlMappings = [
        {
          presignedUrl: responseData.RESULT_VIDEO.url,
          s3Key: responseData.RESULT_VIDEO.key,
          localPath: collageOutputPath,
          fileType: 'video/mp4',
        },
        {
          presignedUrl: responseData.THUMBNAIL.url,
          s3Key: responseData.THUMBNAIL.key,
          localPath: thumbnailOutputPath,
          fileType: 'image/jpeg',
        },
        {
          presignedUrl: responseData.SOURCE_VIDEO.url,
          s3Key: responseData.SOURCE_VIDEO.key,
          localPath: optimizedSourceOutputPath,
          fileType: 'video/mp4',
        },
      ];

      await Promise.all(
        urlMappings.map(data =>
          uploadFile(data.presignedUrl, {
            uri: data.localPath,
            type: data.fileType,
          }),
        ),
      );
      setUploading(false);

      // Save Metadata to DB
      const directParent =
        serverVideos.length > 0 ? serverVideos[serverVideos.length - 1] : null;
      const depth = directParent ? directParent.depth + 1 : 1;

      await axiosInstance.post('/video-insert/complete', {
        user_id: userId,
        results_video_key: responseData.RESULT_VIDEO.key,
        source_video_key: responseData.SOURCE_VIDEO.key,
        thumbnail_key: responseData.THUMBNAIL.key,
        parent_video_id: parentVideoId,
        depth,
        startTime,
        endTime,
        timelinePosition,
      });

      Alert.alert(
        '업로드 완료',
        '비디오가 성공적으로 업로드되었습니다. 프로필에서 확인하시겠습니까?',
        [
          {
            text: '아니오',
            style: 'cancel',
            onPress: () => {
              // 현재 화면에 머무름 (아무것도 하지 않음)
            },
          },
          {
            text: '네',
            onPress: () => {
              // 웹의 마이페이지로 이동
              navigation.navigate('Web', {
                url: `${WEB_FRONTEND_URL}/users/${userId}`,
              });
            },
          },
        ],
      );
    } catch (error: any) {
      console.error('Error in startVideoProcessing:', error);
      Alert.alert('오류', '비디오 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      setUploading(false);
    }
  };

  return {
    isProcessing,
    uploading,
    startVideoProcessing,
  };
};
