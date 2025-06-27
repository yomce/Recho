import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>🎬 비디오 편집 앱</Text>
        <Text style={styles.subtitle}>통합된 비디오 편집 솔루션</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 메인 기능</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.buttonText}>📷 카메라 촬영</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MediaLibrary')}
          >
            <Text style={styles.buttonText}>📁 파일에서 비디오 선택</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              navigation.navigate('VideoEdit', {
                videoUri: 'dummy',
                videoName: '샘플 비디오',
              })
            }
          >
            <Text style={styles.buttonText}>✂️ 비디오 편집</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 iOSTestApp 기능</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('FFmpegTest')}
          >
            <Text style={styles.buttonText}>🔧 FFmpeg 테스트</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('SideBySide')}
          >
            <Text style={styles.buttonText}>
              🔄 비디오 합치기 (Side by Side)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('VideoPreview')}
          >
            <Text style={styles.buttonText}>👁️ 비디오 미리보기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 new_video_test 기능</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('NewVideoTest')}
          >
            <Text style={styles.buttonText}>
              🎤 합주 녹화 (카메라 + 비디오)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ 앱 정보</Text>
          <Text style={styles.infoText}>
            이 앱은 기존의 iOSTestApp과 new_video_test 프로젝트를 통합한
            것입니다.
          </Text>
          <Text style={styles.infoText}>
            각 버튼을 눌러서 원하는 기능을 테스트해보세요.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495e',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ecf0f1',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#34495e',
  },
  buttonText: {
    color: '#ecf0f1',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#2c3e50',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 10,
    textAlign: 'center',
  },
  infoText: {
    color: '#bdc3c7',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;
