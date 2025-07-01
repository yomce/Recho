/// <reference types="vite/client" />

// .png 파일을 모듈로 인식하도록 타입 선언 추가
declare module '*.png' {
    const value: string; 
    export default value;
  }
