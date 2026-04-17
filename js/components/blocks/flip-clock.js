const SIZE_CLASS = {
    sm: 'premium-countdown-size-sm',
    md: 'premium-countdown-size-md',
    lg: 'premium-countdown-size-lg',
};

function createDigitCard(target, value) {
    return `
        <div class="premium-flip-card" data-digit-target="${target}" data-current-digit="${value}">
            <div class="premium-flip-face premium-flip-face-top-bg">
                <span class="premium-digit-span premium-digit-top">${value}</span>
            </div>
            <div class="premium-flip-face premium-flip-face-bottom-bg">
                <span class="premium-digit-span premium-digit-bottom">${value}</span>
            </div>
            <div class="premium-flip-face premium-flip-face-top-flap">
                <span class="premium-digit-span premium-digit-top">${value}</span>
            </div>
            <div class="premium-flip-face premium-flip-face-bottom-flap">
                <span class="premium-digit-span premium-digit-bottom">${value}</span>
            </div>
            <div class="premium-flip-divider"></div>
        </div>
    `;
}

function buildMarkup(sizeClass) {
    return `
        <div class="premium-countdown ${sizeClass}" id="premium-countdown" aria-live="polite">
            <div class="premium-clock-unit">
                ${createDigitCard('days-tens', '4')}
                ${createDigitCard('days-ones', '5')}
                <span class="premium-clock-label">Days</span>
            </div>

            <span class="premium-clock-separator">:</span>

            <div class="premium-clock-unit">
                ${createDigitCard('hours-tens', '0')}
                ${createDigitCard('hours-ones', '0')}
                <span class="premium-clock-label">Hours</span>
            </div>

            <span class="premium-clock-separator">:</span>

            <div class="premium-clock-unit">
                ${createDigitCard('minutes-tens', '0')}
                ${createDigitCard('minutes-ones', '0')}
                <span class="premium-clock-label">Minutes</span>
            </div>

            <span class="premium-clock-separator">:</span>

            <div class="premium-clock-unit">
                ${createDigitCard('seconds-tens', '0')}
                ${createDigitCard('seconds-ones', '0')}
                <span class="premium-clock-label">Seconds</span>
            </div>
        </div>
    `;
}

export function mountFlipClock(root, { size = 'md', durationDays = 45, endDate = null } = {}) {
    if (!root) return;

    if (root.__premiumFlipClockInterval) {
        clearInterval(root.__premiumFlipClockInterval);
        root.__premiumFlipClockInterval = null;
    }

    const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md;
    root.innerHTML = buildMarkup(sizeClass);

    const countdownRoot = root.querySelector('#premium-countdown');
    if (!countdownRoot) return;

    const parsedEndDate = endDate ? new Date(endDate).getTime() : NaN;
    const endAt = Number.isFinite(parsedEndDate)
        ? parsedEndDate
        : Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const flipCards = {
        'days-tens': countdownRoot.querySelector('[data-digit-target="days-tens"]'),
        'days-ones': countdownRoot.querySelector('[data-digit-target="days-ones"]'),
        'hours-tens': countdownRoot.querySelector('[data-digit-target="hours-tens"]'),
        'hours-ones': countdownRoot.querySelector('[data-digit-target="hours-ones"]'),
        'minutes-tens': countdownRoot.querySelector('[data-digit-target="minutes-tens"]'),
        'minutes-ones': countdownRoot.querySelector('[data-digit-target="minutes-ones"]'),
        'seconds-tens': countdownRoot.querySelector('[data-digit-target="seconds-tens"]'),
        'seconds-ones': countdownRoot.querySelector('[data-digit-target="seconds-ones"]'),
    };

    const setDigit = (card, next) => {
        if (!card) return;
        const current = card.dataset.currentDigit || '0';
        if (current === next) return;

        const topBg = card.querySelector('.premium-flip-face-top-bg .premium-digit-span');
        const bottomBg = card.querySelector('.premium-flip-face-bottom-bg .premium-digit-span');
        const topFlap = card.querySelector('.premium-flip-face-top-flap .premium-digit-span');
        const bottomFlap = card.querySelector('.premium-flip-face-bottom-flap .premium-digit-span');
        const topFlapFace = card.querySelector('.premium-flip-face-top-flap');
        const bottomFlapFace = card.querySelector('.premium-flip-face-bottom-flap');

        if (!topBg || !bottomBg || !topFlap || !bottomFlap || !topFlapFace || !bottomFlapFace) return;

        topBg.textContent = next;
        bottomBg.textContent = next;
        topFlap.textContent = next;
        bottomFlap.textContent = next;

        topFlapFace.classList.remove('premium-animate-flip-top');
        bottomFlapFace.classList.remove('premium-animate-flip-bottom');
        card.dataset.currentDigit = next;
    };

    const tick = () => {
        const remaining = Math.max(0, endAt - Date.now());
        const totalSeconds = Math.floor(remaining / 1000);

        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const dayStr = String(Math.min(days, 99)).padStart(2, '0');
        const hourStr = String(hours).padStart(2, '0');
        const minuteStr = String(minutes).padStart(2, '0');
        const secondStr = String(seconds).padStart(2, '0');

        setDigit(flipCards['days-tens'], dayStr[0]);
        setDigit(flipCards['days-ones'], dayStr[1]);
        setDigit(flipCards['hours-tens'], hourStr[0]);
        setDigit(flipCards['hours-ones'], hourStr[1]);
        setDigit(flipCards['minutes-tens'], minuteStr[0]);
        setDigit(flipCards['minutes-ones'], minuteStr[1]);
        setDigit(flipCards['seconds-tens'], secondStr[0]);
        setDigit(flipCards['seconds-ones'], secondStr[1]);
    };

    tick();
    root.__premiumFlipClockInterval = setInterval(tick, 1000);
}
