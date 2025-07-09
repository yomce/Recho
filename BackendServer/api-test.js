require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'; // 백엔드 서버 주소

const testClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5초 타임아웃
});

async function testUploadUrls() {
  console.log('[API_TEST] 3개 파일에 대한 Presigned URL 요청을 보냅니다...');

  try {
    const response = await testClient.post('/video-insert/upload-urls', {
      purposes: [
        { purpose: 'RESULT_VIDEO', fileType: 'video/mp4' },
        { purpose: 'THUMBNAIL', fileType: 'image/jpeg' },
        { purpose: 'SOURCE_VIDEO', fileType: 'video/mp4' },
      ],
    });

    console.log('[API_TEST] 요청 성공!');
    console.log('[API_TEST] 응답 데이터:');
    console.log(JSON.stringify(response.data, null, 2));

    // 3개 파일 모두 받았는지 확인
    if (
      response.data &&
      response.data.RESULT_VIDEO &&
      response.data.THUMBNAIL &&
      response.data.SOURCE_VIDEO &&
      response.data.RESULT_VIDEO.url &&
      response.data.THUMBNAIL.url &&
      response.data.SOURCE_VIDEO.url
    ) {
      console.log(
        '\n[API_TEST] 테스트 성공: 3개 파일에 대한 Presigned URL을 모두 받아왔습니다.',
      );
    } else {
      console.error(
        '\n[API_TEST] 테스트 실패: 3개 파일에 대한 URL을 모두 받지 못했습니다.',
      );
      console.error('받은 키들:', Object.keys(response.data));
    }
  } catch (error) {
    console.error('[API_TEST] 요청 실패!');
    if (error.code === 'ECONNABORTED') {
      console.error(
        '[API_TEST] 에러 원인: 타임아웃 (서버가 5초 내에 응답하지 않았습니다.)',
      );
    } else if (error.response) {
      console.error(`[API_TEST] HTTP 상태 코드: ${error.response.status}`);
      console.error('[API_TEST] 에러 응답:', error.response.data);
    } else {
      console.error('[API_TEST] 기타 에러:', error.message);
    }
  }
}

// 테스트 실행
testUploadUrls();
