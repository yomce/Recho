import React, { useRef } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import {
  WebView,
  type WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';
import {
  type RootStackParamList,
  type MediaItem,
  Video as ServerVideo,
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isErrorWithCode, pick, types } from '@react-native-documents/picker';
import axiosInstance from '../api/axiosInstance';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jwtDecode } from 'jwt-decode';
import { WEB_URL } from '@env';

type WebScreenRouteProp = RouteProp<RootStackParamList, 'Web'>;

interface DecodedToken {
  id: string;
  username: string;
  exp: number;
}

const WebScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<WebScreenRouteProp>();
  const webviewRef = useRef<WebView>(null);
  const insets = useSafeAreaInsets();

  const defaultUrl = WEB_URL || 'http://localhost:5173';
  const webFrontendUrl = route.params?.url ?? defaultUrl;

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
    if (token && webviewRef.current) {
      const message = JSON.stringify({ type: 'SET_TOKEN', token });
      webviewRef.current.postMessage(message);
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
      console.log(
        `[WebScreen] ${
          allowMultiSelection ? '여러' : '단일'
        } 비디오 파일 선택 시작...`,
      );

      const result = await pick({
        type: [types.video],
        allowMultiSelection: allowMultiSelection,
      });

      console.log(
        '[WebScreen] Picker Result:',
        JSON.stringify(result, null, 2),
      );

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
          console.log(
            `[WebScreen] Fetching video lineage for ID: ${childVideoId}`,
          );
          try {
            const response = await axiosInstance.get<ServerVideo[]>(
              `/videos/${childVideoId}/lineage`,
            );
            sourceItems = response.data;
            console.log('[WebScreen] Fetched lineage data:', sourceItems);
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
        });
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        console.log('[WebScreen] 사용자가 파일 선택을 취소했습니다.');
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
        case 'CREATE_VIDEO':
          // '새 비디오 만들기' 버튼 클릭 시
          navigation.navigate('Home');
          break;
        case 'CREATE_VIDEO_FROM_GALLERY':
          // '갤러리에서 영상 선택' 버튼 클릭 시
          // 웹에서 전달받은 토큰이 있으면 AsyncStorage에 저장
          if (message.payload && message.payload.token) {
            await AsyncStorage.setItem('accessToken', message.payload.token);
            console.log(
              '[WebScreen] accessToken from web stored in AsyncStorage.',
            );
          }
          await pickVideos(false); // 단일 비디오 선택
          break;
        case 'startEnsemble': {
          const { token, childVideoId } = message.payload;
          if (token) {
            await AsyncStorage.setItem('accessToken', token);
            console.log(
              '[WebScreen] accessToken from web stored for ensemble.',
            );
          }
          if (childVideoId) {
            // 이제 API를 호출하는 대신, childVideoId를 가지고 바로 pickVideos를 호출합니다.
            await pickVideos(false, childVideoId);
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

  const handleShouldStartLoadWithRequest = (event: WebViewNavigation) => {
    console.log('handleShouldStartLoadWithRequest', event);
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: webFrontendUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        injectedJavaScript={injectedJavaScriptForLogs}
        // onMessage 핸들러를 연결하여 웹과 앱의 통신 활성화
        onMessage={handleWebViewMessage}
        onLoadEnd={sendTokenToWebView}
        mediaPlaybackRequiresUserAction={false}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
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
