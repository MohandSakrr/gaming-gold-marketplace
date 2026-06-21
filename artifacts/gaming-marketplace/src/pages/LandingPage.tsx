import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, Star, Crown, ChevronRight, ChevronDown, X, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const MOCK_OFFERS = [
  { id: 1, game: "Elden Ring", type: "Max Level Account", price: "249.99", rating: "4.9", thumb: "/images/thumb-rpg.png" },
  { id: 2, game: "Valorant", type: "Immortal Rank Boost", price: "89.00", rating: "5.0", thumb: "/images/thumb-fps.png" },
  { id: 3, game: "WoW", type: "100K Gold", price: "12.99", rating: "4.8", thumb: "/images/thumb-mmo.png" },
  { id: 4, game: "Apex Legends", type: "Predator Account", price: "150.00", rating: "4.7", thumb: "/images/thumb-br.png" },
  { id: 5, game: "League of Legends", type: "Diamond Smurf", price: "45.00", rating: "4.9", thumb: "/images/thumb-moba.png" },
  { id: 6, game: "FC 24", type: "1M Coins", price: "22.50", rating: "4.6", thumb: "/images/thumb-sports.png" },
  { id: 7, game: "CS2", type: "Faceit Lvl 10 Boost", price: "110.00", rating: "5.0", thumb: "/images/thumb-fps.png" },
  { id: 8, game: "Final Fantasy XIV", type: "Mythic Mount", price: "75.00", rating: "4.8", thumb: "/images/thumb-mmo.png" },
  { id: 9, game: "Fortnite", type: "Master Rank Carry", price: "55.00", rating: "4.9", thumb: "/images/thumb-br.png" },
  { id: 10, game: "Dota 2", type: "Grandmaster Coaching", price: "30.00", rating: "5.0", thumb: "/images/thumb-moba.png" },
  { id: 11, game: "Rocket League", type: "Credits 10k", price: "15.99", rating: "4.7", thumb: "/images/thumb-sports.png" },
  { id: 12, game: "Genshin Impact", type: "Savage Raid Clear", price: "40.00", rating: "4.8", thumb: "/images/thumb-mmo.png" },
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

  const [selectedService, setSelectedService] = useState("All Categories");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<typeof SEARCH_DATA>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(["Fortnite Accounts", "WoW Gold"]);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const catBarRef = useRef<HTMLDivElement>(null);
  const catBarInnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (catBarRef.current && !catBarRef.current.contains(e.target as Node)) {
        setActiveCat(null);
        setCatSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = searchFocused ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [searchFocused]);

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
  const [offers, setOffers] = useState(MOCK_OFFERS.slice(0, 5));
  const [offerIndex, setOfferIndex] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffers(prev => {
        const nextIndex = (offerIndex + 1) % MOCK_OFFERS.length;
        setOfferIndex(nextIndex);
        const newOffer = { ...MOCK_OFFERS[nextIndex], id: Date.now() }; // unique ID for animation
        return [newOffer, ...prev.slice(0, 4)];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [offerIndex]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background border-b border-border/50">
        <div className="w-full px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" className="fill-background" />
                <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" />
              </svg>
            </div>
            <span className="font-heading font-bold text-3xl tracking-tight text-white">
              Ra<span className="text-primary">Rumble</span>
            </span>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-6xl mx-8 relative" ref={searchRef}>
            <div
              className="relative flex items-center h-11 bg-[#1a1a2e] overflow-visible transition-all"
              ref={dropdownRef}
              style={{
                border: searchFocused ? "2px solid #D5AD68" : "1px solid rgba(255,255,255,0.15)",
                borderRadius: "999px",
              }}
            >
              {/* Search icon left (only when not focused) */}
              {!searchFocused && (
                searchLoading
                  ? <Loader2 className="absolute left-4 w-4 h-4 text-primary animate-spin pointer-events-none" />
                  : <Search className="absolute left-4 w-4 h-4 pointer-events-none" style={{ color: "rgba(255,255,255,0.4)" }} />
              )}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => { setSearchFocused(true); setDropdownOpen(false); }}
                placeholder="Search games, keywords, sellers..."
                className="flex-1 bg-transparent h-full text-sm text-white placeholder:text-muted-foreground outline-none"
                style={{ paddingLeft: searchFocused ? "16px" : "36px", paddingRight: "8px" }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSuggestions([]); }} className="p-1 mr-1 text-muted-foreground hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Divider */}
              <div className="w-px h-6 bg-border/50 shrink-0" />
              {/* Category trigger */}
              <button
                onClick={() => { setDropdownOpen(o => !o); setSearchFocused(false); }}
                className="flex items-center gap-2 px-4 h-full text-sm font-medium text-card-foreground hover:text-white transition-colors whitespace-nowrap"
              >
                {selectedService}
                <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {/* Search icon right (only when focused) */}
              {searchFocused && (
                <button className="h-full px-4 flex items-center justify-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {searchLoading
                    ? <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    : <Search className="w-4 h-4" />
                  }
                </button>
              )}

              {/* Category dropdown */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 rounded-2xl shadow-2xl z-50 p-6" style={{ background: "#1c1c2e", border: "1px solid rgba(255,255,255,0.08)", width: "700px" }}>
                  <p className="text-[11px] text-white/40 font-semibold uppercase tracking-widest mb-5">Search in service</p>
                  <div className="grid grid-cols-4 gap-1">
                    {SERVICES.map(service => (
                      <button
                        key={service.label}
                        onClick={() => { setSelectedService(service.label); setDropdownOpen(false); }}
                        className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl transition-all hover:bg-white/5 group ${selectedService === service.label ? "bg-white/10" : ""}`}
                      >
                        <div className="rounded-2xl flex items-center justify-center" style={{ background: service.bg, width: "52px", height: "52px" }}>
                          <svg viewBox="0 0 24 24" style={{ width: "24px", height: "24px" }} className="stroke-[1.8] fill-none stroke-white" strokeLinecap="round" strokeLinejoin="round">
                            <path d={service.icon} />
                          </svg>
                        </div>
                        <span className="text-[12px] font-semibold text-white/75 group-hover:text-white leading-tight text-center">{service.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search results panel */}
            {searchFocused && !dropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2" style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", maxHeight: "400px", overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
                {searchQuery && suggestions.length > 0 ? (
                  suggestions.slice(0, 7).map((item, i) => (
                    <button key={i}
                      onClick={() => { setSearchQuery(item.label); setSearchFocused(false); setRecentSearches(r => [item.label, ...r.filter(x => x !== item.label)].slice(0, 5)); }}
                      className="w-full flex items-center gap-3 px-5 py-3 transition-colors group"
                      style={{  }}
                      onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                      onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ background: CATEGORY_COLORS[item.category]+"25", color: CATEGORY_COLORS[item.category] }}>
                        {item.category.slice(0,2).toUpperCase()}
                      </div>
                      <span className="text-[14px] text-white/85 group-hover:text-white font-medium">{item.label}</span>
                    </button>
                  ))
                ) : searchQuery && !searchLoading ? (
                  <p className="text-sm text-white/40 text-center py-5">No results for "<span className="text-white/60">{searchQuery}</span>"</p>
                ) : (
                  <>
                    {recentSearches.length > 0 && (
                      <>
                        <div className="flex items-center justify-between px-5 pt-3 pb-1">
                          <p className="text-[11px] text-white/35 font-bold uppercase tracking-widest">Recently searched</p>
                          <button onClick={() => setRecentSearches([])} className="text-[11px] text-white/35 hover:text-white transition-colors">Clear all</button>
                        </div>
                        {recentSearches.slice(0, 2).map((r, i) => (
                          <button key={i} onClick={() => setSearchQuery(r)}
                            className="w-full flex items-center gap-3 px-5 py-3 transition-colors group"
                            onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                            onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                          >
                            <Clock className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }} />
                            <span className="text-[14px] text-white/60 group-hover:text-white font-medium">{r}</span>
                          </button>
                        ))}
                        <div className="mx-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }} />
                      </>
                    )}
                    <p className="text-[11px] text-white/35 font-bold uppercase tracking-widest px-5 pt-3 pb-1">Popular categories</p>
                    {POPULAR_CATEGORIES
                      .filter(p => selectedService === "All Categories" || p.category === selectedService)
                      .slice(0, 10)
                      .map((item, i, arr) => (
                        <button key={i}
                          onClick={() => { setSearchQuery(item.label); setRecentSearches(r => [item.label, ...r.filter(x => x !== item.label)].slice(0, 5)); }}
                          className="w-full flex items-center gap-3 px-5 py-3 transition-colors group"
                          style={{  }}
                          onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.04)")}
                          onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]" style={{ background: item.color+"25", color: item.color }}>
                            {item.category.slice(0,2).toUpperCase()}
                          </div>
                          <span className="text-[14px] text-white/80 group-hover:text-white font-medium">{item.label}</span>
                        </button>
                      ))
                    }
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button className="h-10 px-6 font-semibold text-sm rounded-xl transition-opacity hover:opacity-90" style={{ background: "#D5AD68", color: "#1a1100" }}>
              Log in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20" style={{ height: "680px", background: "#020818" }}>
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
        <div className="relative z-20 h-full flex items-center px-40">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ maxWidth: "560px" }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-5 font-heading">
              Rule Vice City's<br />
              <span style={{ color: "#D5AD68" }}>Economy</span>
            </h1>
            <p className="text-base mb-8 font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              Buy & sell GTA VI money, accounts, and items.<br />
              Trusted by 12M+ players · Instant delivery.
            </p>
            <button
              className="px-10 rounded-full text-base font-bold transition-opacity hover:opacity-90"
              style={{ background: "#D5AD68", color: "#0a0a12", height: "52px" }}
            >
              Shop Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="-mt-6" style={{ zIndex: 100, position: "relative", overflow: "visible" }} ref={catBarRef}>
        <div className="mx-auto px-8" style={{ maxWidth: "1100px", position: "relative", overflow: "visible" }}>
          <div
            ref={catBarInnerRef}
            className="flex items-center justify-between gap-2 px-6 py-4"
            style={{
              background: "rgba(10,10,22,0.97)",
              border: "1px solid rgba(213,173,104,0.35)",
              borderRadius: activeCat ? "16px 16px 0 0" : "16px",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
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
                  setActiveCat(activeCat === cat.label ? null : cat.label);
                  setCatSearch("");
                }}
                className="flex flex-col items-center gap-2 px-5 py-2 rounded-xl group transition-all cursor-pointer"
                style={{
                  flex: 1,
                  background: activeCat === cat.label ? "rgba(213,173,104,0.1)" : "transparent",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  style={{ width: "32px", height: "32px", color: activeCat === cat.label ? "#D5AD68" : "rgba(213,173,104,0.7)" }}
                  className="fill-none stroke-current stroke-[1.6] group-hover:scale-110 transition-transform duration-200"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d={cat.icon} />
                </svg>
                <span className="text-[13px] font-semibold transition-colors"
                  style={{ color: activeCat === cat.label ? "#D5AD68" : "rgba(255,255,255,0.7)" }}>
                  {cat.label}
                </span>
              </motion.button>
            ))}
          </div>

        </div>
      </section>

      {/* Category Dropdown — rendered via portal to escape overflow clipping */}
      {activeCat && CATEGORY_DATA[activeCat] && createPortal(
        <div
          style={{
            position: "fixed",
            top: catBarInnerRef.current ? catBarInnerRef.current.getBoundingClientRect().bottom : 0,
            left: catBarInnerRef.current ? catBarInnerRef.current.getBoundingClientRect().left : 0,
            width: catBarInnerRef.current ? catBarInnerRef.current.getBoundingClientRect().width : 0,
            zIndex: 9999,
            background: "#0e0e1a",
            border: "1px solid rgba(213,173,104,0.35)",
            borderTop: "none",
            borderRadius: "0 0 16px 16px",
            display: "flex",
            maxHeight: "380px",
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
          }}
        >
          {/* Left: Popular games */}
          <div className="flex-1 p-5 overflow-y-auto" style={{ borderRight: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#D5AD68" }}>Popular games</p>
            <div className="grid grid-cols-2 gap-1">
              {CATEGORY_DATA[activeCat].popular.map((game) => (
                <button key={game} className="flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors hover:bg-white/5 group">
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "rgba(213,173,104,0.15)", color: "#D5AD68" }}>
                    {game.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[13px] text-white/70 group-hover:text-white leading-tight line-clamp-1">{game}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: All games + search */}
          <div className="w-72 p-5 flex flex-col">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>All games</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
              <input
                type="text"
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                placeholder="Search for game"
                className="w-full bg-transparent pl-9 pr-3 py-2 text-sm text-white outline-none rounded-lg"
                style={{ border: "1px solid rgba(213,173,104,0.4)", background: "rgba(255,255,255,0.03)" }}
              />
            </div>
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#D5AD68 transparent" }}>
              {CATEGORY_DATA[activeCat].all
                .filter(g => g.toLowerCase().includes(catSearch.toLowerCase()))
                .map((game) => (
                  <button key={game} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors hover:bg-white/5 group">
                    <div className="w-7 h-7 rounded-md shrink-0 flex items-center justify-center text-[9px] font-bold"
                      style={{ background: "rgba(213,173,104,0.12)", color: "#D5AD68" }}>
                      {game.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[13px] text-white/60 group-hover:text-white">{game}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Live Offers Feed */}
      <section className="py-20 relative z-20">
        <div className="container mx-auto px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-2xl font-bold font-heading text-white">Live Offers</h2>
          </div>
          <Button variant="link" className="text-primary hover:text-primary/80 group">
            View All <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="w-full overflow-hidden">
          <div className="flex px-6 h-[180px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {offers.map((offer) => (
                <motion.div
                  key={offer.id}
                  layout
                  initial={{ opacity: 0, x: -280, filter: "blur(4px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: 280, filter: "blur(4px)" }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                  className="shrink-0 w-[260px] mr-4"
                >
                  <div className="h-full bg-card rounded-xl border border-border p-4 flex flex-col justify-between hover:border-primary/50 hover:shadow-[0_0_15px_rgba(213,173,104,0.1)] transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                        <img src={offer.thumb} alt={offer.game} className="w-full h-full object-cover" />
                        <div className="absolute top-0 left-0 bg-background/80 backdrop-blur-[2px] px-1.5 py-0.5 rounded-br-lg flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-indicator" />
                          <span className="text-[8px] font-bold text-primary tracking-wider">LIVE</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight line-clamp-1">{offer.game}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{offer.type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-lg font-bold text-primary font-heading">${offer.price}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="text-xs font-medium text-card-foreground">{offer.rating}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground h-8 text-xs glow-gold">
                        Buy Now
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Featured Categories Grid */}
      <section className="py-20 bg-card/10">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold font-heading text-white mb-10">Featured Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "FPS Games", count: "12,450", img: "/images/cat-fps.png" },
              { name: "MMORPGs", count: "8,920", img: "/images/cat-mmo.png" },
              { name: "Battle Royale", count: "15,300", img: "/images/cat-br.png" },
              { name: "Fighting Games", count: "4,100", img: "/images/cat-fight.png" },
              { name: "Sports Games", count: "9,850", img: "/images/cat-sports.png" },
              { name: "Strategy Games", count: "3,200", img: "/images/cat-strategy.png" },
            ].map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative h-48 rounded-2xl overflow-hidden border border-border cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
                <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 z-20 p-6 flex flex-col justify-end">
                  <h3 className="text-2xl font-bold text-white font-heading mb-2">{cat.name}</h3>
                  <div className="inline-block px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-xs font-semibold text-primary self-start backdrop-blur-sm">
                    {cat.count} listings
                  </div>
                </div>
                <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none glow-gold" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / Stats Bar */}
      <section className="py-16 bg-card border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
            {[
              { val: "12M+", label: "Active Players" },
              { val: "500K+", label: "Listings" },
              { val: "99.2%", label: "Positive Reviews" },
              { val: "< 5min", label: "Avg. Delivery" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center px-4"
              >
                <div className="text-4xl md:text-5xl font-bold font-heading text-primary mb-2 drop-shadow-[0_0_10px_rgba(213,173,104,0.3)]">
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
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold font-heading text-white mb-10 text-center">Top Verified Sellers This Week</h2>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 border-b border-border/50 bg-background/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <div className="w-12 text-center">Rank</div>
              <div>Seller</div>
              <div className="hidden sm:block text-right w-24">Sales</div>
              <div className="w-24 text-right pr-4">Action</div>
            </div>
            <div className="divide-y divide-border/30">
              {[
                { name: "ShadowStriker", spec: "Valorant Specialist", sales: "1,204", rating: "5.0", avatar: "/images/avatar-1.png" },
                { name: "ElvenMerchant", spec: "WoW Gold Farmer", sales: "982", rating: "4.9", avatar: "/images/avatar-2.png" },
                { name: "TacticalGear", spec: "CS2 Items", sales: "845", rating: "4.8", avatar: "/images/avatar-3.png" },
                { name: "NinjaBoosts", spec: "Apex Predator Carries", sales: "721", rating: "5.0", avatar: "/images/avatar-4.png" },
                { name: "KingSlayer", spec: "Elden Ring Accounts", sales: "650", rating: "4.9", avatar: "/images/avatar-5.png" },
              ].map((seller, i) => (
                <motion.div 
                  key={seller.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                >
                  <div className="w-12 flex justify-center items-center">
                    {i === 0 ? (
                      <Crown className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(213,173,104,0.5)]" />
                    ) : (
                      <span className="text-lg font-bold font-heading text-muted-foreground">{i + 1}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors overflow-hidden">
                      {/* Fallback to generic icon if image is missing */}
                      <img src={seller.avatar} alt={seller.name} className="w-full h-full object-cover bg-background" />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        {seller.name}
                        <div className="flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 rounded text-[10px] text-primary">
                          <Star className="w-3 h-3 fill-primary" /> {seller.rating}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{seller.spec}</div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right w-24 font-medium text-card-foreground">
                    {seller.sales}
                  </div>
                  <div className="w-24 text-right">
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10 w-full justify-center">
                      View Shop
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-primary fill-current">
                    <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                    <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" className="fill-background" />
                    <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" />
                  </svg>
                </div>
                <span className="font-heading font-bold text-xl tracking-tight text-white">
                  Ra<span className="text-primary">Rumble</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                The premium destination for secure, fast, and reliable game asset trading. Elevate your gaming experience today.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Trust & Safety</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Selling Guide</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border/50 gap-4">
            <p className="text-xs text-muted-foreground">
              © 2026 RaRumble Inc. All rights reserved. Trade responsibly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter/X</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Discord</a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">YouTube</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
