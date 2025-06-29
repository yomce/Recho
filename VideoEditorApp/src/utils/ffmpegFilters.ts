import { Platform, Alert } from 'react-native';
import { FFmpegKit, FFprobeKit, ReturnCode } from 'ffmpeg-kit-react-native';
import RNFS from 'react-native-fs';
import { EditData } from '../types';

export const generateCollageFilterComplex = (editData: EditData): string[] => {
  const { trimmers } = editData;
  const filterComplex: string[] = [];
  const videoCount = trimmers.length;

  if (videoCount === 0) {
    return [];
  }

  // --- 오디오 필터 체인 ---
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

  // --- 비디오 필터 체인 ---
  const shortestDuration = Math.min(...trimmers.map(t => t.endTime - t.startTime));
  console.log(`[FilterGen-Fix] 계산된 가장 짧은 길이: ${shortestDuration}초`);

  const ensureEven = (num: number) => 2 * Math.round(num / 2);
  const NUM_COLS = 2;
  const COLLAGE_WIDTH = 540;
  const PADDING = 20;
  const cornerRadius = 15;
  const FRAME_WIDTH = ensureEven((COLLAGE_WIDTH - (NUM_COLS + 1) * PADDING) / NUM_COLS);

  const frameHeights = trimmers.map(trimmer => {
    const ar_val = parseFloat(trimmer.aspectRatio) || 16 / 9;
    return ensureEven(FRAME_WIDTH / ar_val);
  });

  const numRows = Math.ceil(trimmers.length / NUM_COLS);
  const rowHeights: number[] = [];
  for (let i = 0; i < numRows; i++) {
    const start = i * NUM_COLS;
    const end = start + NUM_COLS;
    const heightsInRow = frameHeights.slice(start, end);
    rowHeights.push(heightsInRow.length > 0 ? Math.max(...heightsInRow) : 0);
  }

  const totalRowHeights = rowHeights.reduce((sum, height) => sum + height, 0);
  const bg_height = ensureEven((numRows + 1) * PADDING + totalRowHeights);
  const bg_width = ensureEven(COLLAGE_WIDTH);

  filterComplex.push(`color=c=black:s=${bg_width}x${bg_height}:d=${shortestDuration}[bg]`);

  let lastOverlayNode = '[bg]';
  let currentOverlayOutput = '[tmp0]';

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
 * 영상의 해상도를 확인하여 1080p를 초과하는 경우 다운스케일링합니다.
 * 안드로이드의 content:// URI를 처리하기 위해 파일을 내부 캐시로 복사하는 로직을 포함합니다.
 * @param originalUri 원본 영상의 URI (content:// 또는 file://)
 * @returns 다음 화면에서 사용할 수 있는 실제 파일 경로 URI
 */
export const downscaleVideoIfRequired = async (originalUri: string): Promise<string | null> => {
  let accessibleUri = originalUri;
  let tempFilePath: string | null = null;
  let wasFileCopied = false;

  try {
    // 1. 안드로이드 content:// URI 처리
    if (Platform.OS === 'android' && originalUri.startsWith('content://')) {
      tempFilePath = `${RNFS.CachesDirectoryPath}/${new Date().getTime()}_temp_video.mp4`;
      await RNFS.copyFile(originalUri, tempFilePath);
      accessibleUri = tempFilePath;
      wasFileCopied = true;
      console.log(`[VideoUtils] Content URI를 로컬 파일로 복사 완료: ${accessibleUri}`);
    }

    // 2. FFprobe로 해상도 확인
    const session = await FFprobeKit.execute(`-v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${accessibleUri}"`);
    const output = await session.getOutput();

    if (!output) {
      console.error("[VideoUtils] FFprobe: 영상 정보를 가져오지 못했습니다.");
      return null;
    }
    
    const [width, height] = output.trim().split('x').map(Number);
    if (isNaN(width) || isNaN(height)) {
        console.error(`[VideoUtils] FFprobe: 해상도 파싱 실패.`);
        return null;
    }
    console.log(`[VideoUtils] 인식된 영상 해상도: ${width}x${height}`);

    const needsDownscaling = width > 1080 || height > 1080;

    if (needsDownscaling) {
      // 3. ✨ 사용자에게 다운스케일링 여부 확인
      const userConfirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "고해상도 영상 최적화",
          "선택한 영상의 해상도가 높습니다. 원활한 편집을 위해 1080p로 최적화하는 것을 권장합니다.\n\n진행하시겠습니까?",
          [
            { text: "아니요 (취소)", onPress: () => resolve(false), style: 'cancel' },
            { text: "네, 진행합니다", onPress: () => resolve(true) }
          ],
          { cancelable: false }
        );
      });

      // 사용자가 '아니요'를 선택하면 null을 반환하여 과정 중단
      if (!userConfirmed) {
        console.log('[VideoUtils] 사용자가 최적화를 취소했습니다.');
        return null;
      }

      // 4. ✨ 사용자가 동의했으므로 인코딩 진행
      const outputPath = `${RNFS.DocumentDirectoryPath}/optimized_${Date.now()}.mp4`;
      const encoder = Platform.OS === 'ios' ? 'h264_videotoolbox' : 'h264_mediacodec';
      const command = `-i "${accessibleUri}" -vf "scale=-2:1080" -c:v ${encoder} -c:a copy -preset fast "${outputPath}"`;
      
      console.log('[VideoUtils] FFmpeg 인코딩 시작.');
      const encodeSession = await FFmpegKit.execute(command);
      const returnCode = await encodeSession.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        // 5. ✨ 성공 알림 후 경로 반환
        Alert.alert("최적화 완료", "영상이 성공적으로 최적화되었습니다.");
        console.log('[VideoUtils] FFmpeg: 인코딩 성공! 경로:', outputPath);
        return outputPath;
      } else {
        Alert.alert('오류', '영상 최적화 중 오류가 발생했습니다.');
        console.error('[VideoUtils] FFmpeg: 인코딩 실패.');
        return null;
      }
    } else {
      console.log('[VideoUtils] 영상이 1080p 이하이므로 최적화가 필요 없습니다.');
      return wasFileCopied ? accessibleUri : originalUri;
    }
  } catch (error) {
    console.error('[VideoUtils] 영상 처리 중 예외 발생:', error);
    Alert.alert('오류', '영상 처리 중 문제가 발생했습니다.');
    return null;
  }
};