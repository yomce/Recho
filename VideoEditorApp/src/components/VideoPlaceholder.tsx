import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  isEncoding: boolean;
  onSelectVideo: () => void;
}

const VideoPlaceholder: React.FC<Props> = ({ isEncoding, onSelectVideo }) => {
  if (isEncoding) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.infoText}>인코딩 중입니다...</Text>
        <Text style={styles.infoTextSub}>고해상도 영상은 다소 시간이 걸릴 수 있습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>합주할 동영상을 불러와주세요.</Text>
      <TouchableOpacity style={styles.selectButton} onPress={onSelectVideo}>
        <Text style={styles.buttonText}>내 휴대폰에서 동영상 찾기</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  placeholderText: { color: 'white', fontSize: 16, marginBottom: 20 },
  selectButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  infoText: { color: 'white', fontSize: 18, textAlign: 'center', marginTop: 20 },
  infoTextSub: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 10 },
});

export default VideoPlaceholder;