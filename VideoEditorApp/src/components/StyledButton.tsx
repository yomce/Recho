import React from 'react';
import styled from 'styled-components/native';
import { TouchableOpacityProps } from 'react-native';

interface MyButtonProps extends TouchableOpacityProps {
  contents: string;
}

const ButtonContainer = styled.TouchableOpacity`
  background-color: #4a90e2;
  padding: 12px 20px;
  border-radius: 8px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const StyledButton: React.FC<MyButtonProps> = ({ contents, ...props }) => {
  return (
    <ButtonContainer activeOpacity={0.8} {...props}>
      <ButtonText>{contents}</ButtonText>
    </ButtonContainer>
  );
};

export default StyledButton;