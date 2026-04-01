# 설비 수리 의뢰 시스템 — 배포 가이드

## 폴더 구조
```
facility-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx      ← 진입점 (건드리지 마세요)
    ├── App.jsx       ← 메인 앱 코드
    ├── data.js       ← 설비/사용자 데이터
    └── supabase.js   ← DB 연결 (나중에 사용)
```

---

## STEP 1 — 처음 1회만: 프로그램 설치

아래 3개를 순서대로 설치합니다 (전부 무료).

1. **Node.js** → https://nodejs.org  (LTS 버전)
2. **VS Code** → https://code.visualstudio.com
3. **Git**     → https://git-scm.com

---

## STEP 2 — 로컬에서 실행 테스트

VS Code 열기 → 상단 Terminal → New Terminal → 아래 입력:

```bash
cd facility-app
npm install
npm run dev
```

브라우저에서 http://localhost:5173 열면 앱 확인 가능!

---

## STEP 3 — GitHub에 올리기

1. https://github.com 가입
2. 오른쪽 위 **+** → **New repository**
3. Repository name: `facility-app` → **Create repository**
4. 터미널에서 아래 입력 (username은 본인 GitHub 아이디):

```bash
git init
git add .
git commit -m "첫 배포"
git branch -M main
git remote add origin https://github.com/[username]/facility-app.git
git push -u origin main
```

---

## STEP 4 — Vercel로 배포 (5분)

1. https://vercel.com 접속 → **GitHub으로 로그인**
2. **Add New Project** 클릭
3. `facility-app` 저장소 선택 → **Import**
4. Framework: **Vite** 자동 감지됨
5. **Deploy** 클릭

➡ 완료! `https://facility-app-xxx.vercel.app` 주소 자동 생성

---

## 나중에 SMS 알림 추가할 때 (선택)

네이버 클라우드 SENS 가입 후 아래 3가지 값을 Vercel 환경변수에 추가:

Vercel → 프로젝트 → Settings → Environment Variables:
```
VITE_NCLOUD_ACCESS_KEY  = 발급받은 키
VITE_NCLOUD_SECRET_KEY  = 발급받은 키  
VITE_NCLOUD_SERVICE_ID  = 발급받은 ID
```

---

## 코드 수정 후 재배포

로컬에서 수정 후 터미널에서:
```bash
git add .
git commit -m "수정 내용"
git push
```
GitHub에 올라가면 Vercel이 자동으로 재배포합니다!
