// src/types/express.d.ts

// Express 모듈의 전역 네임스페이스를 확장합니다.
// NestJS가 기본적으로 Express를 사용하기 때문에 이 방식이 NestJS에서도 유효합니다.
declare namespace Express {
  // JwtStrategy의 validate 메서드에서 반환하는 객체의 타입을 정의합니다.
  // 이 타입은 req.user에 주입될 사용자 정보의 구조를 나타냅니다.
  // 예시: { id: number; name: string; }
  interface User {
    id: string; // 사용자 고유 ID
    username: string; // 사용자 이름 또는 닉네임
    // 필요에 따라 이 외의 다른 사용자 속성들을 여기에 추가할 수 있습니다.
    // 예: email?: string; roles?: string[];
  }

  // Express의 Request 인터페이스를 확장하여 'user' 속성을 추가합니다.
  interface Request {
    user?: User; // 'user' 속성은 선택적일 수 있습니다 (인증 가드가 없는 라우트에서는 없을 수 있음).
  }
}
