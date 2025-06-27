import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  IOSTestHome: undefined;
  FFmpegTest: undefined;
  SideBySide: undefined;
  VideoPreview: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'IOSTestHome'>;
};

const IOSTestHomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>iOSTestApp 홈</Text>
      <Button title="FFmpeg 테스트" onPress={() => navigation.navigate('FFmpegTest')} />
      <Button title="SideBySide 합치기" onPress={() => navigation.navigate('SideBySide')} />
      <Button title="비디오 미리보기" onPress={() => navigation.navigate('VideoPreview')} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
});

export default IOSTestHomeScreen; 