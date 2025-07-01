import React, { RefObject } from 'react';
import styled from 'styled-components/native';
import { Camera, CameraDevice } from 'react-native-vision-camera';

interface Props {
  cameraRef: RefObject<Camera | null>; // 이곳의 타입을 'Camera | null'로 변경
  device: CameraDevice; // device 타입은 VisionCamera의 Device 타입을 사용합니다.
  isActive: boolean; // isActive 프롭도 Props에 추가되어야 합니다.
}

// Styled Components 정의
const BottomContainer = styled.View`
  flex: 1;
  background-color: #111;
`;

const CameraWrapper = styled.View`
  flex: 1;
  overflow: hidden;
`;

const StyledCamera = styled(Camera)`
  flex: 1;
`;

const InfoText = styled.Text`
  color: white;
  font-size: 18px;
  text-align: center;
  margin-top: 20px;
`;

/**
 * CameraView 컴포넌트는 react-native-vision-camera를 사용하여 카메라 미리보기를 표시합니다.
 * 사용 가능한 카메라 장치가 없거나 초기화 중일 때 정보 텍스트를 표시합니다.
 * 모든 스타일은 styled-components로 정의되었습니다.
 */
const CameraView: React.FC<Props> = ({ cameraRef, device }) => {
  return (
    <BottomContainer>
      <CameraWrapper>
        {device ? (
          // 카메라 장치가 존재하면 Camera 컴포넌트 렌더링
          <StyledCamera
            ref={cameraRef} // 카메라 ref 연결
            device={device} // 사용될 카메라 장치
            isActive={true} // 카메라 활성화
            video={true} // 비디오 녹화 가능
            audio={true} // 오디오 녹음 가능
          />
        ) : (
          // 카메라 장치를 찾을 수 없을 때 정보 텍스트 표시
          <InfoText>사용 가능한 카메라가 없습니다.</InfoText>
        )}
      </CameraWrapper>
    </BottomContainer>
  );
};

export default CameraView;
