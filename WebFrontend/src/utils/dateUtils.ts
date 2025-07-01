import { format, toZonedTime } from 'date-fns-tz';

export const formatToKST = (
  date: string | Date, 
  formatStr = 'yyyy-MM-dd HH:mm:ss'
): string => {
  // [추가] 함수에 전달된 원본 값을 그대로 출력해봅니다.
  console.log('formatToKST에 전달된 원본 날짜:', date); 

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const kstDate = toZonedTime(dateObj, 'Asia/Seoul');
    return format(kstDate, formatStr, { timeZone: 'Asia/Seoul' });
  } catch (error) {
    console.error("날짜 변환 중 오류가 발생했습니다.", error);
    return "유효하지 않은 날짜";
  }
};