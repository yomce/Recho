import { Platform, Alert } from 'react-native';
import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import { EditData } from '../types'; // types.ts에서 EditData를 임포트

/**
 * 주어진 편집 데이터(비디오 트리밍, 볼륨, 이퀄라이저, 화면 비율 등)를 기반으로 FFmpeg filter_complex 문자열 배열을 생성합니다.
 * 이 함수는 여러 비디오 스트림을 처리하고 오디오를 믹싱하며, 비디오를 그리드 형태로 배치하고 라운드 코너를 적용합니다.
 * @param editData 편집을 위한 비디오 트리머 데이터 배열
 * @returns FFmpeg -filter_complex에 사용될 문자열 배열
 */
export const generateCollageFilterComplex = (editData: EditData): string[] => {
  const { trimmers } = editData;
  const filterComplex: string[] = [];
  const videoCount = trimmers.length;

  // 비디오가 없으면 빈 배열 반환
  if (videoCount === 0) {
    return [];
  }

  // --- 오디오 필터 체인 생성 ---
  // 각 비디오의 오디오를 트리밍하고, 볼륨을 조절하며, 이퀄라이저를 적용한 후 믹싱합니다.
  const audioOutputs: string[] = [];
  trimmers.forEach((trimmer, i) => {
    // 1. 오디오 트리밍: 비디오의 시작/종료 시간에 맞춰 오디오도 트리밍
    // asetpts=PTS-STARTPTS는 타임스탬프를 0부터 시작하도록 재설정
    filterComplex.push(
      `[${i}:a]atrim=start=${trimmer.startTime}:end=${trimmer.endTime},asetpts=PTS-STARTPTS[a${i}_trimmed]`,
    );
    // 2. 볼륨 조절
    filterComplex.push(`[a${i}_trimmed]volume=${trimmer.volume}[a${i}_vol]`);
    let lastAudioNode = `[a${i}_vol]`; // 현재 오디오 체인의 마지막 노드

    // 3. 이퀄라이저 적용: 각 EQ 밴드에 대해 gain이 0이 아니면 equalizer 필터 적용
    trimmer.equalizer.forEach((band, bandIndex) => {
      if (band.gain !== 0) {
        const eqNode = `a${i}_eq${bandIndex}`; // EQ 필터의 출력 노드 이름
        // equalizer 필터: f=주파수, t=필터 타입 (h=peaking), width_type=q, w=Q값 (대역폭), g=게인(dB)
        filterComplex.push(
          `${lastAudioNode}equalizer=f=${band.frequency}:t=h:width_type=q:w=1.41:g=${band.gain}[${eqNode}]`,
        );
        lastAudioNode = `[${eqNode}]`; // 다음 필터의 입력으로 설정
      }
    });
    audioOutputs.push(lastAudioNode); // 최종 오디오 출력 노드 저장
  });

  // 모든 개별 오디오 출력을 amix 필터로 믹싱합니다.
  // duration=shortest는 가장 짧은 오디오 스트림 길이에 맞춰 믹싱을 종료합니다.
  if (audioOutputs.length > 0) {
    filterComplex.push(`${audioOutputs.join('')}amix=inputs=${videoCount}:duration=shortest[a]`);
  }

  // --- 비디오 필터 체인 생성 ---
  // 비디오 콜라주 레이아웃을 계산하고 각 비디오에 적용합니다.
  // 모든 비디오의 트리밍된 길이 중 가장 짧은 길이를 콜라주 전체 길이로 설정합니다.
  const shortestDuration = Math.min(...trimmers.map(t => t.endTime - t.startTime));
  console.log(`[FFmpegFilters] Calculated shortest duration for collage: ${shortestDuration} seconds`);

  // FFmpeg는 너비와 높이가 짝수여야 하므로, 홀수일 경우 짝수로 조정하는 헬퍼 함수
  const ensureEven = (num: number) => 2 * Math.round(num / 2);

  const NUM_COLS = 2; // 콜라주 열의 수
  const COLLAGE_WIDTH = 540; // 콜라주의 전체 너비 (px)
  const PADDING = 20; // 비디오 프레임과 콜라주 테두리, 그리고 프레임 간의 패딩 (px)
  const cornerRadius = 15; // 라운드 코너의 반지름 (px)

  // 각 프레임의 너비 계산: (콜라주 너비 - (열 개수 + 1) * 패딩) / 열 개수
  const FRAME_WIDTH = ensureEven((COLLAGE_WIDTH - (NUM_COLS + 1) * PADDING) / NUM_COLS);

  // 각 비디오의 원본 화면 비율을 기반으로 프레임 높이 계산
  const frameHeights = trimmers.map(trimmer => {
    // aspectRatio가 유효하지 않으면 기본값 (16/9) 사용
    const ar_val = parseFloat(trimmer.aspectRatio) || (16 / 9);
    return ensureEven(FRAME_WIDTH / ar_val);
  });

  // 콜라주에 필요한 행의 수
  const numRows = Math.ceil(trimmers.length / NUM_COLS);
  // 각 행의 최대 높이 (해당 행의 모든 비디오 프레임 중 가장 큰 높이)
  const rowHeights: number[] = [];
  for (let i = 0; i < numRows; i++) {
    const start = i * NUM_COLS;
    const end = Math.min(start + NUM_COLS, trimmers.length); // 마지막 행 처리
    const heightsInRow = frameHeights.slice(start, end);
    rowHeights.push(heightsInRow.length > 0 ? Math.max(...heightsInRow) : 0);
  }

  // 콜라주 배경의 전체 높이 계산: (행 개수 + 1) * 패딩 + 모든 행 높이 합
  const totalRowHeights = rowHeights.reduce((sum, height) => sum + height, 0);
  const bg_height = ensureEven((numRows + 1) * PADDING + totalRowHeights);
  const bg_width = ensureEven(COLLAGE_WIDTH); // 배경 너비는 콜라주 너비와 동일

  // 검은색 배경 생성 (콜라주의 기반)
  filterComplex.push(`color=c=black:s=${bg_width}x${bg_height}:d=${shortestDuration}[bg]`);

  let lastOverlayNode = '[bg]'; // 오버레이 체인의 현재 입력 노드
  let currentOverlayOutput: string; // 오버레이 체인의 현재 출력 노드

  trimmers.forEach((trimmer, i) => {
    const frame_h = frameHeights[i]; // 현재 비디오 프레임의 높이
    const col = i % NUM_COLS; // 현재 비디오의 열 인덱스
    const row = Math.floor(i / NUM_COLS); // 현재 비디오의 행 인덱스

    // y-오프셋 계산: 이전 행들의 높이와 패딩을 더한 값
    let y_offset = 0;
    for (let j = 0; j < row; j++) {
      y_offset += rowHeights[j] + PADDING;
    }
    // x, y 좌표 계산
    const x = PADDING + col * (FRAME_WIDTH + PADDING);
    const y = PADDING + y_offset;

    // 비디오 트리밍, 타임스탬프 재설정, 스케일링, 크롭핑
    filterComplex.push(
      `[${i}:v]trim=start=${trimmer.startTime}:end=${trimmer.endTime},setpts=PTS-STARTPTS,scale=${FRAME_WIDTH}:-2,crop=${FRAME_WIDTH}:${frame_h}[v${i}_processed]`
    );

    let videoStream = `[v${i}_processed]`; // 라운드 코너 적용 전 비디오 스트림 노드

    // 라운드 코너 적용 (cornerRadius가 0보다 크면)
    if (cornerRadius > 0) {
      // 라운드 코너 마스크 생성
      filterComplex.push(`color=c=black:s=${FRAME_WIDTH}x${frame_h}[mask${i}_base]`);
      filterComplex.push(`[mask${i}_base]geq=lum='if(gt(hypot(X-max(${cornerRadius},min(W-${cornerRadius},X)),Y-max(${cornerRadius},min(H-${cornerRadius},Y))),${cornerRadius}),0,255)':a=255[mask${i}]`);
      // 마스크를 비디오에 적용하여 라운드 코너 비디오 생성
      filterComplex.push(`[v${i}_processed][mask${i}]alphamerge[v${i}_rounded]`);
      videoStream = `[v${i}_rounded]`; // 라운드 코너 적용 후 스트림 노드
    }

    // 마지막 비디오가 아니면 임시 출력 노드, 마지막 비디오면 최종 출력 노드 '[v]'
    currentOverlayOutput = (i === videoCount - 1) ? '[v]' : `[tmp${i}]`;
    
    // 현재 비디오를 이전 오버레이 결과에 오버레이
    // shortest=1은 오버레이 입력 중 가장 짧은 스트림 길이에 맞춰 출력을 종료합니다.
    filterComplex.push(`${lastOverlayNode}${videoStream}overlay=x=${x}:y=${y}:shortest=1${currentOverlayOutput}`);
    
    lastOverlayNode = currentOverlayOutput; // 다음 오버레이의 입력으로 설정
  });

  return filterComplex;
};

/**
 * 영상의 해상도를 확인하여 1080p를 초과하는 경우 사용자에게 확인 후 다운스케일링합니다.
 * 안드로이드의 content:// URI를 처리하기 위해 파일을 내부 캐시로 복사하는 로직을 포함합니다.
 *
 * @param originalUri 원본 영상의 URI (content:// 또는 file://)
 * @returns 다운스케일링된 영상의 실제 파일 경로 URI (또는 최적화가 필요 없으면 원본 URI), 실패하거나 사용자가 취소하면 null
 */
export const downscaleVideoIfRequired = async (originalUri: string): Promise<string | null> => {
  let accessibleUri = originalUri;
  let tempFilePath: string | null = null;
  let wasFileCopied = false;

  try {
    // 1. 안드로이드 content:// URI 처리: FFmpeg는 content://를 직접 처리하지 못할 수 있으므로 로컬 파일로 복사
    if (Platform.OS === 'android' && originalUri.startsWith('content://')) {
      tempFilePath = `${RNFS.CachesDirectoryPath}/temp_video_${new Date().getTime()}.mp4`;
      console.log(`[VideoUtils] Copying content URI to local cache: ${tempFilePath}`);
      await RNFS.copyFile(originalUri, tempFilePath);
      accessibleUri = tempFilePath;
      wasFileCopied = true;
      console.log(`[VideoUtils] Content URI successfully copied to: ${accessibleUri}`);
    }

    // 2. FFprobe로 영상 해상도 및 코덱 정보 확인 (JSON 출력 사용)
    console.log(`[VideoUtils] Probing video info (JSON) for: ${accessibleUri}`);
    // -of json: JSON 출력으로 설정
    // -show_streams: 모든 스트림 정보 표시
    // -v quiet: FFprobe 자체의 출력을 최소화
    const ffprobeCommand = `-v quiet -hide_banner -print_format json -show_streams "${accessibleUri}"`;
    const session = await FFprobeKit.execute(ffprobeCommand);
    const returnCode = await session.getReturnCode();
    const output = await session.getOutput();

    let width: number = 0;
    let height: number = 0;
    let videoCodec: string | undefined;
    let audioCodec: string | undefined;

    // FFprobe가 성공적으로 실행되었는지 확인
    if (!ReturnCode.isSuccess(returnCode) || !output) {
      console.error("[VideoUtils] FFprobe: Failed to execute or no output. Return Code:", returnCode, "Output:", output);
      // FFprobe 실행 실패 시, 원본 URI 반환
      return wasFileCopied ? accessibleUri : originalUri;
    }

    try {
      const ffprobeData = JSON.parse(output);
      const streams = ffprobeData.streams;

      if (streams && Array.isArray(streams)) {
        const videoStream = streams.find((s: any) => s.codec_type === 'video');
        const audioStream = streams.find((s: any) => s.codec_type === 'audio');

        if (videoStream) {
          width = videoStream.width || 0;
          height = videoStream.height || 0;
          videoCodec = videoStream.codec_name;
        }
        if (audioStream) {
          audioCodec = audioStream.codec_name;
        }
      }
    } catch (parseError) {
      console.error("[VideoUtils] FFprobe: Failed to parse JSON output.", parseError);
      return wasFileCopied ? accessibleUri : originalUri;
    }
    
    // 비디오 해상도 파싱에 실패했지만, 오디오 코덱만 감지된 경우 (오디오 전용 파일)
    if ((isNaN(width) || isNaN(height) || width === 0 || height === 0) && audioCodec && !videoCodec) {
        console.log(`[VideoUtils] Detected as an audio-only file with codec: ${audioCodec}. Skipping video optimization.`);
        return wasFileCopied ? accessibleUri : originalUri;
    }
    
    // 여전히 비디오 정보가 유효하지 않다면
    if (isNaN(width) || isNaN(height) || width === 0 || height === 0) {
      console.warn(`[VideoUtils] FFprobe: Resolution could not be reliably parsed or is zero. Raw output: "${output}"`);
      // 이 경우 최적화 대상에서 제외하고 원본 URI 반환.
      return wasFileCopied ? accessibleUri : originalUri;
    }
    
    console.log(`[VideoUtils] Detected video resolution: ${width}x${height}, Video Codec: ${videoCodec || 'N/A'}, Audio Codec: ${audioCodec || 'N/A'}`);

    const needsDownscaling = width > 1080 || height > 1080;
    // iOS에서 pcm_s16le 오디오는 MP4 컨테이너에서 지원되지 않으므로 강제 변환
    const needsAudioReencode = Platform.OS === 'ios' && audioCodec === 'pcm_s16le';
    // iOS에서 HEVC (hvc1) 비디오는 h264_videotoolbox로 재인코딩이 필요할 수 있음
    const needsVideoCodecConversion = Platform.OS === 'ios' && (videoCodec === 'hevc' || videoCodec === 'hvc1');

    if (needsDownscaling || needsAudioReencode || needsVideoCodecConversion) {
      // 3. 사용자에게 최적화 여부 확인 (Alert 사용, 커스텀 모달로 대체 고려)
      let alertMessage = "";
      if (needsDownscaling) {
          alertMessage += "선택한 영상의 해상도가 높습니다. 원활한 편집을 위해 1080p로 최적화하는 것을 권장합니다.";
      }
      if (needsAudioReencode) {
          if (alertMessage) alertMessage += "\n\n";
          alertMessage += "오디오 호환성 문제를 해결하기 위해 오디오가 변환됩니다.";
      }
      if (needsVideoCodecConversion) {
          if (alertMessage) alertMessage += "\n\n";
          alertMessage += "영상 코덱 호환성 문제를 해결하기 위해 영상이 변환됩니다.";
      }
      alertMessage += "\n\n진행하시겠습니까?";

      const userConfirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "영상 최적화 필요",
          alertMessage,
          [
            { text: "아니요 (취소)", onPress: () => resolve(false), style: 'cancel' },
            { text: "네, 진행합니다", onPress: () => resolve(true) }
          ],
          { cancelable: false }
        );
      });

      // 사용자가 '아니요'를 선택하면 null을 반환하여 과정 중단
      if (!userConfirmed) {
        console.log('[VideoUtils] User cancelled optimization.');
        // 임시 파일이 복사되었다면 해당 임시 파일도 삭제
        if (wasFileCopied && tempFilePath) {
            await RNFS.unlink(tempFilePath).catch(e => console.error("Failed to delete temp file:", e));
        }
        return null;
      }

      // 4. 사용자가 동의했으므로 FFmpeg를 사용하여 인코딩 진행
      const outputPath = `${RNFS.DocumentDirectoryPath}/optimized_video_${new Date().getTime()}.mp4`;
      
      let videoEncoder = '';
      let audioEncoder = '';
      let videoFilters = `scale=-2:1080`; // 기본 스케일링 필터

      if (Platform.OS === 'ios') {
        videoEncoder = 'h264_videotoolbox'; // iOS는 하드웨어 가속
        audioEncoder = 'aac'; // iOS에서 pcm_s16le 문제 해결
        // smpte432 컬러 프라이머리 문제가 계속 발생한다면 아래 주석 해제하여 bt709로 강제 변환 고려
        // videoFilters += ',colorspace=all=bt709:primaries=bt709:transfer=bt709:range=tv';
      } else { // Android
        // 안드로이드는 h264_mediacodec (하드웨어 가속) 또는 libx264 (소프트웨어)
        // h264_mediacodec가 안정적이지 않다면 libx264를 사용할 수도 있습니다.
        videoEncoder = 'h264_mediacodec'; 
        audioEncoder = 'aac'; 
      }

      // 오디오 비트레이트를 192k로 지정. 입력이 모노라면 96k~128k도 고려 가능.
      const audioBitrate = '192k'; 
      // preset은 하드웨어 가속 인코더에서는 무시되거나 다르게 작동할 수 있지만, libx264용으로 남겨둠
      const preset = Platform.OS === 'ios' ? '' : '-preset fast'; // iOS는 preset 옵션이 의미 없음

      const command = `-i "${accessibleUri}" -vf "${videoFilters}" -c:v ${videoEncoder} -c:a ${audioEncoder} -b:a ${audioBitrate} ${preset} -movflags +faststart "${outputPath}"`;
      
      console.log(`[VideoUtils] FFmpeg encoding started with command: ${command}`);
      const encodeSession = await FFmpegKit.execute(command);
      const encodeReturnCode = await encodeSession.getReturnCode();

      if (ReturnCode.isSuccess(encodeReturnCode)) {
        Alert.alert("최적화 완료", "영상이 성공적으로 최적화되었습니다.");
        console.log('[VideoUtils] FFmpeg: Encoding successful! Output path:', outputPath);
        // 최적화 후 임시 파일이 있었다면 삭제
        if (wasFileCopied && tempFilePath) {
            await RNFS.unlink(tempFilePath).catch(e => console.error("Failed to delete temp file after optimization:", e));
        }
        return outputPath;
      } else {
        const errorLogs = await encodeSession.getLogsAsString();
        Alert.alert('오류', '영상 최적화 중 오류가 발생했습니다. 콘솔 로그를 확인하세요.');
        console.error('[VideoUtils] FFmpeg: Encoding failed. Return Code:', encodeReturnCode, 'Logs:', errorLogs);
        // 실패 시 임시 파일 삭제
        if (wasFileCopied && tempFilePath) {
            await RNFS.unlink(tempFilePath).catch(e => console.error("Failed to delete temp file on encoding failure:", e));
        }
        return null;
      }
    } else {
      console.log('[VideoUtils] Video is 1080p or less, and no codec conversion required. Skipping optimization.');
      // 임시 파일이 복사되었다면, 이제 사용될 것이므로 최종 URI 반환
      return wasFileCopied ? accessibleUri : originalUri;
    }
  } catch (error) {
    console.error('[VideoUtils] An exception occurred during video processing:', error);
    Alert.alert('오류', '영상 처리 중 문제가 발생했습니다.');
    // 예외 발생 시 임시 파일 삭제
    if (wasFileCopied && tempFilePath) {
        await RNFS.unlink(tempFilePath).catch(e => console.error("Failed to delete temp file on exception:", e));
    }
    return null;
  }
};