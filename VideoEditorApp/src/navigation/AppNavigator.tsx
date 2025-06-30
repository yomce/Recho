import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import VideoEditScreen from '../screens/VideoEditScreen';
import MediaLibraryScreen from '../screens/MediaLibraryScreen';
import VideoPreviewScreen from '../screens/VideoPreviewScreen';
import NewVideoTestScreen from '../screens/NewVideoTestScreen';
import FFmpegTestScreen from '../screens/FFmpegTestScreen'; // FFmpegTestScreen 임포트

import { RootStackParamList } from '../types'; // RootStackParamList를 types에서 임포트

const Stack = createStackNavigator<RootStackParamList>();

/**
 * AppNavigator 컴포넌트는 앱의 모든 화면을 관리하는 내비게이션 스택을 정의합니다.
 * react-navigation의 createStackNavigator를 사용하며,
 * 헤더 스타일은 styled-components를 활용하여 정의되었습니다.
 */
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          // headerStyle은 View 컴포넌트에 직접 적용되므로 styled-components로 감싸서 사용
          headerStyle: {
            backgroundColor: '#2c3e50', // StyledHeader의 배경색과 일치
          },
          headerTintColor: '#ecf0f1', // 뒤로가기 버튼 등의 색상
          headerTitleStyle: {
            fontWeight: 'bold', // StyledHeaderTitle과 일치
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '🎬 비디오 편집 앱',
            headerShown: false, // 홈 화면에서는 헤더 숨김
          }}
        />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: '📷 카메라',
          }}
        />
        <Stack.Screen
          name="VideoEdit"
          component={VideoEditScreen}
          options={{
            title: '✂️ 비디오 편집',
          }}
        />
        <Stack.Screen
          name="MediaLibrary"
          component={MediaLibraryScreen}
          options={{
            title: '📁 파일 선택',
          }}
        />
        <Stack.Screen
          name="VideoPreview"
          component={VideoPreviewScreen}
          options={{
            title: '👁️ 비디오 미리보기',
          }}
        />
        <Stack.Screen
          name="NewVideoTest"
          component={NewVideoTestScreen}
          options={{
            title: '🎤 합주 녹화',
            headerShown: false, // 합주 녹화 화면에서는 헤더 숨김
          }}
        />
         <Stack.Screen
          name="FFmpegTest"
          component={FFmpegTestScreen}
          options={{
            title: '🛠️ FFmpeg 테스트',
          }}
        />
        {/* SideBySide 스크린은 RootStackParamList에 있지만, 여기에 컴포넌트가 없으므로 주석 처리하거나 추가해야 합니다. */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
