import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for AI Studio
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper: Standard WeatherAPI schema mapped for Gemini response schema
const weatherJsonSchema = {
  type: Type.OBJECT,
  properties: {
    location: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        country: { type: Type.STRING },
        localtime: { type: Type.STRING }
      },
      required: ["name", "country", "localtime"]
    },
    current: {
      type: Type.OBJECT,
      properties: {
        temp_c: { type: Type.NUMBER },
        condition: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            icon: { type: Type.STRING }
          },
          required: ["text", "icon"]
        },
        wind_kph: { type: Type.NUMBER },
        humidity: { type: Type.NUMBER },
        feelslike_c: { type: Type.NUMBER },
        uv: { type: Type.NUMBER },
        precip_mm: { type: Type.NUMBER }
      },
      required: ["temp_c", "condition", "wind_kph", "humidity", "feelslike_c", "uv", "precip_mm"]
    },
    forecast: {
      type: Type.OBJECT,
      properties: {
        forecastday: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              day: {
                type: Type.OBJECT,
                properties: {
                  maxtemp_c: { type: Type.NUMBER },
                  mintemp_c: { type: Type.NUMBER },
                  daily_chance_of_rain: { type: Type.NUMBER },
                  condition: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      icon: { type: Type.STRING }
                    },
                    required: ["text", "icon"]
                  }
                },
                required: ["maxtemp_c", "mintemp_c", "daily_chance_of_rain", "condition"]
              },
              hour: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.STRING },
                    temp_c: { type: Type.NUMBER },
                    condition: {
                      type: Type.OBJECT,
                      properties: {
                        text: { type: Type.STRING },
                        icon: { type: Type.STRING }
                      },
                      required: ["text", "icon"]
                    }
                  },
                  required: ["time", "temp_c", "condition"]
                }
              }
            },
            required: ["date", "day", "hour"]
          }
        }
      },
      required: ["forecastday"]
    }
  },
  required: ["location", "current", "forecast"]
};

// Route 1: Get weather data
app.get("/api/weather", async (req, res) => {
  const city = req.query.q || "Seoul";
  const apiKey = process.env.WEATHER_API_KEY;

  if (apiKey && apiKey.trim() !== "") {
    try {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(String(city))}&days=3&aqi=yes`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return res.json({ source: "weatherapi", data });
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn("WeatherAPI failed, falling back to Gemini:", errData.error?.message);
      }
    } catch (error) {
      console.error("WeatherAPI exception, falling back to Gemini:", error);
    }
  }

  // Fallback: Use Gemini Search Grounding to fetch the actual real-time weather
  try {
    const prompt = `Search the web for the current weather, temperature, humidity, wind, and 3-day forecast for "${city}" on today's date ${new Date().toLocaleDateString()}.
    Convert all temperatures to Celsius. Return the data exactly structured matching the JSON schema.
    Ensure 'localtime' contains the estimated current local time of the city.
    For 'condition.icon' field, use a fitting standard WeatherAPI icon URL (e.g. "//cdn.weatherapi.com/weather/64x64/day/113.png" for Sunny, "//cdn.weatherapi.com/weather/64x64/day/116.png" for Partly cloudy, "//cdn.weatherapi.com/weather/64x64/day/176.png" for patchy rain, "//cdn.weatherapi.com/weather/64x64/day/302.png" for rain, "//cdn.weatherapi.com/weather/64x64/day/122.png" for Overcast, etc.).
    Provide accurate real forecast hourly data points (estimate 4-6 key times, e.g. 09:00, 12:00, 15:00, 18:00, 21:00) for each day based on the search results.`;

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: weatherJsonSchema,
      },
    });

    const resultText = geminiResponse.text || "{}";
    const data = JSON.parse(resultText);
    res.json({ source: "gemini_grounding", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch weather from fallback" });
  }
});

// Route 2: Get AI custom weather insights & clothing recommendation in Korean
app.post("/api/weather/ai", async (req, res) => {
  const { city, weatherData } = req.body;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  try {
    const prompt = `
You are a friendly local weather companion.
Analyze this real-time weather data for "${city}" and provide beautiful, detailed summaries and suggestions in Korean.
Weather Data: ${JSON.stringify(weatherData)}

Please provide:
1. A warm greeting and a descriptive, beautiful Korean summary of today's weather condition.
2. An extensive clothing guide (outfit recommendation) based on the temperature, wind, and rain chances.
3. Useful practical advice (e.g. whether to bring an umbrella, laundry suitability, outdoor activities, uv precaution).
4. A friendly weather quote or sweet daily tip.

Please output the response exactly as a JSON object matching this schema:
{
  "summary": "오늘 서울은 대체로 맑고 선선하여...",
  "outfit": "가벼운 셔츠나 얇은 가디건을 추천드려요. 저녁에는 다소 쌀쌀할 수 있으니...",
  "advice": "자외선 지수가 높으니 선크림을 꼭 바르고 외출하세요. 빨래 건조에 완벽한 날씨입니다!",
  "tip": "맑은 하늘만큼 오늘 하루도 반짝반짝 빛나길 바랄게요! ☀️"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            outfit: { type: Type.STRING },
            advice: { type: Type.STRING },
            tip: { type: Type.STRING }
          },
          required: ["summary", "outfit", "advice", "tip"]
        }
      },
    });

    const resultText = response.text || "{}";
    res.json(JSON.parse(resultText));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to generate AI weather insights" });
  }
});

// Main Server Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
