import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import { MediaItem } from '../../types';

interface Props {
  source: MediaItem;
  volume: number;
  isPaused: boolean;
  startTime: number;
  endTime: number;
  onLoad: (data: OnLoadData) => void;
  onProgress: (data: OnProgressData) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

export interface VideoPlayerHandles {
  seek: (time: number) => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandles, Props>(
  ({ source, volume, isPaused, startTime, endTime, onLoad, onProgress, onPlay, onPause, onStop }, ref) => {
    const videoRef = useRef<Video>(null);

    useImperativeHandle(ref, () => ({
      seek: (time: number) => {
        videoRef.current?.seek(time);
      },
    }));

    return (
      <View>
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: source.uri }}
            style={styles.video}
            resizeMode="contain"
            paused={isPaused}
            onLoad={onLoad}
            onProgress={onProgress}
            volume={volume}
            startTime={startTime}
            endTime={endTime}
          />
        </View>

        <View style={styles.playbackControls}>
          <TouchableOpacity onPress={onPlay} style={styles.button}>
            <Text style={styles.buttonText}>▶</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onPause} style={styles.button}>
            <Text style={styles.buttonText}>❚❚</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onStop} style={styles.button}>
            <Text style={styles.buttonText}>■</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
    videoContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#000',
        aspectRatio: 16 / 9,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    playbackControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        height: 40,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 8
    },
    button: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#ecf0f1',
        fontSize: 18,
    },
});

export default VideoPlayer;