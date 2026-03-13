# ProfileCraft (치즈 프로필 카드 에디터)

[English](../README.md) / [中文](./README.zh-CN.md) / [日本語](./README.ja-JP.md)

ProfileCraft는 React + TypeScript로 만든 브라우저 기반 프로필 카드 에디터입니다.
리치 텍스트 편집, 카드 레이아웃 드래그/리사이즈, 다국어 및 테마 전환, HTML/PNG 내보내기를 제공합니다.

## 데모

- https://tools.chizunet.cc/

## 주요 기능

- 리치 텍스트 편집(굵게, 기울임, 밑줄, 취소선)
- 동적 카드/콘텐츠 블록 관리
- react-grid-layout 기반 드래그 및 리사이즈
- 아바타 업로드와 QR 코드 링크 갱신
- 다국어 UI(zh-CN, en-US, ja-JP, ko-KR)
- 기본 테마 제공(Default, Cyberpunk)
- localStorage 자동 저장
- 독립 HTML 또는 PNG 내보내기

## 기술 스택

- React 19
- TypeScript
- Vite
- Context API
- react-grid-layout
- html2canvas
- qrcode.react
- lucide-react

## 로컬 개발

### 요구 사항

- Node.js 20+
- npm 10+

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 결과 미리보기

```bash
npm run preview
```

### 린트 실행

```bash
npm run lint
```

## 디렉터리 구조

```text
src/
  components/      # 앱 화면, 카드, 모달, UI 컴포넌트
  context/         # Profile / Locale / Theme 컨텍스트
  hooks/           # 레이아웃, 스로틀, 번역 등 재사용 로직
  config/          # 로케일/테마 설정
  utils/           # 내보내기, i18n, 테마/색상 유틸리티
  styles/          # 전역 및 모듈 CSS
  types/           # TypeScript 타입 정의
public/
  locales/         # 번역 리소스
  themes/          # 테마 CSS
document/
  README.*.md      # 다국어 문서
```

## 데이터 저장 및 내보내기 안내

- 편집 데이터는 브라우저 localStorage에 저장됩니다.
- 브라우저 저장소를 지우면 로컬 초안이 함께 삭제됩니다.
- PNG 내보내기는 html2canvas를 사용하므로 복잡한 CSS 효과가 완벽히 재현되지 않을 수 있습니다.
- HTML 내보내기 파일은 필요한 스타일을 포함하지만, 웹 폰트는 인터넷 연결이 필요할 수 있습니다.

## 라이선스

MIT, 자세한 내용은 [LICENSE](../LICENSE)를 참고하세요.
