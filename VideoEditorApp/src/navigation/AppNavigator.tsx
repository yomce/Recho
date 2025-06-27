import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import VideoEditScreen from '../screens/VideoEditScreen';
import MediaLibraryScreen from '../screens/MediaLibraryScreen';
import FFmpegTestScreen from '../screens/FFmpegTestScreen';
import SideBySideScreen from '../screens/SideBySideScreen';
import VideoPreviewScreen from '../screens/VideoPreviewScreen';
import NewVideoTestScreen from '../screens/NewVideoTestScreen';

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  VideoEdit: { videoUri: string; videoName: string };
  MediaLibrary: undefined;
  FFmpegTest: undefined;
  SideBySide: undefined;
  VideoPreview: undefined;
  NewVideoTest: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2c3e50',
          },
          headerTintColor: '#ecf0f1',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: '🎬 비디오 편집 앱',
            headerShown: false,
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
          name="FFmpegTest"
          component={FFmpegTestScreen}
          options={{
            title: '🔧 FFmpeg 테스트',
          }}
        />
        <Stack.Screen
          name="SideBySide"
          component={SideBySideScreen}
          options={{
            title: '🔄 비디오 합치기',
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
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
