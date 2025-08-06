import React, { useEffect, useState } from "react";
import { RxReload } from "react-icons/rx";
import { TbLocationSearch } from "react-icons/tb";
import SearchHistory from "./SearchHistory";
import { FaLocationCrosshairs, FaSun, FaMoon } from "react-icons/fa6";
import { FourSquare } from "react-loading-indicators";
import { FaSmog } from "react-icons/fa";
import { FaLocationArrow } from "react-icons/fa";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const Weather = () => {
  const Apikey = import.meta.env.VITE_WEATHER_API_KEY;
  let [city, setCity] = useState("");
  let [weather, setWeather] = useState(null);
  let [error, setError] = useState("");
  const [searchHistory, setsearchHistory] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [hourForecast, setHourForecast] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const fetchApi = () => {
    setLoading(true);
    setError(null);
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${Apikey}&units=metric`
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Enter Correct city name");
        }
      })
      .then((data) => {
        setWeather(data);
        fetchForecast(data.name); 

        setsearchHistory((prev) => {
          const currentTime = new Date().toLocaleString();
          const updatedHistory = [
            ...prev,
            { city: data.name, time: currentTime },
          ];
          return updatedHistory.length > 10
            ? updatedHistory.slice(1)
            : updatedHistory;
        });
        setError(null);
      })

      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
    document.body.classList.toggle("dark");
  };

  // Fetch 5-day forecast
  const fetchForecast = (cityName) => {
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${Apikey}&units=metric`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.cod === "200") {
          const dailyForecast = processForecastData(data.list);
          setForecast(dailyForecast);
        } else {
          setError("Error fetching forecast data");
        }
      })
      .catch(() => setError("Error fetching forecast data"));
  };

  const processForecastData = (list) => {
    const groupedData = {};
    const today = new Date();

   
    list.forEach((item) => {
      const date = new Date(item.dt_txt).toLocaleDateString(undefined, {
        weekday: "long",
      });
      if (!groupedData[date]) {
        groupedData[date] = [];
      }
      groupedData[date].push(item);
    });

  
    const nextFiveDays = Array.from({ length: 5 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      return date.toLocaleDateString(undefined, { weekday: "long" });
    });

   
    const completeForecast = nextFiveDays.map((day) => {
      const dayData = groupedData[day] || [];
      if (dayData.length > 0) {
       
        const middayForecast = dayData.find((entry) =>
          entry.dt_txt.includes("12:00:00")
        );
        return [day, middayForecast ? [middayForecast] : [dayData[0]]];
      } else {
      
        return [
          day,
          [
            {
              main: { temp: "N/A" },
              weather: [{ main: "N/A", icon: "01d" }], 
            },
          ],
        ];
      }
    });

    return completeForecast;
  };
  useEffect(() => {
   
    const fetchCurrentLocationWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetchWeatherByLocation(latitude, longitude);
            fetchAirQuality(latitude, longitude); 
          },
          (error) => {
           
            setError(
              "Unable to retrieve your location. Please search for a city."
            );
          }
        );
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    fetchCurrentLocationWeather();
  }, []);

  const fetchWeatherByLocation = (latitude, longitude) => {
    setLoading(true);
    setError(null);
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${Apikey}&units=metric`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.cod === 200) {
          setWeather(data);
          fetchForecast(data.name); 
          fetchAirQuality(latitude, longitude); 
          fetchWeatherAlerts(latitude, longitude); 
        } else {
          setError("Error fetching weather data for your location");
        }
      })
      .catch(() => {
        setError("Error fetching weather data");
      })
      .finally(() => setLoading(false));
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByLocation(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => setError("Error retrieving location")
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    getLocation();
  }, []);
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      const formattedDate = now.toLocaleDateString(undefined, options);
      const formattedTime = now.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }); 
      setCurrentDateTime(`${formattedDate}, ${formattedTime}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  
    const fetchForecasthourByCity = async () => {
      if (!city) return;
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${Apikey}`
        );
        const data = await response.json();
        if (data.cod === "200") {
          setHourForecast(data.list.slice(0, 5)); 
        } else {
              setHourForecast([]);
        }
      } catch (error) {
         setHourForecast([]);
      }
    };

    fetchForecasthourByCity();
  }, [city]);

 useEffect(() => {
  const fetchForecasthourByLocation = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${Apikey}`
      );
      const data = await response.json();
      if (data.cod === "200") {
        setHourForecast(data.list.slice(0, 5)); 
      } else {
        setHourForecast([]); 
      }
    } catch (error) {
      setHourForecast([]);
    }
  };

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchForecasthourByLocation(latitude, longitude);
      },
      () => {
        setHourForecast([]); 
      }
    );
  }
}, []);

 const fetchAirQuality = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${Apikey}`
    );
    const data = await response.json();

    if (data && data.list && data.list.length > 0) {
      setAirQuality(data.list[0]);
    } else {
      setAirQuality(null); 
    }
  } catch (error) {
    setAirQuality(null); 
  }
};

  const getAQIDescription = (aqi) => {
    switch (aqi) {
      case 1:
        return "Good";
      case 2:
        return "Fair";
      case 3:
        return "Moderate";
      case 4:
        return "Poor";
      case 5:
        return "Very Poor";
      default:
        return "Unknown";
    }
  };

  const getAQIColor = (aqi) => {
    if (aqi === 1) return "bg-green-500"; 
    if (aqi === 2) return "bg-yellow-500"; 
    if (aqi === 3) return "bg-orange-500"; 
    if (aqi === 4) return "bg-red-500"; 
    return "bg-purple-500";
  };

  const getWindDirectionarrow = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return "North";
    if (deg >= 22.5 && deg < 67.5) return "North-East";
    if (deg >= 67.5 && deg < 112.5) return "East";
    if (deg >= 112.5 && deg < 157.5) return "South-East";
    if (deg >= 157.5 && deg < 202.5) return "South";
    if (deg >= 202.5 && deg < 247.5) return "South-West";
    if (deg >= 247.5 && deg < 292.5) return "West";
    if (deg >= 292.5 && deg < 337.5) return "North-West";
    return "";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000); 
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

 const fetchWeatherAlerts = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,daily&appid=${Apikey}`
    );
    const data = await response.json();

    if (data.alerts) {
      setWeatherAlerts(data.alerts);
    } else {
      setWeatherAlerts([]); 
    }
  } catch (error) {
    setWeatherAlerts([]); 
  }
};


  const prepareHourlyForecastData = () => {
    if (!hourForecast || hourForecast.length === 0) return null;

    const labels = hourForecast.map((hour) =>
      new Date(hour.dt * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    const temperatures = hourForecast.map((hour) => hour.main.temp);

    return {
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temperatures,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.4, 
        },
      ],
    };
  };

  const getRecipeSuggestions = (condition) => {
    switch (condition) {
      case "Clear":
        return ["Grilled Chicken Salad", "Lemonade", "Fruit Smoothie"];
      case "Rain":
      case "Drizzle":
        return [
          "Hot Soup (e.g., Tomato or Chicken Noodle)",
          "Pasta with Creamy Sauce",
          "Masala Chai",
        ];
      case "Snow":
        return ["Hot Chocolate", "Beef Stew", "Baked Lasagna"];
      case "Clouds":
        return [
          "Sandwich with Warm Soup",
          "Coffee with Muffins",
          "Vegetable Stir Fry",
        ];
      case "Thunderstorm":
        return [
          "Comfort Food (e.g., Mac and Cheese)",
          "Hot Tea",
          "Spicy Curry",
        ];
      case "Fog":
      case "Mist":
        return ["Hot Coffee", "Steamed Momos", "Warm Oatmeal"];

      default:
        return ["Seasonal Fruit Salad", "Homemade Pizza", "Smoothie Bowl"];
    }
  };

  const getOutdoorPlanner = (condition) => {
    switch (condition) {
      case "Clear":
        return [
          "Go for a hike or a walk in the park",
          "Plan a picnic with friends or family",
          "Enjoy stargazing at night",
        ];
      case "Rain":
      case "Drizzle":
        return [
          "Visit a museum or indoor attraction",
          "Enjoy a cozy day reading a book",
          "Watch movies or play board games indoors",
        ];
      case "Snow":
        return [
          "Build a snowman or have a snowball fight",
          "Go skiing or snowboarding",
          "Enjoy hot cocoa by the fireplace",
        ];
      case "Clouds":
        return [
          "Take a relaxing walk under the cloudy sky",
          "Visit a local cafe for a warm drink",
          "Plan a photography session with the moody weather",
        ];
      case "Thunderstorm":
        return [
          "Stay indoors and enjoy a warm drink",
          "Catch up on your favorite TV shows or movies",
          "Work on a creative indoor project",
        ];
      case "Fog":
      case "Mist":
        return [
          "Take a calm walk if visibility is safe",
          "Enjoy indoor activities like drawing or journaling",
          "Listen to relaxing music or meditate",
        ];

      default:
        return [
          "Explore local attractions",
          "Try a new hobby or activity",
          "Relax and enjoy the day as it unfolds",
        ];
    }
  };

  const getClothingRecommendations = (temp, condition) => {
    if (condition === "Rain" || condition === "Drizzle")
      return "Carry an umbrella or raincoat.";

    if (temp < 10) return "Wear a heavy jacket, scarf, and gloves.";
    if (temp >= 10 && temp < 20) return "Wear a light jacket or sweater.";
    if (temp >= 20 && temp < 30) return "Wear comfortable clothing.";
    if (temp >= 30) return "Wear light clothing and stay hydrated.";

    return "Dress comfortably.";
  };

return(
  <div className={`min-h-screen w-full px-4 ${darkMode ? "bg-gray-900 text-gray-300" : "bg-sky-100 text-black"}`}>
  <div className="max-w-screen-xl mx-auto">
    <p className="text-3xl sm:text-4xl font-bold text-white animate-glow pt-3 flex justify-center items-center">
      WeatherSphere
    </p>

   <div className="flex flex-col md:flex-row justify-between items-center pt-6 gap-4 w-full">
 
  <SearchHistory
    searchData={searchHistory}
    clearData={() => setsearchHistory([])}
  />

 
  <div className="flex flex-col w-full md:w-auto gap-2">
   
    <input
      className="w-full h-12 p-3 text-base sm:text-lg text-gray-700 font-serif tracking-wide border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      placeholder="Search for your preferred city..."
      value={city}
      onChange={(e) => setCity(e.target.value)}
    />

  
    <div className="flex justify-end flex-wrap gap-2">
 
      <button
        className="bg-red-300 h-10 w-10 rounded-full flex justify-center items-center text-black shadow-lg transition-transform hover:scale-110"
        onClick={() => setCity("")}
      >
        <RxReload />
      </button>

      
      <button
        className="bg-green-400 h-10 w-10 rounded-full flex justify-center items-center text-black shadow-lg transition-transform hover:scale-110"
        onClick={fetchApi}
      >
        <TbLocationSearch />
      </button>

      <button
        className="p-2 px-4 bg-gray-800 text-white rounded-full shadow-md hover:bg-gray-600 flex items-center gap-2"
        onClick={toggleDarkMode}
      >
        {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-400" />}
        {darkMode ? "Light" : "Dark"}
      </button>
      
    </div>
    {/* Error message below toggle button */}
  {error && (
    <p className="text-white bg-red-800 p-2 rounded-lg text-sm sm:text-base">
      {error}
    </p>
  )}
  </div>
</div>

{loading ? (
  <div className="flex justify-center items-center h-[200px]">
    <FourSquare color="#5f925f" size="large" text="Loading" textColor="#a8a29c" />
  </div>
) : (
  weather && (
    <div className="flex flex-col gap-4 pt-5 px-2">
      <div className="flex flex-col sm:flex-row justify-between">
        <h2 className="text-lg sm:text-xl font-semibold font-serif">{weather.name}</h2>
        <p className="text-base sm:text-lg font-serif">{currentDateTime}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
      
        <div className={`w-full sm:w-[200px] p-3 rounded-lg shadow-lg text-center ${darkMode ? "bg-white/10" : "bg-gray-600"}`}>
          <img src="temperature.png" alt="Temperature" className="h-16 mx-auto" />
          <p className="text-sm sm:text-lg">Temperature: {weather.main.temp}°C</p>
        </div>
        <div className={`w-full sm:w-[200px] p-3 rounded-lg shadow-lg text-center ${darkMode ? "bg-white/10" : "bg-gray-600"}`}>
          <img src="temperature.png" alt="Temperature" className="h-16 mx-auto" />
          <p className="text-sm sm:text-lg"> Humidity: {weather.main.humidity}%</p>
        </div>
        <div className={`w-full sm:w-[200px] p-3 rounded-lg shadow-lg text-center ${darkMode ? "bg-white/10" : "bg-gray-600"}`}>
          <img src="temperature.png" alt="Temperature" className="h-16 mx-auto" />
          <p className="text-sm sm:text-lg">Condition: {weather.weather[0].main}</p>
        </div>
        <div className={`w-full sm:w-[200px] p-3 rounded-lg shadow-lg text-center ${darkMode ? "bg-white/10" : "bg-gray-600"}`}>
          <img src="temperature.png" alt="Temperature" className="h-16 mx-auto" />
          <p className="text-sm sm:text-lg">Pressure: {weather.main.pressure} hPa</p>
        </div> 
         <div className={`w-full sm:w-[200px] p-3 rounded-lg shadow-lg text-center ${darkMode ? "bg-white/10" : "bg-gray-600"}`}>
          <img src="temperature.png" alt="Temperature" className="h-16 mx-auto" />
          <p className="text-sm sm:text-lg">Wind Speed: {weather.wind.speed} km/h</p>
        </div>
         <div className={`w-full sm:w-[200px] p-3 rounded-lg shadow-lg text-center ${darkMode ? "bg-white/10" : "bg-gray-600"}`}>
          <img src="temperature.png" alt="Temperature" className="h-16 mx-auto" />
          <p className="text-sm sm:text-lg">     Visibility: {weather.visibility}m</p>
        </div>

       
      </div>
    </div>

  )
)}
<div className="mt-8">
<div  className="flex flex-row flex-wrap justify-between items-center w-full">
  <h2 className="text-xl font-semibold font-serif text-gray-500">Hourly Forecast</h2>
</div>


  <div className="flex overflow-x-auto gap-4 mt-4 px-2 py-2 justify-start sm:justify-center scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
    {hourForecast.map((hour, index) => (
      <div key={index} className="min-w-[140px] sm:min-w-[160px] p-4 bg-gray-600 rounded-lg text-white text-center flex-shrink-0">
        <p className="text-sm">{new Date(hour.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        <img src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`} className="w-12 h-12 mx-auto" />
        <p className="text-sm">{hour.weather[0].main}</p>
        <p className="font-bold">{Math.round(hour.main.temp)}°C</p>
      </div>
    ))}
  </div>
</div>
<div className="mt-6">
  <div className="flex flex-col sm:flex-row justify-between items-center">
    <h2 className="text-xl font-semibold text-gray-500">5 Days Forecast</h2>
    <button
      className="p-2 bg-cyan-800 text-white rounded-full hover:bg-blue-600 mt-2 sm:mt-0"
      onClick={getLocation}
    >
      <FaLocationCrosshairs />
    </button>
   
  </div>

  <div className="flex overflow-x-auto gap-4 mt-4 px-2 py-2 justify-start sm:justify-center scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
    {forecast.map(([day, data]) => (
      <div key={day}  className="min-w-[140px] sm:min-w-[160px] p-4 bg-gray-600 rounded-lg text-white text-center flex-shrink-0">
        <h4 className="font-semibold">{day}</h4>
        <img src={`https://openweathermap.org/img/wn/${data[0].weather[0].icon}@2x.png`} className="w-16 h-16 mx-auto" />
        <p>{data[0].weather[0].main}</p>
        <p className="font-bold">{Math.round(data[0].main.temp)}°C</p>
      </div>
    ))}
  </div>
</div>
{weather?.wind?.deg !== undefined && (
  <div className="flex flex-col md:flex-row justify-center items-center w-full px-4 gap-4 mt-6">
    {/* AQI Box */}
    {airQuality && airQuality.main ? (
      <div
        className={`flex flex-col items-center shadow-lg rounded-lg p-4 w-full md:w-[300px] hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer transition-transform ${getAQIColor(
          airQuality.main.aqi
        )}`}
      >
        <FaSmog className="text-5xl text-white mb-2" />
        <p className="text-center text-lg font-serif">AQI: {airQuality.main.aqi}</p>
        <p className="text-center text-sm">{getAQIDescription(airQuality.main.aqi)}</p>
      </div>
    ) : (
      <div className="flex flex-col items-center shadow-lg rounded-lg p-4 bg-white/10 w-full md:w-[300px]">
        <FaSmog className="text-5xl text-gray-400 mb-2" />
        <p className="text-center text-sm text-gray-500">AQI data not available</p>
      </div>
    )}

    {/* Wind Speed Box */}
    <div
      className={`flex flex-col items-center shadow-lg rounded-lg p-4 w-full md:w-[300px] hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer transition-transform ${
        darkMode ? "bg-white/10" : "bg-gray-800"
      }`}
    >
      <div
        className="flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full shadow-lg"
        style={{ transform: `rotate(${weather.wind?.deg || 0}deg)` }}
      >
        <FaLocationArrow className="text-white text-3xl" />
      </div>
      <p className="text-center mt-2 font-serif text-gray-200 text-lg">
        Wind Speed: {weather.wind?.speed} km/h
      </p>
      <p className="text-center font-serif text-gray-300 text-sm">
        Wind Direction: {getWindDirectionarrow(weather.wind?.deg)}
      </p>
    </div>

    {/* Sunrise / Sunset Box */}
    <div className="flex flex-col items-center shadow-lg rounded-lg p-4 w-full md:w-[300px] bg-gradient-to-r from-orange-400 to-purple-500 text-white hover:scale-105 hover:shadow-lg active:scale-95 cursor-pointer transition-transform">
      <div className="w-16 h-10 flex items-center justify-center bg-yellow-400 rounded-full shadow-md animate-pulse">
        <FaSun className="text-white text-4xl" />
      </div>
      <p className="text-center mt-3 font-serif text-white text-lg">
        Sunrise: {formatTime(weather.sys?.sunrise)}
      </p>

      <div className="w-full h-0.5 bg-white/30 my-4"></div>

      <div className="flex flex-col items-center">
        <div className="w-10 h-10 flex items-center justify-center bg-purple-500 rounded-full shadow-md animate-pulse">
          <FaMoon className="text-white text-3xl" />
        </div>
        <p className="text-center mt-3 font-serif text-white text-lg">
          Sunset: {formatTime(weather.sys?.sunset)}
        </p>
      </div>
    </div>
  </div>
)}

</div>
{/* Weather Alerts */}
<div className="mt-6 p-4 bg-red-500 text-white rounded-lg shadow-lg w-full">
  <h3 className="text-lg font-bold">Weather Alerts</h3>
  {weatherAlerts.length > 0 ? (
    <ul className="mt-2 space-y-2">
      {weatherAlerts.map((alert, index) => (
        <li key={index} className="border-b border-white pb-2">
          <p className="font-semibold">{alert.event}</p>
          <p className="text-sm">
            {new Date(alert.start * 1000).toLocaleString()} -{" "}
            {new Date(alert.end * 1000).toLocaleString()}
          </p>
          <p className="text-sm mt-1">{alert.description}</p>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-sm mt-2">No weather alerts available at this time.</p>
  )}
</div>

{/* Hourly Forecast Graph */}
<div className={`mt-8 p-4 rounded-lg shadow-lg w-full ${darkMode ? "bg-white/10" : "bg-gray-800"}`}>
  <h2 className="text-xl font-semibold font-serif text-gray-100 mb-4">Hourly Forecast</h2>
  {hourForecast.length > 0 ? (
    <div className="w-full overflow-x-auto">
      <Line
        data={prepareHourlyForecastData()}
        height={200}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: "top" },
            tooltip: {
              callbacks: {
                label: (context) => `${context.raw}°C`,
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: "Time" },
            },
            y: {
              title: { display: true, text: "Temperature (°C)" },
            },
          },
        }}
      />
    </div>
  ) : (
    <p className="text-gray-300 text-center">No hourly forecast available.</p>
  )}
</div>

{/* Recipe Suggestions Section */}
{weather?.weather?.[0] && (
  <div
    className={`mt-8 p-4 rounded-lg shadow-lg w-full ${
      darkMode
        ? "bg-gradient-to-r from-yellow-500 to-gray-800 text-white"
        : "bg-gradient-to-r from-gray-800 to-yellow-500 text-white"
    }`}
  >
    <h2 className="text-xl font-semibold font-serif mb-4">Recipe Suggestions</h2>
    <p className="mb-2">
      Based on the current weather: <strong>{weather.weather[0].main}</strong>
    </p>
    <ul className="list-disc list-inside">
      {getRecipeSuggestions(weather.weather[0].main).map((recipe, index) => (
        <li key={index} className="mb-1" style={{ animationDelay: `${index * 0.2}s` }}>
          {recipe}
        </li>
      ))}
    </ul>
  </div>
)}

{/* Outdoor Planner Section */}
{weather?.weather?.[0] && (
  <div
    className={`mt-8 p-4 rounded-lg shadow-lg w-full ${
      darkMode
        ? "bg-gradient-to-r from-yellow-500 to-gray-800 text-white"
        : "bg-gradient-to-r from-gray-800 to-yellow-500 text-white"
    }`}
  >
    <h2 className="text-xl font-semibold font-serif mb-4">Outdoor Planner</h2>
    <p className="mb-2">
      Based on the current weather: <strong>{weather.weather[0].main}</strong>
    </p>
    <ul className="list-disc list-inside">
      {getOutdoorPlanner(weather.weather[0].main).map((activity, index) => (
        <li key={index} className="mb-1" style={{ animationDelay: `${index * 0.2}s` }}>
          {activity}
        </li>
      ))}
    </ul>
  </div>
)}

{/* Clothing Recommendations Section */}
{weather?.main && weather?.weather?.[0] && (
  <div
    className={`mt-8 p-4 rounded-lg shadow-lg w-full ${
      darkMode
        ? "bg-gradient-to-r from-yellow-500 to-gray-800 text-white"
        : "bg-gradient-to-r from-gray-800 to-yellow-500 text-white"
    }`}
  >
    <h2 className="text-xl font-semibold font-serif mb-4">Clothing Recommendations</h2>
    <p>
      {getClothingRecommendations(weather.main.temp, weather.weather[0].main)}
    </p>
  </div>
)}

{/* Weather Tips Section */}
<div
  className={`mt-8 p-4 rounded-lg shadow-lg w-full ${
    darkMode
      ? "bg-gradient-to-r from-yellow-500 to-gray-800 text-white"
      : "bg-gradient-to-r from-gray-800 to-yellow-500 text-white"
  }`}
>
  <h2 className="text-xl font-semibold font-serif mb-4">Weather Tips</h2>
  <p>
    Stay hydrated during hot weather and avoid outdoor activities during peak heat hours.
  </p>
</div>

</div>

)
};
