import React from 'react';
import styled from 'styled-components/native';
import { ViewStyle, TextStyle } from 'react-native'; // View, Text, TouchableOpacity for base types
import { MediaItem, formatFileSize } from '../../types'; // MediaItem 및 formatFileSize 임포트

interface Props {
  item: MediaItem; // The media item object to render.
  onPress: (item: MediaItem) => void; // Function to call when the item is pressed.
  onEditPress: (item: MediaItem) => void; // Function to call when the 'Edit' button is pressed.
  // Additional style props for external customization
  containerStyle?: ViewStyle;
  iconTextStyle?: TextStyle;
  filenameStyle?: TextStyle;
  detailsStyle?: TextStyle;
  editButtonStyle?: ViewStyle;
  editButtonTextStyle?: TextStyle;
}

// Styled component for the main TouchableOpacity container of the media item.
const MediaItemContainer = styled.TouchableOpacity<Pick<Props, 'containerStyle'>>`
  flex-direction: row; /* Horizontal layout */
  background-color: #2c3e50; /* Background color */
  margin-bottom: 10px; /* Bottom margin */
  padding: 15px; /* Internal padding */
  border-radius: 10px; /* Rounded corners */
  align-items: center; /* Vertically center align content */
`;

// Styled component for the media icon container.
const MediaIconWrapper = styled.View`
  width: 50px;
  height: 50px;
  border-radius: 25px; /* Circular icon */
  background-color: #e74c3c; /* Icon background color */
  justify-content: center;
  align-items: center;
  margin-right: 15px; /* Right margin */
`;

// Styled component for the media icon text.
const MediaIconText = styled.Text<Pick<Props, 'iconTextStyle'>>`
  font-size: 20px;
`;

// Styled component for the media information section.
const MediaInfoContainer = styled.View`
  flex: 1; /* Occupy remaining space */
`;

// Styled component for the media filename text.
const MediaFilenameText = styled.Text<Pick<Props, 'filenameStyle'>>`
  font-size: 16px;
  font-weight: bold;
  color: #ecf0f1; /* Text color */
  margin-bottom: 5px; /* Bottom margin */
`;

// Styled component for the media details text (type and size).
const MediaDetailsText = styled.Text<Pick<Props, 'detailsStyle'>>`
  font-size: 14px;
  color: #bdc3c7; /* Text color */
`;

// Styled component for the 'Edit' button.
const EditButtonContainer = styled.TouchableOpacity<Pick<Props, 'editButtonStyle'>>`
  background-color: #f39c12; /* Edit button background color */
  padding-horizontal: 15px; /* Horizontal padding */
  padding-vertical: 8px; /* Vertical padding */
  border-radius: 8px; /* Rounded corners */
`;

// Styled component for the 'Edit' button text.
const EditButtonText = styled.Text<Pick<Props, 'editButtonTextStyle'>>`
  color: #ffffff; /* Text color */
  font-size: 14px;
  font-weight: bold;
`;

/**
 * MediaListItem component is used to display individual media files in a list.
 * It shows the filename, size, and provides an 'Edit' button.
 * It uses styled-components for all its styling.
 */
const MediaListItem: React.FC<Props> = ({
  item,
  onPress,
  onEditPress,
  containerStyle,
  iconTextStyle,
  filenameStyle,
  detailsStyle,
  editButtonStyle,
  editButtonTextStyle,
}) => {
  return (
    <MediaItemContainer style={containerStyle} onPress={() => onPress(item)}>
      <MediaIconWrapper>
        <MediaIconText style={iconTextStyle}>🎥</MediaIconText> {/* Video icon */}
      </MediaIconWrapper>
      <MediaInfoContainer>
        <MediaFilenameText style={filenameStyle} numberOfLines={1}>
          {item.filename} {/* Display filename */}
        </MediaFilenameText>
        <MediaDetailsText style={detailsStyle}>
          VIDEO • {formatFileSize(item.size)} {/* Display file type and size */}
        </MediaDetailsText>
      </MediaInfoContainer>
      <EditButtonContainer style={editButtonStyle} onPress={() => onEditPress(item)}>
        <EditButtonText style={editButtonTextStyle}>편집</EditButtonText>
      </EditButtonContainer>
    </MediaItemContainer>
  );
};

export default MediaListItem;
