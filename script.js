document.addEventListener('DOMContentLoaded', function() {
    const scrollContainer = document.querySelector('.scroll-container');
    const sections = document.querySelectorAll('.snap-section');
    let currentSectionIndex = 0;
    let isScrolling = false;

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

    // 주기적으로 파티클 생성 (ambient - 느린 속도)
    function startAmbientSuction() {
        if (ambientInterval) return;

        ambientInterval = setInterval(() => {
            if (!isHovering) {
                const startPos = getRandomEdgePosition();
                createSuctionParticle(startPos, 2500 + Math.random() * 1500, 3 + Math.random() * 2);
            }
        }, 800);
    }

    function stopAmbientSuction() {
        if (ambientInterval) {
            clearInterval(ambientInterval);
            ambientInterval = null;
        }
    }

    // 호버 시 빠른 파티클 생성
    function startFastSuction() {
        isHovering = true;

        if (suctionInterval) clearInterval(suctionInterval);

        // 즉시 여러 파티클 생성
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const startPos = getRandomEdgePosition();
                createSuctionParticle(startPos, 600 + Math.random() * 400, 4 + Math.random() * 3);
            }, i * 50);
        }

        // 연속 생성
        suctionInterval = setInterval(() => {
            const startPos = getRandomEdgePosition();
            createSuctionParticle(startPos, 500 + Math.random() * 300, 4 + Math.random() * 3);
        }, 150);
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

    // 십자 스파크 생성
    function createSparkle() {
        const btnRect = communityBtn.getBoundingClientRect();
        const sectionRect = communitySection.getBoundingClientRect();

        // 버튼 주변 랜덤 위치 (버튼 가장자리 근처)
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 60;
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

        // 버튼 주변 랜덤 위치
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
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

        // 에너지 링 간격 (3~5초)
        function scheduleEnergyRing() {
            const delay = 3000 + Math.random() * 2000;
            energyRingInterval = setTimeout(() => {
                createEnergyRing();
                scheduleEnergyRing();
            }, delay);
        }
        scheduleEnergyRing();
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
    let logoAnimation = null;
    let currentParticleRate = 1;
    let currentLogoRate = 1;
    let particleRateTransition = null;
    let logoRateTransition = null;

    // 애니메이션 객체 수집
    function collectAnimations() {
        cParticles.forEach(particle => {
            const animations = particle.getAnimations();
            if (animations.length > 0) {
                particleAnimations.push(...animations);
            }
        });

        if (gameLogo) {
            const logoAnimations = gameLogo.getAnimations();
            if (logoAnimations.length > 0) {
                logoAnimation = logoAnimations[0];
            }
        }
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
        if (logoRateTransition) cancelAnimationFrame(logoRateTransition);

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
        if (logoRateTransition) cancelAnimationFrame(logoRateTransition);

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
    const magnetStrength = 0.3; // 끌림 강도 (0.1 ~ 0.5 권장)
    const magnetRange = 100; // 마그네틱 효과 범위 (px)

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
