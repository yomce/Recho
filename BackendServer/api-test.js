require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api'; // 백엔드 서버 주소

const testClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5초 타임아웃
});

async function testUploadUrls() {
  console.log('[API_TEST] 요청을 보냅니다...');

  try {
    const response = await testClient.post('/video-insert/upload-urls', {
      files: [{ fileType: 'video/mp4' }, { fileType: 'image/jpeg' }],
    });

    console.log('[API_TEST] 요청 성공!');
    console.log('[API_TEST] 응답 데이터:');
    console.log(JSON.stringify(response.data, null, 2));

    if (
      Array.isArray(response.data) &&
      response.data.length === 2 &&
      response.data[0].key &&
      response.data[0].url
    ) {
      console.log(
        '\n[API_TEST] 테스트 성공: Presigned URL을 성공적으로 받아왔습니다.',
      );
    } else {
      console.error(
        '\n[API_TEST] 테스트 실패: 응답 데이터 형식이 올바르지 않습니다.',
      );
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

testUploadUrls();
