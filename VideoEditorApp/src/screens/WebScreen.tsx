import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { type StackNavigationProp } from '@react-navigation/stack';
import { type RootStackParamList } from '../types';

const WebScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  // docker-compose.dev.yml에 정의된 webfrontend 서비스의 포트와 일치해야 함
  const webFrontendUrl = 'http://localhost:5173';
  // const webFrontendUrl = 'http://www.naver.com';

  /**
   * WebView (웹)에서 보낸 메시지를 수신하고 처리하는 핸들러 함수
   */
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      // 수신된 데이터는 문자열이므로 JSON 객체로 파싱합니다.
      const message = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', message);

      // 메시지 타입에 따라 적절한 화면으로 이동합니다.
      switch (message.type) {
        case 'CREATE_VIDEO':
          // '새 비디오 만들기' 버튼 클릭 시
          navigation.navigate('Home');
          break;
        case 'EDIT_VIDEO':
          // '리믹스하기' 버튼 클릭 시
          const { videoId } = message.payload;
          navigation.navigate('VideoEdit', { parentVideoId: videoId });
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
        source={{ uri: webFrontendUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        // [중요] onMessage 핸들러를 연결하여 웹과 앱의 통신을 활성화합니다.
        onMessage={handleWebViewMessage}
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
