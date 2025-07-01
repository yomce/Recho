import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle, TextStyle } from 'react-native';

interface Props {
  title: string; // 섹션의 제목 텍스트
  containerStyle?: ViewStyle; // 전체 컨테이너에 적용될 추가 스타일
  titleStyle?: TextStyle; // 제목 텍스트에 적용될 추가 스타일
}

// Styled component for the container View of the section header.
// It takes `containerStyle` as a prop for merging.
const HeaderContainer = styled.View<Pick<Props, 'containerStyle'>>`
  padding-vertical: 10px; /* Vertical padding around the title */
`;

// Styled component for the title Text.
// It takes `titleStyle` as a prop for merging.
const TitleText = styled.Text<Pick<Props, 'titleStyle'>>`
  font-size: 20px;
  font-weight: bold;
  color: #3498db; /* Default color for section titles */
  text-align: center; /* Center align the title text */
`;

/**
 * SectionHeader component provides a consistent styling for section titles across the app.
 * It uses styled-components for its styling and allows for additional customization
 * via `containerStyle` and `titleStyle` props.
 */
const SectionHeader: React.FC<Props> = ({ title, containerStyle, titleStyle }) => {
  return (
    <HeaderContainer style={containerStyle}>
      <TitleText style={titleStyle}>{title}</TitleText>
    </HeaderContainer>
  );
};

export default SectionHeader;
