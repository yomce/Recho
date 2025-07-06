import React, { useState } from 'react';
import styled from 'styled-components/native';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList, MediaItem, formatFileSize } from '../types'; // RootStackParamList, MediaItem, formatFileSize 임포트
import CommonButton from '../components/Common/CommonButton'; // CommonButton 임포트 (수정됨)
import SectionHeader from '../components/Common/SectionHeader'; // SectionHeader 임포트
import InfoDisplay from '../components/Common/InfoDisplay'; // InfoDisplay 임포트
import MediaListItem from '../components/Common/MediaListItem'; // MediaListItem 임포트 (Styled-components 버전이 아님, 스타일은 MediaListItem 내부에서 처리)
import EmptyState from '../components/Common/EmptyState'; // EmptyState 임포트 (Styled-components 버전)
import { isErrorWithCode, pick, types } from '@react-native-documents/picker';

type MediaLibraryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MediaLibrary'
>;

interface Props {
  navigation: MediaLibraryScreenNavigationProp;
}

// Styled Components 정의
const ScreenContainer = styled.SafeAreaView`
  flex: 1;
  background-color: #000000;
`;

const HeaderContainer = styled.View`
  padding: 20px;
  border-bottom-width: 1px;
  border-bottom-color: #2c3e50;
`;

const ButtonContainer = styled.View`
  padding: 20px;
  gap: 15px; /* 버튼 간 간격 */
`;

// CommonButton을 확장하여 PickButton 정의
const PickButton = styled(CommonButton)`
  background-color: #3498db; /* 단일 파일 선택 버튼 색상 */
`;

// CommonButton을 확장하여 PickMultipleButton 정의
const PickMultipleButton = styled(CommonButton)`
  background-color: #27ae60; /* 여러 파일 선택 버튼 색상 */
`;

// 버튼 텍스트 스타일 (CommonButton의 children으로 사용될 styled.Text)
const ButtonTextStyled = styled.Text`
  color: #ffffff; /* CommonButton의 기본 텍스트 색상과 일치 */
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

const ListContainer = styled(FlatList).attrs({
  contentContainerStyle: { padding: 10 },
})`
  /* FlatList 자체의 스타일 (필요하다면) */
`;

const MediaItemStyled = styled(MediaListItem)`
  /* MediaListItem 컴포넌트는 이미 styled-components를 사용하고 있다면 여기서 추가 스타일링 */
  /* 그렇지 않다면 MediaListItem 자체의 스타일을 따름 */
`;

/**
 * MediaLibraryScreen 컴포넌트는 사용자의 기기에서 비디오 파일을 선택하는 인터페이스를 제공합니다.
 * 단일 또는 여러 비디오를 선택하여 VideoEdit 화면으로 전달할 수 있습니다.
 * 모든 스타일은 styled-components로 정의되었으며, 다양한 공통 컴포넌트들을 활용합니다.
 */
const MediaLibraryScreen: React.FC<Props> = ({ navigation }) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]); // 현재 화면에서 표시될 미디어 아이템 목록 (선택 후 다음 화면으로 이동하므로 비어있을 가능성 높음)
  const [isLoading, setIsLoading] = useState(false); // 파일 선택 중 로딩 상태

  /**
   * DocumentPicker를 사용하여 비디오 파일을 선택합니다.
   * @param allowMultiSelection 여러 파일 선택 허용 여부
   */
  const pickVideos = async (allowMultiSelection: boolean) => {
    try {
      setIsLoading(true); // 로딩 시작
      console.log(
        `[MediaLibraryScreen] ${
          allowMultiSelection ? '여러' : '단일'
        } 비디오 파일 선택 시작...`,
      );

      const result = await pick({
        type: [types.video], // 비디오 파일만 선택
        allowMultiSelection: allowMultiSelection, // 여러 파일 선택 허용 여부 설정
      });

      console.log('[MediaLibraryScreen] 선택된 파일:', result);

      if (result && result.length > 0) {
        // 선택된 파일들을 MediaItem 배열로 변환
        const items: MediaItem[] = result.map((file, index) => ({
          id: file.uri + (allowMultiSelection ? index : ''), // 여러 파일 선택 시 고유 ID 보장
          filename: file.name || `video_${index}`, // 파일명 없으면 기본값
          uri: file.uri,
          type: 'video',
          size: file.size || 0,
        }));

        // 선택된 비디오들을 VideoEdit 화면으로 전달하고 이동
        navigation.navigate('VideoEdit', { videos: items });
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        console.log('[MediaLibraryScreen] 사용자가 파일 선택을 취소했습니다.');
      } else {
        console.error('[MediaLibraryScreen] 파일 선택 오류:', error);
        Alert.alert('오류', '비디오 파일을 선택하는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  // FlatList의 각 아이템 렌더링 함수
  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <MediaListItem
      item={item}
      onPress={() => handleMediaItemPress(item)}
      onEditPress={() => handleMediaItemEditPress(item)}
    />
  );

  // 미디어 아이템 클릭 핸들러 (단일 아이템 편집 화면으로 이동)
  const handleMediaItemPress = (item: MediaItem) => {
    navigation.navigate('VideoEdit', { videos: [item] });
  };

  // 미디어 아이템의 '편집' 버튼 클릭 핸들러
  const handleMediaItemEditPress = (item: MediaItem) => {
    navigation.navigate('VideoEdit', { videos: [item] });
  };

  return (
    <ScreenContainer>
      <HeaderContainer>
        <SectionHeader
          title="📁 비디오 파일 선택"
          containerStyle={{ paddingVertical: 0 }}
        />
      </HeaderContainer>

      <ButtonContainer>
        <PickButton onPress={() => pickVideos(false)} disabled={isLoading}>
          <ButtonTextStyled>
            {isLoading ? '🔄 선택 중...' : '📁 비디오 파일 선택'}
          </ButtonTextStyled>
        </PickButton>
        <PickMultipleButton
          onPress={() => pickVideos(true)}
          disabled={isLoading}
        >
          <ButtonTextStyled>
            {isLoading ? '🔄 선택 중...' : '📁 여러 비디오 선택'}
          </ButtonTextStyled>
        </PickMultipleButton>
      </ButtonContainer>

      {isLoading ? (
        // 로딩 중일 때 InfoDisplay 컴포넌트 표시
        <InfoDisplay showIndicator={true} message="파일을 선택하는 중..." />
      ) : (
        // 로딩이 끝나면 파일 목록 또는 빈 상태 메시지 표시
        <ListContainer
          data={mediaItems} // mediaItems는 일반적으로 비어있을 것임 (선택 즉시 다음 화면으로 이동)
          renderItem={renderMediaItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <EmptyState
              icon="📭"
              message="선택된 비디오가 없습니다"
              subMessages={[
                '위의 버튼을 눌러서 비디오 파일을 선택해보세요',
                '지원 형식: MP4, MOV, AVI, MKV 등',
              ]}
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

export default MediaLibraryScreen;
