import React from 'react';
import styled from 'styled-components/native';
import { ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
// CommonStyles는 더 이상 StyleSheet를 사용하지 않으므로 직접적인 의존성은 없지만,
// 다른 styled-component가 아닌 컴포넌트나 공통 값(예: 색상)을 위해 유지될 수 있습니다.
// 여기서는 styles.container 대신 styled-components를 사용하므로 StyleSheet.create는 제거됩니다.

interface Props {
  message: string; // The main message text to display.
  subMessage?: string; // Optional secondary message text.
  showIndicator?: boolean; // Controls the visibility of the ActivityIndicator. Defaults to false.
  containerStyle?: ViewStyle; // Additional styles for the main container.
  messageStyle?: TextStyle; // Additional styles for the main message text.
  subMessageStyle?: TextStyle; // Additional styles for the sub-message text.
}

// Styled component for the main container View.
// It takes `containerStyle` as a prop directly, which `styled-components` will merge.
const InfoDisplayContainer = styled.View<Pick<Props, 'containerStyle'>>`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-horizontal: 20px;
`;

// Styled component for the main message Text.
// It takes `messageStyle` as a prop directly.
const MessageText = styled.Text<Pick<Props, 'messageStyle'>>`
  color: white; /* Default color for the message. */
  font-size: 16px;
  text-align: center;
  margin-top: 20px; /* Spacing from the indicator or top. */
`;

// Styled component for the sub-message Text.
// It takes `subMessageStyle` as a prop directly.
const SubMessageText = styled.Text<Pick<Props, 'subMessageStyle'>>`
  color: #aaa; /* Slightly subdued color for sub-message. */
  font-size: 14px;
  text-align: center;
  margin-top: 10px; /* Spacing from the main message. */
`;

/**
 * InfoDisplay component is a versatile UI element used to show various messages
 * such as loading states, permission requests, or general information to the user.
 * It can optionally display an ActivityIndicator for loading feedback.
 * All styles are defined using styled-components for consistency and reusability.
 */
const InfoDisplay: React.FC<Props> = ({
  message,
  subMessage,
  showIndicator = false,
  containerStyle,
  messageStyle,
  subMessageStyle,
}) => {
  return (
    <InfoDisplayContainer style={containerStyle}>
      {/* Display ActivityIndicator if `showIndicator` is true. */}
      {showIndicator && <ActivityIndicator size="large" color="white" />}
      {/* Main message. */}
      <MessageText style={messageStyle}>{message}</MessageText>
      {/* Optional sub-message. */}
      {subMessage && <SubMessageText style={subMessageStyle}>{subMessage}</SubMessageText>}
    </InfoDisplayContainer>
  );
};

export default InfoDisplay;
