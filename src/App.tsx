import React, { useState, useEffect } from "react";
import { 
  Search, 
  Wind, 
  Droplets, 
  Sun, 
  CloudRain, 
  MapPin, 
  Cpu, 
  TrendingUp, 
  Compass, 
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Shirt,
  CloudLightning,
  CloudSnow,
  Cloudy,
  Star,
  Trash2,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeatherData, WeatherInsight, WeatherResponse } from "./types";

const DOMESTIC_CITIES = [
  { name: "Seoul", label: "서울" },
  { name: "Busan", label: "부산" },
  { name: "Jeju", label: "제주" },
  { name: "Incheon", label: "인천" },
  { name: "Daegu", label: "대구" },
  { name: "Gwangju", label: "광주" },
  { name: "Daejeon", label: "대전" },
  { name: "Gangneung", label: "강릉" }
];

const GLOBAL_CITIES = [
  { name: "Tokyo", label: "도쿄" },
  { name: "New York", label: "뉴욕" },
  { name: "London", label: "런던" },
  { name: "Paris", label: "파리" },
  { name: "Sydney", label: "시드니" },
  { name: "Beijing", label: "베이징" },
  { name: "Singapore", label: "싱가포르" }
];

const SUB_REGIONS: Record<string, { name: string; label: string }[]> = {
  Seoul: [
    { name: "Gangnam-gu, Seoul", label: "강남구" },
    { name: "Mapo-gu, Seoul", label: "마포구" },
    { name: "Jongno-gu, Seoul", label: "종로구" },
    { name: "Seocho-gu, Seoul", label: "서초구" },
    { name: "Songpa-gu, Seoul", label: "송파구" },
    { name: "Yongsan-gu, Seoul", label: "용산구" },
    { name: "Yeongdeungpo-gu, Seoul", label: "영등포구" },
    { name: "Seodaemun-gu, Seoul", label: "서대문구" }
  ],
  Busan: [
    { name: "Haeundae, Busan", label: "해운대구" },
    { name: "Suyeong-gu, Busan", label: "수영구" },
    { name: "Saha-gu, Busan", label: "사하구" },
    { name: "Busanjin-gu, Busan", label: "부산진구" },
    { name: "Nampo-dong, Busan", label: "남포동" },
    { name: "Dongnae-gu, Busan", label: "동래구" }
  ],
  Jeju: [
    { name: "Jeju-si, Jeju", label: "제주시" },
    { name: "Seogwipo, Jeju", label: "서귀포시" },
    { name: "Aewol, Jeju", label: "애월읍" },
    { name: "Seongsan, Jeju", label: "성산읍" },
    { name: "Udo, Jeju", label: "우도면" },
    { name: "Hallasan, Jeju", label: "한라산" }
  ],
  Incheon: [
    { name: "Songdo, Incheon", label: "송도동" },
    { name: "Bupyeong, Incheon", label: "부평구" },
    { name: "Yeongjongdo, Incheon", label: "영종동" },
    { name: "Ganghwa, Incheon", label: "강화읍" },
    { name: "Namdong-gu, Incheon", label: "남동구" }
  ],
  Daegu: [
    { name: "Suseong-gu, Daegu", label: "수성구" },
    { name: "Jung-gu, Daegu", label: "중구 동성로" },
    { name: "Dalseo-gu, Daegu", label: "달서구" },
    { name: "Buk-gu, Daegu", label: "북구" },
    { name: "Dong-gu, Daegu", label: "동구" }
  ],
  Gwangju: [
    { name: "Dong-gu, Gwangju", label: "동구 충장로" },
    { name: "Seo-gu, Gwangju", label: "서구 치평동" },
    { name: "Nam-gu, Gwangju", label: "남구 양림동" },
    { name: "Gwangsan-gu, Gwangju", label: "광산구 수완동" }
  ],
  Daejeon: [
    { name: "Seo-gu, Daejeon", label: "서구 둔산동" },
    { name: "Yuseong-gu, Daejeon", label: "유성구 궁동" },
    { name: "Jung-gu, Daejeon", label: "중구 은행동" },
    { name: "Daedeok-gu, Daejeon", label: "대덕구 신탄진" }
  ],
  Gangneung: [
    { name: "Gyeongpo-dong, Gangneung", label: "경포동" },
    { name: "Jumunjin, Gangneung", label: "주문진읍" },
    { name: "Anmok, Gangneung", label: "안목(송정동)" },
    { name: "Chodang-dong, Gangneung", label: "초당동" }
  ]
};

export default function App() {
  const [cityInput, setCityInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("Seoul");
  const [selectedDomesticCity, setSelectedDomesticCity] = useState<string>("Seoul");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [source, setSource] = useState<"weatherapi" | "gemini_grounding" | null>(null);
  const [insight, setInsight] = useState<WeatherInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistence States
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("recent_searches");
      return saved ? JSON.parse(saved) : ["서울", "도쿄", "뉴욕"];
    } catch {
      return ["서울", "도쿄", "뉴욕"];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("favorite_cities");
      return saved ? JSON.parse(saved) : ["서울"];
    } catch {
      return ["서울"];
    }
  });

  const [activeTab, setActiveTab] = useState<"favorites" | "recent">("favorites");

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("recent_searches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    localStorage.setItem("favorite_cities", JSON.stringify(favorites));
  }, [favorites]);

  // Fetch weather data
  const fetchWeather = async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/weather?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "날씨 정보를 가져오는 데 실패했습니다.");
      }
      const resData: WeatherResponse = await response.json();
      setWeather(resData.data);
      setSource(resData.source);
      
      // Update recent searches list with actual resolved city name
      const cityLabel = resData.data.location.name;
      setRecentSearches(prev => {
        const filtered = prev.filter(c => c.toLowerCase() !== cityLabel.toLowerCase());
        return [cityLabel, ...filtered].slice(0, 8); // Keep up to 8 recent searches
      });

      // Fetch AI Insights for this weather data
      fetchAiInsights(resData.data.location.name, resData.data);
    } catch (err: any) {
      setError(err.message || "날씨를 불러오는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch AI insights from the weather data
  const fetchAiInsights = async (cityName: string, data: WeatherData) => {
    setLoadingAi(true);
    setInsight(null);
    try {
      const response = await fetch("/api/weather/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: cityName, weatherData: data }),
      });
      if (response.ok) {
        const insightData: WeatherInsight = await response.json();
        setInsight(insightData);
      } else {
        console.warn("AI insights failed to generate.");
      }
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Toggle favorite city status
  const toggleFavorite = (cityName: string) => {
    setFavorites(prev => {
      const isFav = prev.some(c => c.toLowerCase() === cityName.toLowerCase());
      if (isFav) {
        return prev.filter(c => c.toLowerCase() !== cityName.toLowerCase());
      } else {
        return [...prev, cityName];
      }
    });
  };

  const removeRecent = (cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(c => c !== cityName));
  };

  const removeFavorite = (cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(c => c !== cityName));
  };

  // Geolocation weather retrieval
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("이 브라우저는 위치 서비스를 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const query = `${position.coords.latitude},${position.coords.longitude}`;
        fetchWeather(query);
      },
      (err) => {
        console.error(err);
        setError("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchWeather(searchQuery);

    // Sync selectedDomesticCity based on searchQuery
    const matchedMain = DOMESTIC_CITIES.find(c => c.name.toLowerCase() === searchQuery.toLowerCase());
    if (matchedMain) {
      setSelectedDomesticCity(matchedMain.name);
      return;
    }

    // If query is one of the sub-regions, match parent
    for (const [parentCity, subs] of Object.entries(SUB_REGIONS)) {
      if (subs.some(sub => sub.name.toLowerCase() === searchQuery.toLowerCase())) {
        setSelectedDomesticCity(parentCity);
        return;
      }
    }

    // If query matches a global city, clear selection
    const matchedGlobal = GLOBAL_CITIES.find(c => c.name.toLowerCase() === searchQuery.toLowerCase());
    if (matchedGlobal) {
      setSelectedDomesticCity("");
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInput.trim()) {
      setSearchQuery(cityInput.trim());
      setCityInput("");
    }
  };

  // Determine dynamic theme gradients based on weather condition & local time
  const getThemeClass = () => {
    if (!weather) return "from-slate-800 to-slate-900 text-white";

    const conditionText = weather.current.condition.text.toLowerCase();
    const isRainy = conditionText.includes("rain") || conditionText.includes("drizzle") || conditionText.includes("shower") || conditionText.includes("비");
    const isThunder = conditionText.includes("thunder") || conditionText.includes("storm") || conditionText.includes("번개");
    const isSnowy = conditionText.includes("snow") || conditionText.includes("ice") || conditionText.includes("sleet") || conditionText.includes("freezing") || conditionText.includes("눈");
    const isCloudy = conditionText.includes("cloud") || conditionText.includes("overcast") || conditionText.includes("fog") || conditionText.includes("mist") || conditionText.includes("흐림") || conditionText.includes("구름");

    let isNight = false;
    try {
      const localTimeStr = weather.location.localtime;
      if (localTimeStr) {
        const timePart = localTimeStr.split(" ")[1];
        if (timePart) {
          const hour = parseInt(timePart.split(":")[0], 10);
          if (hour >= 19 || hour < 6) {
            isNight = true;
          }
        }
      }
    } catch (e) {
      console.error("Local time parsing error:", e);
    }

    if (isNight) {
      return "from-slate-950 via-indigo-950 to-slate-900 text-slate-100";
    }
    if (isThunder) {
      return "from-stone-900 via-neutral-800 to-slate-900 text-orange-50";
    }
    if (isRainy) {
      return "from-sky-950 via-slate-800 to-zinc-900 text-sky-100";
    }
    if (isSnowy) {
      return "from-cyan-900 via-sky-800 to-slate-800 text-cyan-50";
    }
    if (isCloudy) {
      return "from-blue-900 via-slate-800 to-stone-800 text-blue-50";
    }

    // Default Clear/Sunny day
    return "from-amber-600 via-orange-500 to-blue-600 text-white";
  };

  // Helper to translate weather condition text to Korean elegantly
  const translateCondition = (text: string) => {
    const term = text.toLowerCase();
    if (term.includes("sunny") || term.includes("clear")) return "맑음 ☀️";
    if (term.includes("partly cloudy")) return "구름 조금 ⛅";
    if (term.includes("cloudy")) return "흐림 ☁️";
    if (term.includes("overcast")) return "매우 흐림 🌫️";
    if (term.includes("mist") || term.includes("fog")) return "안개 🌫️";
    if (term.includes("patchy rain") || term.includes("drizzle")) return "보슬비 🌧️";
    if (term.includes("light rain") || term.includes("showers")) return "가벼운 비 🌧️";
    if (term.includes("heavy rain") || term.includes("moderate rain")) return "강한 비 ☔";
    if (term.includes("thunderstorm") || term.includes("thunder")) return "뇌우 ⚡";
    if (term.includes("snow") || term.includes("sleet")) return "눈 ❄️";
    return text;
  };

  // Helper to format date beautifully in Korean
  const formatDateKorean = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]}요일)`;
    } catch {
      return dateStr;
    }
  };

  const currentTheme = getThemeClass();
  const isCurrentFavorite = weather ? favorites.some(c => c.toLowerCase() === weather.location.name.toLowerCase()) : false;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentTheme} transition-all duration-1000 ease-in-out font-sans p-4 md:p-8 flex flex-col justify-between overflow-x-hidden`}>
      
      {/* HEADER SECTION */}
      <header className="max-w-4xl mx-auto w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
              <Sun className="h-7 w-7 text-amber-300 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <h1 id="app-title" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                오늘의 날씨 <span className="text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">LIVE</span>
              </h1>
              <p className="text-xs text-white/70">WeatherAPI + Gemini 실시간 날씨 정보</p>
            </div>
          </div>

          {/* Quick Location Buttons */}
          <div className="flex items-center gap-2">
            <button 
              id="geo-btn"
              onClick={handleGeolocation}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 active:scale-95 transition backdrop-blur-md rounded-xl border border-white/20 text-xs text-white font-medium shadow-md"
            >
              <MapPin className="h-4 w-4 text-emerald-300" />
              내 위치 날씨
            </button>
            <button 
              id="refresh-btn"
              onClick={() => fetchWeather(searchQuery)}
              className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition backdrop-blur-md rounded-xl border border-white/20 text-white shadow-md"
              title="날씨 새로고침"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form id="search-form" onSubmit={handleSearchSubmit} className="relative w-full mb-4">
          <div className="relative flex items-center">
            <input
              id="city-search"
              type="text"
              placeholder="도시 이름을 입력하세요 (예: 서울, 제주, New York, Tokyo)..."
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              className="w-full pl-11 pr-24 py-3.5 bg-white/15 focus:bg-white/20 border border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/10 rounded-2xl text-white placeholder-white/50 text-sm outline-none backdrop-blur-md shadow-inner transition-all"
            />
            <div className="absolute left-4 text-white/60">
              <Search className="h-5 w-5" />
            </div>
            <button
              id="submit-search"
              type="submit"
              className="absolute right-2 px-4 py-2 bg-white text-slate-900 text-xs font-semibold rounded-xl hover:bg-white/90 active:scale-95 transition shadow-md"
            >
              검색하기
            </button>
          </div>
        </form>

        {/* PERSISTENT SAVED CITIES TABS & CHIPS */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 mb-4 shadow-lg">
          <div className="flex border-b border-white/10 pb-2 mb-2 justify-between items-center">
            <div className="flex gap-4">
              <button
                id="tab-favorites"
                onClick={() => setActiveTab("favorites")}
                className={`text-xs font-bold pb-1 transition-all flex items-center gap-1 relative ${
                  activeTab === "favorites" ? "text-amber-300" : "text-white/60 hover:text-white"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${activeTab === "favorites" ? "fill-amber-300 text-amber-300" : ""}`} />
                ★ 즐겨찾는 도시 ({favorites.length})
                {activeTab === "favorites" && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-300" />
                )}
              </button>
              <button
                id="tab-recent"
                onClick={() => setActiveTab("recent")}
                className={`text-xs font-bold pb-1 transition-all flex items-center gap-1 relative ${
                  activeTab === "recent" ? "text-sky-300" : "text-white/60 hover:text-white"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                🕒 최근 검색한 도시 ({recentSearches.length})
                {activeTab === "recent" && (
                  <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-300" />
                )}
              </button>
            </div>
            
            {/* Clear All Option */}
            <button
              onClick={() => {
                if (activeTab === "favorites") {
                  setFavorites([]);
                } else {
                  setRecentSearches([]);
                }
              }}
              className="text-[10px] text-white/50 hover:text-rose-300 flex items-center gap-0.5 transition"
              title="모두 비우기"
            >
              <Trash2 className="h-3 w-3" />
              전체 비우기
            </button>
          </div>

          {/* Chips Grid */}
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {activeTab === "favorites" ? (
              favorites.length === 0 ? (
                <p className="text-[11px] text-white/50 py-1.5 px-1">즐겨찾는 도시가 없습니다. 날씨 카드에서 별표(★)를 눌러 등록해보세요!</p>
              ) : (
                favorites.map((favCity) => (
                  <div
                    key={favCity}
                    onClick={() => setSearchQuery(favCity)}
                    className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer text-xs font-medium text-white transition border border-white/5"
                  >
                    <span>{favCity}</span>
                    <button
                      onClick={(e) => removeFavorite(favCity, e)}
                      className="p-0.5 hover:bg-rose-500/20 rounded text-amber-300 hover:text-rose-300 transition"
                      title="즐겨찾기 삭제"
                    >
                      ★
                    </button>
                  </div>
                ))
              )
            ) : (
              recentSearches.length === 0 ? (
                <p className="text-[11px] text-white/50 py-1.5 px-1">최근 검색 기록이 없습니다. 새로운 도시를 검색해보세요!</p>
              ) : (
                recentSearches.map((recCity) => (
                  <div
                    key={recCity}
                    onClick={() => setSearchQuery(recCity)}
                    className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer text-xs font-medium text-white transition border border-white/5"
                  >
                    <span>{recCity}</span>
                    <button
                      onClick={(e) => removeRecent(recCity, e)}
                      className="p-0.5 hover:bg-rose-500/20 rounded text-white/40 hover:text-rose-300 transition"
                      title="검색기록 삭제"
                    >
                      ×
                    </button>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* RECOMMENDED CITIES ROW (DOMESTIC & GLOBAL SEPARATED) */}
        <div id="city-chips-container" className="space-y-3 mb-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <span className="text-xs text-amber-300 font-bold min-w-[120px] flex items-center gap-1">
              🇰🇷 대한민국 주요 도시
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DOMESTIC_CITIES.map((city) => (
                <button
                  key={city.name}
                  id={`chip-domestic-${city.name.toLowerCase()}`}
                  onClick={() => setSearchQuery(city.name)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                    searchQuery.toLowerCase() === city.name.toLowerCase()
                      ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md scale-105"
                      : "bg-white/5 text-white hover:bg-white/15 border-white/10"
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 my-2"></div>

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <span className="text-xs text-sky-300 font-bold min-w-[120px] flex items-center gap-1">
              🌐 글로벌 주요 도시
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GLOBAL_CITIES.map((city) => (
                <button
                  key={city.name}
                  id={`chip-global-${city.name.toLowerCase()}`}
                  onClick={() => setSearchQuery(city.name)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                    searchQuery.toLowerCase() === city.name.toLowerCase()
                      ? "bg-sky-400 text-slate-950 border-sky-400 shadow-md scale-105"
                      : "bg-white/5 text-white hover:bg-white/15 border-white/10"
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          {selectedDomesticCity && SUB_REGIONS[selectedDomesticCity] && (
            <>
              <div className="border-t border-white/5 my-2"></div>
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white/5 rounded-xl p-3 border border-white/5 mt-2"
              >
                <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-amber-200">
                  <MapPin className="h-3.5 w-3.5 text-rose-300" />
                  <span>{DOMESTIC_CITIES.find(c => c.name === selectedDomesticCity)?.label}의 세부 구/동 선택:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SUB_REGIONS[selectedDomesticCity].map((sub) => {
                    const isSubActive = searchQuery.toLowerCase() === sub.name.toLowerCase();
                    return (
                      <button
                        key={sub.name}
                        onClick={() => setSearchQuery(sub.name)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all border ${
                          isSubActive
                            ? "bg-amber-300 text-slate-950 border-amber-300 font-bold scale-105 shadow-md"
                            : "bg-white/5 text-white/80 hover:bg-white/10 border-white/10 hover:text-white"
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="max-w-4xl mx-auto w-full flex-grow grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Loading and Error Overlays */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-12 flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <Cpu className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/80 animate-pulse h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">실시간 날씨 검색 중...</h3>
              <p className="text-xs text-white/60 mt-1">지역 정보를 파악하여 상세 날씨를 구성하고 있습니다.</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="col-span-12 bg-red-950/40 border border-red-500/30 backdrop-blur-md rounded-3xl p-6 text-center"
            >
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3 animate-bounce" />
              <h3 className="text-lg font-bold text-red-200">날씨 정보를 찾지 못했습니다</h3>
              <p className="text-sm text-red-300/80 mt-1">{error}</p>
              <button 
                onClick={() => setSearchQuery("Seoul")}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/10 transition"
              >
                서울 날씨로 되돌아가기
              </button>
            </motion.div>
          ) : weather ? (
            <React.Fragment key="weather-view">
              
              {/* LEFT SIDE: Current Weather display & details (8 Cols on Desktop) */}
              <div className="col-span-12 md:col-span-7 flex flex-col gap-6">
                
                {/* CURRENT WEATHER MAIN CARD */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  id="main-weather-card"
                  className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/25 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[300px]"
                >
                  {/* Glowing background blob */}
                  <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl animate-bg-pulse"></div>
                  
                  {/* Top Bar inside Card */}
                  <div className="flex justify-between items-start z-10">
                    <div>
                      <div className="flex items-center gap-1.5 text-white/95">
                        <MapPin className="h-4.5 w-4.5 text-red-300" />
                        <h2 className="text-2xl font-bold tracking-tight">{weather.location.name}</h2>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-md ml-1.5 font-medium">{weather.location.country}</span>
                        
                        {/* Toggle Favorite Star Button */}
                        <button
                          onClick={() => toggleFavorite(weather.location.name)}
                          className="ml-2 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-amber-300 shadow-md border border-white/10 flex items-center justify-center"
                          title={isCurrentFavorite ? "즐겨찾기 해제" : "즐겨찾는 도시에 추가"}
                        >
                          <Star className={`h-4.5 w-4.5 ${isCurrentFavorite ? "fill-amber-300 text-amber-300 animate-pulse" : "text-white/60"}`} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/70 mt-1 font-mono">
                        <Clock className="h-3.5 w-3.5" />
                        <span>관측 시각: {weather.location.localtime.split(" ")[1] || weather.location.localtime}</span>
                      </div>
                    </div>
                    
                    {/* Source Badge */}
                    <div className="flex flex-col items-end">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1.5 rounded-full border shadow-sm ${
                        source === "weatherapi" 
                          ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" 
                          : "bg-purple-500/20 text-purple-200 border-purple-500/30"
                      }`}>
                        {source === "weatherapi" ? "Direct API" : "Gemini AI Search"}
                      </span>
                    </div>
                  </div>

                  {/* Temperature & Icon Layout */}
                  <div className="flex items-center justify-between my-6 z-10">
                    <div className="flex flex-col">
                      <div className="flex items-start">
                        <span className="text-7xl font-extrabold tracking-tighter text-white drop-shadow-md">
                          {Math.round(weather.current.temp_c)}
                        </span>
                        <span className="text-3xl font-semibold text-white/90 mt-2">°C</span>
                      </div>
                      <p className="text-lg font-medium text-white/90 mt-1">
                        {translateCondition(weather.current.condition.text)}
                      </p>
                      <p className="text-xs text-white/70 mt-1">
                        체감 온도 <span className="font-semibold text-white">{Math.round(weather.current.feelslike_c)}°C</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center relative">
                      <img 
                        src={weather.current.condition.icon.startsWith("//") ? `https:${weather.current.condition.icon}` : weather.current.condition.icon} 
                        alt={weather.current.condition.text}
                        referrerPolicy="no-referrer"
                        className="h-28 w-28 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] transform hover:scale-110 transition duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://cdn.weatherapi.com/weather/64x64/day/116.png";
                        }}
                      />
                    </div>
                  </div>

                  {/* Today's High and Low Forecast */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 z-10 text-xs text-white/80">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-rose-300" />
                      </div>
                      <div>
                        <p className="text-white/50 text-[10px] uppercase">최고 기온</p>
                        <p className="font-semibold text-white text-sm">
                          {Math.round(weather.forecast.forecastday[0]?.day.maxtemp_c ?? weather.current.temp_c + 2)}°C
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white/10 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-blue-300 rotate-180" />
                      </div>
                      <div>
                        <p className="text-white/50 text-[10px] uppercase">최저 기온</p>
                        <p className="font-semibold text-white text-sm">
                          {Math.round(weather.forecast.forecastday[0]?.day.mintemp_c ?? weather.current.temp_c - 4)}°C
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ADDITIONAL METRICS GRID */}
                <div id="weather-metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Metric 1: Humidity */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60 font-medium">습도</span>
                      <Droplets className="h-5 w-5 text-sky-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{weather.current.humidity}%</p>
                      <p className="text-[10px] text-white/50 mt-1">
                        {weather.current.humidity > 70 ? "꿉꿉한 공기 💦" : weather.current.humidity < 30 ? "건조해요 🍂" : "쾌적한 공기 😊"}
                      </p>
                    </div>
                  </div>

                  {/* Metric 2: Wind */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60 font-medium">바람</span>
                      <Wind className="h-5 w-5 text-teal-200" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{weather.current.wind_kph} km/h</p>
                      <p className="text-[10px] text-white/50 mt-1">
                        {weather.current.wind_kph > 20 ? "강한 바람 🌬️" : "가벼운 산들바람 🍃"}
                      </p>
                    </div>
                  </div>

                  {/* Metric 3: Rain Chance */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60 font-medium">강수 확률</span>
                      <CloudRain className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {weather.forecast.forecastday[0]?.day.daily_chance_of_rain ?? 0}%
                      </p>
                      <p className="text-[10px] text-white/50 mt-1">
                        {(weather.forecast.forecastday[0]?.day.daily_chance_of_rain ?? 0) > 40 ? "우산 꼭 챙기세요! ☔" : "비 소식 없음 ☀️"}
                      </p>
                    </div>
                  </div>

                  {/* Metric 4: UV Index */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col justify-between shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/60 font-medium">자외선 지수</span>
                      <Sun className="h-5 w-5 text-amber-300 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{weather.current.uv}</p>
                      <p className="text-[10px] text-white/50 mt-1">
                        {weather.current.uv >= 6 ? "자외선 차단 필수 🧴" : "자외선 보통 😎"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* HOURLY FORECAST SCROLL ROW */}
                <div id="hourly-forecast-container" className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/15 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4.5 w-4.5 text-white/80" />
                    <h3 className="text-sm font-semibold text-white">오늘의 시간대별 날씨</h3>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                    {weather.forecast.forecastday[0]?.hour ? (
                      weather.forecast.forecastday[0].hour
                        .filter((_, i) => i % 2 === 0)
                        .map((h, index) => {
                          const hourStr = h.time.split(" ")[1] || h.time;
                          return (
                            <div 
                              key={index}
                              className="flex flex-col items-center min-w-[70px] bg-white/5 rounded-xl py-3 px-2 border border-white/10"
                            >
                              <span className="text-[11px] text-white/60 font-mono">{hourStr}</span>
                              <img 
                                src={h.condition.icon.startsWith("//") ? `https:${h.condition.icon}` : h.condition.icon} 
                                alt={h.condition.text}
                                referrerPolicy="no-referrer"
                                className="h-10 w-10 object-contain my-1 filter drop-shadow"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://cdn.weatherapi.com/weather/64x64/day/116.png";
                                }}
                              />
                              <span className="text-sm font-bold text-white">{Math.round(h.temp_c)}°</span>
                              <span className="text-[10px] text-white/50 mt-0.5 max-w-[60px] text-center truncate">
                                {translateCondition(h.condition.text).split(" ")[0]}
                              </span>
                            </div>
                          );
                        })
                    ) : (
                      <p className="text-xs text-white/50 w-full text-center py-4">시간대별 데이터를 표시할 수 없습니다.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT SIDE: AI Companion & Weekly Forecast (5 Cols on Desktop) */}
              <div className="col-span-12 md:col-span-5 flex flex-col gap-6">
                
                {/* AI COMPANION (WEATHER BOT) */}
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  id="ai-companion-card"
                  className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-5 border border-white/15 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>

                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-xl text-white shadow-md animate-pulse">
                        <Sparkles className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-1">
                          AI 날씨 비서
                        </h3>
                        <p className="text-[10px] text-purple-300">실시간 상황 맞춤형 코디 & 일상 제안</p>
                      </div>
                    </div>

                    <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/30 font-semibold font-mono">
                      Gemini 3.5
                    </span>
                  </div>

                  <AnimatePresence mode="wait">
                    {loadingAi ? (
                      <div key="ai-loading" className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-8 h-8 border-3 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mb-3"></div>
                        <p className="text-xs text-white/70 font-medium">기온과 바람, 강수 확률을 연산하여</p>
                        <p className="text-[10px] text-white/50">맞춤형 코디를 설계하고 있습니다...</p>
                      </div>
                    ) : insight ? (
                      <motion.div 
                        key="ai-insight"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Summary Block */}
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1">
                            <Compass className="h-3.5 w-3.5" /> 오늘 날씨 요약
                          </p>
                          <p className="text-xs leading-relaxed text-white/90">
                            {insight.summary}
                          </p>
                        </div>

                        {/* Outfit Block */}
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-xs font-semibold text-emerald-300 mb-1 flex items-center gap-1">
                            <Shirt className="h-3.5 w-3.5" /> 추천 코디 스타일
                          </p>
                          <p className="text-xs leading-relaxed text-white/90">
                            {insight.outfit}
                          </p>
                        </div>

                        {/* Advice Block */}
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                          <p className="text-xs font-semibold text-sky-300 mb-1 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> 일상 생활 꿀팁
                          </p>
                          <p className="text-xs leading-relaxed text-white/90">
                            {insight.advice}
                          </p>
                        </div>

                        {/* Daily Tip Block */}
                        <div className="bg-indigo-500/10 rounded-2xl p-3.5 border border-indigo-500/20 text-center">
                          <p className="text-xs italic text-indigo-200">
                            "{insight.tip}"
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-6 text-xs text-white/50">
                        <AlertCircle className="h-8 w-8 text-white/20 mx-auto mb-2" />
                        AI 코멘트를 구성하지 못했습니다. 상단 새로고침을 눌러주세요.
                      </div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* 3-DAY WEEKLY FORECAST CARD */}
                <div id="weekly-forecast-card" className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/15 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4.5 w-4.5 text-white/80" />
                    <h3 className="text-sm font-semibold text-white">주간 예보 (3일)</h3>
                  </div>

                  <div className="space-y-3">
                    {weather.forecast.forecastday.map((day, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between py-2.5 px-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">
                            {index === 0 ? "오늘" : index === 1 ? "내일" : formatDateKorean(day.date)}
                          </span>
                          <span className="text-[10px] text-white/50 font-mono">{day.date}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <img 
                            src={day.day.condition.icon.startsWith("//") ? `https:${day.day.condition.icon}` : day.day.condition.icon} 
                            alt={day.day.condition.text}
                            referrerPolicy="no-referrer"
                            className="h-10 w-10 object-contain filter drop-shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://cdn.weatherapi.com/weather/64x64/day/116.png";
                            }}
                          />
                          <span className="text-xs text-white/80 font-medium">
                            {translateCondition(day.day.condition.text).split(" ")[0]}
                          </span>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="text-xs font-bold text-white">
                            <span className="text-rose-300">{Math.round(day.day.maxtemp_c)}°</span>
                            <span className="text-white/40 mx-1">/</span>
                            <span className="text-sky-300">{Math.round(day.day.mintemp_c)}°</span>
                          </div>
                          <span className="text-[9px] text-sky-200 flex items-center gap-0.5 mt-0.5">
                            <CloudRain className="h-3 w-3" />
                            {day.day.daily_chance_of_rain}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </React.Fragment>
          ) : (
            <div className="col-span-12 text-center py-20">
              <p className="text-white/50 text-sm">로딩 중이거나 알 수 없는 에러가 발생했습니다.</p>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* FOOTER SECTION */}
      <footer className="max-w-4xl mx-auto w-full mt-8 pt-4 border-t border-white/10 text-center flex flex-col sm:flex-row sm:justify-between items-center gap-3 text-[11px] text-white/50">
        <div>
          <p>© 2026 Today's Weather. All Rights Reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <span>개발자 이메일: coolfacejh@gmail.com</span>
          <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded">v1.2.0 Full-Stack</span>
        </div>
      </footer>

    </div>
  );
}
