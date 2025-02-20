const API_KEY = window.API_KEY || '59ce35330ff352d5fb875a00247300c0'; // Replace with your actual OpenWeatherMap key—no red if quoted right
const form = document.getElementById('weatherForm');
const locationInput = document.getElementById('locationInput');
const loading = document.getElementById('loading');
const weatherDisplay = document.getElementById('weatherDisplay');
const errorDisplay = document.getElementById('errorDisplay');
const unitToggle = document.getElementById('unitToggle');
const recentSearchesDiv = document.getElementById('recentSearches');

let currentWeatherData = null;
let isCelsius = true;
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

console.log('Script loaded, API_KEY:', API_KEY ? 'Set' : 'Not set!');
console.log('Initial recent searches:', recentSearches);

if (recentSearchesDiv) {
    renderRecentSearches();
} else {
    console.error('recentSearchesDiv not found in DOM!');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const location = locationInput.value.trim();
    if (!location) {
        console.log('No location entered');
        return;
    }

    console.log('Submitting form for:', location);
    await fetchAndDisplayWeather(location);
});

unitToggle.addEventListener('click', () => {
    if (currentWeatherData) {
        isCelsius = !isCelsius;
        unitToggle.textContent = `Switch to °${isCelsius ? 'F' : 'C'}`;
        displayWeather(currentWeatherData);
    }
});

async function fetchWeather(location) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`;
    console.log('Fetching from:', url);
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API response not OK:', response.status, errorText);
        throw new Error('Location not found or API error');
    }
    return await response.json();
}

function displayWeather(data) {
    console.log('Displaying weather for:', data.name);
    const tempC = data.main.temp;
    const tempF = (tempC * 9/5) + 32;
    const feelsLikeC = data.main.feels_like;
    const feelsLikeF = (feelsLikeC * 9/5) + 32;

    document.getElementById('location').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('temperature').textContent = 
        `${Math.round(isCelsius ? tempC : tempF)}°${isCelsius ? 'C' : 'F'}`;
    document.getElementById('conditions').textContent = data.weather[0].description;
    document.getElementById('weatherIcon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    document.getElementById('feelsLike').textContent = 
        `Feels like: ${Math.round(isCelsius ? feelsLikeC : feelsLikeF)}°${isCelsius ? 'C' : 'F'}`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind').textContent = `${data.wind.speed} m/s`;

    weatherDisplay.classList.remove('hidden');
    errorDisplay.classList.add('hidden');
}

function updateBackground(condition) {
    const body = document.body;
    body.className = 'bg-gray-100 min-h-screen flex items-center justify-center p-4';
    switch (condition.toLowerCase()) {
        case 'clear': body.classList.add('bg-blue-200'); break;
        case 'clouds': body.classList.add('bg-gray-300'); break;
        case 'rain': body.classList.add('bg-blue-400'); break;
        case 'snow': body.classList.add('bg-gray-100'); break;
        default: body.classList.add('bg-gray-100');
    }
}

function showLoading() {
    loading.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
    errorDisplay.classList.add('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

function saveRecentSearch(location) {
    console.log('Saving search:', location);
    recentSearches = recentSearches.filter(city => city.toLowerCase() !== location.toLowerCase());
    recentSearches.unshift(location);
    if (recentSearches.length > 5) recentSearches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    console.log('Updated recent searches:', recentSearches);
    renderRecentSearches();
}

function renderRecentSearches() {
    console.log('Rendering recent searches:', recentSearches);
    if (!recentSearchesDiv) {
        console.error('recentSearchesDiv is not available!');
        return;
    }
    recentSearchesDiv.innerHTML = '';
    if (recentSearches.length === 0) {
        recentSearchesDiv.textContent = 'No recent searches yet.';
        return;
    }
    recentSearches.forEach(city => {
        const button = document.createElement('button');
        button.textContent = city;
        button.className = 'bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300';
        button.addEventListener('click', () => fetchAndDisplayWeather(city));
        recentSearchesDiv.appendChild(button);
    });
}

async function fetchAndDisplayWeather(location) {
    showLoading();
    try {
        const weatherData = await fetchWeather(location);
        console.log('Weather data fetched:', weatherData);
        currentWeatherData = weatherData;
        displayWeather(weatherData);
        updateBackground(weatherData.weather[0].main);
        saveRecentSearch(location);
        hideLoading();
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message);
        hideLoading();
    }
}