# Recho WebFrontend 구현 계획서 (작성자: 후임 Gemini)

이 문서는 Recho 프로젝트의 `WebFrontend` 구현을 위한 공식적인 작업 계획서입니다. 모든 작업은 이 계획을 기반으로 진행하며, 중요한 변경 사항 발생 시 본 문서를 업데이트합니다.

## 1. 최상위 목표 (Top-Level Objective)

백엔드 서버, `VideoEditorApp`과 완벽하게 연동되는 `WebFrontend`를 구현한다. 사용자는 웹뷰를 통해 비디오 목록을 보고, 스트리밍하며, 원하는 비디오의 편집을 시작할 수 있어야 한다.

## 2. 핵심 행동 강령 (Core Principles)

1.  **연결부를 먼저 설계한다 (Connectivity First):** 기능 구현에 앞서, 시스템 간의 통신 방식(인증, 앱-웹 연동)을 최우선으로 확정한다.
2.  **확장 가능한 아키텍처를 구축한다 (Scalable Architecture):** 재사용성과 유지보수성을 높이기 위해 서버 상태 관리 라이브러리(`TanStack Query`)를 도입하여 데이터 흐름을 체계적으로 관리한다.
3.  **모호함을 제거하고 검증한다 (Clarification and Verification):** 코드를 작성하기 전에 백엔드의 데이터 명세와 같이 불확실한 부분을 먼저 확인하여 오류 가능성을 차단한다.
4.  **모든 새로운 설계를 문서화한다 (Diligent Documentation):** 새롭게 결정된 모든 설계와 정책은 관련 문서에 즉시 업데이트하여 투명성을 유지한다.

---

## 3. 구현 로드맵 (Implementation Roadmap) - 수정안 (Mock Data 우선 전략)

### Phase 1: Mock Data 기반 UI/UX 프로토타이핑

- **1-1. Mock Data 정의 및 핵심 UI 구현:**

  - **내용:** 실제 API 통신 없이 UI 개발을 진행하기 위해, 백엔드 API 응답을 모방한 가짜 비디오 목록 데이터를 정의하고, 이 데이터를 기반으로 썸네일 목록과 '편집' 버튼을 포함한 핵심 UI를 먼저 완성한다.
  - **이유:** API 인증 로직을 기다리지 않고, 사용자에게 보여질 화면과 인터랙션 로직 개발에 집중하여 병렬 작업 효율을 극대화한다.

- **1-2. 웹 → 앱 편집 로직 구현:**
  - **내용:** 구현된 UI의 '편집' 버튼에, `window.ReactNativeWebView.postMessage`를 사용하여 `VideoEditorApp`으로 `videoId`를 전달하는 로직을 연동한다.
  - **이유:** 토큰 없이도 구현 가능한 핵심 연동 기능을 먼저 완료한다.

### Phase 2: 백엔드 명세 검증 (Backend Specification Verification)

- **2-1. `depth` 컬럼 처리 주체 확인 (Verify `depth` Column Handling):**
  - **내용:** `BackendServer/src/video-insert/video-insert.service.ts` 코드를 직접 확인하여, 리믹스 깊이를 나타내는 `depth` 값을 클라이언트가 보내야 하는지, 서버가 직접 계산하는지 명확히 한다.
  - **이유:** 데이터의 무결성을 보장하고, 추후 발생할 수 있는 데이터 불일치 오류를 사전에 방지한다.

### Phase 3: 실제 API 연동 및 상태 관리 도입 (API Integration & State Management)

- **3-1. 인증 로직 통합 및 API 연동:**
  - **내용:** 다른 팀원의 인증 작업 완료 후, `VideoEditorApp`에서 WebView로 토큰을 주입하는 로직을 적용한다. 이후, `TanStack Query`를 도입하여 Mock Data를 사용하던 부분을 `axiosInstance`를 이용한 실제 API 호출로 교체한다.
  - **이유:** 모든 기반 작업이 완료된 시점에서 실제 데이터와 연동하여 기능을 완성한다.

### Phase 4: 지속적인 문서화 (Continuous Documentation)

- **4-1. `GEMINI.md` 및 `IMPLEMENTATION_REPORT.md` 업데이트:**

* **내용:** 모든 구현 단계의 진행 상황, 주요 결정 사항, 발생한 이슈 및 해결 과정을 관련 문서에 지속적으로 기록한다.
* **이유:** 프로젝트의 투명성과 연속성을 확보하고, 미래의 다른 개발자를 돕기 위함이다.

---

### Phase 5: 홈 화면에서 비디오 생성 흐름 연동 (Home to Creation Flow)

- **5-1. 홈 화면에 '비디오 생성' 버튼 추가:**

  - **내용:** `WebFrontend`의 홈 화면(`MainPage.tsx`)에 "새 비디오 만들기" 버튼을 추가한다.
  - **이유:** 사용자가 비디오 생성을 시작할 수 있는 명확한 진입점을 제공한다.

- **5-2. 웹 → 앱 '화면 호출' 로직 구현:**
  - **내용:** 생성된 버튼 클릭 시, `postMessage`를 통해 `{ "type": "CREATE_VIDEO" }` 라는 메시지를 `VideoEditorApp`으로 전송하는 로직을 구현한다.
  - **이유:** 웹에서 네이티브 앱의 특정 화면(HomeScreen)으로 전환을 트리거하는 기능을 구현한다.
