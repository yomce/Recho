import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { OnLoadData, OnProgressData } from 'react-native-video';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TrimmerState, SingleEditorHandles } from '../types';
import VideoPlayer, { VideoPlayerHandles } from './Editor/VideoPlayer';
import RangeControl from './Editor/RangeControl';
import AudioControls from './Editor/AudioControls';

interface Props {
  trimmerState: TrimmerState;
  onUpdate: (id: string, newState: Partial<Omit<TrimmerState, 'id'>>) => void;
  onVideoLoad: (id: string, data: OnLoadData, aspectRatio: string) => void;
}

const SingleVideoEditor = forwardRef<SingleEditorHandles, Props>(
  ({ trimmerState, onUpdate, onVideoLoad }, ref) => {
    const playerRef = useRef<VideoPlayerHandles>(null);
    const { id, sourceVideo, startTime, endTime, volume, equalizer, duration } = trimmerState;

    const [isPaused, setIsPaused] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);

    useImperativeHandle(ref, () => ({
      playVideo: () => handlePlay(),
      pauseVideo: () => handlePause(),
      seekToStart: () => handleStop(),
    }));

    const handleLoad = (data: OnLoadData) => {
      const ar = data.naturalSize.height > 0 ? (data.naturalSize.width / data.naturalSize.height).toFixed(3) : '1.777';
      setCurrentTime(startTime);
      onVideoLoad(id, data, ar);
    };

    const handleProgress = (data: OnProgressData) => {
      if (data.currentTime >= endTime && !isPaused) {
        handleStop();
      } else {
        setCurrentTime(data.currentTime);
      }
    };
    
    const handleSeek = (value: number) => {
      const clampedValue = Math.max(startTime, Math.min(value, endTime));
      playerRef.current?.seek(clampedValue);
      setCurrentTime(clampedValue);
    };

    const handlePlay = () => {
        if (currentTime < startTime || currentTime >= endTime) {
            handleSeek(startTime);
        }
        setIsPaused(false);
    };

    const handlePause = () => setIsPaused(true);
    
    const handleStop = () => {
        setIsPaused(true);
        handleSeek(startTime);
    };
    
    const handleRangeChange = (values: number[]) => {
      onUpdate(id, { startTime: values[0], endTime: values[1] });
      if (currentTime < values[0] || currentTime > values[1]) {
          handleSeek(values[0]);
      }
    };

    const handleVolumeChange = (value: number) => {
      onUpdate(id, { volume: value });
    };

    const handleEQChange = (bandId: string, gain: number) => {
      const newEQ = equalizer.map(b => (b.id === bandId ? { ...b, gain } : b));
      onUpdate(id, { equalizer: newEQ });
    };

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.editorContainer}>
          {sourceVideo ? (
            <>
              <VideoPlayer
                ref={playerRef}
                source={sourceVideo}
                volume={volume}
                isPaused={isPaused}
                startTime={startTime}
                endTime={endTime}
                onLoad={handleLoad}
                onProgress={handleProgress}
                onPlay={handlePlay}
                onPause={handlePause}
                onStop={handleStop}
              />

              <View style={styles.controlsSection}>
                <RangeControl
                  startTime={startTime}
                  endTime={endTime}
                  duration={duration}
                  currentTime={currentTime}
                  onValuesChange={handleRangeChange}
                  onSeek={handleSeek}
                />
                <AudioControls
                  volume={volume}
                  equalizer={equalizer}
                  onVolumeChange={handleVolumeChange}
                  onEQChange={handleEQChange}
                />
              </View>
            </>
          ) : (
            <View style={styles.emptySlot}>
               <Text style={styles.emptyText}>비디오 슬롯</Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    );
  },
);

const styles = StyleSheet.create({
    editorContainer: {
        marginHorizontal: 15,
        marginBottom: 15,
        backgroundColor: '#34495e',
        borderRadius: 12,
        padding: 10,
    },
    controlsSection: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(44, 62, 80, 0.8)',
        marginTop: 10,
        paddingTop: 10,
    },
    emptySlot: {
        height: 180,
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
});

export default SingleVideoEditor;