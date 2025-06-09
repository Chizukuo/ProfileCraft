# 🌈 치즈 프로필 카드 에디터 (Profile Craft)
### [English](./README.md) / [中文](./README.zh-CN.md) / [日本語](./README.ja-JP.md)
>개발자 "작은 치즈(小芝士, chizukuo)"가 전하는 인사말:  
"치즈(芝士)"는 중국어로 "이것은(这是, zhè shì)"와 발음이 비슷해요.  
그래서 이 툴의 이름은 "이것은 프로필 카드 에디터입니다!"라는 재치 있는 뜻을 담고 있어요. 재미있게 사용해 주세요!

치즈 프로필 카드 에디터는 React + TypeScript 기반으로 제작된 최신 프로필 카드 에디터입니다.  
텍스트 편집, 테마 색상 변경, 아바타 및 QR 코드 업로드, 동적 콘텐츠 블록 관리 기능을 지원하며, 완성된 카드는 독립 HTML 파일 또는 고화질 PNG 이미지로 내보내기 할 수 있습니다.  
개성 넘치는 프로필 카드 제작과 SNS 공유에 최적화된 도구입니다.

## 👉 온라인에서 사용해보기 → [GitHub Pages 데모](https://chizukuo.github.io/ProfileCraft/)



## 📌 주요 기능
- 🖋️ **실시간 리치 텍스트 편집**  
  텍스트를 클릭하여 바로 수정 가능.  
  **굵게**, *기울임꼴*, ~~취소선~~, <u>밑줄 등 서식 지원</u>.

- 🎨 **테마 색상 자유 설정**  
  색상 선택기를 통해 테마 색상을 지정하면, 관련 색상도 자동으로 조정되어 통일감 있는 디자인 제공.

- 🖼️ **아바타 및 QR 코드 실시간 업데이트**  
  원하는 아바타 이미지 업로드 (Base64 형식으로 브라우저에 저장).  
  URL 입력 시 QR 코드가 즉시 업데이트.

- 🗂️ **동적 카드 및 콘텐츠 블록**  
  템플릿에서 새로운 카드 추가.  
  단락, 태그 그룹, 관심사 정보 등을 자유롭게 추가 가능.  
  카드/블록/태그는 마우스 오버 시 삭제 버튼 노출.

- 💾 **자동 저장 기능**  
  편집 내용은 브라우저의 [localStorage](https://developer.mozilla.org/ko/docs/Web/API/Window/localStorage)에 자동 저장됨. 새로고침 후에도 유지됨.

- 📤 **다양한 내보내기 기능**  
  완성된 카드를 HTML 또는 PNG 이미지로 내보내기 지원.  
  원클릭 초기화 기능도 제공.

- 📱 **모바일 최적화**  
  반응형 디자인 적용. 모바일에서는 툴바가 접혀서 깔끔한 사용 경험 제공.

---

## 🛠️ 사용 방법
- 🚀 **온라인 접속**  
  👉 [https://chizukuo.github.io/ProfileCraft/](https://chizukuo.github.io/ProfileCraft/)

- ✨ **편집 가이드**  
  - 텍스트 클릭 후 직접 수정.  
  - 텍스트 드래그 후 서식 지정 가능.  
  - 사이드바 또는 툴바에서 테마 색상 변경.  
  - 카드/블록 자유롭게 추가 및 삭제 가능.

---

## 📦 내보내기
- 상단 툴바에서 HTML 또는 PNG 형식으로 내보내기 가능.  
- 원클릭으로 초기 템플릿으로 리셋 가능.

---

## ⚙️ 기술 스택

- 프레임워크: [React](https://reactjs.org/)  
- 언어: [TypeScript](https://www.typescriptlang.org/)  
- 빌드 도구: [Vite](https://vitejs.dev/)  
- 상태 관리: [React Context API](https://reactjs.org/docs/context.html)  
- 스타일링: [CSS3](https://developer.mozilla.org/ko/docs/Web/CSS) + [CSS Variables](https://developer.mozilla.org/ko/docs/Web/CSS/Using_CSS_custom_properties)  
- 아이콘: [Lucide React](https://lucide.dev/)

### 주요 라이브러리
- [html2canvas](https://github.com/niklasvh/html2canvas) — PNG 이미지 내보내기 지원  
- [qrcode.react](https://github.com/zpao/qrcode.react) — QR 코드 생성 컴포넌트

---

## ⚠️ 주의 사항
- 데이터는 브라우저의 [localStorage](https://developer.mozilla.org/ko/docs/Web/API/Window/localStorage)에 저장됩니다.  
- 캐시 삭제 시 데이터가 손실될 수 있으므로 필요시 백업 권장.  
- [html2canvas](https://github.com/niklasvh/html2canvas)는 복잡한 CSS 스타일을 완벽하게 반영하지 못할 수 있습니다.  
- HTML 내보내기 시 외부 폰트 로딩을 위해 인터넷 연결이 필요합니다.

자신만의 특별한 프로필 카드를 제작해보세요! 🎉
