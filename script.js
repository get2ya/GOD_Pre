// 마우스 패럴랙스 효과
(function() {
    // 레이어 요소들
    const bgPhoto = document.querySelector('.bg-photo');
    const bgChange = document.querySelector('.bg-change');
    const bgTwo = document.querySelector('.bg-two');
    const mainSection = document.querySelector('.main-section');
    const flashOverlay = document.querySelector('.flash-overlay');

    // 각 레이어의 이동 강도 (깊이에 따라 다름)
    const layers = [
        { el: bgPhoto, depth: 0.02 },    // 배경: 가장 느리게
        { el: bgChange, depth: 0.04 },   // big_change: 중간
        { el: bgTwo, depth: 0.06 }       // big_2: 가장 빠르게
    ];

    // 3D 회전 강도 (각도)
    const rotateIntensity = 5; // 최대 회전 각도 (도)

    // 상태 관리
    let isShaking = false;

    // 씬 업데이트 함수
    function updateScene(x, y) {
        // 각 레이어에 translate 적용
        layers.forEach(function(layer) {
            if (!layer.el) return;
            const moveX = x * layer.depth * 1000;
            const moveY = y * layer.depth * 1000;
            layer.el.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
        });

        // 전체 씬에 3D 회전 적용
        if (mainSection && !isShaking) {
            const rotateY = x * rotateIntensity;
            const rotateX = -y * rotateIntensity;
            mainSection.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        }
    }

    // 마우스 이동 이벤트
    document.addEventListener('mousemove', function(e) {
        if (isShaking) return;

        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        updateScene(x, y);
    });

    // 마우스가 화면을 벗어나면 원위치
    document.addEventListener('mouseleave', function() {
        if (isShaking) return;
        updateScene(0, 0);
    });

    // logo_change 착지 완료 시점에 플래시 + 흔들림 동시 트리거
    // 배경인트로(3.5s) + 로고Base(5.8s) + 로고Change착지(0.4s) = 9.7s
    setTimeout(function() {
        // 플래시 강제 트리거
        if (flashOverlay) {
            flashOverlay.style.animation = 'none';
            flashOverlay.offsetHeight; // 리플로우 강제
            flashOverlay.style.animation = 'flashEffect 0.4s ease-out forwards';
        }

        // 화면 흔들림 트리거
        if (mainSection) {
            isShaking = true;
            mainSection.classList.add('shake');

            setTimeout(function() {
                mainSection.classList.remove('shake');
                isShaking = false;
                mainSection.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            }, 500);
        }
    }, 9700);
})();

// ========== 별빛 파티클 시스템 ==========
(function() {
    const container = document.querySelector('.snowflake-container');
    const logoChange = document.querySelector('.logo-overlay');

    if (!container) return;

    // 파티클 생성 함수 (6각 눈꽃 결정 + 트레일)
    function createSnowflake() {
        const snowflake = document.createElement('span');
        snowflake.className = 'snowflake';

        // 세 번째 가지 추가 (120도 회전)
        const thirdBranch = document.createElement('span');
        thirdBranch.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 2px;
            height: 100%;
            background: linear-gradient(to bottom,
                transparent 0%,
                rgba(255, 255, 255, 1) 20%,
                rgba(200, 230, 255, 1) 50%,
                rgba(255, 255, 255, 1) 80%,
                transparent 100%);
            transform: translate(-50%, -50%) rotate(120deg);
        `;
        snowflake.appendChild(thirdBranch);

        // 트레일(꼬리) 효과 추가
        const trail = document.createElement('span');
        trail.className = 'trail';
        snowflake.appendChild(trail);

        // 랜덤 시작 위치 (화면 바깥쪽 테두리 영역에서만 생성)
        // 중앙 영역(-50~50)을 피하고 바깥쪽(50~80, -80~-50)에서만 생성
        const angle = Math.random() * Math.PI * 2; // 0 ~ 2π 랜덤 각도
        const distance = 60 + Math.random() * 30; // 60~90 범위 (바깥쪽)
        const startX = Math.cos(angle) * distance;
        const startY = Math.sin(angle) * distance;

        snowflake.style.setProperty('--start-x', startX + 'vw');
        snowflake.style.setProperty('--start-y', startY + 'vh');

        // 랜덤 크기 변화 (12~24px) - 더 큰 파티클
        const size = 12 + Math.random() * 12;
        snowflake.style.width = size + 'px';
        snowflake.style.height = size + 'px';

        // 랜덤 회전 (눈꽃마다 다른 각도)
        const rotation = Math.random() * 60;
        snowflake.style.setProperty('--rotation', rotation + 'deg');

        container.appendChild(snowflake);

        // 애니메이션 끝나면 제거
        snowflake.addEventListener('animationend', function() {
            snowflake.remove();
        });
    }

    // 3.5초 후 파티클 생성 시작 (배경인트로 종료 후)
    setTimeout(function() {
        let interval = 150; // 초기 생성 간격 (ms) - 더 빠르게 시작
        let particleSpawner = null;

        function spawnParticle() {
            // 한 번에 2~3개씩 생성 (더 많은 별빛)
            const count = 2 + Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                createSnowflake();
            }

            // 점점 빈도 증가 (에너지 모으는 느낌) - 최소 15ms까지
            interval = Math.max(15, interval - 3);

            particleSpawner = setTimeout(spawnParticle, interval);
        }

        spawnParticle();

        // 파티클 생성 중단: 로고 착지(9.3s) - 애니메이션시간(1.8s) - 시작시점(3.5s) = 4s
        // 마지막 파티클이 로고 착지 전에 도착하도록 3.5초간만 생성
        setTimeout(function() {
            if (particleSpawner) {
                clearTimeout(particleSpawner);
            }
        }, 3500); // 3.5초간 파티클 생성 (7s에 중단, 8.8s에 마지막 도착)
    }, 3500);
})();

// ========== 불꽃 파티클 시스템 (무한 루프) ==========
(function() {
    const container = document.querySelector('.flame-container');
    if (!container) return;

    // 불꽃 색상 팔레트 (주황~빨강~노랑)
    const flameColors = [
        { inner: 'rgba(255, 200, 50, 1)', outer: 'rgba(255, 100, 0, 0.8)' },    // 노랑→주황
        { inner: 'rgba(255, 150, 50, 1)', outer: 'rgba(255, 50, 0, 0.8)' },     // 주황→빨강
        { inner: 'rgba(255, 100, 30, 1)', outer: 'rgba(200, 30, 0, 0.7)' },     // 주황빨강
        { inner: 'rgba(255, 220, 100, 1)', outer: 'rgba(255, 150, 50, 0.8)' },  // 밝은 노랑
        { inner: 'rgba(255, 80, 20, 1)', outer: 'rgba(180, 20, 0, 0.6)' }       // 진한 빨강
    ];

    // 불꽃 파티클 생성
    function createFlameParticle() {
        const flame = document.createElement('div');
        flame.className = 'flame-particle';

        // 랜덤 색상 선택
        const color = flameColors[Math.floor(Math.random() * flameColors.length)];

        // 랜덤 크기 (8~20px)
        const size = 8 + Math.random() * 12;
        flame.style.width = size + 'px';
        flame.style.height = size * 1.3 + 'px';

        // 로고 하단 좌우에서 생성 (중앙 60% 영역)
        const startX = (Math.random() - 0.5) * 60; // -30% ~ 30%
        flame.style.left = (50 + startX) + '%';
        flame.style.bottom = '5%';

        // 랜덤 X 드리프트 (바람에 흔들리는 느낌)
        const driftX = (Math.random() - 0.5) * 20; // -10px ~ 10px

        // CSS 변수 설정
        flame.style.setProperty('--start-x', '0px');
        flame.style.setProperty('--drift-x', driftX + 'px');
        flame.style.setProperty('--duration', (1 + Math.random() * 0.8) + 's');
        flame.style.setProperty('--delay', (Math.random() * 0.3) + 's');

        // 그라데이션 배경 + 글로우
        flame.style.background = 'radial-gradient(ellipse at center bottom, ' +
            color.inner + ' 0%, ' +
            color.outer + ' 50%, ' +
            'transparent 70%)';
        flame.style.boxShadow = '0 0 ' + (size * 0.5) + 'px ' + color.outer + ', ' +
                                '0 0 ' + (size) + 'px ' + color.outer;

        container.appendChild(flame);

        // 일정 시간 후 제거 (메모리 관리)
        setTimeout(function() {
            flame.remove();
        }, 2500);
    }

    // 4.3초 후 불꽃 생성 시작 (logo_base 페이드인과 동시)
    setTimeout(function() {
        // 무한 루프로 불꽃 생성
        setInterval(function() {
            // 한 번에 2~4개 생성
            const count = 2 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                createFlameParticle();
            }
        }, 80); // 80ms마다 생성
    }, 4300);
})();
