
interface WeatherResponse {
  current: {
    condition: {
      text: string;
      code: number;
    };
    temp_c: number;
  };
}

export const fetchWeather = async (city: string = 'Bielefeld') => {
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=8f368402f73e4843997171553251704&q=${city}&aqi=no`
    );
    const data: WeatherResponse = await response.json();
    
    // Map weather conditions to our simplified categories
    const conditionText = data.current.condition.text.toLowerCase();
    
    if (conditionText.includes('sunny') || conditionText.includes('clear')) {
      return 'sunny';
    } else if (conditionText.includes('partly cloudy') || conditionText.includes('partly')) {
      return 'partly_cloudy';
    } else {
      return 'cloudy';
    }
  } catch (error) {
    console.error('Error fetching weather:', error);
    return 'partly_cloudy'; // fallback
  }
};
