export interface WeatherCondition {
  text: string;
  icon: string;
}

export interface WeatherCurrent {
  temp_c: number;
  condition: WeatherCondition;
  wind_kph: number;
  humidity: number;
  feelslike_c: number;
  uv: number;
  precip_mm: number;
}

export interface WeatherLocation {
  name: string;
  country: string;
  localtime: string;
}

export interface DayForecast {
  maxtemp_c: number;
  mintemp_c: number;
  daily_chance_of_rain: number;
  condition: WeatherCondition;
}

export interface HourForecast {
  time: string;
  temp_c: number;
  condition: WeatherCondition;
}

export interface ForecastDay {
  date: string;
  day: DayForecast;
  hour: HourForecast[];
}

export interface WeatherForecast {
  forecastday: ForecastDay[];
}

export interface WeatherData {
  location: WeatherLocation;
  current: WeatherCurrent;
  forecast: WeatherForecast;
}

export interface WeatherResponse {
  source: "weatherapi" | "gemini_grounding";
  data: WeatherData;
}

export interface WeatherInsight {
  summary: string;
  outfit: string;
  advice: string;
  tip: string;
}
