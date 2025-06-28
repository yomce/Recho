import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react'; // useEffect import 추가
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Video, { OnLoadData } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { TrimmerState, SingleEditorHandles, EQBand } from '../types';

interface Props {
  trimmerState: TrimmerState;
  onUpdate: (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => void;
  onVideoLoad: (id: string, data: OnLoadData, aspectRatio: string) => void;
}

const SingleVideoEditor = forwardRef<SingleEditorHandles, Props>(
  ({ trimmerState, onUpdate, onVideoLoad }, ref) => {
    const videoRef = useRef<Video>(null);
    const { id, sourceVideo, startTime, endTime, volume, equalizer, duration } = trimmerState;

    // ✨ [로그] 부모로부터 받은 props(상태)가 변경될 때마다 추적
    useEffect(() => {
      if (sourceVideo) { // 비디오가 있을 때만 로그를 남겨 콘솔을 깔끔하게 유지
        console.log(`[ChildProps] '${id}'가 부모로부터 새 상태를 받았습니다:`, { startTime, endTime, volume, eq_gains: equalizer.map(e => e.gain) });
      }
    }, [trimmerState]); // trimmerState가 바뀔 때마다 실행

    useImperativeHandle(ref, () => ({
      playVideo: () => {
        // ✨ [로그] 전역 컨트롤러가 playVideo 함수를 호출했는지 확인
        console.log(`[ChildAction] '${id}'의 playVideo() 호출됨`);
        videoRef.current?.seek(startTime);
        videoRef.current?.setNativeProps({ paused: false });
      },
      pauseVideo: () => {
        // ✨ [로그] 전역 컨트롤러가 pauseVideo 함수를 호출했는지 확인
        console.log(`[ChildAction] '${id}'의 pauseVideo() 호출됨`);
        videoRef.current?.setNativeProps({ paused: true });
      },
      seekToStart: () => {
        // ✨ [로그] 전역 컨트롤러가 seekToStart 함수를 호출했는지 확인
        console.log(`[ChildAction] '${id}'의 seekToStart() 호출됨`);
        videoRef.current?.seek(startTime);
      },
    }));

    const handleLoad = (data: OnLoadData) => {
      // ✨ [로그] Video 컴포넌트의 onLoad 이벤트 원본 데이터 확인
      console.log(`[ChildEvent] '${id}'의 onLoad 이벤트 발생. 원본 데이터:`, data);
      const ar = data.naturalSize.height > 0 ? (data.naturalSize.width / data.naturalSize.height).toFixed(3) : '1.777';
      onVideoLoad(id, data, ar);
    };

    const handleUpdate = (update: Partial<Omit<TrimmerState, 'id'>>) => {
      // ✨ [로그] 부모의 onUpdate 콜백을 호출하기 직전 데이터 확인
      console.log(`[ChildCallback] '${id}'가 부모의 onUpdate 호출. 전달 데이터:`, update);
      onUpdate(id, update);
    };

    const handleEQChange = (bandId: string, newGain: number) => {
      const newEQ = equalizer.map(band => (band.id === bandId ? { ...band, gain: newGain } : band));
      handleUpdate({ equalizer: newEQ });
    };

    return (
      <View style={styles.editorContainer}>
        {sourceVideo ? (
          <>
            <Text style={styles.sectionTitle}>🎬 {sourceVideo.filename}</Text>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: sourceVideo.uri }}
                style={styles.video}
                resizeMode="contain"
                paused={true} // 최초 로드 시 정지 상태 유지
                onLoad={handleLoad}
              />
            </View>

            <Text style={styles.label}>시간 설정 (시작: {startTime.toFixed(1)}s, 종료: {endTime.toFixed(1)}s)</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={startTime}
              onSlidingComplete={value => handleUpdate({ startTime: value, endTime: Math.max(value, endTime) })}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#ecf0f1"
              thumbTintColor="#3498db"
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration}
              value={endTime}
              onSlidingComplete={value => handleUpdate({ endTime: value, startTime: Math.min(value, startTime) })}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#ecf0f1"
              thumbTintColor="#3498db"
            />

            <Text style={styles.label}>볼륨: {Math.round(volume * 100)}%</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2} // 200%까지
              value={volume}
              onSlidingComplete={value => handleUpdate({ volume: value })}
              minimumTrackTintColor="#2ecc71"
              maximumTrackTintColor="#ecf0f1"
              thumbTintColor="#2ecc71"
            />

            <Text style={styles.label}>이퀄라이저</Text>
            {equalizer.map(band => (
              <View key={band.id} style={styles.eqBandContainer}>
                <Text style={styles.eqLabel}>{band.frequency}Hz: {band.gain.toFixed(1)}dB</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={-20}
                  maximumValue={20}
                  value={band.gain}
                  onSlidingComplete={value => handleEQChange(band.id, value)}
                  minimumTrackTintColor="#f39c12"
                  maximumTrackTintColor="#ecf0f1"
                  thumbTintColor="#f39c12"
                />
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.emptyText}>비디오 슬롯이 비어있습니다</Text>
            <Text style={styles.emptySubText}>라이브러리에서 영상을 선택해 채워주세요.</Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  editorContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#34495e',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: 10,
  },
  videoContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: 200,
  },
  label: {
    fontSize: 14,
    color: '#bdc3c7',
    marginBottom: 5,
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  eqBandContainer: {
    marginBottom: 5,
  },
  eqLabel: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  emptySlot: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c3e50',
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 5,
  },
});

export default SingleVideoEditor;