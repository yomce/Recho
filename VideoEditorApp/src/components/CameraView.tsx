import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, CameraDevice } from 'react-native-vision-camera';

interface Props {
  cameraRef: React.RefObject<Camera>;
  device: CameraDevice | null;
}

const CameraView: React.FC<Props> = ({ cameraRef, device }) => {
  return (
    <View style={styles.bottomContainer}>
      <View style={styles.cameraWrapper}>
        {device ? (
          <Camera
            ref={cameraRef}
            style={styles.cameraView}
            device={device}
            isActive={true}
            video={true}
            audio={true}
          />
        ) : (
          <Text style={styles.infoText}>사용 가능한 카메라가 없습니다.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomContainer: { flex: 1, backgroundColor: '#111' },
  cameraWrapper: { flex: 1, overflow: 'hidden' },
  cameraView: { flex: 1 },
  infoText: { color: 'white', fontSize: 18, textAlign: 'center', marginTop: 20 },
});

export default CameraView;