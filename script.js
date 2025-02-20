const apiKey = '17036001fc110638901fcc2368c9f15f'
const cityInput = document.getElementById("cityInput")
const suggestionsDiv = document.querySelector('.suggestions')
const locationBtn = document.getElementById("locationBtn")
cityInput.addEventListener('input', async (e) => {
    let query = e.target.value
    if (!query) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    let response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`)
    let cities = await response.json()

    suggestionsDiv.innerHTML = cities.map(
        (city) =>
            `<div class="suggestion-item p-2 hover:cursor-pointer hover:bg-[#eeeded]" data-lat="${city.lat}" data-lon="${city.lon}" data-city="${city.name}">
             ${city.name}, ${city.country}
           </div>`
    )
        .join('');
})
suggestionsDiv.addEventListener('click', (item) => {

    let lat = item.target.dataset.lat;
    let lon = item.target.dataset.lon;
    let cityName = item.target.dataset.city;

    suggestionsDiv.innerHTML = '';
    cityInput.value = '';

    updWeather(lat, lon, cityName);
})

document.addEventListener('click', (e) => {
    if (!suggestionsDiv.contains(e.target)) {
        suggestionsDiv.innerHTML = '';
        cityInput.value='';
    }
})
//  default location ( Delhi, India)
let currentLat = "28.6139";
let currentLon = "77.2090";
let currentCityName = "Delhi";

// Function to get GPS location

locationBtn.addEventListener('click', () => getUserLocation())

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLon = position.coords.longitude;
                updWeather(currentLat, currentLon);
            },
            (error) => {
                console.error("Error getting location: ", error.message);
                //  default location ( Delhi, India)
                currentLat = "28.6139";
                currentLon = "77.2090";
                currentCityName = "Delhi";
                updWeather(currentLat, currentLon, currentCityName);
            }
        );
    }
}


async function updWeather(lat, lon, cityName) {
    lat = lat ?? currentLat;
    lon = lon ?? currentLon;

    let response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    let currWeather = await response.json()


    let apiObj = {
        dt: currWeather.dt,
        timezone: currWeather.timezone
    }

    dateTimeGreet(apiObj)


    cityName = cityName ?? currWeather.name

    document.querySelectorAll(".temp").forEach(e => e.innerHTML = Math.floor(currWeather.main.temp) + "&deg;");
    document.querySelectorAll(".wind").forEach(e => e.innerHTML = Math.floor((currWeather.wind.speed * 3.6)) + " kmh");
    document.querySelectorAll(".humid").forEach(e => e.innerHTML = Math.floor(currWeather.main.humidity) + "% humid");
    document.querySelectorAll(".weather").forEach(e => e.innerHTML = currWeather.weather[0].main);
    document.querySelector('.feelslike').innerHTML = "Feels like " + Math.floor(currWeather.main.feels_like) + "&deg;C";
    document.querySelector('.location').innerHTML = cityName

    let forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    let forecastData = await forecastRes.json()

    processForecastData(forecastData)
    processHourlyData(forecastData)
}

function processForecastData(data) {
    const dailyTemps = {}; // Object to store grouped temperatures by date

    data.list.forEach((item) => {
        const date = item.dt_txt.split(" ")[0];

        // Initialize the date array if not already created
        if (!dailyTemps[date]) {
            dailyTemps[date] = [];
        }

        // Push the temperature for this time slot into the respective date array
        dailyTemps[date].push(item.main.temp);
    });

    // Calculate min and max temperatures for each day
    const forecast = Object.keys(dailyTemps).map((date) => {
        const temps = dailyTemps[date];
        const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });

        return {
            day: dayName,
            minTemp: Math.min(...temps),
            maxTemp: Math.max(...temps),
        };
    });

    displayForecast(forecast)
}

function displayForecast(forecast) {
    const container = document.getElementById("sixDays");
    container.innerHTML = "";

    forecast.forEach((day) => {
        const dayDiv = document.createElement("div");
        dayDiv.innerHTML = `
                    <div
                        class="dayI border-2 border-gray-200 rounded-2xl space-y-3 w-24 p-2 flex flex-col justify-center items-center shadow-lg active:shadow-cyan-500 hover:shadow-yellow-500 transition hover:scale-105">
                        <div class='font-semibold'>${day.day}</div>
                        <div class='text-[#696969] font-semibold text-xl'>${Math.floor(day.maxTemp)}°</div>
                        <div class='text-[#a09f9f] font-semibold'>${Math.floor(day.minTemp)}°</div>
                    </div>
        `;
        container.appendChild(dayDiv);
    });
}

function processHourlyData(data) {
    const hourlyTemps = {}; // Object to store grouped temperatures by date

    data.list.slice(0, 6).forEach((item) => {
        const utcTime = item.dt_txt.split(" ")[1]

        const istTime = convertUTCtoIST(utcTime)

        // Initialize the date array if not already created
        if (!hourlyTemps[istTime]) {
            hourlyTemps[istTime] = [];
        }

        // Push the temperature for this time slot into the respective date array
        hourlyTemps[istTime].push(item.main.temp, item.weather[0].main);
    });

    const hourly = Object.keys(hourlyTemps).map((time) => {
        const hourlyWeather = hourlyTemps[time];
        return {
            time: time,
            temp: hourlyWeather[0],
            weather: hourlyWeather[1]
        };
    });

    displayHourlyData(hourly)
    hourlyResponsive(hourly)

}
function displayHourlyData(hourly) {
    const container = document.getElementById("hourly");
    container.innerHTML = "";
    hourly.forEach((hour) => {
        const dayDiv = document.createElement("div");
        dayDiv.innerHTML = `
                    <div
                        class="dayI border-2 border-gray-200 rounded-2xl space-y-3 w-24 p-2 flex flex-col justify-center items-center shadow-lg active:shadow-cyan-500 hover:shadow-yellow-500 transition">
                        <div class='font-semibold'>${hour.time}</div>
                        <div class='text-[#696969] font-semibold text-xl'>${Math.floor(hour.temp)}°</div>
                        <div class='text-[#a09f9f] font-semibold'>${hour.weather}</div>
                    </div>
        `;
        container.appendChild(dayDiv);
    });
}
function hourlyResponsive(hourly) {
    const container = document.getElementById("hourlyResponsive");
    container.innerHTML = "";
    hourly.forEach((hour) => {
        const dayDiv = document.createElement("div");
        dayDiv.innerHTML = `
                    <div
                        class="dayI border-2 border-gray-200 rounded-2xl space-y-3 w-24 p-2 flex flex-col justify-center items-center shadow-lg active:shadow-cyan-500 hover:shadow-yellow-500 transition">
                        <div class='font-semibold'>${hour.time}</div>
                        <div class='text-[#696969] font-semibold text-xl'>${Math.floor(hour.temp)}°</div>
                        <div class='text-[#a09f9f] font-semibold'>${hour.weather}</div>
                    </div>
        `;
        container.appendChild(dayDiv);
    });
}


function convertUTCtoIST(utcTime) {
    const [utcHour, utcMinute] = utcTime.split(":").map(Number);

    const utcDate = new Date(Date.UTC(0, 0, 0, utcHour, utcMinute, 0));

    const istOffset = 5 * 60 * 60 * 1000 + 30 * 60 * 1000; // IST in milliseconds
    const istDate = new Date(utcDate.getTime() + istOffset);

    const istHour = istDate.getUTCHours(); // Use UTC methods as IST is calculated
    const istMinute = istDate.getUTCMinutes().toString().padStart(2, "0");
    const period = istHour >= 12 ? "PM" : "AM";
    const istHour12 = istHour % 12 || 12;

    return `${istHour12} ${period}`;
}


function dateTimeGreet(apiResponse) {

    const date = new Date();
    const hours = date.getHours();

    const optionsTime = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,

    };

    const optionsDate = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }
    const timeString = date.toLocaleTimeString("en-US", optionsTime);
    const dateString = date.toLocaleDateString("en-IN", optionsDate);

    let greeting = "";
    if (hours < 12) {
        greeting = "Good Morning ";
    } else if (hours < 17) {
        greeting = "Good Afternoon ";
    } else {
        greeting = "Good Evening";
    }

    document.querySelector('.greeting').innerHTML = greeting
    document.querySelector('.time').innerHTML = timeString
    document.querySelector('.date').innerHTML = dateString

}
updWeather()
setInterval(dateTimeGreet, 1000);