document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.snap-section');
    let currentSectionIndex = 0;
    let isScrolling = false;

    // ========== 섹션 1: Pixi.js 동심원 물결 효과 (Gemini 검토 반영) ==========
    const pixiContainer = document.getElementById('pixi-ripple-container');
    const heroImage = document.querySelector('.hero-image');
    let pixiApp = null;
    let backgroundSprite = null;
    let displacementFilter = null;
    let displacementSprite = null;

    // Pixi.js 초기화
    let lastWidth = window.innerWidth; // 리사이즈 방어용 변수

    async function initPixiRipple() {
        if (!pixiContainer || !heroImage || typeof PIXI === 'undefined') {
            console.error("Pixi.js 로드 실패 또는 컨테이너 없음");
            return;
        }

        // [추가] GPU 메모리 절약을 위한 정밀도 조정 (아이폰 메모리 부족 방지)
        PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.MEDIUM;

        const containerRect = pixiContainer.parentElement.getBoundingClientRect();

        // [최적화] 모바일/PC 판단 (768px 기준)
        const isMobile = window.innerWidth <= 768;

        // [최적화] 해상도 제한 (모바일 1배 고정, 메모리 절약)
        const pixelRatio = 1;

        // Pixi Application 생성
        pixiApp = new PIXI.Application({
            width: containerRect.width,
            height: containerRect.height,
            backgroundAlpha: 0,
            resolution: pixelRatio,
            autoDensity: true,
            powerPreference: 'high-performance',
        });

        pixiContainer.appendChild(pixiApp.view);

        // 1. 배경 이미지 로드 (적응형: 모바일/PC 분기 + JPG 사용으로 용량 대폭 절감)
        const bgPath = isMobile ? 'resource/background_m.jpg' : 'resource/background.jpg';

        try {
            const bgTexture = await PIXI.Assets.load(bgPath);
            backgroundSprite = new PIXI.Sprite(bgTexture);
        } catch (error) {
            console.error("배경 이미지 로드 실패 (CORS 문제일 수 있음):", error);
            return;
        }

        // 배경 이미지를 화면에 맞게 조절 (cover 효과)
        fitBackground();

        pixiApp.stage.addChild(backgroundSprite);

        // 2. Displacement Map용 캔버스 생성 (동심원 그라데이션)
        const displacementCanvas = createDisplacementMap(512);
        const displacementTexture = PIXI.Texture.from(displacementCanvas);

        // 텍스처 래핑 모드 설정 (CLAMP: 한 지점에서만 동심원 퍼짐, REPEAT 시 바둑판 현상)
        displacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.CLAMP;

        displacementSprite = new PIXI.Sprite(displacementTexture);
        displacementSprite.anchor.set(0.5);
        displacementSprite.position.set(pixiApp.screen.width / 2, pixiApp.screen.height / 2);

        // [핵심 수정] 스프라이트는 스테이지에 있어야 하지만, 눈에 보일 필요는 없음
        // Gemini 제안: renderable=false 대신 alpha=0 사용 (더 안전한 방법)
        displacementSprite.alpha = 0;

        pixiApp.stage.addChild(displacementSprite);

        // 3. Displacement Filter 생성
        displacementFilter = new PIXI.DisplacementFilter(displacementSprite);

        // 필터 영역 여백 설정 (파동이 화면 끝에서 잘리지 않게)
        displacementFilter.padding = 100;

        // 초기에는 왜곡 없게 설정
        displacementFilter.scale.set(0);

        backgroundSprite.filters = [displacementFilter];

        // [최적화] 리사이즈 이벤트 방어 코드 (카톡 인앱 브라우저 튕김 방지)
        // 가로 폭이 변할 때만 리사이즈, 세로만 변할 때(주소창 움직임)는 무시
        window.addEventListener('resize', () => {
            if (window.innerWidth === lastWidth) return; // 가로 폭 변경 없으면 무시

            lastWidth = window.innerWidth;

            const parent = pixiContainer.parentElement;
            if (parent && pixiApp) {
                const rect = parent.getBoundingClientRect();
                pixiApp.renderer.resize(rect.width, rect.height);
                fitBackground();
                if (displacementSprite) {
                    displacementSprite.position.set(rect.width / 2, rect.height / 2);
                }
            }
        });

        // 기존 이미지 숨기고 Pixi 캔버스 보이기
        heroImage.style.opacity = '0';
        pixiContainer.style.opacity = '1';

        // 로고 등장 시점에 맞춰 물결 효과 시작 (Pixi 초기화 후 바로)
        setTimeout(() => {
            triggerRippleEffect();
        }, 100);
    }

    // 배경 이미지를 화면에 맞추기 (cover 효과)
    function fitBackground() {
        if (!backgroundSprite || !pixiApp) return;

        const ratio = Math.max(
            pixiApp.screen.width / backgroundSprite.texture.width,
            pixiApp.screen.height / backgroundSprite.texture.height
        );
        backgroundSprite.scale.set(ratio);
        backgroundSprite.anchor.set(0.5);
        backgroundSprite.position.set(pixiApp.screen.width / 2, pixiApp.screen.height / 2);
    }

    // 동심원 형태의 Displacement Map 생성
    function createDisplacementMap(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = size / 2;

        // 128(0x80)이 중립(이동 없음)
        // 밝으면 한쪽으로, 어두우면 반대쪽으로 픽셀을 밈
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2);
        gradient.addColorStop(0, 'rgba(128, 128, 128, 1)');   // 중앙: 평평
        gradient.addColorStop(0.3, 'rgba(200, 200, 200, 1)'); // 볼록 (밝음)
        gradient.addColorStop(0.5, 'rgba(128, 128, 128, 1)'); // 평평
        gradient.addColorStop(0.7, 'rgba(50, 50, 50, 1)');    // 오목 (어두움)
        gradient.addColorStop(1, 'rgba(128, 128, 128, 1)');   // 가장자리: 평평

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        return canvas;
    }

    // 물결 효과 트리거
    function triggerRippleEffect() {
        if (!displacementSprite || !displacementFilter) {
            return;
        }

        // 파동 시작 위치 (화면 중앙)
        displacementSprite.position.set(pixiApp.screen.width / 2, pixiApp.screen.height / 2);

        const duration = 2000; // 2초 동안 지속
        const startTime = performance.now();

        // 파동의 크기 (Sprite scale)
        const startScale = 0.1;
        const endScale = 4.0; // 화면을 덮을 정도로 커짐

        // 왜곡의 강도 (Filter scale) - 값이 클수록 물결이 심하게 일렁임
        // Gemini 제안: 효과가 약하면 150~500까지 증가 가능
        const maxFilterStrength = 150;

        function animate() {
            const now = performance.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Ease-out 효과 (빠르게 시작해서 천천히 끝남)
            const ease = 1 - Math.pow(1 - progress, 3);

            // 1. 파동의 크기를 점점 키움
            const currentScale = startScale + (endScale - startScale) * ease;
            displacementSprite.scale.set(currentScale);

            // 2. 왜곡 강도는 점점 줄어듦 (파동이 퍼지면서 약해짐)
            const strength = maxFilterStrength * (1 - ease);
            displacementFilter.scale.set(strength);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 종료 시 왜곡 제거
                displacementFilter.scale.set(0);
            }
        }

        animate();
    }

    // 로고 등장 시점 (2.8초)에 맞춰 Pixi 초기화
    setTimeout(() => {
        initPixiRipple();
    }, 2800);

    function scrollToSection(index) {
        if (index >= 0 && index < sections.length) {
            sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
            currentSectionIndex = index;
        }
    }

    let scrollTimeout;
    if (scrollContainer) {
        scrollContainer.addEventListener('wheel', function(e) {
            if (isScrolling) return;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const delta = e.deltaY;

                if (delta > 0 && currentSectionIndex < sections.length - 1) {
                    isScrolling = true;
                    scrollToSection(currentSectionIndex + 1);
                    setTimeout(() => { isScrolling = false; }, 1000);
                } else if (delta < 0 && currentSectionIndex > 0) {
                    isScrolling = true;
                    scrollToSection(currentSectionIndex - 1);
                    setTimeout(() => { isScrolling = false; }, 1000);
                }
            }, 50);
        }, { passive: true });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionIndex = Array.from(sections).indexOf(entry.target);
                if (sectionIndex !== -1) {
                    currentSectionIndex = sectionIndex;
                }
            }
        });
    }, {
        threshold: 0.5
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // ========== 파티클 흡입 시스템 ==========
    const communitySection = document.getElementById('community');
    const communityBtn = document.querySelector('.community-btn');

    if (!communitySection || !communityBtn) return;

    let isHovering = false;
    let suctionInterval = null;
    let ambientInterval = null;

    // 버튼 중앙 위치 계산
    function getButtonCenter() {
        const rect = communityBtn.getBoundingClientRect();
        const sectionRect = communitySection.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2 - sectionRect.left,
            y: rect.top + rect.height / 2 - sectionRect.top
        };
    }

    // 랜덤 시작 위치 (화면 가장자리에서)
    function getRandomEdgePosition() {
        const sectionRect = communitySection.getBoundingClientRect();
        const edge = Math.floor(Math.random() * 4); // 0: 상, 1: 우, 2: 하, 3: 좌

        let x, y;
        const margin = 50;

        switch(edge) {
            case 0: // 상단
                x = Math.random() * sectionRect.width;
                y = -margin;
                break;
            case 1: // 우측
                x = sectionRect.width + margin;
                y = Math.random() * sectionRect.height;
                break;
            case 2: // 하단
                x = Math.random() * sectionRect.width;
                y = sectionRect.height + margin;
                break;
            case 3: // 좌측
                x = -margin;
                y = Math.random() * sectionRect.height;
                break;
        }

        return { x, y };
    }

    // 화면 내 랜덤 위치
    function getRandomInnerPosition() {
        const sectionRect = communitySection.getBoundingClientRect();
        return {
            x: Math.random() * sectionRect.width,
            y: Math.random() * sectionRect.height
        };
    }

    // 색상 보간 함수 (orange -> green)
    function lerpColor(progress) {
        // 시작: orange (255, 170, 100)
        // 끝: naver green (3, 199, 90)
        const startR = 255, startG = 170, startB = 100;
        const endR = 3, endG = 199, endB = 90;

        const r = Math.round(startR + (endR - startR) * progress);
        const g = Math.round(startG + (endG - startG) * progress);
        const b = Math.round(startB + (endB - startB) * progress);

        return { r, g, b };
    }

    // 파티클 생성 및 애니메이션
    function createSuctionParticle(startPos, speed, size) {
        const particle = document.createElement('div');
        particle.className = 'suction-particle';

        // 랜덤 크기 변화
        const particleSize = size || (3 + Math.random() * 3);
        particle.style.width = particleSize + 'px';
        particle.style.height = particleSize + 'px';

        particle.style.left = startPos.x + 'px';
        particle.style.top = startPos.y + 'px';
        particle.style.opacity = '0';

        communitySection.appendChild(particle);

        const targetPos = getButtonCenter();
        const duration = speed || (1500 + Math.random() * 1000);

        // 곡선 경로를 위한 컨트롤 포인트
        const midX = (startPos.x + targetPos.x) / 2 + (Math.random() - 0.5) * 200;
        const midY = (startPos.y + targetPos.y) / 2 + (Math.random() - 0.5) * 100;

        const startTime = performance.now();

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-in 효과 (가속)
            const easeProgress = progress * progress * progress;

            // 베지어 곡선 계산
            const t = easeProgress;
            const x = (1-t)*(1-t)*startPos.x + 2*(1-t)*t*midX + t*t*targetPos.x;
            const y = (1-t)*(1-t)*startPos.y + 2*(1-t)*t*midY + t*t*targetPos.y;

            // 크기 감소 (마지막에 빨려들어가는 느낌)
            const scale = 1 - (easeProgress * 0.7);

            // opacity: 처음에 서서히 나타나고, 끝에서 사라짐
            let opacity;
            if (progress < 0.1) {
                opacity = progress * 10;
            } else if (progress > 0.85) {
                opacity = (1 - progress) / 0.15;
            } else {
                opacity = 1;
            }

            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.transform = `scale(${scale})`;
            particle.style.opacity = opacity;

            // 50% 이후부터 색상 변화 시작 (orange -> green)
            const colorProgress = progress > 0.5 ? (progress - 0.5) / 0.5 : 0;
            const color = lerpColor(colorProgress);

            particle.style.background = `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;

            // 가까워질수록 밝아지고 녹색 글로우
            if (progress > 0.6) {
                const glowIntensity = (progress - 0.6) / 0.4;
                const glowColor = lerpColor(glowIntensity);
                particle.style.boxShadow = `0 0 ${6 + glowIntensity * 12}px rgba(${glowColor.r}, ${glowColor.g}, ${glowColor.b}, ${0.6 + glowIntensity * 0.4})`;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        }

        requestAnimationFrame(animate);
    }

    // 주기적으로 파티클 생성 (ambient - 기존 호버 수준으로 상향)
    function startAmbientSuction() {
        if (ambientInterval) return;

        ambientInterval = setInterval(() => {
            if (!isHovering) {
                const startPos = getRandomEdgePosition();
                createSuctionParticle(startPos, 600 + Math.random() * 400, 4 + Math.random() * 3);
            }
        }, 150);
    }

    function stopAmbientSuction() {
        if (ambientInterval) {
            clearInterval(ambientInterval);
            ambientInterval = null;
        }
    }

    // 호버 시 과격한 파티클 폭풍
    function startFastSuction() {
        isHovering = true;

        if (suctionInterval) clearInterval(suctionInterval);

        // 즉시 폭발적으로 파티클 생성 (20개)
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                const startPos = getRandomEdgePosition();
                createSuctionParticle(startPos, 250 + Math.random() * 200, 5 + Math.random() * 4);
            }, i * 20);
        }

        // 연속 생성 (매우 빠름 - 50ms 간격, 한번에 2개씩)
        suctionInterval = setInterval(() => {
            for (let i = 0; i < 2; i++) {
                const startPos = getRandomEdgePosition();
                createSuctionParticle(startPos, 200 + Math.random() * 150, 5 + Math.random() * 4);
            }
        }, 50);
    }

    function stopFastSuction() {
        isHovering = false;

        if (suctionInterval) {
            clearInterval(suctionInterval);
            suctionInterval = null;
        }
    }

    // ========== 버튼 스파크/별 효과 시스템 ==========
    let sparkleInterval = null;
    let energyRingInterval = null;

    // 모바일 감지
    const isMobile = window.innerWidth <= 768;

    // 십자 스파크 생성
    function createSparkle() {
        const btnRect = communityBtn.getBoundingClientRect();
        const sectionRect = communitySection.getBoundingClientRect();

        // 버튼 주변 랜덤 위치 (모바일에서는 더 가깝게)
        const angle = Math.random() * Math.PI * 2;
        const baseDistance = isMobile ? 40 : 80;
        const randomRange = isMobile ? 30 : 60;
        const distance = baseDistance + Math.random() * randomRange;
        const x = (btnRect.left + btnRect.width / 2 - sectionRect.left) + Math.cos(angle) * distance;
        const y = (btnRect.top + btnRect.height / 2 - sectionRect.top) + Math.sin(angle) * distance;

        const sparkle = document.createElement('div');
        sparkle.className = 'btn-sparkle';

        // 랜덤 크기
        const size = 6 + Math.random() * 8;
        sparkle.style.width = size + 'px';
        sparkle.style.height = size + 'px';
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';

        communitySection.appendChild(sparkle);

        // 애니메이션 시작
        requestAnimationFrame(() => {
            sparkle.classList.add('active');
        });

        // 제거
        setTimeout(() => {
            sparkle.remove();
        }, 600);
    }

    // 원형 글로우 스파크 생성
    function createGlowSpark() {
        const btnRect = communityBtn.getBoundingClientRect();
        const sectionRect = communitySection.getBoundingClientRect();

        // 버튼 주변 랜덤 위치 (모바일에서는 더 가깝게)
        const angle = Math.random() * Math.PI * 2;
        const baseDistance = isMobile ? 30 : 50;
        const randomRange = isMobile ? 50 : 100;
        const distance = baseDistance + Math.random() * randomRange;
        const x = (btnRect.left + btnRect.width / 2 - sectionRect.left) + Math.cos(angle) * distance;
        const y = (btnRect.top + btnRect.height / 2 - sectionRect.top) + Math.sin(angle) * distance;

        const spark = document.createElement('div');
        spark.className = 'btn-glow-spark';

        const size = 4 + Math.random() * 6;
        spark.style.width = size + 'px';
        spark.style.height = size + 'px';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';

        communitySection.appendChild(spark);

        requestAnimationFrame(() => {
            spark.classList.add('active');
        });

        setTimeout(() => {
            spark.remove();
        }, 800);
    }

    // 에너지 링 생성
    function createEnergyRing() {
        // 버튼 내부에 링 추가
        const ring = document.createElement('div');
        ring.className = 'btn-energy-ring';
        communityBtn.appendChild(ring);

        requestAnimationFrame(() => {
            ring.classList.add('pulse');
        });

        setTimeout(() => {
            ring.remove();
        }, 1500);
    }

    function startSparkleEffect() {
        if (sparkleInterval) return;

        // 랜덤 간격으로 스파크 효과 생성
        function scheduleNextSparkle() {
            const delay = 800 + Math.random() * 1500;
            sparkleInterval = setTimeout(() => {
                // 랜덤하게 십자 스파크 또는 글로우 스파크 생성
                if (Math.random() < 0.6) {
                    createSparkle();
                } else {
                    createGlowSpark();
                }

                // 가끔 연속 스파크 (30% 확률)
                if (Math.random() < 0.3) {
                    setTimeout(() => {
                        createGlowSpark();
                    }, 150);
                }

                scheduleNextSparkle();
            }, delay);
        }
        scheduleNextSparkle();

        // 첫 에너지 링은 0.3~0.5초 후 즉시 발생
        setTimeout(() => {
            createEnergyRing();
        }, 300 + Math.random() * 200);

        // 이후 에너지 링 간격 (3~5초)
        function scheduleEnergyRing() {
            const delay = 3000 + Math.random() * 2000;
            energyRingInterval = setTimeout(() => {
                createEnergyRing();
                scheduleEnergyRing();
            }, delay);
        }
        // 첫 링 후 3~5초 뒤부터 반복
        setTimeout(() => {
            scheduleEnergyRing();
        }, 500);
    }

    function stopSparkleEffect() {
        if (sparkleInterval) {
            clearTimeout(sparkleInterval);
            sparkleInterval = null;
        }
        if (energyRingInterval) {
            clearTimeout(energyRingInterval);
            energyRingInterval = null;
        }
    }

    // ========== 호버 시 파티클 속도 증가 및 로고 글로우 속도 증가 ==========
    const cParticles = document.querySelectorAll('.c-particle');
    const gameLogo = document.querySelector('.game-logo');

    // Web Animations API로 파티클 애니메이션 속도 제어
    let particleAnimations = [];
    let currentParticleRate = 1;
    let particleRateTransition = null;

    // 애니메이션 객체 수집
    function collectAnimations() {
        cParticles.forEach(particle => {
            const animations = particle.getAnimations();
            if (animations.length > 0) {
                particleAnimations.push(...animations);
            }
        });

    }

    // 부드러운 속도 전환 함수
    function smoothTransition(getCurrentRate, setRate, targetRate, duration, onComplete) {
        const startRate = getCurrentRate();
        const startTime = performance.now();

        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out 곡선
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const newRate = startRate + (targetRate - startRate) * easeProgress;

            setRate(newRate);

            if (progress < 1) {
                return requestAnimationFrame(step);
            } else if (onComplete) {
                onComplete();
            }
            return null;
        }

        return requestAnimationFrame(step);
    }

    function speedUpEffects() {
        if (particleAnimations.length === 0) {
            collectAnimations();
        }

        // 기존 트랜지션 취소
        if (particleRateTransition) cancelAnimationFrame(particleRateTransition);

        // 파티클 속도 증가 (빠르게 전환: 300ms)
        particleRateTransition = smoothTransition(
            () => currentParticleRate,
            (rate) => {
                currentParticleRate = rate;
                particleAnimations.forEach(anim => {
                    if (anim.playState === 'running') {
                        anim.playbackRate = rate;
                    }
                });
            },
            4, // 4배속
            300
        );

        // 로고 글로우 속도 증가 + 색상 변경
        if (gameLogo) {
            gameLogo.classList.add('glow-fast');
        }
    }

    function resetEffects() {
        // 기존 트랜지션 취소
        if (particleRateTransition) cancelAnimationFrame(particleRateTransition);

        // 파티클 속도 원복 (천천히 전환: 1500ms)
        particleRateTransition = smoothTransition(
            () => currentParticleRate,
            (rate) => {
                currentParticleRate = rate;
                particleAnimations.forEach(anim => {
                    if (anim.playState === 'running') {
                        anim.playbackRate = rate;
                    }
                });
            },
            1, // 1배속 (원래 속도)
            1500
        );

        // 로고 글로우 색상 원복
        if (gameLogo) {
            gameLogo.classList.remove('glow-fast');
        }
    }

    // ========== 4. 마그네틱 커서 효과 ==========
    let btnRect = communityBtn.getBoundingClientRect();
    const magnetStrength = 0.3; // 끌림 강도 (0.1 ~ 0.5 권장) - 고정
    const magnetRange = 1200; // 마그네틱 효과 범위 (px) - 초광역

    // 버튼 위치 업데이트 (스크롤/리사이즈 시)
    function updateBtnRect() {
        btnRect = communityBtn.getBoundingClientRect();
    }

    // 마그네틱 효과 적용
    function applyMagneticEffect(e) {
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;

        const deltaX = e.clientX - btnCenterX;
        const deltaY = e.clientY - btnCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 버튼 위에 있거나 근처에 있을 때만 효과 적용
        if (distance < magnetRange + btnRect.width / 2) {
            const moveX = deltaX * magnetStrength;
            const moveY = deltaY * magnetStrength;

            communityBtn.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    }

    // 마그네틱 효과 리셋
    function resetMagneticEffect() {
        communityBtn.style.transform = '';
    }

    // 이벤트 리스너
    communityBtn.addEventListener('mouseenter', () => {
        startFastSuction();
        speedUpEffects();
        updateBtnRect();
    });

    communityBtn.addEventListener('mousemove', (e) => {
        applyMagneticEffect(e);
    });

    communityBtn.addEventListener('mouseleave', () => {
        stopFastSuction();
        resetEffects();
        resetMagneticEffect();
    });

    // 스크롤/리사이즈 시 버튼 위치 업데이트
    window.addEventListener('scroll', updateBtnRect, { passive: true });
    window.addEventListener('resize', updateBtnRect, { passive: true });

    // 섹션이 보일 때만 ambient 파티클 및 스파크 효과 생성
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startAmbientSuction();
                startSparkleEffect();
            } else {
                stopAmbientSuction();
                stopFastSuction();
                stopSparkleEffect();
                resetEffects();
            }
        });
    }, { threshold: 0.3 });

    sectionObserver.observe(communitySection);
});
