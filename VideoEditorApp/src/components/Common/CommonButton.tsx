import React from 'react';
import styled from 'styled-components/native';
import { ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

// 텍스트 색상을 상수로 정의합니다.
const BUTTON_TEXT_COLOR = '#ffffff'; // <-- 이 상수를 추가하세요.

const ButtonContainer = styled.TouchableOpacity<Pick<Props, 'buttonStyle' | 'disabled' | 'isLoading'>>`
  background-color: #4a90e2; /* 기본 배경 색상 */
  padding-vertical: 15px;
  padding-horizontal: 20px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;

  /* 비활성화 또는 로딩 시 투명도 적용 */
  opacity: ${props => (props.disabled || props.isLoading ? 0.6 : 1)};
`;

const ButtonText = styled.Text`
  color: ${BUTTON_TEXT_COLOR}; /* 상수를 여기에 사용합니다. */
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

const CommonButton: React.FC<Props> = ({
  onPress,
  disabled = false,
  isLoading = false,
  buttonStyle,
  textStyle,
  children,
}) => {
  return (
    <ButtonContainer
      onPress={onPress}
      disabled={disabled || isLoading}
      isLoading={isLoading} // 조건부 스타일링을 위해 isLoading 프롭을 스타일드 컴포넌트에 전달
      buttonStyle={buttonStyle}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color={BUTTON_TEXT_COLOR} /> // <-- 이곳에도 상수를 사용합니다.
      ) : (
        <ButtonText style={textStyle}>{children}</ButtonText> // 'children'을 ButtonText 안에 렌더링
      )}
    </ButtonContainer>
  );
};

export default CommonButton;