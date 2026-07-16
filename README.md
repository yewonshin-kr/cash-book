# 가계부 웹앱

개인용 월말 결산형 가계부. GitHub Pages(프론트) + 구글 스프레드시트(DB, Apps Script API) 구성.

## 구조

```
가계부-앱/
├── index.html            # 앱 전체 (단일 파일)
├── config.example.js     # 연결 설정 예시 → config.js로 복사해서 사용
├── .gitignore            # config.js 커밋 방지
└── apps-script/Code.gs   # 구글 시트 쪽 API (Apps Script에 붙여넣기)
```

## 1단계 — 구글 시트 준비 (약 10분)

1. [sheets.new](https://sheets.new) 에서 새 스프레드시트 생성 (이름 예: `가계부DB`)
2. 메뉴 **확장 프로그램 > Apps Script** 열기
3. 기본 코드를 지우고 `apps-script/Code.gs` 내용 전체를 붙여넣기
4. 코드 상단 `TOKEN` 값을 **아무도 모르는 긴 문자열**로 변경 (예: 비밀번호 생성기로 32자)
5. **배포 > 새 배포 > 유형: 웹 앱**
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자** (토큰이 없으면 데이터 접근 불가하므로 안전)
6. 발급된 `https://script.google.com/macros/s/…/exec` URL 복사

> 시트(탭)는 앱이 처음 저장할 때 자동 생성됩니다: `transactions`, `works`, `accounts`, `isa_items`, `savings`, `fixed`, `ry_month`

## 2단계 — GitHub Pages 배포 (약 10분)

1. GitHub 저장소: `cash-book`
2. 이 폴더 내용을 push:
   ```bash
   cd 가계부-앱
   git init && git add . && git commit -m "가계부 v0.14"
   git branch -M main
   git remote add origin https://github.com/<아이디>/cash-book.git
   git push -u origin main
   ```
3. 저장소 **Settings > Pages > Source: Deploy from a branch > main / root** 선택
4. 1~2분 후 `https://<아이디>.github.io/cash-book/` 접속 가능

## 3단계 — 앱과 시트 연결

**방법 A (권장 · 공개 저장소):** 배포된 앱 접속 → **설정 ⚙ > 구글 시트 연결** → 1단계의 URL과 토큰 입력 → 저장.
토큰이 기기 브라우저(localStorage)에만 저장되므로 저장소에 노출되지 않습니다. 폰과 PC 각각 1회씩 입력.

**방법 B (비공개 저장소인 경우만):** `config.example.js`를 `config.js`로 복사해 URL/토큰을 넣고 함께 push.
⚠️ 공개 저장소에서는 절대 사용 금지 — 토큰이 노출되면 누구나 시트를 읽고 쓸 수 있습니다.

## 동작 방식

- 앱 시작 시 시트에서 전체 데이터를 불러옵니다. **시트가 비어 있으면 내장된 초기 데이터(기존 엑셀 마이그레이션분)를 자동 업로드**합니다.
- 이후 모든 입력·수정은 1.5초 디바운스 후 시트에 자동 저장됩니다 (배열 필드는 JSON 문자열로 셀에 저장).
- 연결이 없거나 실패하면 내장 데이터로 오프라인 표시됩니다.
- 모바일: 배포 URL을 크롬에서 열고 **홈 화면에 추가**하면 앱처럼 사용 가능.

## 이후 개선 아이디어

- 카드사 CSV 업로드 파싱 실전 연결 (현재 샘플 플로우)
- 자동 분류 규칙 시트(`rules`) 추가
- 월 데이터만 부분 동기화 (현재는 전체 저장 — 수백 행 수준에서는 충분히 빠름)
