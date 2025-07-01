import React, { useState } from 'react';
import styled from 'styled-components/native';
import { SafeAreaView, ScrollView, StatusBar, Alert, Platform, ActivityIndicator } from 'react-native';
import { FFmpegKit, ReturnCode, Session } from 'ffmpeg-kit-react-native';

// FFmpegTestScreenProps를 위한 RootStackParamList 임포트
import { RootStackParamList } from '../types';
import { StackScreenProps } from '@react-navigation/stack';

// CommonButton을 임포트합니다. (수정됨)
import CommonButton from '../components/Common/CommonButton';
// SectionHeader를 임포트합니다.
import SectionHeader from '../components/Common/SectionHeader';

// 화면 컴포넌트의 props 타입을 정의합니다.
type FFmpegTestScreenProps = StackScreenProps<RootStackParamList, 'FFmpegTest'>;

// Styled Components 정의
const ScreenContainer = styled(SafeAreaView)<{ isDarkMode: boolean }>`
  flex: 1;
  background-color: ${props => (props.isDarkMode ? '#121212' : '#FFFFFF')};
`;

const ContentScrollView = styled.ScrollView`
  flex: 1;
  background-color: transparent;
`;

const SectionContainer = styled.View`
  margin-top: 32px;
  padding-horizontal: 24px;
`;

const ButtonContainer = styled.View`
  margin-bottom: 20px;
`;

const FFmpegOutputText = styled.Text`
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f0f0;
  border-color: #ccc;
  border-width: 1px;
  border-radius: 5px;
  min-height: 100px;
  font-family: ${Platform.OS === 'ios' ? 'Menlo' : 'monospace'}; /* iOS: Menlo, Android: monospace */
  color: #333;
  margin-bottom: 20px;
`;

// 버튼 텍스트 스타일 (CommonButton의 children으로 사용될 styled.Text)
const ButtonTextStyled = styled.Text`
  color: #ffffff; /* CommonButton의 기본 텍스트 색상과 일치 */
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;

/**
 * FFmpegTestScreen 컴포넌트는 FFmpegKit 및 FFprobeKit 기능을 테스트하기 위한 화면입니다.
 * 비디오 메타데이터 추출 및 FFmpeg 버전 확인 명령을 실행할 수 있습니다.
 * 모든 스타일은 styled-components로 정의되었으며, CommonButton과 SectionHeader를 활용합니다.
 */
function FFmpegTestScreen({ navigation }: FFmpegTestScreenProps): React.JSX.Element {
  const isDarkMode = Platform.select({
    ios: true, // For simplicity, assume dark mode on iOS for this example
    android: false, // For simplicity, assume light mode on Android
    default: false,
  });

  const [ffmpegOutput, setFfmpegOutput] = useState<string>(
    'FFmpeg Output will appear here.',
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * FFmpeg 명령어를 실행하고 결과를 처리하는 범용 함수.
   * @param command 실행할 FFmpeg 명령어 문자열
   * @param description 현재 실행 중인 작업에 대한 설명 (예: "Metadata Extraction")
   */
  const executeFFmpegCommand = async (command: string, description: string): Promise<void> => {
    setIsLoading(true);
    setFfmpegOutput(`Running FFmpeg ${description}...`);
    try {
      console.log(`FFmpeg Command (${description}):`, command);

      const session: Session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (ReturnCode.isSuccess(returnCode)) {
        const output = await session.getOutput();
        setFfmpegOutput(`${description} Success:\n${output}`);
        Alert.alert(
          `${description} Test`,
          `Successfully ${description.toLowerCase()} (check output).`,
        );
      } else if (ReturnCode.isCancel(returnCode)) {
        setFfmpegOutput(`${description} Cancelled.`);
        Alert.alert(`${description} Test`, `${description.toLowerCase()} was cancelled.`);
      } else {
        const error = await session.getOutput();
        setFfmpegOutput(
          `${description} Failed:\nCode: ${returnCode.getValue()}\nError: ${
            error || 'No error output.'
          }`,
        );
        Alert.alert(
          `${description} Test`,
          `${description.toLowerCase()} failed.\nCode: ${returnCode.getValue()}\nError: ${
            error || 'No error output.'
          }`,
        );
      }
    } catch (e: any) {
      setFfmpegOutput(
        `Error during ${description.toLowerCase()}: ${e.message || 'Unknown error'}`,
      );
      Alert.alert(
        'Error',
        `Failed to run ${description.toLowerCase()}: ${e.message || 'Unknown error'}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 비디오 메타데이터 추출 테스트를 실행합니다.
   * 실제 기기에서 작동하려면 `inputPath`를 기기에 존재하는 비디오 파일 경로로 변경해야 합니다.
   */
  const testExtractMetadata = async (): Promise<void> => {
    // 경고: 이 경로는 예시이며 실제 기기에서는 작동하지 않을 수 있습니다.
    // 실제 앱에서는 DocumentPicker 등을 통해 선택된 파일의 URI를 사용해야 합니다.
    const inputPath = Platform.OS === 'ios'
      ? `${RNFS.DocumentDirectoryPath}/catvideo.mp4` // 예시 iOS 경로
      : `${RNFS.DocumentDirectoryPath}/catvideo.mp4`; // 예시 Android 경로

    // 파일이 존재한다고 가정하고 테스트합니다. 실제 사용 시 파일 존재 여부를 확인해야 합니다.
    const command = `-i "${inputPath}" -hide_banner -f null -`;
    await executeFFmpegCommand(command, 'Metadata Extraction');
  };

  /**
   * FFmpeg 버전 확인 테스트를 실행합니다.
   */
  const runFFmpegTest = async (): Promise<void> => {
    const command = '-version';
    await executeFFmpegCommand(command, 'Version Check');
  };

  return (
    <ScreenContainer isDarkMode={isDarkMode}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ContentScrollView
        contentInsetAdjustmentBehavior="automatic"
      >
        <SectionContainer>
          <SectionHeader title="FFmpeg Metadata Test" />
          <ButtonContainer>
            <CommonButton
              onPress={testExtractMetadata}
              isLoading={isLoading}
              disabled={isLoading}
            >
              <ButtonTextStyled>Extract Video Metadata</ButtonTextStyled> {/* children으로 텍스트 전달 */}
            </CommonButton>
          </ButtonContainer>
          <FFmpegOutputText>{ffmpegOutput}</FFmpegOutputText>

          <ButtonContainer>
            <CommonButton
              onPress={runFFmpegTest}
              isLoading={isLoading}
              disabled={isLoading}
            >
              <ButtonTextStyled>Run FFmpeg Version Check</ButtonTextStyled> {/* children으로 텍스트 전달 */}
            </CommonButton>
          </ButtonContainer>
          <FFmpegOutputText>{ffmpegOutput}</FFmpegOutputText>
        </SectionContainer>
      </ContentScrollView>
    </ScreenContainer>
  );
}

export default FFmpegTestScreen;
