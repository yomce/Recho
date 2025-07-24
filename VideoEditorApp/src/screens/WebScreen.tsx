import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Alert, BackHandler } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import {
  type RootStackParamList,
  type MediaItem,
  type ServerVideo,
} from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isErrorWithCode, pick, types } from '@react-native-documents/picker';
import axiosInstance from '../api/axiosInstance';
import { WEB_FRONTEND_URL } from '@env';
import { WebViewNavigationEvent } from 'react-native-webview/lib/RNCWebViewNativeComponent';

type WebScreenRouteProp = RouteProp<RootStackParamList, 'Web'>;

const WebScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<WebScreenRouteProp>();
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  
  // 권한 훅 사용
  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicrophonePermission, requestPermission: requestMicrophonePermission } = useMicrophonePermission();

  const onNavigationStateChange = (event: WebViewNavigationEvent) => {
    setCanGoBack(event.canGoBack);
  };

  useEffect(() => {
    const handleBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true; 
      }
      return false;
    };
    
    // BackHandler 이벤트 리스너를 등록합니다.
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // 컴포넌트가 언마운트될 때 리스너를 제거합니다.
    return () => backHandler.remove();
  }, [canGoBack]);

  // Web 화면 진입 시 모든 권한 요청
  useEffect(() => {
    const requestAllPermissions = async () => {
      console.log('[WebScreen] Web 화면 진입 - 모든 권한 요청 시작');
      
      // 카메라 권한 요청
      if (!hasCameraPermission) {
        console.log('[WebScreen] 카메라 권한 요청 중...');
        const cameraResult = await requestCameraPermission();
        console.log('[WebScreen] 카메라 권한 요청 결과:', cameraResult);
      } else {
        console.log('[WebScreen] 카메라 권한 이미 허용됨');
      }
      
      // 마이크 권한 요청
      if (!hasMicrophonePermission) {
        console.log('[WebScreen] 마이크 권한 요청 중...');
        const micResult = await requestMicrophonePermission();
        console.log('[WebScreen] 마이크 권한 요청 결과:', micResult);
      } else {
        console.log('[WebScreen] 마이크 권한 이미 허용됨');
      }
      
      console.log('[WebScreen] 모든 권한 요청 완료');
    };
    
    requestAllPermissions();
  }, [hasCameraPermission, hasMicrophonePermission, requestCameraPermission, requestMicrophonePermission]);

  const webFrontendUrl = route.params?.url ?? WEB_FRONTEND_URL;

  const meta = `
    const meta = document.createElement('meta'); 
    meta.setAttribute('name', 'viewport'); 
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'); 
    document.head.appendChild(meta);
  `;

  const injectedJavaScriptForLogs = `
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const originalConsoleInfo = console.info;

    const postConsoleMessage = (type, ...args) => {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONSOLE',
        payload: {
          level: type,
          data: args.map(arg => {
            try {
              if (arg instanceof Error) {
                return { name: arg.name, message: arg.message, stack: arg.stack };
              }
              // For other types, use standard JSON stringification
              return JSON.parse(JSON.stringify(arg));
            } catch (e) {
              return 'Unserializable log argument';
            }
          })
        }
      }));
    };

    console.log = (...args) => {
      originalConsoleLog(...args);
      postConsoleMessage('log', ...args);
    };
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      postConsoleMessage('warn', ...args);
    };
    console.error = (...args) => {
      originalConsoleError(...args);
      postConsoleMessage('error', ...args);
    };
    console.info = (...args) => {
      originalConsoleInfo(...args);
      postConsoleMessage('info', ...args);
    };

    window.addEventListener('error', function(event) {
      postConsoleMessage('error', 'Uncaught Error: ' + event.message);
    });
    
    window.addEventListener('unhandledrejection', function(event) {
      postConsoleMessage('error', 'Unhandled Rejection: ', event.reason);
    });

    true; // note: this is required, or you'll sometimes get silent failures
  `;

  const sendTokenToWebView = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token && webViewRef.current) {
      const message = JSON.stringify({ type: 'SET_TOKEN', token });
      webViewRef.current.postMessage(message);
    }
  };

  /**
   * DocumentPicker를 사용하여 비디오 파일을 선택합니다.
   * @param allowMultiSelection 여러 파일 선택 허용 여부
   * @param sourceVideos 합주를 위한 기존 비디오 목록 (optional)
   */
  const pickVideos = async (
    allowMultiSelection: boolean,
    // 합주 시작을 위한 childVideoId. 이 ID가 있으면, 선택 후 lineage를 가져옵니다.
    childVideoId?: string,
  ) => {
    try {
      const result = await pick({
        type: [types.video],
        allowMultiSelection: allowMultiSelection,
      });

      if (result && result.length > 0) {
        // 선택된 파일을 앱 내부의 영구적인 공간으로 복사합니다.
        const copyPromises = result.map(async (file, index) => {
          const newName = `${Date.now()}_${file.name || `video_${index}`}`;
          const newPath = `${RNFS.DocumentDirectoryPath}/${newName}`;
          await RNFS.copyFile(file.uri, newPath);

          return {
            id: newPath, // ID를 새로운 경로로 사용
            filename: newName,
            uri: `file://${newPath}`, // 새로운 로컬 파일 경로 사용
            type: file.type || 'video',
            size: file.size || 0,
          };
        });

        const localItems: MediaItem[] = await Promise.all(copyPromises);

        let sourceItems: ServerVideo[] = [];

        // childVideoId가 있으면, 이제 lineage를 가져옵니다.
        if (childVideoId) {
          try {
            const response = await axiosInstance.get<ServerVideo[]>(
              `videos/${childVideoId}/lineage`,
            );
            sourceItems = response.data;
          } catch (err) {
            console.error('[WebScreen] Failed to fetch video lineage:', err);
            Alert.alert('오류', '합주 정보를 불러오는 데 실패했습니다.');
            return; // 에러 발생 시 중단
          }
        }

        // 선택된 비디오들과 함께 ProcessingScreen으로 전달
        navigation.navigate('Processing', {
          localVideos: localItems,
          sourceVideos: sourceItems,
          parentVideoId: childVideoId,
        });
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        // 사용자가 선택을 취소한 경우이므로 아무것도 하지 않음
      } else {
        console.error('[WebScreen] 파일 선택 오류:', error);
        Alert.alert('오류', '비디오 파일을 선택하는 중 오류가 발생했습니다.');
      }
    }
  };

  // 메세지 처리
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      // 수신된 데이터는 문자열이므로 JSON 객체로 파싱
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'CONSOLE':
          const { level, data } = message.payload;
          const H_DATA = ['[WebView]', ...data];
          switch (level) {
            case 'log':
              console.log(...H_DATA);
              break;
            case 'warn':
              console.warn(...H_DATA);
              break;
            case 'error':
              console.error(...H_DATA);
              break;
            case 'info':
              console.info(...H_DATA);
              break;
            default:
              console.log(...H_DATA);
          }
          break;
        case 'startRecording': {
          const { video: webVideo } = message.data;
          if (webVideo) {
            // Web에서 받은 camelCase 데이터를 RN의 snake_case 타입으로 변환
            const rnVideo: ServerVideo = {
              id: webVideo.id,
              user_id: webVideo.user.id,
              parent_video_id: webVideo.parent_video_id,
              depth: webVideo.depth,
              like_count: webVideo.likeCount,
              comment_count: webVideo.commentCount,
              created_at: webVideo.created_at,
              source_video_key: webVideo.source_video_key,
              results_video_key: webVideo.results_video_key,
              thumbnail_key: webVideo.thumbnail_key,
              video_url: webVideo.videoUrl,
              thumbnail_url: webVideo.thumbnailUrl,
              user: {
                id: webVideo.user.id,
                nickname: webVideo.user.nickname,
                profile_image_url: webVideo.user.profile_image_url,
              },
              startTime: webVideo.startTime,
              endTime: webVideo.endTime,
              timelinePosition: webVideo.timelinePosition,
            };
            navigation.navigate('RecordScreen', { video: rnVideo });
          }
          break;
        }
        case 'CREATE_VIDEO':
          // '새 비디오 만들기' 버튼 클릭 시
          navigation.navigate('Home');
          break;
        case 'CREATE_VIDEO_FROM_GALLERY':
          // '갤러리에서 영상 선택' 버튼 클릭 시
          // 웹에서 전달받은 토큰이 있으면 AsyncStorage에 저장
          if (message.payload && message.payload.token) {
            await AsyncStorage.setItem('accessToken', message.payload.token);
          }
          await pickVideos(false); // 단일 비디오 선택
          break;
        case 'startEnsemble': {
          const { token, selectedVideoId } = message.data;
          if (token) {
            await AsyncStorage.setItem('accessToken', token);
          }
          if (selectedVideoId) {
            await pickVideos(false, selectedVideoId);
          }
          break;
        }
        case 'EDIT_VIDEO':
          // '합주하기' 버튼 클릭 시
          const { videoId } = message.payload;
          navigation.navigate('VideoEdit', { parentVideoId: videoId });
          break;
        case 'TOKEN_UPDATE':
          // 웹에서 토큰이 업데이트되었을 때
          if (message.token) {
            await AsyncStorage.setItem('accessToken', message.token);
          }
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message from WebView:', error);
    }
  };

  const userAgent = "Mozilla/5.0 (Linux; Android 10; Android SDK built for x86 Build/LMY48X) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.117 Mobile Safari/608.2.11";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <WebView
        ref={webViewRef}
        userAgent={userAgent}
        source={{ uri: webFrontendUrl }}
        onNavigationStateChange={onNavigationStateChange}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={false}
        allowsInlineMediaPlayback={true}
        injectedJavaScript={`${meta}; ${injectedJavaScriptForLogs}`}
        // onMessage 핸들러를 연결하여 웹과 앱의 통신 활성화
        onMessage={handleWebViewMessage}
        onLoadEnd={sendTokenToWebView}
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default WebScreen;
