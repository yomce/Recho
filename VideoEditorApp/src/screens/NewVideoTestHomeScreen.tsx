import React from 'react';
import { View, Text, Button, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  NewVideoTestHome: undefined;
  NewVideoTest: undefined;
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'NewVideoTestHome'>;
};

const NewVideoTestHomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>new_video_test 홈</Text>
      <Button
        title="합주 녹화/비디오 기능"
        onPress={() => navigation.navigate('NewVideoTest')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
});

export default NewVideoTestHomeScreen;
