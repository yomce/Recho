import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from 'react'; // useEffect 임포트
import styled from 'styled-components/native';
import { View } from 'react-native';
import Video, {
  OnLoadData,
  OnProgressData,
  ReactVideoSourceProperties,
  VideoRef,
} from 'react-native-video';
import { MediaItem } from '../../types'; // MediaItem 임포트

// Styled Components 정의
const VideoContainer = styled.View`
  border-radius: 8px;
  overflow: hidden;
  background-color: #333333;
  width: 100%;
  height: 100%;
`;

const StyledVideo = styled(Video)<ReactVideoSourceProperties>`
  width: 100%;
  height: 100%;
`;

export interface VideoPlayerHandles {
  seek: (time: number) => void;
}

interface Props {
  source: MediaItem; // 재생할 미디어 아이템
  volume: number; // 볼륨 (0.0 ~ 2.0)
  isPaused: boolean; // 재생 일시정지 여부
  muted?: boolean; // 음소거 여부
  startTime: number; // 비디오 재생 시작 시간 (초)
  endTime: number; // 비디오 재생 종료 시간 (초)
  onLoad: (data: OnLoadData) => void; // 비디오 로드 완료 시 호출될 함수
  onProgress: (data: OnProgressData) => void; // 재생 진행 중 호출될 함수
  onPlay: () => void; // [추가] onPlay 핸들러 prop 타입 정의
  onPause: () => void;
  onStop: () => void;
  onSeekComplete: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerHandles, Props>(
  (
    {
      source,
      volume,
      isPaused,
      muted,
      startTime,
      endTime,
      onLoad,
      onProgress,
      onPlay, // [추가]
      onPause,
      onStop, // [추가]
      onSeekComplete, // [추가]
    },
    ref,
  ) => {
    const videoRef = useRef<VideoRef>(null);
    const playbackTimeRef = useRef(0);
    const isSeekingRef = useRef(false);

    // useImperativeHandle을 사용하여 상위 컴포넌트에 seek 함수 노출
    useImperativeHandle(ref, () => ({
      seek: (time: number) => {
        videoRef.current?.seek(time); // 비디오 탐색
      },
    }));

    // 비디오가 로드되면 시작 시간으로 이동합니다.
    // 또한, startTime이 변경될 때마다 비디오를 해당 위치로 이동시킵니다.
    useEffect(() => {
      if (videoRef.current && startTime !== undefined && startTime !== null) {
        videoRef.current.seek(startTime);
      }
    }, [startTime]); // startTime이 변경될 때마다 실행

    // onProgress 핸들러를 확장하여 endTime에 도달하면 일시정지 또는 중지 로직을 추가할 수 있습니다.
    const handleProgress = (data: OnProgressData) => {
      if (!isSeekingRef.current) {
        playbackTimeRef.current = data.currentTime;
        onProgress(data); // 원래의 onProgress 함수 호출
      }

      // endTime에 도달했는지 확인하고, 필요하다면 비디오를 일시정지합니다.
      if (endTime !== undefined && data.currentTime >= endTime) {
        // 비디오를 일시정지하거나, 다음 비디오로 넘어가는 로직을 여기에 추가
        // 예를 들어, onPause를 호출하여 비디오를 멈출 수 있습니다.
        // 또는, onStop을 호출하여 비디오를 처음으로 되돌릴 수도 있습니다.
        // 여기서는 예시로 onPause를 호출합니다.
        onPause();
        // 또는 videoRef.current?.pause(); 를 직접 호출할 수도 있습니다.
        // 필요한 경우 videoRef.current?.seek(startTime); 으로 처음으로 되돌릴 수도 있습니다.
      }
    };

    const handleEnd = () => {
      // Android에서는 isPaused=true만으로 onEnd가 호출될 수 있음.
      // 재생 시간이 종료 시간에 근접했을 때만 onStop을 호출하여 방지.
      if (Math.abs(playbackTimeRef.current - endTime) < 0.5) {
        onStop(); // [수정] props로 받은 onStop을 여기서 호출
      }
    };

    const handleLoad = (data: OnLoadData) => {
      onLoad(data);
      if (startTime > 0) {
        videoRef.current?.seek(startTime);
      }
    };

    return (
      <View>
        <VideoContainer>
          <StyledVideo
            ref={videoRef}
            source={{ uri: source.uri }} // 비디오 URI 소스
            resizeMode="cover" // 비디오 크기 조정 모드
            paused={isPaused} // 재생/일시정지 상태
            muted={muted} // [추가] 음소거 상태
            progressUpdateInterval={50} // [추가] 50ms마다 진행상황 업데이트
            onLoad={handleLoad} // 원래의 onLoad 함수 호출
            onProgress={handleProgress} // 확장된 진행 이벤트 핸들러
            onPlaybackStateChanged={state => {
              if (state.isPlaying) {
                onPlay(); // [추가] isPlaying 상태가 true이면 onPlay 호출
              } else {
                onPause();
              }
            }}
            onEnd={handleEnd} // [수정] onEnd 이벤트에 handleEnd 연결
            onSeek={onSeekComplete} // [추가]
            volume={volume} // 볼륨
            // startTime과 endTime은 이제 직접 프롭으로 전달하지 않습니다.
            // 대신 onLoad에서 초기 seek하고 onProgress에서 endTime을 모니터링합니다.
          />
        </VideoContainer>
      </View>
    );
  },
);

export default VideoPlayer;
