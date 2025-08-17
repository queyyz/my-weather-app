const apiKey = '805eaf9569bcaabe7036fa6c3315fa08';

const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');
const appContainer = document.querySelector('.app-container');

let forecastContainer = null; // ตัวแปรเก็บ container พยากรณ์ 5 วัน

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const cityName = cityInput.value.trim();

    if (cityName) {
        getWeather(cityName);
    } else {
        alert('กรุณาป้อนชื่อเมือง');
    }
});

async function getWeather(city) {
    weatherInfoContainer.innerHTML = `<p>กำลังโหลดข้อมูล...</p>`;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('ไม่พบข้อมูลเมืองนี้');
        }
        const data = await response.json();
        localStorage.setItem('lastCity', city);

        displayWeather(data); // แสดงข้อมูลสภาพอากาศปัจจุบัน
        removeForecast(); // เคลียร์พยากรณ์เก่า (ถ้ามี)
    } catch (error) {
        weatherInfoContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

async function getForecast(city) {
    console.log('เรียก getForecast สำหรับเมือง:', city);
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('ไม่สามารถโหลดพยากรณ์อากาศได้');

        const data = await response.json();
        console.log('ข้อมูล forecast ที่ได้:', data);
        displayForecast(data);
    } catch (error) {
        console.error('Error getForecast:', error);
    }
}

function displayForecast(data) {
    console.log('เริ่ม displayForecast');
    removeForecast();

    forecastContainer = document.createElement('div');
    forecastContainer.classList.add('forecast-container');
    forecastContainer.style.border = '1px solid red';

    const forecastList = data.list;
    
    // เก็บข้อมูลพยากรณ์แต่ละวันโดยเลือกเวลาใกล้ 12:00 น.
    const dailyDataMap = new Map();

    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('th-TH'); // แยกตามวัน

        // เก็บเวลานี้และค่าเวลาต่างจาก 12:00
        const hour = date.getHours();
        const diff = Math.abs(hour - 12);

        if (!dailyDataMap.has(dayKey) || diff < dailyDataMap.get(dayKey).diff) {
            dailyDataMap.set(dayKey, {item, diff});
        }
    });

    // แปลงข้อมูลเป็น array พร้อมฟอร์แมตวัน เวลา และอื่นๆ
    const dailyForecasts = Array.from(dailyDataMap.values()).map(({item}) => {
        const date = new Date(item.dt * 1000);
        return {
            date: date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }),
            temp: item.main.temp.toFixed(1),
            icon: item.weather[0].icon,
            description: item.weather[0].description
        };
    });

    forecastContainer.innerHTML = `<h3>พยากรณ์ 5 วันถัดไป</h3>`;
    forecastContainer.innerHTML += `
        <div class="forecast-grid">
            ${dailyForecasts.slice(0, 5).map(day => `
                <div class="forecast-item">
                    <div>${day.date}</div>
                    <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
                    <div>${day.temp}°C</div>
                    <small>${day.description}</small>
                </div>
            `).join('')}
        </div>
    `;

    weatherInfoContainer.appendChild(forecastContainer);
    console.log('แสดง forecast เรียบร้อย');
}

function removeForecast() {
    if (forecastContainer) {
        forecastContainer.remove();
        forecastContainer = null;
    }
}

function displayWeather(data) {
    const { name, main, weather, timezone } = data;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];

    const weatherHtml = `
        <h2 class="text-2xl font-bold">${name}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p class="temp">${temp.toFixed(1)}°C</p>
        <p>${description}</p>
        <p>ความชื้น: ${humidity}%</p>
        <button id="forecast-btn" class="forecast-button">
            พยากรณ์ 5 วันถัดไป
        </button>
    `;
    weatherInfoContainer.innerHTML = weatherHtml;

    changeBackgroundByTime(timezone);
    changeBackgroundByTemperature(temp);

    const forecastBtn = document.getElementById('forecast-btn');
    forecastBtn.addEventListener('click', () => {
        getForecast(name);
    });
}

function getLocalHour(timezoneOffset) {
    const nowUTC = new Date().getTime() + (new Date().getTimezoneOffset() * -60000);
    const localTime = new Date(nowUTC + timezoneOffset * 1000);
    return localTime.getHours();
}

function changeBackgroundByTime(timezoneOffset) {
    const hour = getLocalHour(timezoneOffset);
    const isMorning = hour >= 6 && hour < 18;

    let gradient = '';

    if (isMorning) {
        gradient = 'linear-gradient(to bottom, #ffcc00ff, #e7daa7ff)';
    } else {
        gradient = 'linear-gradient(to bottom, #2c3e50, #0f434bff)';
    }

    if (appContainer) {
        appContainer.style.background = gradient;
    }
}

function changeBackgroundByTemperature(temp) {
    if (!appContainer) return;

    let tempColor = '';

    if (temp >= 30) {
        tempColor = 'linear-gradient(to bottom, #ff7e5f, #feb47b)';
    } else if (temp <= 15) {
        tempColor = 'linear-gradient(to bottom, #83a4d4, #b6fbff)';
    } else {
        tempColor = 'linear-gradient(to bottom, #56ccf2, #2f80ed)';
    }

    appContainer.style.background = tempColor;
}

document.addEventListener('DOMContentLoaded', () => {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        getWeather(lastCity);
    }
});
