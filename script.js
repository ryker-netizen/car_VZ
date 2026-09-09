const video = document.getElementById('myVideo');
const canvas = document.getElementById('chromaCanvas');
const ctx = canvas.getContext('2d', {
    willReadFrequently: true
});

const weatherDiv = document.getElementById('weather-info');


// ============================================================
// НАСТРОЙКИ
// ============================================================

const LEAF_PROTECTION = {
    x: 0.67,
    y: 0.67,
    width: 0.13,
    height: 0.13
};

const SPILL_STRENGTH = 0.55;

let videoReady = false;


// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, x) {

    x = clamp(
        (x - edge0) / (edge1 - edge0),
        0,
        1
    );

    return x * x * (3 - 2 * x);
}


// ============================================================
// СЕЗОН
// ============================================================

function getSeason(month) {

    if (month === 11 || month === 0 || month === 1) {
        return 'winter';
    }

    if (month >= 2 && month <= 4) {
        return 'spring';
    }

    if (month >= 5 && month <= 7) {
        return 'summer';
    }

    return 'autumn';
}


// ============================================================
// ВРЕМЯ СУТОК
// ============================================================

function getDayPhase(date) {

    const hour =
        date.getHours() +
        date.getMinutes() / 60;

    if (hour >= 6 && hour < 9) {
        return 'morning';
    }

    if (hour >= 9 && hour < 17) {
        return 'day';
    }

    if (hour >= 17 && hour < 21) {
        return 'evening';
    }

    return 'night';
}


// ============================================================
// РАЗМЕР CANVAS
// ============================================================

function resizeCanvas() {

    if (
        video.videoWidth > 0 &&
        video.videoHeight > 0
    ) {

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
}


// ============================================================
// ЗАЩИТА ЛИСТКА
// ============================================================

function isProtectedLeaf(x, y) {

    const px =
        canvas.width *
        LEAF_PROTECTION.x;

    const py =
        canvas.height *
        LEAF_PROTECTION.y;

    const pw =
        canvas.width *
        LEAF_PROTECTION.width;

    const ph =
        canvas.height *
        LEAF_PROTECTION.height;

    return (
        x >= px &&
        x <= px + pw &&
        y >= py &&
        y <= py + ph
    );
}


// ============================================================
// ФОН
// ============================================================

function drawBackground(time) {

    const date = new Date();

    const season =
        getSeason(date.getMonth());

    const phase =
        getDayPhase(date);

    const w = canvas.width;
    const h = canvas.height;


    // --------------------------------------------------------
    // НЕБО
    // --------------------------------------------------------

    let top;
    let bottom;

    if (phase === 'night') {

        top = '#02030a';
        bottom = '#101525';

    } else if (phase === 'evening') {

        top = '#24152b';
        bottom = '#704b55';

    } else if (phase === 'morning') {

        top = '#263444';
        bottom = '#b47763';

    } else {

        top = '#516878';
        bottom = '#b5c0bd';
    }


    const sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            h
        );

    sky.addColorStop(0, top);
    sky.addColorStop(1, bottom);

    ctx.fillStyle = sky;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    // --------------------------------------------------------
    // ЗВЁЗДЫ
    // --------------------------------------------------------

    if (phase === 'night') {

        for (let i = 0; i < 90; i++) {

            const x =
                ((i * 137.5) % 100) *
                w / 100;

            const y =
                ((i * 73.1) % 45) *
                h / 100;

            const twinkle =
                0.35 +
                Math.sin(
                    time * 0.001 + i
                ) * 0.25;

            ctx.fillStyle =
                `rgba(255,255,255,${twinkle})`;

            ctx.fillRect(
                x,
                y,
                2,
                2
            );
        }


        // Луна

        ctx.beginPath();

        ctx.arc(
            w * 0.82,
            h * 0.16,
            Math.min(w, h) * 0.045,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            '#e7e4cf';

        ctx.fill();
    }


    // --------------------------------------------------------
    // ГОРОД
    // --------------------------------------------------------

    const horizon =
        h * 0.48;


    for (let i = 0; i < 18; i++) {

        const bw =
            w * (
                0.025 +
                ((i * 17) % 5) * 0.008
            );

        const bh =
            h * (
                0.08 +
                ((i * 29) % 8) * 0.018
            );

        const x =
            (i / 18) * w;

        const y =
            horizon - bh;


        ctx.fillStyle =
            phase === 'night'
                ? '#080b12'
                : '#353a3d';

        ctx.fillRect(
            x,
            y,
            bw,
            bh
        );


        // Окна

        if (phase === 'night') {

            for (
                let wy = y + 10;
                wy < horizon - 5;
                wy += 13
            ) {

                ctx.fillStyle =
                    ((i + Math.floor(wy)) % 3 === 0)
                        ? '#c7a95b'
                        : '#252a31';

                ctx.fillRect(
                    x + 5,
                    wy,
                    4,
                    5
                );
            }
        }
    }


    // --------------------------------------------------------
    // ЗЕМЛЯ
    // --------------------------------------------------------

    if (season === 'winter') {

        ctx.fillStyle =
            '#c7cbd0';

    } else if (season === 'autumn') {

        ctx.fillStyle =
            '#39382e';

    } else if (season === 'spring') {

        ctx.fillStyle =
            '#303e31';

    } else {

        ctx.fillStyle =
            '#263629';
    }

    ctx.fillRect(
        0,
        horizon,
        w,
        h - horizon
    );


    // --------------------------------------------------------
    // ДЕРЕВЬЯ
    // --------------------------------------------------------

    for (let i = 0; i < 14; i++) {

        const x =
            (i / 14) * w +
            Math.sin(i * 8.3) * 15;

        const treeHeight =
            h * (
                0.16 +
                ((i * 19) % 7) * 0.015
            );

        const baseY =
            horizon + h * 0.05;

        const trunkWidth =
            Math.max(
                5,
                w * 0.008
            );


        // Ствол

        ctx.fillStyle =
            '#2a211d';

        ctx.fillRect(
            x,
            baseY - treeHeight,
            trunkWidth,
            treeHeight
        );


        // Крона

        if (season === 'winter') {

            ctx.fillStyle =
                '#5d6565';

        } else if (season === 'autumn') {

            ctx.fillStyle =
                i % 2 === 0
                    ? '#62502d'
                    : '#713f28';

        } else if (season === 'spring') {

            ctx.fillStyle =
                '#536b49';

        } else {

            ctx.fillStyle =
                '#304a35';
        }


        ctx.beginPath();

        ctx.arc(
            x + trunkWidth / 2,
            baseY - treeHeight,
            h * 0.055,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    // --------------------------------------------------------
    // СНЕГ
    // --------------------------------------------------------

    if (
        season === 'winter'
    ) {

        ctx.fillStyle =
            'rgba(255,255,255,0.35)';

        ctx.fillRect(
            0,
            horizon,
            w,
            h * 0.02
        );
    }
}


// ============================================================
// ХРОМАКЕЙ
// ============================================================

function processVideoFrame() {

    const width =
        canvas.width;

    const height =
        canvas.height;


    const frame =
        ctx.getImageData(
            0,
            0,
            width,
            height
        );


    const data =
        frame.data;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const pixelIndex =
            i / 4;

        const x =
            pixelIndex % width;

        const y =
            Math.floor(
                pixelIndex / width
            );


        const r =
            data[i];

        const g =
            data[i + 1];

        const b =
            data[i + 2];


        // ----------------------------------------------------
        // ЛИСТОК
        // ----------------------------------------------------

        if (
            isProtectedLeaf(x, y)
        ) {
            continue;
        }


        // ----------------------------------------------------
        // GREEN SCORE
        // ----------------------------------------------------

        const max =
            Math.max(r, g, b);

        const min =
            Math.min(r, g, b);

        const saturation =
            max === 0
                ? 0
                : (max - min) / max;

        const greenDominance =
            g - Math.max(r, b);


        const greenScore =
            clamp(
                (
                    greenDominance - 18
                ) / 100,
                0,
                1
            ) *
            clamp(
                (
                    saturation - 0.12
                ) / 0.55,
                0,
                1
            );


        // ----------------------------------------------------
        // ПРОЗРАЧНОСТЬ
        // ----------------------------------------------------

        let alpha =
            1 -
            smoothstep(
                0.08,
                0.72,
                greenScore
            );


        // Не вырезаем слабую зелень

        if (
            greenDominance < 28 ||
            saturation < 0.18
        ) {

            alpha = 1;
        }


        // ----------------------------------------------------
        // GREEN SPILL
        // ----------------------------------------------------

        if (
            alpha > 0 &&
            alpha < 0.95 &&
            g > r &&
            g > b
        ) {

            const greenExcess =
                g - Math.max(r, b);

            const reduction =
                greenExcess *
                SPILL_STRENGTH *
                (1 - alpha);

            data[i + 1] =
                clamp(
                    g - reduction,
                    0,
                    255
                );
        }


        data[i + 3] =
            Math.round(
                alpha * 255
            );
    }


    // ВОТ ЭТОГО У ТЕБЯ НЕ ХВАТАЛО

    ctx.putImageData(
        frame,
        0,
        0
    );
}


// ============================================================
// ГЛАВНЫЙ LOOP
// ============================================================

function render(time) {

    requestAnimationFrame(
        render
    );


    if (
        !videoReady ||
        video.paused ||
        video.ended
    ) {
        return;
    }


    // 1. Фон

    drawBackground(time);


    // 2. Видео поверх фона

    ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    // 3. Удаляем зелёный фон

    processVideoFrame();
}


// ============================================================
// VIDEO
// ============================================================

video.addEventListener(
    'loadedmetadata',
    () => {

        resizeCanvas();

        console.log(
            'VIDEO LOADED:',
            video.videoWidth,
            'x',
            video.videoHeight
        );
    }
);


video.addEventListener(
    'loadeddata',
    () => {

        videoReady = true;

        resizeCanvas();

        video.play().catch(
            error => {
                console.error(
                    'VIDEO PLAY ERROR:',
                    error
                );
            }
        );
    }
);


video.addEventListener(
    'error',
    () => {

        console.error(
            'VIDEO ERROR:',
            video.error
        );

        console.error(
            'VIDEO SRC:',
            video.currentSrc
        );
    }
);


// ============================================================
// ПОГОДА
// ============================================================

async function getEkaterinburgWeather() {

    try {

        const response =
            await fetch(
                'https://api.open-meteo.com/v1/forecast?latitude=56.8389&longitude=60.6057&current=temperature_2m,weather_code,is_day'
            );


        const data =
            await response.json();


        const temp =
            Math.round(
                data.current.temperature_2m
            );

        const weatherCode =
            data.current.weather_code;

        const isNight =
            data.current.is_day === 0;


        let weatherText =
            'ЯСНО';

        let emoji =
            '☀️';


        if (
            weatherCode > 1 &&
            weatherCode <= 3
        ) {

            weatherText =
                'ОБЛАЧНО';

            emoji =
                '☁️';

        } else if (
            weatherCode > 3 &&
            weatherCode <= 48
        ) {

            weatherText =
                'ТУМАН';

            emoji =
                '🌫️';

        } else if (
            weatherCode > 48 &&
            weatherCode <= 67
        ) {

            weatherText =
                'ДОЖДЬ';

            emoji =
                '🌧️';

        } else if (
            weatherCode > 67
        ) {

            weatherText =
                'СНЕГ';

            emoji =
                '❄️';
        }


        weatherDiv.innerHTML =
            `${emoji} ЕКБ: ${temp}°C<br>` +
            `${weatherText} // ` +
            `${isNight ? 'НОЧЬ' : 'ДЕНЬ'}`;


    } catch (error) {

        console.error(
            'WEATHER ERROR:',
            error
        );

        weatherDiv.textContent =
            'ЕКБ // WEATHER OFFLINE';
    }
}


// ============================================================
// START
// ============================================================

getEkaterinburgWeather();

setInterval(
    getEkaterinburgWeather,
    300000
);

requestAnimationFrame(
    render
);
