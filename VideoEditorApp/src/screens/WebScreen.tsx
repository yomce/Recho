import React, { useRef } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { type RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
