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
 * 주어진 편집 데이터(비디오 트리밍, 타임라인, 볼륨, 화면 비율 등)를 기반으로
 * FFmpeg filter_complex 문자열 배열을 생성합니다.
 * 이 함수는 안정적인 그리드 레이아웃과 정교한 타임라인 제어를 결합합니다.
 */
export const generateCollageFilterComplex = (editData: EditData): string[] => {
  const { trimmers, globalStartTime, globalEndTime, hasAudio } = editData;
  const filterComplex: string[] = [];
  const videoCount = trimmers.length;

  if (videoCount === 0) {
    return [];
  }

  const resultDuration = globalEndTime - globalStartTime;
  if (resultDuration <= 0) {
    console.error(
      'Invalid global time range. End time must be after start time.',
    );
    return [];
  }

  // --- 1. 기본 캔버스 및 레이아웃 계산 ---
  const ensureEven = (num: number) => 2 * Math.round(num / 2);
  const OUTPUT_WIDTH = 540;
  const OUTPUT_HEIGHT = 960;
  const PADDING = 20;
  const cornerRadius = 15;
  const NUM_COLS = 2;
  const FIXED_ASPECT_RATIO = 4 / 3;

  // [수정] 중앙 정렬을 위한 그리드 크기 및 오프셋 계산 로직 (루프 밖으로 이동 및 복원)
  const isOddCount = videoCount % 2 !== 0;
  const numRows = Math.ceil(videoCount / NUM_COLS);
  const FRAME_WIDTH = ensureEven(
    (OUTPUT_WIDTH - PADDING * (NUM_COLS + 1)) / NUM_COLS,
  );
  const FRAME_HEIGHT = ensureEven(FRAME_WIDTH / FIXED_ASPECT_RATIO);

  let totalGridHeight: number;
  if (isOddCount) {
    const lastRowFrameWidth = ensureEven(FRAME_WIDTH * 2 + PADDING);
    const lastRowFrameHeight = ensureEven(
      lastRowFrameWidth / FIXED_ASPECT_RATIO,
    );
    totalGridHeight = ensureEven(
      (numRows - 1) * FRAME_HEIGHT +
        lastRowFrameHeight +
        (numRows + 1) * PADDING,
    );
  } else {
    totalGridHeight = ensureEven(
      numRows * FRAME_HEIGHT + (numRows + 1) * PADDING,
    );
  }
  const totalGridWidth = ensureEven(
    NUM_COLS * FRAME_WIDTH + (NUM_COLS + 1) * PADDING,
  );

  const gridOffsetX = ensureEven((OUTPUT_WIDTH - totalGridWidth) / 2);
  const gridOffsetY = ensureEven((OUTPUT_HEIGHT - totalGridHeight) / 2);

  // 타임라인의 전체 길이를 계산하여 기본 캔버스 생성
  const totalDuration = Math.max(
    globalEndTime,
    ...trimmers.map(t => t.timelinePosition + (t.endTime - t.startTime)),
  );

  filterComplex.push(
    `color=c=black:s=${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}:d=${totalDuration}[base_v]`,
  );
  if (hasAudio) {
    filterComplex.push(`aevalsrc=0:d=${totalDuration}[base_a]`);
  }

  let lastOverlayNode = '[base_v]';
  const audioToMix = hasAudio ? ['[base_a]'] : [];

  // --- 2. 개별 비디오 및 오디오 필터 체인 생성 ---
  trimmers.forEach((trimmer, i) => {
    const clipDuration = trimmer.endTime - trimmer.startTime;
    if (clipDuration <= 0) return;

    // --- 2.1. 소스 스트림 처리 (음수 시간 고려) ---
    let videoInputStream = `[${i}:v]`;
    // [수정] audioInputStream은 단순히 초기화만 하고, 자르는 로직은 2.5절로 완전히 위임
    let audioInputStream = hasAudio ? `[${i}:a]` : '';
    let placementTime = trimmer.timelinePosition;
    let effectiveClipDuration = clipDuration;

    // timelinePosition이 음수이면, 소스의 시작 부분을 잘라내고 배치 시간을 0으로 조정
    if (placementTime < 0) {
      const trimStart = -placementTime;
      if (trimStart >= clipDuration) return; // 잘라낼 부분이 클립 전체보다 길면 스킵

      effectiveClipDuration -= trimStart;

      videoInputStream = `[v_pre_trimmed_${i}]`;
      filterComplex.push(
        `[${i}:v]trim=start=${trimmer.startTime + trimStart}:end=${
          trimmer.endTime
        },setpts=PTS-STARTPTS${videoInputStream}`,
      );

      // [삭제] 여기서 오디오를 자르는 중복 로직 제거
      // if (hasAudio) { ... }

      placementTime = 0; // 타임라인의 0초에 배치
    } else {
      // 양수일 경우 원래 로직대로 trim
      videoInputStream = `[v_pre_trimmed_${i}]`;
      filterComplex.push(
        `[${i}:v]trim=start=${trimmer.startTime}:end=${trimmer.endTime},setpts=PTS-STARTPTS${videoInputStream}`,
      );

      // [삭제] 여기서 오디오를 자르는 중복 로직 제거
      // if (hasAudio) { ... }
    }

    // --- 2.2. 레이아웃 계산 (사용자 기존 로직 유지) ---
    const isLastVideo = i === videoCount - 1;
    // const isOddCount = videoCount % 2 !== 0; // 이미 밖에서 계산됨
    let frameW = FRAME_WIDTH; // 루프 밖에서 계산된 FRAME_WIDTH 사용
    let frameH = FRAME_HEIGHT; // 루프 밖에서 계산된 FRAME_HEIGHT 사용
    if (isOddCount && isLastVideo) {
      frameW = ensureEven(frameW * 2 + PADDING);
      frameH = ensureEven(frameW / FIXED_ASPECT_RATIO);
    }

    // --- 2.3. 비디오 필터 적용 (스케일, 크롭, 둥근 모서리) ---
    const processedVid = `[v_processed_${i}]`;
    filterComplex.push(
      `${videoInputStream}scale='if(gte(a,${FIXED_ASPECT_RATIO}),-2,${frameW})':'if(gte(a,${FIXED_ASPECT_RATIO}),${frameH},-2)',crop=${frameW}:${frameH}${processedVid}`,
    );
    let finalVideoStream = processedVid;
    if (cornerRadius > 0) {
      const roundedVid = `[v_rounded_${i}]`;
      filterComplex.push(`color=c=black:s=${frameW}x${frameH}[mask${i}_base]`);
      filterComplex.push(
        `[mask${i}_base]geq=lum='if(gt(hypot(X-max(${cornerRadius},min(W-${cornerRadius},X)),Y-max(${cornerRadius},min(H-${cornerRadius},Y))),${cornerRadius}),0,255)':a=255[mask${i}]`,
      );
      filterComplex.push(
        `[${processedVid.slice(1, -1)}][mask${i}]alphamerge${roundedVid}`,
      );
      finalVideoStream = roundedVid;
    }

    // --- 2.4. 타임라인에 비디오 오버레이 ---
    // [수정] 미리 계산된 오프셋을 사용하여 x,y 좌표 계산
    const row = Math.floor(i / NUM_COLS);
    const col = i % NUM_COLS;
    let x: number, y: number;

    if (isOddCount && isLastVideo) {
      // 마지막 넓은 프레임은 첫 번째 열 위치에 고정
      x = gridOffsetX + PADDING;
      y = gridOffsetY + PADDING + row * (FRAME_HEIGHT + PADDING);
    } else {
      x = gridOffsetX + PADDING + col * (FRAME_WIDTH + PADDING);
      y = gridOffsetY + PADDING + row * (FRAME_HEIGHT + PADDING);
    }

    const nextOverlayNode = `[v_overlay_${i}]`;
    filterComplex.push(
      `${lastOverlayNode}${finalVideoStream}overlay=x=${x}:y=${y}:enable='between(t,${placementTime},${
        placementTime + effectiveClipDuration
      })'${nextOverlayNode}`,
    );
    lastOverlayNode = nextOverlayNode;

    // --- 2.5. 오디오 처리 (딜레이, 볼륨, EQ) 및 믹싱 목록에 추가 ---
    if (hasAudio) {
      // [수정] 모든 오디오 처리를 여기서 통합하여 실행
      const audioTrimStartTime =
        trimmer.startTime +
        (trimmer.timelinePosition < 0 ? -trimmer.timelinePosition : 0);
      const audioClipDuration = trimmer.endTime - audioTrimStartTime;

      // 잘라낼 오디오가 없는 경우는 스킵
      if (audioClipDuration <= 0) return;

      const trimmedAud = `[a_trimmed_${i}]`;
      filterComplex.push(
        `${audioInputStream}atrim=start=${audioTrimStartTime}:end=${trimmer.endTime},asetpts=PTS-STARTPTS${trimmedAud}`,
      );

      const volAud = `[a_vol_${i}]`;
      filterComplex.push(`${trimmedAud}volume=${trimmer.volume}${volAud}`);

      let lastAudioNode = volAud;
      trimmer.equalizer.forEach((band, bandIndex) => {
        if (band.gain !== 0) {
          const eqNode = `[a_eq_${i}_${bandIndex}]`;
          filterComplex.push(
            `${lastAudioNode}equalizer=f=${band.frequency}:t=h:width_type=q:w=1.41:g=${band.gain}${eqNode}`,
          );
          lastAudioNode = eqNode;
        }
      });

      const delayedAud = `[a_delayed_${i}]`;
      const delayInMillis = Math.round(placementTime * 1000);
      filterComplex.push(
        `${lastAudioNode}adelay=${delayInMillis}|${delayInMillis}${delayedAud}`,
      );

      audioToMix.push(delayedAud);
    }
  });

  // --- 3. 최종 믹싱 및 자르기 ---
  let finalAudioSource = '[base_a]'; // 오디오가 없을 경우 기본 무음 오디오
  if (hasAudio && audioToMix.length > 1) {
    // base_a와 하나 이상의 클립 오디오가 있으면 amix로 믹싱
    const mixedAud = '[a_mixed]';
    filterComplex.push(
      `${audioToMix.join('')}amix=inputs=${
        audioToMix.length
      }:duration=longest${mixedAud}`,
    );
    finalAudioSource = mixedAud;
  } else if (hasAudio && audioToMix.length === 1) {
    // 클립 오디오가 하나만 있는 경우 (audioToMix는 base_a와 클립오디오 2개)
    // 이 케이스는 위의 if문에 포함되므로 사실상 여기는 base_a만 있을 때 해당.
    finalAudioSource = audioToMix[0];
  }

  // 최종 비디오 스트림을 전역 시간에 맞춰 자르기
  const finalVid = '[v_final_trim]';
  filterComplex.push(
    `${lastOverlayNode}trim=start=${globalStartTime}:duration=${resultDuration},setpts=PTS-STARTPTS${finalVid}`,
  );
  filterComplex.push(`${finalVid}null[v]`); // 비디오 스트림을 '[v]'로 최종 매핑

  if (hasAudio) {
    const finalAud = '[a_final_trim]';
    filterComplex.push(
      `${finalAudioSource}atrim=start=${globalStartTime}:duration=${resultDuration},asetpts=PTS-STARTPTS${finalAud}`,
    );
    // [수정] 오디오 스트림은 'anull' 필터를 사용하여 '[a]'로 최종 매핑
    filterComplex.push(`${finalAud}anull[a]`);
  }

  return filterComplex;
};

/**
 * 영상의 해상도를 확인하여 1080p를 초과하는 경우 사용자에게 확인 후 다운스케일링합니다.
 * (이 함수 내부 로직도 안정성을 위해 일부 수정되었습니다.)
 */
export const downscaleVideoIfRequired = async (
  originalUri: string,
): Promise<string | null> => {
  let accessibleUri = originalUri;
  let tempFilePath: string | null = null;
  let wasFileCopied = false;

  try {
    if (Platform.OS === 'android' && originalUri.startsWith('content://')) {
      tempFilePath = `${
        RNFS.CachesDirectoryPath
      }/temp_video_${new Date().getTime()}.mp4`;
      console.log(
        `[VideoUtils] Copying content URI to local cache: ${tempFilePath}`,
      );
      await RNFS.copyFile(originalUri, tempFilePath);
      accessibleUri = tempFilePath; // 이제 accessibleUri는 순수 파일 경로
      wasFileCopied = true;
      console.log(
        `[VideoUtils] Content URI successfully copied to: ${accessibleUri}`,
      );
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

    let width: number = 0,
      height: number = 0;
    let videoCodec: string | undefined, audioCodec: string | undefined;

    if (!ReturnCode.isSuccess(returnCode) || !output) {
      console.error(
        '[VideoUtils] FFprobe: Failed to execute or no output.',
        'Returning original/copied URI.',
      );
      // [수정] 실패 시에도 file:// 접두사를 붙여서 반환해야 할 수 있음 (호출하는 곳에 따라 다름)
      // 여기서는 원본 URI를 반환하여 호출 측에서 처리하도록 함.
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }

    // ... (JSON 파싱 및 해상도/코덱 확인 로직은 이전과 동일)
    try {
      const ffprobeData = JSON.parse(output);
      const videoStream = ffprobeData.streams?.find(
        (s: any) => s.codec_type === 'video',
      );
      const audioStream = ffprobeData.streams?.find(
        (s: any) => s.codec_type === 'audio',
      );
      if (videoStream) {
        width = videoStream.width || 0;
        height = videoStream.height || 0;
        videoCodec = videoStream.codec_name;
      }
      if (audioStream) {
        audioCodec = audioStream.codec_name;
      }
    } catch (parseError) {
      console.error(
        '[VideoUtils] FFprobe: Failed to parse JSON output.',
        'Returning original/copied URI.',
      );
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }

    if ((!width || !height) && audioCodec && !videoCodec) {
      console.log(
        `[VideoUtils] Audio-only file detected. Skipping optimization.`,
      );
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }
    
    if (!width || !height) {
      console.warn(
        `[VideoUtils] FFprobe: Could not parse resolution. Skipping optimization.`,
      );
      return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }
    
    console.log(
      `[VideoUtils] Detected: ${width}x${height}, Video: ${
        videoCodec || 'N/A'
      }, Audio: ${audioCodec || 'N/A'}`,
    );

    const needsDownscaling = width > 1080 || height > 1080;
    const needsAudioReencode =
      Platform.OS === 'ios' && audioCodec === 'pcm_s16le';
    const needsVideoCodecConversion =
      Platform.OS === 'ios' && (videoCodec === 'hevc' || videoCodec === 'hvc1');

    if (needsDownscaling || needsAudioReencode || needsVideoCodecConversion) {
        // ... (사용자 확인 Alert 로직은 이전과 동일)
      const userConfirmed = await new Promise<boolean>(resolve => {
        Alert.alert(
          '영상 최적화 필요',
          '영상 품질 및 호환성 최적화를 진행하시겠습니까?',
          [
            { text: '아니요', onPress: () => resolve(false), style: 'cancel' },
            { text: '네', onPress: () => resolve(true) },
          ],
        );
        });

        if (!userConfirmed) {
        if (wasFileCopied && tempFilePath)
          await RNFS.unlink(tempFilePath).catch(console.error);
            return null;
        }

        // [수정] 최종 반환 경로도 file:// 접두사를 붙여 일관성 유지
      const outputPath = `${
        RNFS.DocumentDirectoryPath
      }/optimized_video_${new Date().getTime()}.mp4`;
      const videoEncoder =
        Platform.OS === 'ios' ? 'h264_videotoolbox' : 'h264_mediacodec';
        const audioEncoder = 'aac';
        const videoFilters = `scale=-2:1080`;
        const preset = Platform.OS === 'ios' ? '' : '-preset fast';
        // [수정] 입력 경로(accessibleUri)가 이미 정제되었으므로 그대로 사용
        const command = `-i "${accessibleUri}" -vf "${videoFilters}" -c:v ${videoEncoder} -c:a ${audioEncoder} -b:a 192k ${preset} -movflags +faststart "${outputPath}"`;
      
      console.log(
        `[VideoUtils] FFmpeg encoding started with command: ${command}`,
      );
        const encodeSession = await FFmpegKit.execute(command);
        const encodeReturnCode = await encodeSession.getReturnCode();

        if (ReturnCode.isSuccess(encodeReturnCode)) {
        Alert.alert('최적화 완료', '영상이 성공적으로 최적화되었습니다.');
        if (wasFileCopied && tempFilePath)
          await RNFS.unlink(tempFilePath).catch(console.error);
            return `file://${outputPath}`; // 최종 경로 반환
        } else {
            const errorLogs = await encodeSession.getLogsAsString();
            Alert.alert('오류', '영상 최적화 중 오류가 발생했습니다.');
            console.error('[VideoUtils] FFmpeg encoding failed. Logs:', errorLogs);
        if (wasFileCopied && tempFilePath)
          await RNFS.unlink(tempFilePath).catch(console.error);
            return null;
        }
    } else {
        console.log('[VideoUtils] No optimization required.');
        // [수정] 최적화가 필요 없더라도 일관된 형식으로 반환
        return wasFileCopied ? `file://${accessibleUri}` : originalUri;
    }
  } catch (error) {
    console.error(
      '[VideoUtils] An exception occurred during video processing:',
      error,
    );
    Alert.alert('오류', '영상 처리 중 문제가 발생했습니다.');
    if (wasFileCopied && tempFilePath)
      await RNFS.unlink(tempFilePath).catch(console.error);
    return null;
  }
};
