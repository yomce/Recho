# Recho 비디오 편집기 앱

이것은 Recho를 위한 React Native 모바일 애플리케이션입니다.

## 후임 에이전트를 위한 중요 사항

-   **FFmpeg는 이제 클라이언트 측에 있습니다.** 모든 비디오 처리 로직이 백엔드에서 제거되었습니다. `ffmpeg-kit-react-native`와 같은 라이브러리를 사용하여 여기에서 구현해야 합니다.
-   **새로운 업로드 흐름:** 새로운 업로드 워크플로를 구현해야 합니다. 자세한 계획은 루트 디렉토리의 `PROMPT_FOR_SUCCESSOR.md` 파일을 참조하세요.
-   **새로운 편집 화면:** 새로운 파일 `src/screens/VideoEditScreen.arm.tsx`가 추가되었습니다. 이것은 새로운 클라이언트 측 편집 로직을 위한 의도된 위치입니다.

## 잠재적인 빌드 문제 및 해결책

-   **Android `bundle exec pod install` 오류:** `Could not find gem 'cocoapods'`와 같은 오류 메시지가 발생하면, 이는 종종 Ruby 환경이 올바르게 설정되지 않았거나 `rbenv` 또는 `rvm`과 같은 버전 관리자가 아닌 시스템 Ruby를 사용하고 있음을 의미합니다. 안정적인 Ruby 버전이 설치되고 활성화되어 있는지 확인하세요.
-   **iOS 빌드 오류 - `std::filesystem`:** iOS 빌드 중 `std::filesystem`을 찾을 수 없다는 오류가 발생하면 (특히 `ffmpeg-kit`과 같은 라이브러리를 추가한 후), 이는 C++ 표준이 올바르게 설정되지 않았음을 의미합니다.
    -   **해결책:** `VideoEditorApp/ios/Podfile`에서 모든 포드가 올바른 C++ 표준으로 컴파일되도록 하기 위해 다음 포스트 설치 후크를 추가해야 할 수 있습니다: