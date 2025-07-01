// date-fns 라이브러리에서 필요한 함수들을 가져옵니다.
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';


/**
 * UTC 시간 문자열을 한국 시간(KST) 'yyyy-MM-dd HH:mm:ss' 형식으로 변환합니다.
 * @param date - 서버로부터 받은 UTC 시간 문자열 또는 Date 객체
 * @param formatStr - (선택사항) 변환하고 싶은 날짜 형식 문자열
 * @returns KST로 변환된 날짜 문자열
 */
export const formatToKST = (
  date: string | Date, 
  formatStr = 'yyyy-MM-dd HH:mm:ss' // 기본 형식을 지정합니다.
): string => {
  try {
    // new Date()는 ISO 8601 형식 문자열(예: "2025-07-02T10:00:00.000Z")을 UTC로 올바르게 인식합니다.
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // 서버에서 받은 UTC 시간을 한국 시간대(Asia/Seoul)로 변환합니다.
    const kstDate = toZonedTime(dateObj, 'Asia/Seoul');
    
    // 지정된 형식(formatStr)으로 날짜를 문자열로 만듭니다.
    return format(kstDate, formatStr);
  } catch (error) {
    console.error("날짜 변환 중 오류가 발생했습니다.", error);
    return "유효하지 않은 날짜"; // 오류 발생 시 대체 텍스트
  }
};