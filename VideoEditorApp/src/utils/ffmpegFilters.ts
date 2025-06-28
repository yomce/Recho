// src/utils/ffmpegFilters.ts

import { EditData } from '../types';

export const generateCollageFilterComplex = (editData: EditData): string[] => {
  const { trimmers } = editData;
  const filterComplex: string[] = [];
  const videoCount = trimmers.length;

  if (videoCount === 0) {
    return [];
  }

  // --- 오디오 필터 체인 (이전과 동일) ---
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

  // ✨ 1. 최종 영상의 길이를 가장 짧은 클립 기준으로 미리 계산
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

  // ✨ 2. 배경(color) 필터에 'duration' 옵션을 추가하여 길이를 고정
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
    
    // ✨ 3. overlay 필터에 'shortest=1' 옵션을 추가하여 짧은 영상이 끝나면 같이 종료되도록 설정
    filterComplex.push(`${lastOverlayNode}${videoStream}overlay=x=${x}:y=${y}:shortest=1${currentOverlayOutput}`);
    
    lastOverlayNode = currentOverlayOutput;
  });

  return filterComplex;
};