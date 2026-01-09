# GOD OF HIGHSCHOOL CHANGE - 티저 페이지

## 프로젝트 구조

### 파일 구성
- `index.html` - 메인 HTML
- `style.css` - 스타일시트
- `script.js` - 마우스 3D 패럴랙스 효과
- `resource/` - 이미지 리소스

### 리소스 파일
- `background.jpg` - 배경 이미지
- `big_change.png` - 배경 CHANGE 텍스트
- `big_2.png` - 배경 숫자 2
- `logo_base.png` - 로고 베이스
- `logo_middle.png` - 로고 중간 레이어
- `logo_change.png` - 로고 CHANGE 텍스트
- `naverbttn.png` - 네이버 라운지 버튼
- `favicon.ico` - 파비콘

---

## 씬 구성

### 1. 배경인트로 (0~3.5초)

**타임라인:**
| 시간 | 배경그룹01 (background + big_2) | 배경그룹02 (big_change) |
|------|--------------------------------|------------------------|
| 0~1s | 블러 상태로 페이드인 | 블러 상태로 페이드인 |
| 1~2s | 포커스 맞음 (선명) | 블러 유지 |
| 2~3.5s | 블러 아웃 | 포커스 맞음 (초점 이동) |

**효과:**
- 랙포커스 효과 (배경→big_change로 초점 이동)
- 마우스 3D 패럴랙스 (레이어별 깊이감)
- 마우스 3D 회전 (최대 5도)

**레이어 구조 (z-index):**
```
z-index: 10  → 로고 그룹 (main-content)
z-index: 2   → big_2.png
z-index: 1   → big_change.png
z-index: 0   → background.jpg
```

---

### 2. 로고 Base씬 (3.5초~9.3초)

#### 2-1. 에너지 모음 연출 (3.5초~9.3초)

**타임라인:**
| 시간 | 이벤트 |
|------|--------|
| 3.5s | 별빛 파티클 생성 시작 (간격 150ms, 한번에 2~3개) |
| 3.5s | big_change 서서히 블러 시작 |
| 3.5~7.5s | 파티클 점점 증가 (간격 150ms → 15ms), logo_base 방향으로 빨려들어감 |
| 7.5s | 마지막 파티클 생성 |
| 9.3s | 마지막 파티클 소멸 (파티클 애니메이션 1.8s), big_change 블러 완료 |

**효과:**
- 별빛 JS 파티클 (동적 생성, 점진적 빈도 증가)
- 지수적 가속 효과 (리니어하게 오다가 끝에서 급가속)
- logo_base 바깥 지점(25% 거리)에서 사라짐
- 4레이어 글로우 + 트레일(꼬리) 효과
- big_change 서서히 블러 (0px → 4px)

#### 2-2. Base 등장 연출 (4.3초~9.3초)

**타임라인:**
| 시간 | 이벤트 |
|------|--------|
| 4.3s | logo_base + logo_middle 페이드인 시작 (별빛 시작 + 0.8초) |
| 9.3s | logo_base + logo_middle 페이드인 완료 (마지막 별빛 소멸 시점) |

**효과:**
- 지수적 페이드인 (처음엔 천천히, 끝에서 빠르게) - 5s 지속
  - 50% 시점: opacity 0.15
  - 80% 시점: opacity 0.5
  - 100% 시점: opacity 1
- 에너지 충전 글로우 (파란색 drop-shadow)

---

### 3. 로고 Change씬 (9.3초~10초)

#### 3-1. Change 박힘 연출 (9.3초~9.7초)

**타임라인:**
| 시간 | 이벤트 |
|------|--------|
| 9.3s | logo_change가 화면 앞(scale 8배, blur 4px)에서 빠르게 날아옴 |
| 9.5s | logo_change 착지 (scale 바운스: 8 → 1.2 → 0.9 → 1.05 → 1) |

**효과:**
- 충격 착지 애니메이션 (0.4s, cubic-bezier 오버슈트)
- 블러→선명 전환

#### 3-2. 주변 효과 연출 (9.5초~10초)

**타임라인:**
| 시간 | 이벤트 |
|------|--------|
| 9.5s | 플래시 오버레이 (흰색, 0.4s) |
| 9.5s | 화면 흔들림 (screenShake, 0.5s) |
| - | 네이버 버튼 (당분간 숨김) |

**효과:**
- 플래시 오버레이 (opacity 0→0.9→0)
- 화면 흔들림 (translate + rotate 감쇠)

---

**레이어 구조 (z-index):**
```
z-index: 1000 → 네이버 버튼
z-index: 100  → 플래시 오버레이
z-index: 15   → 별빛 파티클 (독립 레이어)
z-index: 10   → 로고 그룹 (main-content)
z-index: 2    → big_2.png
z-index: 1    → big_change.png
z-index: 0    → background.jpg
```

---

## 기술 노트

### CSS 애니메이션
**배경인트로:**
- `bgPhotoFocus` - background.jpg 랙포커스 (3.5s)
- `bgChangeFocus` - big_change 포커스 인 + 서서히 블러 (9.3s)
- `bgTwoFocus` - big_2 랙포커스 (3.5s)

**에너지 충전:**
- `snowflakeAttract` - 별빛 지수적 가속 (cubic-bezier(0.2, 0, 0.9, 0.4), 1.8s)
- `logoSparkle` - 파티클 충돌 시 logo_change 반짝임

**로고등장:**
- `logoContainerFadeIn` - logo_base + logo_middle 페이드인 (4.3s 시작, 5s 지속)
- `energyCharge` - 에너지 충전 글로우 (4.3s 시작, 5s 지속)
- `logoChangeImpact` - logo_change 충격 착지 (9.3s 시작)
- `flashEffect` - 플래시 오버레이 (9.5s 시작)
- `screenShake` - 화면 흔들림 (9.5s 시작)

### JavaScript
**마우스 패럴랙스:**
- 각 레이어 depth 값으로 이동량 차등
  - bg-photo: 0.02
  - bg-change: 0.04
  - bg-two: 0.06
- 3D 회전: main-section에 perspective + rotateX/Y 적용 (최대 5도)
- 화면 흔들림 트리거: 9.5초 후 shake 클래스 추가/제거
- 흔들림 중 마우스 패럴랙스 비활성화 (isShaking 플래그)

**별빛 파티클:**
- 동적 생성: 5.5초 후 시작, setTimeout 재귀 호출
- 생성 빈도: 150ms → 15ms (점진적 증가, -3ms씩 감소)
- 파티클 크기: 12~24px 랜덤 (강화됨)
- 시작 위치: 화면 바깥 (-70vw~70vw, -70vh~70vh)
- 파티클 생성 중단: 9.5초
- 마지막 파티클 소멸: 11.3초 (생성 중단 + 애니메이션 1.8s)
- 6각 눈꽃 결정 모양 (CSS ::before, ::after + JS 세 번째 가지)
- 4레이어 글로우 효과 (drop-shadow 4개)
- 트레일(꼬리) 효과 (빨려들어가는 잔상)

**카메라 시스템:**
- 랜덤 A, B 지점 생성 (-0.3 ~ 0.3 범위)
- 카메라 무빙 타임라인:
  - 0s: A 위치에서 시작
  - 1s: A→B 이동 (0.8초)
  - 2.8s: B→A 이동 (0.5초)
  - 4s: A→B 이동 (0.5초)
  - 5.5s: 카메라 무빙 종료, 마우스 패럴랙스 활성화
- 핸드헬드 카메라 떨림 (sin/cos 조합)
- easeInOutCubic 이징 함수
