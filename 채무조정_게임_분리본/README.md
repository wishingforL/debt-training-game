# 신입사원 채무조정 접수 클리어

React + Vite + TypeScript로 만든 모바일 세로형 웹 게임입니다. 상담 시나리오를 읽고 전산 입력, 가용소득 확인, 최종미션 제출 순서로 5개 레벨을 클리어합니다.

## 실행

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## Vercel 배포

Vercel에서 이 폴더를 프로젝트로 연결하면 Vite 설정을 자동 인식합니다.

- Build Command: `npm run build`
- Output Directory: `dist`

배포 URL을 QR 코드로 만들면 모바일 브라우저에서 설치 없이 바로 플레이할 수 있습니다.

## 저장

최고점수, 최근점수, 해금 레벨은 브라우저 `localStorage`에 저장됩니다.

## 참고

게임 내 가용소득과 변제기간은 교육용 간이 계산값입니다. 실제 채무조정 심사나 법률 판단에는 공식 기준과 내부 전산 기준을 확인해야 합니다.
