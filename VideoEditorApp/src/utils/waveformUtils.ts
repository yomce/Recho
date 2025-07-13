import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

const POINTS_PER_SECOND = 10; // 초당 표시할 파형 데이터 포인트 개수

/**
 * 숫자 배열을 주어진 크기로 다운샘플링합니다.
 * @param data 원본 데이터 배열
 * @param targetSize 목표 크기
 * @returns 다운샘플링된 배열
 */
const downsample = (data: number[], targetSize: number): number[] => {
  if (targetSize >= data.length) {
    return data;
  }
  const downsampled = [];
  const step = data.length / targetSize;
  for (let i = 0; i < targetSize; i++) {
    const startIndex = Math.floor(i * step);
    const endIndex = Math.floor((i + 1) * step);
    const chunk = data.slice(startIndex, endIndex);
    if (chunk.length > 0) {
      const avg = chunk.reduce((sum, val) => sum + val, 0) / chunk.length;
      downsampled.push(avg);
    }
  }
  return downsampled;
};

/**
 * 비디오 파일에서 오디오 파형 데이터를 추출합니다.
 *
 * 이 함수는 ffmpeg 명령을 실행하여 비디오의 오디오 트랙을 분석합니다.
 * 'astats' 필터를 사용하여 오디오 청크의 RMS(Root Mean Square) 레벨을 얻고,
 * 이 값을 0-1 범위로 정규화하여 파형을 나타냅니다.
 *
 * 처리 속도를 높이기 위해 오디오를 먼저 8000Hz로 다운샘플링합니다.
 *
 * @param videoUri 비디오 파일의 URI.
 * @param duration 비디오의 전체 길이 (초).
 * @returns 파형을 나타내는 0에서 1 사이의 숫자 배열을 반환하는 Promise.
 */
export const extractWaveformData = async (
  videoUri: string,
  duration: number,
  onSessionCreated?: (sessionId: number) => void,
): Promise<number[]> => {
  // 복잡한 FFmpeg 명령어 설명:
  // -i "${videoUri}": 입력 파일
  // -af ...: 오디오 필터 그래프
  //   - aresample=8000: 데이터 처리량을 줄이기 위해 8000Hz로 다운샘플링
  //   - astats=metadata=1:reset=1: 오디오 통계 계산
  //   - ametadata=mode=print:key=lavfi.astats.Overall.RMS_level:file=-: 각 프레임의 RMS 레벨을 stdout으로 출력
  // -f null -: 출력 파일 없음
  const command = `-nostats -i "${videoUri}" -af aresample=8000,astats=metadata=1:reset=1,ametadata=mode=print:key=lavfi.astats.Overall.RMS_level -f null -`;

  try {
    const session = await FFmpegKit.execute(command);
    onSessionCreated?.(session.getSessionId());

    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      const output = await session.getOutput();
      if (!output) {
        return [];
      }

      const lines = output.split('\n');
      const rmsLevels: number[] = [];
      const rmsKey = 'lavfi.astats.Overall.RMS_level=';

      for (const line of lines) {
        if (line.includes(rmsKey)) {
          const valueStr = line.split('=')[1];
          const dbValue = parseFloat(valueStr);
          // -Infinity는 무음 부분에서 발생할 수 있으므로 유효한 숫자만 추가
          if (!isNaN(dbValue) && dbValue < 0) {
            rmsLevels.push(dbValue);
          }
        }
      }

      if (rmsLevels.length === 0) return [];

      // 시각화를 위해 dB 값을 0-1 범위로 정규화합니다.
      // 대부분의 오디오에 합리적인 60dB의 동적 범위를 가정합니다.
      const maxDb = 0;
      const minDb = -60; // 무음은 -Infinity일 수 있지만, -60dB로 제한합니다.

      const normalized = rmsLevels.map(db => {
        const clampedDb = Math.max(minDb, db);
        const linearValue = (clampedDb - minDb) / (maxDb - minDb);
        // 작은 소리는 더 작게, 큰 소리는 더 크게 만들어 시각적 대비를 강화합니다.
        // 지수(exponent) 값을 높이면 대비가 더 강해집니다. (예: 2.0 ~ 3.0)
        const exponent = 2.5;
        return Math.pow(linearValue, exponent);
      });

      // UI에 필요한 만큼 데이터 포인트를 동적으로 계산하여 다운샘플링합니다.
      const totalPoints = Math.floor(duration * POINTS_PER_SECOND);
      const finalWaveform = downsample(normalized, totalPoints);
      return finalWaveform;
    } else if (ReturnCode.isCancel(returnCode)) {
      // 취소된 경우 조용히 빈 배열 반환
      return [];
    } else {
      // 실패한 경우 조용히 빈 배열 반환
      return [];
    }
  } catch (error) {
    // 오류 발생 시 조용히 빈 배열 반환
    return [];
  }
};
