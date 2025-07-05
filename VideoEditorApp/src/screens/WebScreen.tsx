import React, { useRef } from 'react';
import { SafeAreaView, StyleSheet, Alert } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { type RootStackParamList, type MediaItem } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isErrorWithCode, pick, types } from '@react-native-documents/picker';

type WebScreenRouteProp = RouteProp<RootStackParamList, 'Web'>;

const WebScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<WebScreenRouteProp>();
  const webviewRef = useRef<WebView>(null);

  // 나중에 env로 변경
  const defaultUrl = 'http://localhost:5173';
  const webFrontendUrl = route.params?.url ?? defaultUrl;
  // const webFrontendUrl = 'http://www.naver.com';
  // const [accessToken, setAccessToken] = useState<string | null>(null);

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
   */
  const pickVideos = async (allowMultiSelection: boolean) => {
    try {
      console.log(
        `[WebScreen] ${
          allowMultiSelection ? '여러' : '단일'
        } 비디오 파일 선택 시작...`,
      );

      const result = await pick({
        type: [types.video], // 비디오 파일만 선택
        allowMultiSelection: allowMultiSelection, // 여러 파일 선택 허용 여부 설정
      });

      console.log('[WebScreen] 선택된 파일:', result);

      if (result && result.length > 0) {
        // 선택된 파일들을 MediaItem 배열로 변환
        const items: MediaItem[] = result.map((file, index) => ({
          id: file.uri + (allowMultiSelection ? index : ''), // 여러 파일 선택 시 고유 ID 보장
          filename: file.name || `video_${index}`, // 파일명 없으면 기본값
          uri: file.uri,
          type: 'video',
          size: file.size || 0,
        }));

        // 선택된 비디오들과 함께 total_slots: 1을 전달
        navigation.navigate('VideoEdit', {
          videos: items,
          total_slots: 1,
        } as RootStackParamList['VideoEdit']);
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
        // onMessage 핸들러를 연결하여 웹과 앱의 통신 활성화
        onMessage={handleWebViewMessage}
        onLoadEnd={sendTokenToWebView}
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
