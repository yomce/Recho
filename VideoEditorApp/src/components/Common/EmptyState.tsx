import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle, TextStyle } from 'react-native';

interface Props {
  icon?: string; // Icon string to display (e.g., '📭')
  message: string; // Main message text
  subMessages?: string[]; // Array of sub-message texts (optional)
  containerStyle?: ViewStyle; // Additional styles for the overall container
  messageStyle?: TextStyle; // Additional styles for the main message text
  subMessageStyle?: TextStyle; // Additional styles for the sub-message text
}

// Styled component for the main container View.
// It directly accepts `containerStyle` as a prop for merging.
const EmptyStateContainer = styled.View<Pick<Props, 'containerStyle'>>`
  flex: 1;
  justify-content: center;
  align-items: center;
  padding-vertical: 50px;
  padding-horizontal: 20px;
`;

// Styled component for the icon Text.
const IconText = styled.Text`
  font-size: 40px;
  margin-bottom: 15px;
`;

// Styled component for the main message Text.
// It directly accepts `messageStyle` as a prop for merging.
const MessageText = styled.Text<Pick<Props, 'messageStyle'>>`
  font-size: 18px;
  color: #ecf0f1; /* Default text color */
  margin-bottom: 10px;
  text-align: center;
`;

// Styled component for the sub-message Text.
// It directly accepts `subMessageStyle` as a prop for merging.
const SubMessageText = styled.Text<Pick<Props, 'subMessageStyle'>>`
  font-size: 14px;
  color: #bdc3c7; /* Default sub-message text color */
  text-align: center;
  margin-bottom: 5px;
`;

/**
 * EmptyState component is used to display a message to the user when a list or data is empty.
 * It can flexibly show an icon, a main message, and multiple sub-messages.
 * All styles are defined using styled-components.
 */
const EmptyState: React.FC<Props> = ({
  icon,
  message,
  subMessages,
  containerStyle,
  messageStyle,
  subMessageStyle,
}) => {
  return (
    <EmptyStateContainer style={containerStyle}>
      {icon && <IconText>{icon}</IconText>} {/* Display icon if provided */}
      <MessageText style={messageStyle}>{message}</MessageText> {/* Main message */}
      {/* Iterate and display sub-messages if provided */}
      {subMessages && subMessages.map((sub, index) => (
        <SubMessageText key={index} style={subMessageStyle}>{sub}</SubMessageText>
      ))}
    </EmptyStateContainer>
  );
};

export default EmptyState;
