import { Platform, Alert } from 'react-native';
import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import { EditData } from '../types'; // types.ts에서 EditData를 임포트

// [추가] URI를 FFmpeg가 인식 가능한 순수 파일 경로로 변환하는 헬퍼 함수
const cleanUri = (uri: string): string => {
  if (!uri) return '';
  let path = uri;
  // URL 인코딩된 문자(예: %20 -> 공백)를 디코딩
  path = decodeURIComponent(path);
  // 'file://' 접두사 제거
  if (path.startsWith('file://')) {
    path = path.substring(7);
  }
  return path;
};


/**
 * 주어진 편집 데이터(비디오 트리밍, 볼륨, 이퀄라이저, 화면 비율 등)를 기반으로 FFmpeg filter_complex 문자열 배열을 생성합니다.
 * (이 함수 내부 로직은 변경되지 않았습니다.)
 */
export const generateCollageFilterComplex = (editData: EditData): string[] => {
  // ... (이전과 동일한 코드)
  const { trimmers } = editData;
  const filterComplex: string[] = [];
  const videoCount = trimmers.length;

  if (videoCount === 0) {
    return [];
  }
  const audioOutputs: string[] = [];
  trimmers.forEach((trimmer, i) => {
    filterComplex.push(
      `[${i}:a]atrim=start=${trimmer.startTime}:end=${trimmer.endTime},asetpts=PTS-STARTPTS[a${i}_trimmed]`,
    );
    filterComplex.push(`[a${i}_trimmed]volume=${trimmer.volume}[a${i}_vol]`);
    let lastAudioNode = `[a${i}_vol]`;
    trimmer.equalizer.forEach((band, bandIndex) => {
      if (band.gain !== 0) {
        const eqNode = `a${i}_eq${bandIndex}`;
        filterComplex.push(
          `${lastAudioNode}equalizer=f=${band.frequency}:t=h:width_type=q:w=1.41:g=${band.gain}[${eqNode}]`,
        );
        lastAudioNode = `[${eqNode}]`;
      }
    });
    audioOutputs.push(lastAudioNode);
  });

  if (audioOutputs.length > 0) {
    filterComplex.push(`${audioOutputs.join('')}amix=inputs=${videoCount}:duration=shortest[a]`);
  }

  const shortestDuration = Math.min(...trimmers.map(t => t.endTime - t.startTime));
  console.log(`[FFmpegFilters] Calculated shortest duration for collage: ${shortestDuration} seconds`);

  const ensureEven = (num: number) => 2 * Math.round(num / 2);
  const NUM_COLS = 2;
  const COLLAGE_WIDTH = 540;
  const PADDING = 20;
  const cornerRadius = 15;
  const FRAME_WIDTH = ensureEven((COLLAGE_WIDTH - (NUM_COLS + 1) * PADDING) / NUM_COLS);
  const frameHeights = trimmers.map(trimmer => {
    const ar_val = parseFloat(trimmer.aspectRatio) || (16 / 9);
    return ensureEven(FRAME_WIDTH / ar_val);
  });
  const numRows = Math.ceil(trimmers.length / NUM_COLS);
  const rowHeights: number[] = [];
  for (let i = 0; i < numRows; i++) {
    const start = i * NUM_COLS;
    const end = Math.min(start + NUM_COLS, trimmers.length);
    const heightsInRow = frameHeights.slice(start, end);
    rowHeights.push(heightsInRow.length > 0 ? Math.max(...heightsInRow) : 0);
  }
  const totalRowHeights = rowHeights.reduce((sum, height) => sum + height, 0);
  const bg_height = ensureEven((numRows + 1) * PADDING + totalRowHeights);
  const bg_width = ensureEven(COLLAGE_WIDTH);
  filterComplex.push(`color=c=black:s=${bg_width}x${bg_height}:d=${shortestDuration}[bg]`);
  let lastOverlayNode = '[bg]';
  let currentOverlayOutput: string;
  trimmers.forEach((trimmer, i) => {
    const frame_h = frameHeights[i];
    const col = i % NUM_COLS;
    const row = Math.floor(i / NUM_COLS);
    let y_offset = 0;
    for (let j = 0; j < row; j++) {
      y_offset += rowHeights[j] + PADDING;
    }
    const x = PADDING + col * (FRAME_WIDTH + PADDING);
    const y = PADDING + y_offset;
    filterComplex.push(
      `[${i}:v]trim=start=${trimmer.startTime}:end=${trimmer.endTime},setpts=PTS-STARTPTS,scale=${FRAME_WIDTH}:-2,crop=${FRAME_WIDTH}:${frame_h}[v${i}_processed]`
    );
    let videoStream = `[v${i}_processed]`;
    if (cornerRadius > 0) {
      filterComplex.push(`color=c=black:s=${FRAME_WIDTH}x${frame_h}[mask${i}_base]`);
      filterComplex.push(`[mask${i}_base]geq=lum='if(gt(hypot(X-max(${cornerRadius},min(W-${cornerRadius},X)),Y-max(${cornerRadius},min(H-${cornerRadius},Y))),${cornerRadius}),0,255)':a=255[mask${i}]`);
      filterComplex.push(`[v${i}_processed][mask${i}]alphamerge[v${i}_rounded]`);
      videoStream = `[v${i}_rounded]`;
    }
    currentOverlayOutput = (i === videoCount - 1) ? '[v]' : `[tmp${i}]`;
    filterComplex.push(`${lastOverlayNode}${videoStream}overlay=x=${x}:y=${y}:shortest=1${currentOverlayOutput}`);
    lastOverlayNode = currentOverlayOutput;
  });
  return filterComplex;
};

/**
 * 영상의 해상도를 확인하여 1080p를 초과하는 경우 사용자에게 확인 후 다운스케일링합니다.
 * (이 함수 내부 로직도 안정성을 위해 일부 수정되었습니다.)
 */
export const downscaleVideoIfRequired = async (originalUri: string): Promise<string | null> => {
  let accessibleUri = originalUri;
  let tempFilePath: string | null = null;
  let wasFileCopied = false;

  try {
    if (Platform.OS === 'android' && originalUri.startsWith('content://')) {
      tempFilePath = `${RNFS.CachesDirectoryPath}/temp_video_${new Date().getTime()}.mp4`;
      console.log(`[VideoUtils] Copying content URI to local cache: ${tempFilePath}`);
      await RNFS.copyFile(originalUri, tempFilePath);
      accessibleUri = tempFilePath; // 이제 accessibleUri는 순수 파일 경로
      wasFileCopied = true;
      console.log(`[VideoUtils] Content URI successfully copied to: ${accessibleUri}`);
    } else {
        // [추가] content://가 아닌 다른 URI도 cleanUri로 경로 정제
        accessibleUri = cleanUri(originalUri);
    }
    
    // [수정] 정제된 경로(accessibleUri)를 FFprobe에 전달
    const ffprobeCommand = `-v quiet -hide_banner -print_format json -show_streams "${accessibleUri}"`;
    const session = await FFprobeKit.execute(ffprobeCommand);
    // ... (이후 로직은 이전과 대부분 동일)

    const returnCode = await session.getReturnCode();
    const output = await session.getOutput();

    let width: number = 0, height: number = 0;
    let videoCodec: string | undefined, audioCodec: string | undefined;

    if (!ReturnCode.isSuccess(returnCode) || !output) {
      console.error("[VideoUtils] FFprobe: Failed to execute or no output.", "Returning original/copied URI.");
      // [수정] 실패 시에도 file:// 접두사를 붙여서 반환해야 할 수 있음 (호출하는 곳에 따라 다름)
      // 여기서는 원본 URI를 반환하여 호출 측에서 처리하도록 함.
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }

    // ... (JSON 파싱 및 해상도/코덱 확인 로직은 이전과 동일)
    try {
      const ffprobeData = JSON.parse(output);
      const videoStream = ffprobeData.streams?.find((s: any) => s.codec_type === 'video');
      const audioStream = ffprobeData.streams?.find((s: any) => s.codec_type === 'audio');
      if (videoStream) { width = videoStream.width || 0; height = videoStream.height || 0; videoCodec = videoStream.codec_name; }
      if (audioStream) { audioCodec = audioStream.codec_name; }
    } catch (parseError) {
      console.error("[VideoUtils] FFprobe: Failed to parse JSON output.", "Returning original/copied URI.");
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }

    if ((!width || !height) && audioCodec && !videoCodec) {
      console.log(`[VideoUtils] Audio-only file detected. Skipping optimization.`);
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }
    
    if (!width || !height) {
      console.warn(`[VideoUtils] FFprobe: Could not parse resolution. Skipping optimization.`);
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }
    
    console.log(`[VideoUtils] Detected: ${width}x${height}, Video: ${videoCodec || 'N/A'}, Audio: ${audioCodec || 'N/A'}`);

    const needsDownscaling = width > 1080 || height > 1080;
    const needsAudioReencode = Platform.OS === 'ios' && audioCodec === 'pcm_s16le';
    const needsVideoCodecConversion = Platform.OS === 'ios' && (videoCodec === 'hevc' || videoCodec === 'hvc1');

    if (needsDownscaling || needsAudioReencode || needsVideoCodecConversion) {
        // ... (사용자 확인 Alert 로직은 이전과 동일)
        const userConfirmed = await new Promise<boolean>((resolve) => {
            Alert.alert("영상 최적화 필요", "영상 품질 및 호환성 최적화를 진행하시겠습니까?", [
                { text: "아니요", onPress: () => resolve(false), style: 'cancel' },
                { text: "네", onPress: () => resolve(true) }
            ]);
        });

        if (!userConfirmed) {
            if (wasFileCopied && tempFilePath) await RNFS.unlink(tempFilePath).catch(console.error);
            return null;
        }

        // [수정] 최종 반환 경로도 file:// 접두사를 붙여 일관성 유지
        const outputPath = `${RNFS.DocumentDirectoryPath}/optimized_video_${new Date().getTime()}.mp4`;
        const videoEncoder = Platform.OS === 'ios' ? 'h264_videotoolbox' : 'h264_mediacodec';
        const audioEncoder = 'aac';
        const videoFilters = `scale=-2:1080`;
        const preset = Platform.OS === 'ios' ? '' : '-preset fast';
        // [수정] 입력 경로(accessibleUri)가 이미 정제되었으므로 그대로 사용
        const command = `-i "${accessibleUri}" -vf "${videoFilters}" -c:v ${videoEncoder} -c:a ${audioEncoder} -b:a 192k ${preset} -movflags +faststart "${outputPath}"`;
      
        console.log(`[VideoUtils] FFmpeg encoding started with command: ${command}`);
        const encodeSession = await FFmpegKit.execute(command);
        const encodeReturnCode = await encodeSession.getReturnCode();

        if (ReturnCode.isSuccess(encodeReturnCode)) {
            Alert.alert("최적화 완료", "영상이 성공적으로 최적화되었습니다.");
            if (wasFileCopied && tempFilePath) await RNFS.unlink(tempFilePath).catch(console.error);
            return `file://${outputPath}`; // 최종 경로 반환
        } else {
            const errorLogs = await encodeSession.getLogsAsString();
            Alert.alert('오류', '영상 최적화 중 오류가 발생했습니다.');
            console.error('[VideoUtils] FFmpeg encoding failed. Logs:', errorLogs);
            if (wasFileCopied && tempFilePath) await RNFS.unlink(tempFilePath).catch(console.error);
            return null;
        }
    } else {
        console.log('[VideoUtils] No optimization required.');
        // [수정] 최적화가 필요 없더라도 일관된 형식으로 반환
        return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }
  } catch (error) {
    console.error('[VideoUtils] An exception occurred during video processing:', error);
    Alert.alert('오류', '영상 처리 중 문제가 발생했습니다.');
    if (wasFileCopied && tempFilePath) await RNFS.unlink(tempFilePath).catch(console.error);
    return null;
  }
};