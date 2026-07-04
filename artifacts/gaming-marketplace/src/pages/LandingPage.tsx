import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, Star, Crown, ChevronRight, ChevronDown, X, Clock, TrendingUp, Loader2, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocale, LANGUAGES, CURRENCIES } from "@/lib/locale";

const SERVICES = [
  { label: "All Categories", bg: "linear-gradient(135deg,#6366f1,#8b5cf6)", icon: "M4 6h16M4 12h16M4 18h10" },
  { label: "Sellers",   bg: "linear-gradient(135deg,#0ea5e9,#6366f1)", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { label: "Currency",   bg: "linear-gradient(135deg,#f59e0b,#f97316)", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { label: "Accounts",   bg: "linear-gradient(135deg,#3b82f6,#06b6d4)", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { label: "Top Up",     bg: "linear-gradient(135deg,#10b981,#14b8a6)", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { label: "Items",      bg: "linear-gradient(135deg,#a855f7,#ec4899)", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
  { label: "Boosting",   bg: "linear-gradient(135deg,#ef4444,#f97316)", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { label: "Gift Cards", bg: "linear-gradient(135deg,#ec4899,#f43f5e)", icon: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" },
];

const POPULAR_CATEGORIES = [
  { label: "Fortnite Accounts",        category: "Accounts",   color: "#3b82f6" },
  { label: "Valorant Accounts",        category: "Accounts",   color: "#3b82f6" },
  { label: "Apex Legends Accounts",    category: "Accounts",   color: "#3b82f6" },
  { label: "CS2 Accounts",             category: "Accounts",   color: "#3b82f6" },
  { label: "WoW Gold",                 category: "Currency",   color: "#f59e0b" },
  { label: "FC 24 Coins",              category: "Currency",   color: "#f59e0b" },
  { label: "Path of Exile Currency",   category: "Currency",   color: "#f59e0b" },
  { label: "Runescape Gold",           category: "Currency",   color: "#f59e0b" },
  { label: "Valorant Boosting",        category: "Boosting",   color: "#ef4444" },
  { label: "League of Legends Boosting", category: "Boosting", color: "#ef4444" },
  { label: "Apex Legends Boosting",    category: "Boosting",   color: "#ef4444" },
  { label: "CS2 Boosting",             category: "Boosting",   color: "#ef4444" },
  { label: "Genshin Impact Top Up",    category: "Top Up",     color: "#10b981" },
  { label: "Roblox Top Up",            category: "Top Up",     color: "#10b981" },
  { label: "Mobile Legends Top Up",    category: "Top Up",     color: "#10b981" },
  { label: "PUBG Mobile Top Up",       category: "Top Up",     color: "#10b981" },
  { label: "CS2 Items",                category: "Items",      color: "#a855f7" },
  { label: "Dota 2 Items",             category: "Items",      color: "#a855f7" },
  { label: "Rocket League Items",      category: "Items",      color: "#a855f7" },
  { label: "TF2 Items",                category: "Items",      color: "#a855f7" },
  { label: "Steam Gift Cards",         category: "Gift Cards", color: "#ec4899" },
  { label: "PSN Gift Cards",           category: "Gift Cards", color: "#ec4899" },
  { label: "Xbox Gift Cards",          category: "Gift Cards", color: "#ec4899" },
  { label: "Google Play Gift Cards",   category: "Gift Cards", color: "#ec4899" },
  { label: "ShadowStriker Store",      category: "Sellers",    color: "#0ea5e9" },
  { label: "ElvenMerchant Store",      category: "Sellers",    color: "#0ea5e9" },
  { label: "TacticalGear Store",       category: "Sellers",    color: "#0ea5e9" },
  { label: "NinjaBoosts Store",        category: "Sellers",    color: "#0ea5e9" },
];

const SEARCH_DATA = [
  { label: "Fortnite Accounts",        category: "Accounts"   },
  { label: "Fortnite V-Bucks",         category: "Currency"   },
  { label: "Fortnite Boosting",        category: "Boosting"   },
  { label: "Fortnite Gift Cards",      category: "Gift Cards" },
  { label: "Fortnite Items",           category: "Items"      },
  { label: "WoW Gold",                 category: "Currency"   },
  { label: "WoW Accounts",             category: "Accounts"   },
  { label: "WoW Boosting",             category: "Boosting"   },
  { label: "Valorant Accounts",        category: "Accounts"   },
  { label: "Valorant Boosting",        category: "Boosting"   },
  { label: "Valorant Items",           category: "Items"      },
  { label: "CS2 Items",                category: "Items"      },
  { label: "CS2 Accounts",             category: "Accounts"   },
  { label: "CS2 Boosting",             category: "Boosting"   },
  { label: "Genshin Impact Top Up",    category: "Top Up"     },
  { label: "Genshin Impact Accounts",  category: "Accounts"   },
  { label: "Apex Legends Accounts",    category: "Accounts"   },
  { label: "Apex Legends Boosting",    category: "Boosting"   },
  { label: "League of Legends Boosting", category: "Boosting" },
  { label: "League of Legends Accounts", category: "Accounts" },
  { label: "Dota 2 Items",             category: "Items"      },
  { label: "Dota 2 Boosting",          category: "Boosting"   },
  { label: "Roblox Top Up",            category: "Top Up"     },
  { label: "Steam Gift Cards",         category: "Gift Cards" },
  { label: "PSN Gift Cards",           category: "Gift Cards" },
  { label: "Xbox Gift Cards",          category: "Gift Cards" },
  { label: "Rocket League Items",      category: "Items"      },
  { label: "Elden Ring Accounts",      category: "Accounts"   },
  { label: "FC 24 Coins",              category: "Currency"   },
  { label: "Path of Exile Currency",   category: "Currency"   },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Accounts":   "#3b82f6",
  "Currency":   "#f59e0b",
  "Boosting":   "#ef4444",
  "Top Up":     "#10b981",
  "Items":      "#a855f7",
  "Gift Cards": "#ec4899",
  "Sellers":    "#0ea5e9",
};

// Eldorado-style rating tiers: 90-100% green, 50-89.9% yellow, <50% red
const ratingColor = (pct: number) => (pct >= 90 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444");

const MOCK_OFFERS = [
  { id: 1, game: "Elden Ring", type: "Max Level Account", price: "249.99", rating: "98.4", seller: "ShadowStriker" },
  { id: 2, game: "Valorant", type: "Immortal Rank Boost", price: "89.00", rating: "100", seller: "ProBoostKing" },
  { id: 3, game: "WoW", type: "100K Gold", price: "12.99", rating: "96.2", seller: "GoldFarmer99" },
  { id: 4, game: "Apex Legends", type: "Predator Account", price: "150.00", rating: "94.5", seller: "NinjaBoosts" },
  { id: 5, game: "League of Legends", type: "Diamond Smurf", price: "45.00", rating: "97.7", seller: "ElvenMerchant" },
  { id: 6, game: "FC 24", type: "1M Coins", price: "22.50", rating: "91.8", seller: "TacticalGear" },
  { id: 7, game: "CS2", type: "Faceit Lvl 10 Boost", price: "110.00", rating: "99.1", seller: "ProBoostKing" },
  { id: 8, game: "Final Fantasy XIV", type: "Mythic Mount", price: "75.00", rating: "95.6", seller: "ElvenMerchant" },
  { id: 9, game: "Fortnite", type: "Master Rank Carry", price: "55.00", rating: "98.0", seller: "NinjaBoosts" },
  { id: 10, game: "Dota 2", type: "Grandmaster Coaching", price: "30.00", rating: "100", seller: "ShadowStriker" },
  { id: 11, game: "Rocket League", type: "Credits 10k", price: "15.99", rating: "93.4", seller: "TacticalGear" },
  { id: 12, game: "Genshin Impact", type: "Savage Raid Clear", price: "40.00", rating: "96.9", seller: "GoldFarmer99" },
];

const CATEGORY_DATA: Record<string, { popular: string[]; all: string[] }> = {
  Currency: {
    popular: ["EA Sports FC Coins","DonutSMP Money","Roblox Robux","Blade Ball Tokens","World of Warcraft Gold","Grow a Garden 2 Shackles","Path of Exile 2 Currency","Old School RuneScape Gold","WoW Classic Era Gold","Pet Simulator 99 Gems","Grow a Garden Tokens","MLB: The Show Stubs"],
    all: ["8 Ball Pool Coins","Aion 2 Kinah","Albion Online Silver","Arc Raiders Coins","Black Desert Online Silver","Blade Ball Tokens","Dark and Darker Gold","Diablo 4 Gold","DonutSMP Money","Dune: Awakening Solaris","EA Sports FC Coins","Elden Ring Runes","Elder Scrolls Online Gold","Escape From Tarkov Roubles","EVE Online ISK","Fallout 76 Caps","Final Fantasy XIV Gil","Forza Horizon 5 Credits","Grow a Garden 2 Shackles","Grow a Garden Tokens","Guild Wars 2 Gold","Lost Ark Gold","Minecraft Hypixel Coins","New World Coins","Old School RuneScape Gold","Path of Exile 2 Currency","Pet Simulator 99 Gems","Pokemon Go Stardust","Roblox Robux","RuneScape 3 Gold","Throne and Liberty Lucent","Warframe Platinum","World of Warcraft Gold","WoW Classic Era Gold"],
  },
  Accounts: {
    popular: ["Fortnite","Valorant","Roblox","Minecraft","Counter-Strike 2","Grand Theft Auto 5","Rainbow Six Siege X","League of Legends","Call of Duty","Pokemon Go","Rocket League"],
    all: ["8 Ball Pool","Adopt Me","Apex Legends","Arc Raiders","Battlefield","Brawl Stars","Call of Duty","Clash of Clans","Counter-Strike 2","Dark and Darker","Dead by Daylight","Destiny 2","Diablo 4","Diablo Immortal","Dota 2","EA Sports FC","Elden Ring","Escape from Tarkov","Fortnite","Genshin Impact","Grand Theft Auto 5","Grow a Garden","Honkai: Star Rail","League of Legends","Minecraft","Mobile Legends","Overwatch","Path of Exile 2","Pokemon Go","PUBG","PUBG Mobile","Rainbow Six Siege X","Roblox","Rocket League","Rust","Valorant","World of Tanks","World of Warcraft","Wuthering Waves","Zenless Zone Zero"],
  },
  "Top Up": {
    popular: ["Pokemon Go Top Ups","Genshin Impact Top Ups","Apex Legends Top Ups","Zenless Zone Zero Monochromes","Spotify Subscription","EA Sports FC Points","Valorant Points","Fortnite V-Bucks","Roblox Top Ups","Call of Duty Points","Minecraft Minecoins","Mobile Legends Diamonds"],
    all: ["Amazon Subscription","Apex Legends Top Ups","Brawl Stars Gems","Call of Duty Points","ChatGPT Subscription","Clash of Clans Gems","Crunchyroll Subscription","Dead by Daylight Auric Cells","EA Sports FC Points","Fortnite V-Bucks","Garena Free Fire Diamonds","Genshin Impact Top Ups","Honkai: Star Rail Oneric Shards","League of Legends Riot Points","Marvel Rivals Lattice","Minecraft Minecoins","Mobile Legends Diamonds","Nintendo Subscription","Overwatch Coins","PlayStation Subscription","PUBG G-Coins","Rainbow Six Siege X Credits","Roblox Top Ups","Rocket League Credits","Spotify Subscription","TikTok Coins","Valorant Points","Xbox Game Pass","Zenless Zone Zero Monochromes"],
  },
  Items: {
    popular: ["Grow a Garden 2","Arc Raiders","Adopt Me","Old School RuneScape","Roblox Limiteds","Fisch","Steal a Brainrot","Murder Mystery 2","Roblox","Fortnite","Blox Fruits","Minecraft Hypixel Items"],
    all: ["Adopt Me","Albion Online","Anime Defenders","Arc Raiders","ARK: Survival Ascended","Blade Ball","Blox Fruits","Borderlands 4","Case Paradise","Counter-Strike 2","Da Hood","Dark and Darker","Delta Force","Destiny 2","Diablo 4","Dota 2","Dune: Awakening","EA Sports FC","Elden Ring","Elder Scrolls Online","Escape from Tarkov","EVE Online","Fallout 76","Fisch","Fortnite","Grand Piece Online","Grow a Garden","Grow a Garden 2","Guild Wars 2","Jailbreak","King Legacy","League of Legends","Lost Ark","Minecraft Hypixel Items","Murder Mystery 2","Old School RuneScape","Path of Exile 2","Pet Simulator 99","Pokemon Go","Roblox","Roblox Limiteds","Rust","SpongeBob Tower Defense","Steal a Brainrot","Team Fortress 2","Throne and Liberty","Warframe","World of Warcraft"],
  },
  Boosting: {
    popular: ["Brawl Stars","EA Sports FC","Rainbow Six Siege X","Marvel Rivals","Apex Legends","Call of Duty","Valorant","League of Legends","Rocket League","Pokemon Go","Roblox","Arc Raiders"],
    all: ["Apex Legends","Arc Raiders","Arena Breakout","Battlefield","Black Desert Online","Blox Fruits","Brawl Stars","Call of Duty","Clash of Clans","Clash Royale","Counter-Strike 2","Dead by Daylight","Deadlock","Delta Force","Destiny 2","Diablo 4","Dota 2","EA Sports FC","Escape from Tarkov","Fisch","Fortnite","Forza Horizon 5","Genshin Impact","League of Legends","Marvel Rivals","Minecraft","Mobile Legends","New World","Old School RuneScape","Overwatch","Path of Exile 2","Pokemon Go","Rainbow Six Siege X","Roblox","Rocket League","Teamfight Tactics","The First Descendant","Throne and Liberty","Valorant","Warframe","World of Warcraft"],
  },
  "Gift Cards": {
    popular: ["Roblox Gift Cards","Valorant Gift Cards","Steam Gift Cards","Apple Gift Cards","Steam Game Accounts","CD Keys","PlayStation Gift Card","Razer Gold","Amazon Gift Cards","Discord Nitro","Xbox Gift Cards","Garena Free Fire Gift Cards"],
    all: ["Amazon Gift Cards","Apple Gift Cards","Blizzard Gift Cards","CD Keys","Discord Nitro","Fortnite Gift Cards","Garena Free Fire Gift Cards","Google Play Gift Cards","League of Legends Gift Cards","Netflix Gift Cards","Nintendo Gift Cards","PlayStation Gift Card","PUBG Mobile Gift Cards","Razer Gold","Roblox Gift Cards","Runescape Memberships","Steam Game Accounts","Steam Gift Cards","Valorant Gift Cards","Xbox Gift Cards"],
  },
};

export default function Home() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [darkMode, setDarkMode] = useState(true);
  const [selectedService, setSelectedService] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof SEARCH_DATA>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(["Fortnite Accounts", "WoW Gold"]);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { lang, cur, setLocale, language, currency, formatPrice, t, tLabel } = useLocale();
  const [langCurOpen, setLangCurOpen] = useState(false);
  const [draftLang, setDraftLang] = useState("EN");
  const [draftCur, setDraftCur] = useState("USD");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const catBarRef = useRef<HTMLDivElement>(null);
  const catBarInnerRef = useRef<HTMLDivElement>(null);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const catOpenUpRef = useRef(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const inDropdownEl = (dropdownRef.current && dropdownRef.current.contains(e.target as Node))
        || (mobileDropdownRef.current && mobileDropdownRef.current.contains(e.target as Node));
      if (!inDropdownEl) {
        setDropdownOpen(false);
      }
      const inSearchEl = (searchRef.current && searchRef.current.contains(e.target as Node))
        || (mobileSearchRef.current && mobileSearchRef.current.contains(e.target as Node));
      if (!inSearchEl) {
        setSearchFocused(false);
      }
      const inBar = catBarRef.current && catBarRef.current.contains(e.target as Node);
      const inDropdown = catDropdownRef.current && catDropdownRef.current.contains(e.target as Node);
      if (!inBar && !inDropdown) {
        setActiveCat(null);
        setCatSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const locked = searchFocused || !!activeCat || langCurOpen;
    document.body.style.overflow = locked ? "hidden" : "";
    document.documentElement.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [searchFocused, activeCat, langCurOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const filtered = SEARCH_DATA.filter(item => {
        const matchesQuery = item.label.toLowerCase().includes(q);
        const matchesCategory = selectedService === "All Categories" || item.category === selectedService;
        return matchesQuery && matchesCategory;
      }).slice(0, 7);
      setSuggestions(filtered);
      setSearchLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedService]);

  // Live offers state
  const [offerStart, setOfferStart] = useState(0);
  const offerDirRef = useRef<1 | -1>(1);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const visibleOffers = Array.from({ length: 4 }, (_, i) => {
    const idx = (offerStart + i) % MOCK_OFFERS.length;
    return { ...MOCK_OFFERS[idx], uid: `${offerStart}-${i}` };
  });

  // New offers always enter at the LEFTMOST slot: moving the window start
  // backwards puts the incoming offer at visibleOffers[0] and pushes the rest right.
  const startAutoPlay = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      offerDirRef.current = 1;
      setOfferStart(prev => (prev - 1 + MOCK_OFFERS.length) % MOCK_OFFERS.length);
    }, 2500);
  };

  useEffect(() => {
    startAutoPlay();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const handlePrev = () => {
    offerDirRef.current = -1;
    setOfferStart(prev => (prev + 1) % MOCK_OFFERS.length);
    startAutoPlay();
  };

  const handleNext = () => {
    offerDirRef.current = 1;
    setOfferStart(prev => (prev - 1 + MOCK_OFFERS.length) % MOCK_OFFERS.length);
    startAutoPlay();
  };

  return (
    <div className={`min-h-screen overflow-x-hidden selection:bg-primary/30 ${darkMode ? "bg-background text-foreground" : "bg-[#f5f3ee] text-[#1a1a2e]"}`}>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/50" style={{ background: darkMode ? "#0a0a12" : "#1a1a2e" }}>

        {/* ── DESKTOP row (md+): logo | search | login ── */}
        <div className="hidden md:flex w-full px-6 h-20 items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-14 h-14 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" className="fill-background" />
                <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" />
              </svg>
            </div>
            <span className="font-heading font-bold text-3xl tracking-tight text-white">RaRumble</span>
          </div>

          {/* Desktop search bar */}
          <div className="flex-1 min-w-0 max-w-6xl mx-8 relative" ref={searchRef}>
            <div className="relative flex items-center h-11 bg-[#1a1a2e] overflow-visible transition-all" ref={dropdownRef}
              style={{ border: searchFocused ? "2px solid #D5AD68" : "1px solid rgba(255,255,255,0.15)", borderRadius: "999px" }}>
              {!searchFocused && (searchLoading
                ? <Loader2 className="absolute left-4 w-4 h-4 text-primary animate-spin pointer-events-none" />
                : <Search className="absolute left-4 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
              )}
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocused(true); setDropdownOpen(false); }}
                placeholder={t("searchPlaceholder")}
                className="flex-1 bg-transparent h-full text-sm text-white placeholder:text-muted-foreground outline-none"
                style={{ paddingLeft: searchFocused ? "16px" : "36px", paddingRight: "8px" }} />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="p-1 mr-1 text-muted-foreground hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="w-px h-6 bg-border/50 shrink-0" />
              <button onClick={() => { setDropdownOpen(o => !o); setSearchFocused(false); }}
                className="flex items-center gap-2 px-4 h-full text-sm font-medium text-card-foreground hover:text-white transition-colors whitespace-nowrap">
                {tLabel(selectedService)}
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {searchFocused && (
                <button className="h-full px-4 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {searchLoading ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Search className="w-4 h-4" />}
                </button>
              )}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 rounded-2xl z-50 p-6" style={{ background: "#0e0e1a", border: "1px solid rgba(213,173,104,0.35)", width: "700px", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-5" style={{ color: "#D5AD68" }}>{t("searchInService")}</p>
                  <div className="grid grid-cols-4 gap-1">
                    {SERVICES.map(service => {
                      const active = selectedService === service.label;
                      return (
                        <button key={service.label} onClick={() => { setSelectedService(service.label); setDropdownOpen(false); }}
                          className="flex flex-col items-center gap-2 px-2 py-3 rounded-xl transition-all group"
                          style={{ background: active ? "rgba(213,173,104,0.1)" : "transparent" }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                          <div className="rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                            style={{ width: "52px", height: "52px", background: active ? "rgba(213,173,104,0.2)" : "rgba(213,173,104,0.12)", border: active ? "1px solid rgba(213,173,104,0.6)" : "1px solid rgba(213,173,104,0.25)" }}>
                            <svg viewBox="0 0 24 24" style={{ width: "24px", height: "24px", color: "#D5AD68" }} className="stroke-[1.8] fill-none stroke-current" strokeLinecap="round" strokeLinejoin="round">
                              <path d={service.icon} />
                            </svg>
                          </div>
                          <span className="text-[12px] font-semibold leading-tight text-center transition-colors"
                            style={{ color: active ? "#D5AD68" : "rgba(255,255,255,0.75)" }}>{tLabel(service.label)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {searchFocused && !dropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", maxHeight: "400px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
                {searchQuery && suggestions.length > 0 ? (
                  suggestions.slice(0, 7).map((item, i) => (
                    <button key={i} onClick={() => { setSearchQuery(item.label); setSearchFocused(false); setRecentSearches(r => [item.label, ...r.filter(x => x !== item.label)].slice(0, 5)); }}
                      className="w-full flex items-center gap-3 px-5 py-3 transition-colors group"
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ background: CATEGORY_COLORS[item.category]+"25", color: CATEGORY_COLORS[item.category] }}>
                        {item.category.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-[14px] text-white/85 group-hover:text-white font-medium">{item.label}</span>
                    </button>
                  ))
                ) : searchQuery && !searchLoading ? (
                  <p className="text-sm text-white/40 text-center py-5">{t("noResults")} "<span className="text-white/60">{searchQuery}</span>"</p>
                ) : (
                  <>
                    {recentSearches.length > 0 && (<>
                      <div className="flex items-center justify-between px-5 pt-3 pb-1">
                        <p className="text-[11px] text-white/35 font-bold uppercase tracking-widest">{t("recentlySearched")}</p>
                        <button onClick={() => setRecentSearches([])} className="text-[11px] text-white/35 hover:text-white transition-colors">{t("clearAll")}</button>
                      </div>
                      {recentSearches.slice(0, 2).map((r, i) => (
                        <button key={i} onClick={() => setSearchQuery(r)} className="w-full flex items-center gap-3 px-5 py-3 transition-colors group"
                          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                          <Clock className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
                          <span className="text-[14px] text-white/60 group-hover:text-white font-medium">{r}</span>
                        </button>
                      ))}
                      <div className="mx-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
                    </>)}
                    <p className="text-[11px] text-white/35 font-bold uppercase tracking-widest px-5 pt-3 pb-1">{t("popularCategories")}</p>
                    {POPULAR_CATEGORIES.filter(p => selectedService === "All Categories" || p.category === selectedService).slice(0, 10).map((item, i) => (
                      <button key={i} onClick={() => { setSearchQuery(item.label); setRecentSearches(r => [item.label, ...r.filter(x => x !== item.label)].slice(0, 5)); }}
                        className="w-full flex items-center gap-3 px-5 py-3 transition-colors group"
                        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ background: item.color+"25", color: item.color }}>
                          {item.category.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-[14px] text-white/80 group-hover:text-white font-medium">{item.label}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center shrink-0">
            <button className="h-10 px-6 font-semibold text-sm rounded-xl transition-opacity hover:opacity-90 whitespace-nowrap" style={{ background: "#D5AD68", color: "#1a1100" }}>
              {t("login")}
            </button>
          </div>
        </div>

        {/* ── MOBILE layout (< md): two rows ── */}
        <div className="flex md:hidden flex-col" style={{ background: darkMode ? "#0a0a12" : "#1a1a2e" }}>
          {/* Row 1: logo+name (left) | login (right) */}
          <div className="flex items-center justify-between px-4 h-14">
            {/* Logo + name */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9">
                <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                  <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                  <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" className="fill-background" />
                  <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" />
                </svg>
              </div>
              <span className="font-heading font-bold text-lg tracking-tight text-white">RaRumble</span>
            </div>
            {/* Login */}
            <button className="h-9 px-5 font-bold text-sm rounded-xl whitespace-nowrap" style={{ background: "#D5AD68", color: "#1a1100" }}>
              {t("login")}
            </button>
          </div>

          {/* Row 2: full-width search bar */}
          <div className="px-3 pb-3 relative" ref={mobileSearchRef}>
            <div className="relative flex items-center h-11" ref={mobileDropdownRef}
              style={{ background: "rgba(255,255,255,0.07)", border: searchFocused ? "1.5px solid #D5AD68" : "1px solid rgba(255,255,255,0.12)", borderRadius: "12px" }}>
              <Search className="absolute left-3 w-4 h-4 pointer-events-none shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocused(true); setDropdownOpen(false); }}
                placeholder={t("searchPlaceholder")}
                className="flex-1 min-w-0 bg-transparent h-full text-sm text-white placeholder:text-muted-foreground outline-none pl-9 pr-2" />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="p-1 shrink-0 text-muted-foreground hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="w-px h-5 shrink-0 mx-1" style={{ background: "rgba(255,255,255,0.15)" }} />
              <button
                onClick={() => { setDropdownOpen(o => !o); setSearchFocused(false); }}
                className="flex items-center gap-1 pr-3 pl-2 h-full shrink-0 whitespace-nowrap"
                style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", fontWeight: 600 }}
              >
                {tLabel(selectedService)}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform shrink-0 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl z-50 p-4" style={{ background: "#0e0e1a", border: "1px solid rgba(213,173,104,0.35)", boxShadow: "0 20px 60px rgba(0,0,0,0.8)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#D5AD68" }}>{t("searchInService")}</p>
                  <div className="grid grid-cols-3 gap-1">
                    {SERVICES.map(service => {
                      const active = selectedService === service.label;
                      return (
                        <button key={service.label} onClick={() => { setSelectedService(service.label); setDropdownOpen(false); }}
                          className="flex flex-col items-center gap-2 px-2 py-3 rounded-xl transition-all"
                          style={{ background: active ? "rgba(213,173,104,0.1)" : "transparent" }}>
                          <div className="rounded-xl flex items-center justify-center"
                            style={{ width: "40px", height: "40px", background: active ? "rgba(213,173,104,0.2)" : "rgba(213,173,104,0.12)", border: active ? "1px solid rgba(213,173,104,0.6)" : "1px solid rgba(213,173,104,0.25)" }}>
                            <svg viewBox="0 0 24 24" style={{ width: "18px", height: "18px", color: "#D5AD68" }} className="stroke-[1.8] fill-none stroke-current" strokeLinecap="round" strokeLinejoin="round">
                              <path d={service.icon} />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold leading-tight text-center" style={{ color: active ? "#D5AD68" : "rgba(255,255,255,0.75)" }}>{tLabel(service.label)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {searchFocused && !dropdownOpen && (
              <div className="absolute top-full left-3 right-3 z-50 mt-1" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", maxHeight: "320px", overflowY: "auto" }}>
                {searchQuery && suggestions.length > 0 ? (
                  suggestions.slice(0, 6).map((item, i) => (
                    <button key={i} onClick={() => { setSearchQuery(item.label); setSearchFocused(false); setRecentSearches(r => [item.label, ...r.filter(x => x !== item.label)].slice(0, 5)); }}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ background: CATEGORY_COLORS[item.category]+"25", color: CATEGORY_COLORS[item.category] }}>
                        {item.category.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-[13px] text-white/85 font-medium">{item.label}</span>
                    </button>
                  ))
                ) : searchQuery && !searchLoading ? (
                  <p className="text-sm text-white/40 text-center py-5">{t("noResults")} "<span className="text-white/60">{searchQuery}</span>"</p>
                ) : !searchQuery ? (
                  <>
                    {recentSearches.length > 0 && (<>
                      <div className="flex items-center justify-between px-4 pt-3 pb-1">
                        <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest">{t("recentlySearched")}</p>
                        <button onClick={() => setRecentSearches([])} className="text-[10px] text-white/35 hover:text-white">{t("clearAll")}</button>
                      </div>
                      {recentSearches.slice(0, 2).map((r, i) => (
                        <button key={i} onClick={() => setSearchQuery(r)} className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                          <Clock className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
                          <span className="text-[13px] text-white/60 font-medium">{r}</span>
                        </button>
                      ))}
                      <div className="mx-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
                    </>)}
                    <p className="text-[10px] text-white/35 font-bold uppercase tracking-widest px-4 pt-3 pb-1">{t("popularCategories")}</p>
                    {POPULAR_CATEGORIES.filter(p => selectedService === "All Categories" || p.category === selectedService).slice(0, 8).map((item, i) => (
                      <button key={i} onClick={() => { setSearchQuery(item.label); setRecentSearches(r => [item.label, ...r.filter(x => x !== item.label)].slice(0, 5)); setSearchFocused(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
                        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ background: item.color+"25", color: item.color }}>
                          {item.category.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-[13px] text-white/80 font-medium">{item.label}</span>
                      </button>
                    ))}
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>

      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ height: "clamp(420px, 55vw, 680px)", background: "#020818", paddingTop: "clamp(64px, 8vw, 80px)" }}>
        {/* Full-width background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.png"
            alt="Hero"
            className="w-full h-full object-cover object-top"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          {/* Left gradient — smooth text readability */}
          <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to right, rgba(2,8,24,0.95) 0%, rgba(2,8,24,0.80) 30%, rgba(2,8,24,0.30) 60%, rgba(2,8,24,0.0) 100%)" }} />
          {/* Bottom fade — long smooth dissolve into page */}
          <div className="absolute bottom-0 left-0 right-0 z-10" style={{ height: "260px", background: "linear-gradient(to bottom, transparent 0%, rgba(2,8,24,0.5) 50%, rgba(2,8,24,0.85) 75%, #020818 100%)" }} />
          {/* Right edge smooth fade */}
          <div className="absolute inset-y-0 right-0 z-10" style={{ width: "45%", background: "linear-gradient(to left, #020818 0%, rgba(2,8,24,0.9) 25%, rgba(2,8,24,0.5) 60%, transparent 100%)" }} />
        </div>

        {/* Left text */}
        <div className="relative z-20 h-full flex items-center" style={{ paddingLeft: "clamp(24px, 8vw, 160px)" }}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ maxWidth: "520px" }}
          >
            <h1 className="font-bold text-white leading-tight font-heading mb-3 md:mb-4" style={{ fontSize: "clamp(28px, 5vw, 64px)" }}>
              {t("heroTitle1")}<br />
              <span style={{ color: "#D5AD68" }}>{t("heroTitle2")}</span>
            </h1>
            <p className="mb-6 md:mb-8 font-medium" style={{ fontSize: "clamp(13px, 1.5vw, 16px)", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
              {t("heroSub1")}<br />
              {t("heroSub2")}
            </p>
            <button
              className="font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, #D5AD68 0%, #e8c586 100%)",
                color: "#0a0a12",
                height: "clamp(40px, 5vw, 52px)",
                padding: "0 clamp(20px, 3vw, 36px)",
                borderRadius: "10px",
                fontSize: "clamp(13px, 1.4vw, 15px)",
                boxShadow: "0 4px 24px rgba(213,173,104,0.35)",
              }}
            >
              {t("shopNow")}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="-mt-4 md:-mt-6" style={{ zIndex: 100, position: "relative", overflow: "visible" }} ref={catBarRef}>
        <div className="mx-auto px-4 md:px-8" style={{ maxWidth: "1100px", position: "relative", overflow: "visible" }}>
          <div
            ref={catBarInnerRef}
            className="flex items-center md:justify-between gap-1 md:gap-2 px-2 md:px-6 py-3 md:py-4 overflow-x-auto"
            style={{
              background: darkMode ? "rgba(10,10,22,0.97)" : "#ffffff",
              border: darkMode ? "1px solid rgba(213,173,104,0.35)" : "1px solid rgba(0,0,0,0.08)",
              borderRadius: activeCat ? (catOpenUpRef.current ? "0 0 16px 16px" : "16px 16px 0 0") : "16px",
              backdropFilter: "blur(12px)",
              boxShadow: darkMode ? "0 4px 32px rgba(0,0,0,0.6)" : "0 4px 24px rgba(0,0,0,0.08)",
              scrollbarWidth: "none",
            }}
          >
            {[
              { label: "Currency",   icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
              { label: "Accounts",   icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
              { label: "Top Up",     icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
              { label: "Items",      icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
              { label: "Boosting",   icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
              { label: "Gift Cards", icon: "M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" },
            ].map((cat, i) => (
              <motion.button
                key={cat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => {
                  const next = activeCat === cat.label ? null : cat.label;
                  if (next && catBarInnerRef.current) {
                    const rect = catBarInnerRef.current.getBoundingClientRect();
                    catOpenUpRef.current = rect.bottom > window.innerHeight * 0.55;
                  }
                  setActiveCat(next);
                  setCatSearch("");
                }}
                className="flex flex-col items-center gap-1 md:gap-2 px-3 md:px-5 py-2 rounded-xl group transition-all cursor-pointer shrink-0 md:flex-1"
                style={{
                  minWidth: "72px",
                  background: activeCat === cat.label ? "rgba(213,173,104,0.1)" : "transparent",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  style={{ width: "28px", height: "28px", color: activeCat === cat.label ? "#D5AD68" : "rgba(213,173,104,0.7)" }}
                  className="fill-none stroke-current stroke-[1.6] group-hover:scale-110 transition-transform duration-200"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d={cat.icon} />
                </svg>
                <span className="text-[12px] md:text-[13px] font-semibold transition-colors text-center leading-tight"
                  style={{ color: activeCat === cat.label ? "#D5AD68" : darkMode ? "#ffffff" : "#1a1a2e" }}>
                  {tLabel(cat.label)}
                </span>
              </motion.button>
            ))}
          </div>

        </div>
      </section>

      {/* Category Dropdown — rendered via portal to escape overflow clipping */}
      {activeCat && CATEGORY_DATA[activeCat] && createPortal(
        <div
          ref={catDropdownRef}
          style={{
            position: "fixed",
            ...(catOpenUpRef.current
              ? { bottom: catBarInnerRef.current ? window.innerHeight - catBarInnerRef.current.getBoundingClientRect().top : 0, top: "auto" }
              : { top: catBarInnerRef.current ? catBarInnerRef.current.getBoundingClientRect().bottom : 0 }),
            left: catBarInnerRef.current ? catBarInnerRef.current.getBoundingClientRect().left : 0,
            width: catBarInnerRef.current ? catBarInnerRef.current.getBoundingClientRect().width : 0,
            zIndex: 9999,
            background: darkMode ? "#0e0e1a" : "#ffffff",
            border: darkMode ? "1px solid rgba(213,173,104,0.35)" : "1px solid rgba(0,0,0,0.10)",
            ...(catOpenUpRef.current
              ? { borderBottom: "none", borderRadius: "16px 16px 0 0" }
              : { borderTop: "none", borderRadius: "0 0 16px 16px" }),
            display: "flex",
            maxHeight: "500px",
            overflow: "hidden",
            boxShadow: darkMode ? "0 20px 60px rgba(0,0,0,0.9)" : "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          {/* Left: Popular games */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ borderRight: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)", scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: darkMode ? "#D5AD68" : "#9a7a3a" }}>{t("popularGames")}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORY_DATA[activeCat].popular.map((game) => {
                const catColor = CATEGORY_COLORS[activeCat] || "#D5AD68";
                return (
                  <button key={game}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors group"
                    style={{}}
                    onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-[11px] font-bold"
                      style={darkMode
                        ? { background: "rgba(213,173,104,0.15)", color: "#D5AD68", border: "1px solid rgba(213,173,104,0.2)" }
                        : { background: catColor + "22", color: catColor, border: `1px solid ${catColor}44` }
                      }>
                      {game.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-medium leading-tight line-clamp-2 transition-colors"
                      style={{ color: darkMode ? "rgba(255,255,255,0.75)" : "rgba(26,26,46,0.80)" }}>
                      {game}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: All games + search */}
          <div className="flex flex-col p-6" style={{ width: "300px" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: darkMode ? "rgba(255,255,255,0.4)" : "rgba(26,26,46,0.45)" }}>{t("allGames")}</p>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: darkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }} />
              <input
                type="text"
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                placeholder={t("searchForGame")}
                className="w-full pl-9 pr-3 py-2.5 text-sm outline-none rounded-xl"
                style={{
                  border: darkMode ? "1px solid rgba(213,173,104,0.4)" : "1px solid rgba(0,0,0,0.15)",
                  background: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
                  color: darkMode ? "#fff" : "#1a1a2e",
                }}
              />
            </div>
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
              {CATEGORY_DATA[activeCat].all
                .filter(g => g.toLowerCase().includes(catSearch.toLowerCase()))
                .map((game) => {
                  const catColor = CATEGORY_COLORS[activeCat] || "#D5AD68";
                  return (
                    <button key={game}
                      className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors group"
                      onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={darkMode
                          ? { background: "rgba(213,173,104,0.12)", color: "#D5AD68", border: "1px solid rgba(213,173,104,0.15)" }
                          : { background: catColor + "1a", color: catColor, border: `1px solid ${catColor}33` }
                        }>
                        {game.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[13px] font-medium transition-colors"
                        style={{ color: darkMode ? "rgba(255,255,255,0.65)" : "rgba(26,26,46,0.75)" }}>
                        {game}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Popular Categories Grid — layout: [Accounts big | Items small] / [Boosting full width] */}
      <section className="py-6 md:py-10 relative z-20">
        <div className="mx-auto px-4 md:px-8" style={{ maxWidth: "1100px" }}>

          {/* Top row */}
          <div className="flex flex-col md:flex-row gap-5 mb-5">

            {/* Popular Accounts — large, 2-col inner grid */}
            {(() => {
              const games = ["Fortnite","Valorant","Roblox","Minecraft","Counter-Strike 2","Grand Theft Auto 5","Rainbow Six Siege X","League of Legends","Call of Duty","Pokemon Go"];
              return (
                <div className="flex-1 flex flex-col">
                  <h3 className="text-[18px] mb-3" style={{ color: darkMode ? "#ffffff" : "#1a1a2e", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>{t("popularAccounts")}</h3>
                  <div className="rounded-2xl p-4 flex-1 transition-all duration-200"
                    style={{ background: darkMode ? "#111120" : "#ffffff", border: darkMode ? "1px solid rgba(213,173,104,0.15)" : "1px solid rgba(0,0,0,0.08)", boxShadow: darkMode ? "none" : "0 2px 12px rgba(0,0,0,0.06)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(213,173,104,0.4)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = darkMode ? "rgba(213,173,104,0.15)" : "rgba(0,0,0,0.08)")}>
                  <div className="grid grid-cols-2 gap-y-0.5">
                    {games.map(game => (
                      <button key={game} className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                          style={darkMode ? { background: "rgba(213,173,104,0.15)", color: "#D5AD68" } : { background: "#e8edf8", color: "#5a72b5" }}>
                          {game.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-[15px] font-medium leading-tight line-clamp-1" style={{ color: darkMode ? "#ffffff" : "rgba(26,26,46,0.80)" }}>{game}</span>
                      </button>
                    ))}
                  </div>
                  </div>
                </div>
              );
            })()}

            {/* Popular Items — narrower, 1-col */}
            {(() => {
              const games = ["Grow a Garden 2","Steal a Brainrot","Adopt Me","Old School RuneScape","Roblox Limiteds"];
              return (
                <div className="flex flex-col w-full md:w-[340px] md:shrink-0">
                  <h3 className="text-[18px] mb-3" style={{ color: darkMode ? "#ffffff" : "#1a1a2e", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>{t("popularItems")}</h3>
                  <div className="rounded-2xl p-4 flex-1 transition-all duration-200"
                    style={{ background: darkMode ? "#111120" : "#ffffff", border: darkMode ? "1px solid rgba(213,173,104,0.15)" : "1px solid rgba(0,0,0,0.08)", boxShadow: darkMode ? "none" : "0 2px 12px rgba(0,0,0,0.06)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(213,173,104,0.4)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = darkMode ? "rgba(213,173,104,0.15)" : "rgba(0,0,0,0.08)")}>
                  <div className="flex flex-col gap-y-0.5">
                    {games.map(game => (
                      <button key={game} className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                          style={darkMode ? { background: "rgba(213,173,104,0.15)", color: "#D5AD68" } : { background: "#e8edf8", color: "#5a72b5" }}>
                          {game.slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-[15px] font-medium leading-tight line-clamp-1" style={{ color: darkMode ? "#ffffff" : "rgba(26,26,46,0.80)" }}>{game}</span>
                      </button>
                    ))}
                  </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom row — Popular Boosting full width, 3-col inner grid */}
          {(() => {
            const games = ["Brawl Stars","EA Sports FC","Rainbow Six Siege X","Marvel Rivals","Apex Legends","Valorant"];
            return (
              <div>
                <h3 className="text-[18px] mb-3" style={{ color: darkMode ? "#ffffff" : "#1a1a2e", fontFamily: "Inter, sans-serif", fontWeight: 700 }}>{t("popularBoosting")}</h3>
                <div className="rounded-2xl p-4 transition-all duration-200"
                  style={{ background: darkMode ? "#111120" : "#ffffff", border: darkMode ? "1px solid rgba(213,173,104,0.15)" : "1px solid rgba(0,0,0,0.08)", boxShadow: darkMode ? "none" : "0 2px 12px rgba(0,0,0,0.06)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(213,173,104,0.4)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = darkMode ? "rgba(213,173,104,0.15)" : "rgba(0,0,0,0.08)")}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-0.5">
                  {games.map(game => (
                    <button key={game} className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition-colors"
                      onMouseEnter={e => (e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={darkMode ? { background: "rgba(213,173,104,0.15)", color: "#D5AD68" } : { background: "#e8edf8", color: "#5a72b5" }}>
                        {game.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-[15px] font-medium leading-tight line-clamp-1" style={{ color: darkMode ? "#ffffff" : "rgba(26,26,46,0.80)" }}>{game}</span>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* Live Offers Feed */}
      <section className="py-8 md:py-16 relative z-20">
        <div className="mx-auto px-4 md:px-8 mb-6 flex items-center justify-between" style={{ maxWidth: "1100px" }}>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }} />
            <h2 className="text-2xl font-bold" style={{ fontFamily: "Inter, sans-serif", color: darkMode ? "#ffffff" : "#1a1a2e" }}>{t("liveOffers")}</h2>
            <div className="relative group">
              <div className="w-5 h-5 rounded-full flex items-center justify-center cursor-default select-none text-[11px] font-bold" style={{ background: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>?</div>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                style={{ background: "#1e1e30", color: "rgba(255,255,255,0.8)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                {t("liveOffersTip")}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e1e30" }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(213,173,104,0.2)"; e.currentTarget.style.color = "#D5AD68"; }}
              onMouseLeave={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"; e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)"; }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button onClick={handleNext} className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(213,173,104,0.2)"; e.currentTarget.style.color = "#D5AD68"; }}
              onMouseLeave={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"; e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)"; }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <div className="flex gap-3 md:gap-4 items-stretch px-4 md:px-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ maxWidth: "1100px", margin: "0 auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleOffers.map((offer) => (
                <motion.div
                  key={offer.uid}
                  layout
                  initial={{ opacity: 0, x: offerDirRef.current * -300, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: offerDirRef.current * 300, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, opacity: { duration: 0.2 } }}
                  className="cursor-pointer shrink-0 flex-1"
                  style={{ minWidth: "220px" }}
                >
                  {(() => {
                    const cat = offer.type.includes("Account") ? "Accounts"
                      : offer.type.includes("Boost") || offer.type.includes("Coaching") ? "Boosting"
                      : offer.type.includes("Gold") || offer.type.includes("Coins") || offer.type.includes("Credits") ? "Currency"
                      : "Items";
                    return (
                      <div className="rounded-2xl flex flex-col transition-all duration-200 h-full overflow-hidden"
                        style={{ background: darkMode ? "#111120" : "#ffffff", border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = "rgba(213,173,104,0.45)";
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow = darkMode ? "0 12px 28px rgba(0,0,0,0.5), 0 0 20px rgba(213,173,104,0.08)" : "0 12px 28px rgba(213,173,104,0.18)";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        {/* Top: icon + game name stacked + category badge below name */}
                        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                          <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
                            style={{ background: CATEGORY_COLORS[cat] || "#7c3aed" }}>
                            {offer.game.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[14px] font-bold leading-tight truncate" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>{offer.game}</p>
                            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)", color: darkMode ? "rgba(255,255,255,0.6)" : "#666" }}>
                              {tLabel(cat)}
                            </span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: "1px", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />

                        {/* Bottom: offer title, then seller+rating left / price right */}
                        <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                          <p className="text-[13px] font-semibold leading-snug" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>{offer.type}</p>
                          <div className="flex items-end justify-between mt-1">
                            <div>
                              <p className="text-[11px] font-medium" style={{ color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)" }}>{offer.seller}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3 h-3" style={{ fill: ratingColor(parseFloat(offer.rating)), color: ratingColor(parseFloat(offer.rating)) }} />
                                <span className="text-[11px] font-semibold" style={{ color: ratingColor(parseFloat(offer.rating)) }}>{offer.rating}%</span>
                              </div>
                            </div>
                            <p className="text-[20px] font-bold leading-none" style={{ color: "#D5AD68" }}>{formatPrice(offer.price)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <section className="pb-8 md:pb-12 relative z-20">
        <div className="mx-auto px-4 md:px-8" style={{ maxWidth: "1100px" }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5" style={{ color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }} />
              <h2 className="text-2xl font-bold" style={{ fontFamily: "Inter, sans-serif", color: darkMode ? "#ffffff" : "#1a1a2e" }}>{t("recentlyViewed")}</h2>
              <div className="relative group">
                <div className="w-5 h-5 rounded-full flex items-center justify-center cursor-default select-none text-[11px] font-bold" style={{ background: darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>?</div>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                  style={{ background: "#1e1e30", color: "rgba(255,255,255,0.8)", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>
                  {t("recentlyViewedTip")}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0" style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e1e30" }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(213,173,104,0.2)"; e.currentTarget.style.color = "#D5AD68"; }}
                onMouseLeave={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"; e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)"; }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", color: darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(213,173,104,0.2)"; e.currentTarget.style.color = "#D5AD68"; }}
                onMouseLeave={e => { e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"; e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)"; }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              { game: "Valorant", type: "Immortal Rank Boost", price: "89.00", rating: "100", seller: "ProBoostKing" },
              { game: "Elden Ring", type: "Max Level Account", price: "249.99", rating: "98.4", seller: "ShadowStriker" },
              { game: "WoW", type: "100K Gold", price: "12.99", rating: "96.2", seller: "GoldFarmer99" },
              { game: "Apex Legends", type: "Predator Account", price: "150.00", rating: "94.5", seller: "NinjaBoosts" },
            ].map((offer) => {
              const cat = offer.type.includes("Account") ? "Accounts"
                : offer.type.includes("Boost") || offer.type.includes("Coaching") ? "Boosting"
                : offer.type.includes("Gold") || offer.type.includes("Coins") || offer.type.includes("Credits") ? "Currency"
                : "Items";
              return (
                <div key={offer.game} className="rounded-2xl flex flex-col overflow-hidden cursor-pointer transition-all duration-200 shrink-0 flex-1"
                  style={{ minWidth: "220px", background: darkMode ? "#111120" : "#ffffff", border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(213,173,104,0.45)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = darkMode ? "0 12px 28px rgba(0,0,0,0.5), 0 0 20px rgba(213,173,104,0.08)" : "0 12px 28px rgba(213,173,104,0.18)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Top: icon + game name + type badge inline */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
                      style={{ background: CATEGORY_COLORS[cat] || "#7c3aed" }}>
                      {offer.game.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold leading-tight" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>{offer.game}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: darkMode ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)", color: darkMode ? "rgba(255,255,255,0.6)" : "#666" }}>
                        {tLabel(cat)}
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: "1px", background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />

                  {/* Bottom: title row, then seller+rating on left / price on right */}
                  <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                    <p className="text-[13px] font-semibold leading-snug" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>{offer.type}</p>
                    <div className="flex items-end justify-between mt-1">
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: darkMode ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)" }}>{offer.seller}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3" style={{ fill: ratingColor(parseFloat(offer.rating)), color: ratingColor(parseFloat(offer.rating)) }} />
                          <span className="text-[11px] font-semibold" style={{ color: ratingColor(parseFloat(offer.rating)) }}>{offer.rating}%</span>
                        </div>
                      </div>
                      <p className="text-[20px] font-bold leading-none" style={{ color: "#D5AD68" }}>{formatPrice(offer.price)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

{/* Trust / Stats Bar */}
      <section className="py-16 bg-card border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 md:divide-x divide-border/50">
            {[
              { val: "50+", label: t("statGames") },
              { val: "100%", label: t("statVerified") },
              { val: "0%", label: t("statFraud") },
              { val: "24/7", label: t("statSupport") },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-bold font-heading mb-2 drop-shadow-[0_0_10px_rgba(213,173,104,0.3)]"
                  style={{ backgroundImage: "linear-gradient(135deg, #D5AD68 30%, #f0d9a8 70%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                  {stat.val}
                </div>
                <div className="text-sm font-medium text-card-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Sellers Leaderboard */}
      <section className="py-10 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <h2 className="text-3xl font-bold font-heading mb-10 text-center" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>{t("topSellers")}</h2>
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: darkMode ? "#111120" : "#ffffff",
              border: darkMode ? "1px solid rgba(213,173,104,0.15)" : "1px solid rgba(0,0,0,0.08)",
              boxShadow: darkMode ? "0 8px 40px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 text-xs font-bold uppercase tracking-wider"
              style={{ borderBottom: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)", background: darkMode ? "rgba(10,10,18,0.5)" : "rgba(0,0,0,0.03)", color: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)" }}>
              <div className="w-12 text-center">{t("rank")}</div>
              <div>{t("seller")}</div>
              <div className="hidden sm:block text-right w-24">{t("sales")}</div>
              <div className="w-24 text-right pr-4">{t("action")}</div>
            </div>
            <div className={darkMode ? "divide-y divide-border/30" : "divide-y divide-black/[0.06]"}>
              {[
                { name: "ShadowStriker", spec: "Valorant Specialist", sales: "1,204", trend: "+18%", rating: "100", grad: "linear-gradient(135deg,#7c3aed,#c026d3)" },
                { name: "ElvenMerchant", spec: "WoW Gold Farmer", sales: "982", trend: "+12%", rating: "98.7", grad: "linear-gradient(135deg,#059669,#10b981)" },
                { name: "TacticalGear", spec: "CS2 Items", sales: "845", trend: "+9%", rating: "97.3", grad: "linear-gradient(135deg,#ea580c,#f59e0b)" },
                { name: "NinjaBoosts", spec: "Apex Predator Carries", sales: "721", trend: "+15%", rating: "99.2", grad: "linear-gradient(135deg,#0284c7,#06b6d4)" },
                { name: "KingSlayer", spec: "Elden Ring Accounts", sales: "650", trend: "+7%", rating: "98.1", grad: "linear-gradient(135deg,#dc2626,#f43f5e)" },
              ].map((seller, i) => {
                const medal =
                  i === 0 ? { bg: "linear-gradient(135deg,#D5AD68,#f0d9a8)", ring: "rgba(213,173,104,0.5)", text: "#1a1100" }
                  : i === 1 ? { bg: "linear-gradient(135deg,#9ca3af,#e5e7eb)", ring: "rgba(156,163,175,0.4)", text: "#1f2937" }
                  : i === 2 ? { bg: "linear-gradient(135deg,#b45309,#d97706)", ring: "rgba(180,83,9,0.4)", text: "#fff7ed" }
                  : null;
                return (
                  <motion.div
                    key={seller.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 md:gap-4 p-4 items-center transition-colors group ${darkMode ? "hover:bg-white/[0.04]" : "hover:bg-black/[0.02]"}`}
                  >
                    {/* Rank medal */}
                    <div className="w-12 flex justify-center items-center">
                      {medal ? (
                        <div className="relative w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] font-heading"
                          style={{ background: medal.bg, color: medal.text, boxShadow: `0 0 0 3px ${medal.ring}` }}>
                          {i === 0 ? <Crown className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }} /> : i + 1}
                        </div>
                      ) : (
                        <span className="text-[15px] font-bold font-heading" style={{ color: darkMode ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)" }}>{i + 1}</span>
                      )}
                    </div>
                    {/* Seller */}
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className="w-11 h-11 md:w-12 md:h-12 rounded-full shrink-0 flex items-center justify-center font-bold text-[14px] text-white transition-transform group-hover:scale-105"
                        style={{ background: seller.grad, boxShadow: i === 0 ? "0 0 0 2px rgba(213,173,104,0.6), 0 0 16px rgba(213,173,104,0.25)" : darkMode ? "0 0 0 2px rgba(255,255,255,0.1)" : "0 0 0 2px rgba(0,0,0,0.06)" }}>
                        {seller.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1.5 flex-wrap" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>
                          <span className="truncate">{seller.name}</span>
                          <BadgeCheck className="w-4 h-4 shrink-0" style={{ color: "#D5AD68" }} />
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0" style={{ background: `${ratingColor(parseFloat(seller.rating))}1f`, color: ratingColor(parseFloat(seller.rating)) }}>
                            <Star className="w-3 h-3" style={{ fill: ratingColor(parseFloat(seller.rating)), color: ratingColor(parseFloat(seller.rating)) }} /> {seller.rating}%
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Sales + trend */}
                    <div className="hidden sm:flex flex-col items-end w-24">
                      <span className="font-bold text-[15px]" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>{seller.sales}</span>
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold mt-0.5" style={{ color: "#22c55e" }}>
                        <TrendingUp className="w-3 h-3" /> {seller.trend}
                      </span>
                    </div>
                    {/* Action */}
                    <div className="w-24 md:w-28 flex justify-end">
                      <button
                        className="text-[12px] md:text-[13px] font-semibold px-3 md:px-4 py-2 rounded-full transition-all whitespace-nowrap cursor-pointer"
                        style={{ color: "#D5AD68", border: "1px solid rgba(213,173,104,0.35)", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "#D5AD68"; e.currentTarget.style.color = "#1a1100"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#D5AD68"; }}
                      >
                        {t("viewShop")}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6" style={{ maxWidth: "1150px" }}>
          <div className="flex flex-col md:flex-row gap-8 md:gap-14">

            {/* Left: intro */}
            <div className="md:w-[38%] md:shrink-0 md:pt-4">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight mb-2" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>
                  {t("faqDiscover")} <span style={{ color: "#D5AD68" }}>RaRumble:</span>
                </h2>
                <h2 className="text-3xl md:text-4xl font-bold font-heading leading-tight mb-5" style={{ color: darkMode ? "#ffffff" : "#1a1a2e" }}>
                  {t("faqPlatform")}
                </h2>
                <p className="text-[14px] leading-relaxed" style={{ color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }}>
                  {t("faqIntro1")}{" "}
                  <a href="#" className="font-semibold underline underline-offset-2 transition-colors" style={{ color: "#D5AD68" }}>{t("faqContact")}</a>
                  {" "}{t("faqIntro2")}{" "}
                  <a href="#" className="font-semibold underline underline-offset-2 transition-colors" style={{ color: "#D5AD68" }}>{t("faqHelp")}</a>.
                </p>
              </motion.div>
            </div>

            {/* Right: accordion */}
            <div className="flex-1 flex flex-col gap-4">
              {[
                { q: t("faqQ1"), a: t("faqA1") },
                { q: t("faqQ2"), a: t("faqA2") },
                { q: t("faqQ3"), a: t("faqA3") },
                { q: t("faqQ4"), a: t("faqA4") },
                { q: t("faqQ5"), a: t("faqA5") },
              ].map((faq, i) => {
                const open = openFaq === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="rounded-2xl overflow-hidden transition-all"
                    style={{
                      background: darkMode ? "#111120" : "#ffffff",
                      border: open
                        ? "1px solid rgba(213,173,104,0.45)"
                        : darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                      boxShadow: open
                        ? (darkMode ? "0 0 24px rgba(213,173,104,0.07)" : "0 4px 20px rgba(213,173,104,0.15)")
                        : (darkMode ? "none" : "0 2px 16px rgba(0,0,0,0.05)"),
                    }}
                    onMouseEnter={e => { if (!open) e.currentTarget.style.borderColor = "rgba(213,173,104,0.3)"; }}
                    onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"; }}
                  >
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 md:py-5 text-left cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold" style={{ color: open ? "#D5AD68" : darkMode ? "#ffffff" : "#1a1a2e" }}>
                        {faq.q}
                      </span>
                      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0">
                        <ChevronDown className="w-5 h-5" style={{ color: open ? "#D5AD68" : darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)" }} />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <div className="px-5 md:px-6 pb-5" style={{ borderTop: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
                            <p className="text-[14px] leading-relaxed pt-4" style={{ color: darkMode ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)" }}>
                              {faq.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: darkMode ? "#0d0d14" : "#13131f" }}>

        {/* Top bar — payment icons + language */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-10 py-3" style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: "VISA", bg: "#1a1f71", color: "#fff" },
                { label: "MC",   bg: "#eb001b", color: "#fff" },
                { label: "AMEX", bg: "#2e77bc", color: "#fff" },
                { label: "DISC", bg: "#ff6600", color: "#fff" },
                { label: "BTC",  bg: "#f7931a", color: "#fff" },
                { label: "GPay", bg: "#fff",    color: "#333" },
                { label: "Pay",  bg: "#111",    color: "#fff" },
              ].map(p => (
                <div key={p.label} className="px-3 h-7 flex items-center justify-center rounded text-[11px] font-bold tracking-wide" style={{ background: p.bg, color: p.color, minWidth: "46px" }}>
                  {p.label}
                </div>
              ))}
              <span className="text-[12px] font-medium ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>{t("more15")}</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setDarkMode(d => !d)} className="flex items-center gap-2.5">
                <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{darkMode ? t("darkTheme") : t("lightTheme")}</span>
                <div className="relative shrink-0" style={{ width: "36px", height: "20px" }}>
                  <div className="absolute inset-0 rounded-full transition-colors" style={{ background: darkMode ? "#D5AD68" : "rgba(255,255,255,0.25)" }} />
                  <div className="absolute top-[3px] rounded-full transition-all" style={{ width: "14px", height: "14px", background: "#fff", left: darkMode ? "19px" : "3px", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                </div>
              </button>
              <button
                onClick={() => { setDraftLang(lang); setDraftCur(cur); setLangCurOpen(true); }}
                className="flex items-center gap-2 text-[13px] font-medium px-3 py-1.5 rounded-full transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(213,173,104,0.5)"; e.currentTarget.style.color = "#D5AD68"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-[1.5]"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                {language.label} | {currency.code} - {currency.symbol}
              </button>
            </div>
          </div>
        </div>

        {/* Main body */}
        <div className="px-4 md:px-10 pt-10 md:pt-14 pb-8 md:pb-10" style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">

            {/* Brand column */}
            <div className="md:shrink-0" style={{ minWidth: "220px" }}>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: "#D5AD68" }}>
                    <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                    <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" style={{ fill: darkMode ? "#0d0d14" : "#13131f" }} />
                    <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" style={{ fill: "#D5AD68" }} />
                  </svg>
                </div>
                <span className="font-heading font-bold text-2xl tracking-tight text-white">Ra<span style={{ color: "#D5AD68" }}>Rumble</span></span>
              </div>
              <p className="text-[14px] mb-6" style={{ color: "rgba(255,255,255,0.45)", lineHeight: "1.7" }}>
                {t("footerJoin")}
              </p>
              <div className="flex items-center gap-5 flex-wrap">
                {[
                  { label: "Reddit",    path: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-3.11-8.83c-.384.345-.537.852-.406 1.327.13.475.5.849.97.993.47.144.98.02 1.334-.325.61-.556 1.524-.556 2.134 0 .354.346.864.47 1.334.325.47-.144.84-.518.97-.993.13-.475-.022-.982-.406-1.327-.994-.905-2.53-.905-3.93 0zm.77-3.17a.75.75 0 100 1.5.75.75 0 000-1.5zm4.68 0a.75.75 0 100 1.5.75.75 0 000-1.5z" },
                  { label: "TikTok",    path: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" },
                  { label: "X",         path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { label: "Facebook",  path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                  { label: "Instagram", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0122 7.5v9A5.5 5.5 0 0116.5 22h-9A5.5 5.5 0 012 16.5v-9A5.5 5.5 0 017.5 2z" },
                  { label: "YouTube",   path: "M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
                ].map(s => (
                  <a key={s.label} href="#" title={s.label} style={{ opacity: 0.45 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "0.45")}>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-white"><path d={s.path} /></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns — 2 col on mobile, 4 on desktop */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { title: t("colHelpCenter"),  links: ["Contact us", "About us", "Bug Bounty", "Blog", "Become a Partner", "Become an Affiliate", "Become a Seller"] },
                { title: t("colWarranty"),    links: ["TradeShield (Buying)", "TradeShield (Selling)", "Withdrawals", "Account Seller Rules"] },
                { title: t("colSellerRules"), links: ["Changing Username", "Fees", "Refund Policy"] },
                { title: t("currency"),       links: ["Accounts", "Top Up", "Items", "Boosting", "Gift Cards"] },
              ].map(col => (
                <div key={col.title}>
                  <h4 className="text-[14px] font-semibold mb-4 text-white">{col.title}</h4>
                  <ul className="space-y-3">
                    {col.links.map(link => (
                      <li key={link}>
                        <a href="#" className="text-[13px] transition-colors" style={{ color: "rgba(255,255,255,0.45)" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>{tLabel(link)}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-10 py-4 md:py-5" style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <p className="text-[12px] md:text-[13px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("copyright")}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              {["Terms of Service", "Privacy Policy", "DMCA", "DSA"].map(l => (
                <a key={l} href="#" className="text-[12px] md:text-[13px] transition-colors" style={{ color: "rgba(255,255,255,0.45)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}>{tLabel(l)}</a>
              ))}
            </div>
          </div>
        </div>

      </footer>

      {/* Language & Currency modal */}
      {createPortal(
        <AnimatePresence>
          {langCurOpen && (
            <motion.div
              key="langcur-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center p-4"
              style={{ zIndex: 10000, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
              onMouseDown={e => { if (e.target === e.currentTarget) setLangCurOpen(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full rounded-2xl overflow-hidden flex flex-col"
                style={{ maxWidth: "600px", maxHeight: "85vh", background: "#0e0e1a", border: "1px solid rgba(213,173,104,0.35)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 md:px-6 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(213,173,104,0.12)", border: "1px solid rgba(213,173,104,0.25)" }}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[1.5]" style={{ stroke: "#D5AD68" }}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
                    </div>
                    <h3 className="text-[16px] md:text-[17px] font-bold text-white">{t("modalTitle")}</h3>
                  </div>
                  <button onClick={() => setLangCurOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-5 md:px-6 py-5 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#D5AD68" }}>{t("modalLanguage")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                    {LANGUAGES.map(l => {
                      const active = draftLang === l.code;
                      return (
                        <button key={l.code} onClick={() => setDraftLang(l.code)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                          style={{ background: active ? "rgba(213,173,104,0.12)" : "rgba(255,255,255,0.03)", border: active ? "1px solid rgba(213,173,104,0.6)" : "1px solid rgba(255,255,255,0.07)" }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "rgba(213,173,104,0.3)"; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                          <span className="text-[18px] leading-none shrink-0">{l.flag}</span>
                          <span className="text-[13px] font-semibold truncate" style={{ color: active ? "#D5AD68" : "rgba(255,255,255,0.8)" }}>{l.label}</span>
                          {active && <svg viewBox="0 0 24 24" className="w-4 h-4 ml-auto shrink-0 fill-none stroke-2" style={{ stroke: "#D5AD68" }}><path d="M20 6L9 17l-5-5"/></svg>}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#D5AD68" }}>{t("currency")}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CURRENCIES.map(c => {
                      const active = draftCur === c.code;
                      return (
                        <button key={c.code} onClick={() => setDraftCur(c.code)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all"
                          style={{ background: active ? "rgba(213,173,104,0.12)" : "rgba(255,255,255,0.03)", border: active ? "1px solid rgba(213,173,104,0.6)" : "1px solid rgba(255,255,255,0.07)" }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "rgba(213,173,104,0.3)"; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0"
                            style={{ background: active ? "rgba(213,173,104,0.2)" : "rgba(213,173,104,0.1)", color: "#D5AD68" }}>{c.symbol}</span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold leading-tight" style={{ color: active ? "#D5AD68" : "rgba(255,255,255,0.85)" }}>{c.code}</span>
                            <span className="block text-[10px] leading-tight truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{c.name}</span>
                          </span>
                          {active && <svg viewBox="0 0 24 24" className="w-4 h-4 ml-auto shrink-0 fill-none stroke-2" style={{ stroke: "#D5AD68" }}><path d="M20 6L9 17l-5-5"/></svg>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3 px-5 md:px-6 py-4 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button
                    onClick={() => { setLocale({ lang: draftLang, cur: draftCur }); setLangCurOpen(false); }}
                    className="flex-1 h-11 rounded-xl font-bold text-[14px] transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #D5AD68 0%, #e8c586 100%)", color: "#1a1100", boxShadow: "0 4px 16px rgba(213,173,104,0.25)" }}>
                    {t("save")}
                  </button>
                  <button
                    onClick={() => setLangCurOpen(false)}
                    className="flex-1 h-11 rounded-xl font-semibold text-[14px] transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
                    {t("cancel")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
