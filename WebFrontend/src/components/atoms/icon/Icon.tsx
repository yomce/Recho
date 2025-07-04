// src/components/atoms/icon/Icon.tsx

import React from 'react';
import { 
  IoPaperPlaneOutline, 
  IoChevronBack, 
  IoExitOutline, 
  IoPersonAddOutline,
  IoHeartOutline,
  IoEllipsisHorizontalOutline,
  IoCloseOutline,
  IoCheckmarkOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoSearchOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoStarOutline,
  IoBookmarkOutline,
  IoShareOutline,
  IoHomeOutline,
  IoChatbubbleOutline,
  IoPersonOutline,
  IoSettingsOutline,
  IoMenuOutline,
  IoDiscOutline,
} from 'react-icons/io5';

// 아이콘 이름을 키로, 실제 컴포넌트를 값으로 매핑합니다.
const iconMap = {
  send: IoPaperPlaneOutline, // 전송
  back: IoChevronBack, // 뒤로가기  
  exit: IoExitOutline, // 나가기
  addUser: IoPersonAddOutline, // 초대
  like: IoHeartOutline, // 좋아요
  more: IoEllipsisHorizontalOutline, // 더보기
  close: IoCloseOutline, // 닫기
  check: IoCheckmarkOutline, // 체크
  delete: IoTrashOutline, // 삭제       
  edit: IoPencilOutline, // 수정    
  search: IoSearchOutline, // 검색
  plus: IoAddOutline, // 추가
  minus: IoRemoveOutline, // 제거
  arrowUp: IoArrowUpOutline, // 위로
  arrowDown: IoArrowDownOutline, // 아래로
  arrowLeft: IoArrowBackOutline, // 왼쪽으로
  arrowRight: IoArrowForwardOutline, // 오른쪽으로
  star: IoStarOutline, // 즐겨찾기
  bookmark: IoBookmarkOutline, // 북마크, 저장
  share: IoShareOutline, // 공유
  home: IoHomeOutline, // 홈
  chat: IoChatbubbleOutline, // 채팅
  user: IoPersonOutline, // 사용자
  settings: IoSettingsOutline, // 설정
  menu: IoMenuOutline, // 메뉴
  vinyl: IoDiscOutline, // 바이닐
};

// Icon 컴포넌트가 받을 props 타입을 정의합니다.
interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: keyof typeof iconMap; // 'send', 'back' 등 iconMap의 키만 허용
  size?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 24, className, ...props }) => {
  // name prop에 해당하는 아이콘 컴포넌트를 찾습니다.
  const IconComponent = iconMap[name];

  // 해당하는 아이콘이 없으면 아무것도 렌더링하지 않습니다.
  if (!IconComponent) {
    return null;
  }

  // 찾은 아이콘 컴포넌트를 props와 함께 렌더링합니다.
  return <IconComponent size={size} className={className} {...props} cursor="pointer" />;
};

export default Icon;
