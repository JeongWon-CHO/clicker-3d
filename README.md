# Clicker

직접 제작한 GLB 키캡을 돌리고 누르는 단일 페이지 웹 경험입니다.
React + TypeScript + Vite, Three.js + React Three Fiber + Drei로 구성했습니다.

## 실행

Node.js 22.12 이상에서:

```sh
npm ci
npm run dev
```

http://127.0.0.1:5173 에서 확인합니다.

```sh
npm run build
npm run preview
```

배포할 때는 `dist/`를 정적 호스팅하면 됩니다.

## 인터랙션

- 모델 위에서 pointerdown 시 상단 키캡이 즉시 눌립니다.
- 이동이 마우스 5px / 터치 9px를 초과하면 눌림을 취소합니다. 시작점으로 돌아와도 해당 입력은 클릭이 되지 않습니다.
- 모델 위에서 유효한 pointerup 시 한 번만 카운트합니다. 빈 배경은 회전만 가능합니다.
- 다중 터치, pointercancel, 포커스 상실은 클릭 후보를 취소합니다.
- Arcball 회전은 `src/components/RotationControls.tsx`에 격리했습니다. 이동, 줌, 더블클릭 포커스, 관성은 꺼져 있습니다.
- 저장은 `clicker:count:v1` 키를 사용하며 250ms trailing throttle로 묶습니다. `pagehide`와 탭 숨김 시 미저장 값을 즉시 저장합니다. 브라우저 강제 종료 직전의 최대 250ms 입력은 보존되지 않을 수 있습니다.

## 모델

루트 `keycap.glb`를 Vite URL 자산으로 로딩합니다. Blender 작업 폴더는 웹 코드와 독립적입니다.

```text
Scene
├── Keycap_Base
└── Keycap_Top
    └── Keycap_Stem
```

원본 hierarchy와 재질을 유지합니다. Top의 로컬 Y를 0.00034만큼 내려 Stem을 함께 움직이며 Base는 고정합니다. 전체 크기와 중심은 바깥 그룹에서 조정합니다. 환경 조명은 코드로 생성하므로 외부 HDR 파일이 필요하지 않습니다. 웹폰트를 불러올 수 없으면 시스템 폰트로 표시됩니다.

## 검증

설치된 Google Chrome을 사용합니다.

```sh
npm test
```

Playwright가 개발 서버와 실제 Chrome을 실행해 GLB 로딩, press, 회전, 드래그 취소, 연타, 저장 복원, 저장 실패, 모바일 터치 및 다중 터치를 검증합니다. 렌더링 검증은 소프트웨어 WebGL로 수행하며 실기기 GPU 성능 검증을 대체하지 않습니다. 스크린샷은 `test-results/`에 저장됩니다.
