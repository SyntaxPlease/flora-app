import { useState, useEffect } from "react";
import homeInsightsArt from "./assets/home-insights.svg";
import gutBalanceArt from "./assets/gut-balance.svg";
import foodJourneyArt from "./assets/food-journey.svg";
import archetypeGardenArt from "./assets/archetype-garden.svg";
import profileWellnessArt from "./assets/profile-wellness.svg";
import dietSaladArt from "./assets/diet-salad.svg";
import lifestyleMotionArt from "./assets/lifestyle-motion.svg";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────
const C = {
  bg:       "#050c07",
  surface:  "#0a140c",
  card:     "#0f1e12",
  border:   "rgba(74,222,128,0.12)",
  border2:  "rgba(255,255,255,0.06)",
  green:    "#4ade80",
  greenDim: "rgba(74,222,128,0.1)",
  lime:     "#86efac",
  teal:     "#2dd4bf",
  yellow:   "#fbbf24",
  red:      "#f87171",
  orange:   "#fb923c",
  blue:     "#60a5fa",
  purple:   "#a78bfa",
  text:     "#f0fdf4",
  muted:    "#6b7280",
  dim:      "#374151",
  serif:    "'Cormorant Garamond', Georgia, serif",
  sans:     "'DM Sans', system-ui, sans-serif",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};font-family:${C.sans}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.3)}50%{box-shadow:0 0 0 12px rgba(74,222,128,0)}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes typing{0%,60%,100%{opacity:1}30%{opacity:0.3}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.fadeUp{animation:fadeUp 0.6s ease both}
.fadeIn{animation:fadeIn 0.4s ease both}
.slideIn{animation:slideIn 0.35s ease both}
.float{animation:float 4s ease-in-out infinite}
input,textarea{outline:none}
input::placeholder,textarea::placeholder{color:${C.muted}}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${C.dim};border-radius:4px}
.bar-grow{animation:grow 1s cubic-bezier(0.34,1.56,0.64,1) both}
.metric-card{cursor:pointer;transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1)}
.metric-card:hover{transform:translateY(-4px) scale(1.01);border-color:rgba(74,222,128,0.3)!important}
.metric-card:active{transform:scale(0.97)}
.image-card{transition:transform 0.24s cubic-bezier(0.34,1.56,0.64,1), border-color 0.24s ease, box-shadow 0.24s ease}
.image-card:hover{transform:translateY(-4px);box-shadow:0 18px 36px rgba(0,0,0,0.18)}
.image-card-media img{transition:transform 0.35s ease, filter 0.35s ease}
.image-card:hover .image-card-media img{transform:scale(1.06);filter:saturate(1.08)}
.feature-tile{position:relative;overflow:hidden}
.feature-thumb{margin-top:12px;height:74px;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03)}
.feature-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.35s ease, filter 0.35s ease}
.feature-tile:hover .feature-thumb img{transform:scale(1.08);filter:saturate(1.1)}
`;

const LOCAL_API_BASES = ["", "http://127.0.0.1:8000", "http://localhost:8000"];

function uniqueItems(items) {
  return [...new Set(items.filter(Boolean))];
}

function getApiBases() {
  const envBase = process.env.REACT_APP_API_URL?.trim();

  if (typeof window === "undefined") {
    return uniqueItems([envBase, ...LOCAL_API_BASES]);
  }

  const { origin, hostname, protocol } = window.location;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(hostname);
  const renderCandidates = [];

  if (hostname.endsWith(".onrender.com")) {
    const hostVariants = [
      hostname.replace("frontend", "api"),
      hostname.replace("frontend", "backend"),
      hostname.replace("app", "api"),
      hostname.replace("app", "backend"),
    ].filter((candidate) => candidate !== hostname);

    hostVariants.forEach((candidate) => renderCandidates.push(`${protocol}//${candidate}`));
  }

  return uniqueItems([
    envBase,
    ...(isLocalHost ? LOCAL_API_BASES : [origin]),
    ...renderCandidates,
  ]);
}

// ─── API CACHE & FAST TIMEOUT ─────────────────────────────────────────
const _apiCache = new Map();
const API_TIMEOUT_MS = 4000; // fast 4-second timeout per base URL

function _fetchWithTimeout(url, options, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isRead = method === "GET";

  // Return cached response for GET requests
  if (isRead && _apiCache.has(path)) {
    return _apiCache.get(path);
  }

  const apiBases = getApiBases();
  let lastError = null;

  for (let index = 0; index < apiBases.length; index += 1) {
    const base = apiBases[index];
    const hasMoreOptions = index < apiBases.length - 1;

    try {
      const response = await _fetchWithTimeout(`${base}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      });

      const isJson = response.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await response.json() : null;

      if (response.ok) {
        if (isRead) _apiCache.set(path, data);
        return data;
      }

      const message = data?.detail || response.statusText || "Request failed";

      if (hasMoreOptions && response.status === 404) {
        lastError = new Error(message);
        continue;
      }

      throw new Error(message);
    } catch (error) {
      lastError = error;
      const isNetworkError = error instanceof TypeError
        || /failed to fetch/i.test(error.message)
        || error.name === "AbortError";

      if (hasMoreOptions && isNetworkError) {
        continue;
      }

      break;
    }
  }

  if (lastError && (/failed to fetch/i.test(lastError.message) || lastError.name === "AbortError")) {
    throw new Error("Could not reach the Flora server. Start the backend or set REACT_APP_API_URL.");
  }

  throw lastError || new Error("Request failed");
}
// ─── QUIZ QUESTIONS ─────────────────────────────────────────────────
const QUESTIONS = [
  { id:"fruits_veggies",  cat:"Diet",       icon:"🥦", q:"How often do you eat fruits & vegetables?",                    opts:[{l:"Every day",v:3},{l:"A few times a week",v:1},{l:"Rarely",v:-1},{l:"Almost never",v:-2}] },
  { id:"junk_food",       cat:"Diet",       icon:"🍔", q:"How often do you eat processed or fried food?",                opts:[{l:"Rarely or never",v:2},{l:"Once a week",v:0},{l:"Several times a week",v:-2},{l:"Every day",v:-3}] },
  { id:"fermented",       cat:"Diet",       icon:"🫙", q:"Do you eat probiotic foods? (curd, yogurt, kimchi, buttermilk)", opts:[{l:"Every day",v:3},{l:"A few times a week",v:2},{l:"Rarely",v:-1},{l:"Never",v:-2}] },
  { id:"water",           cat:"Diet",       icon:"💧", q:"How much water do you drink daily?",                            opts:[{l:"8+ glasses",v:2},{l:"5–7 glasses",v:1},{l:"3–4 glasses",v:-1},{l:"Less than 3",v:-2}] },
  { id:"fiber",           cat:"Diet",       icon:"🌾", q:"How much fiber do you get? (dal, oats, whole grains, veggies)", opts:[{l:"Plenty — daily",v:2},{l:"Some — most days",v:1},{l:"A little",v:-1},{l:"Very little",v:-2}] },
  { id:"sugar",           cat:"Diet",       icon:"🍬", q:"How much added sugar or sugary drinks do you consume?",        opts:[{l:"Rarely — very low sugar",v:2},{l:"Occasionally",v:0},{l:"Most days",v:-2},{l:"Multiple times daily",v:-3}] },
  { id:"plant_diversity", cat:"Diet",       icon:"🌈", q:"How many different plant foods do you eat in a week?",         opts:[{l:"20+ different plants",v:3},{l:"10–20 plants",v:1},{l:"5–10 plants",v:-1},{l:"Fewer than 5",v:-2}] },
  { id:"meal_timing",     cat:"Diet",       icon:"🕐", q:"How regular are your mealtimes?",                              opts:[{l:"Very regular — same times daily",v:2},{l:"Mostly regular",v:1},{l:"Often irregular",v:-1},{l:"No set schedule",v:-2}] },
  { id:"alcohol",         cat:"Diet",       icon:"🍺", q:"How often do you consume alcohol?",                            opts:[{l:"Never or very rarely",v:2},{l:"Occasionally (1–2/week)",v:0},{l:"Several times a week",v:-2},{l:"Daily",v:-3}] },
  { id:"antibiotics",     cat:"Medication", icon:"💊", q:"Have you taken antibiotics in the last 3 months?",             opts:[{l:"No",v:1},{l:"Yes, short course",v:-2},{l:"Yes, long course",v:-3},{l:"Multiple courses",v:-4}] },
  { id:"probiotics",      cat:"Medication", icon:"🌿", q:"Do you take probiotic or prebiotic supplements?",              opts:[{l:"Daily",v:2},{l:"Sometimes",v:1},{l:"Only after antibiotics",v:0},{l:"Never",v:-1}] },
  { id:"bloating",        cat:"Symptoms",   icon:"😣", q:"How often do you feel bloated or gassy?",                      opts:[{l:"Rarely or never",v:2},{l:"Once in a while",v:0},{l:"Often",v:-2},{l:"Almost every day",v:-3}] },
  { id:"acidity",         cat:"Symptoms",   icon:"🔥", q:"Do you experience acidity or heartburn?",                      opts:[{l:"Never",v:2},{l:"Rarely",v:1},{l:"A few times a week",v:-1},{l:"Daily",v:-3}] },
  { id:"bristol",         cat:"Symptoms",   icon:"🩺", q:"How would you describe your usual stool consistency?",         opts:[{l:"Smooth and regular (ideal)",v:2},{l:"Slightly soft",v:0},{l:"Hard or constipated",v:-2},{l:"Loose or liquid",v:-3}] },
  { id:"bowel_freq",      cat:"Symptoms",   icon:"📅", q:"How often do you have a bowel movement?",                      opts:[{l:"Once or twice daily",v:2},{l:"Every 1–2 days",v:1},{l:"Every 3–4 days",v:-1},{l:"Less often or very irregular",v:-2}] },
  { id:"fatigue",         cat:"Symptoms",   icon:"😴", q:"Do you feel unexplained fatigue or brain fog during the day?", opts:[{l:"Rarely — I feel energised",v:2},{l:"Sometimes",v:0},{l:"Often",v:-2},{l:"Almost every day",v:-3}] },
  { id:"skin",            cat:"Symptoms",   icon:"🧴", q:"Do you experience skin issues? (acne, eczema, rashes)",        opts:[{l:"No skin issues",v:2},{l:"Mild and occasional",v:0},{l:"Moderate and recurring",v:-1},{l:"Frequent and significant",v:-2}] },
  { id:"food_intol",      cat:"Symptoms",   icon:"🚫", q:"Do you notice discomfort after eating specific foods?",         opts:[{l:"No — I tolerate most foods well",v:2},{l:"Mild reactions to a few foods",v:0},{l:"Moderate reactions regularly",v:-2},{l:"Severe or frequent reactions",v:-3}] },
  { id:"nausea",          cat:"Symptoms",   icon:"🤢", q:"How often do you experience nausea or stomach cramps?",         opts:[{l:"Never",v:2},{l:"Rarely",v:1},{l:"Sometimes (weekly)",v:-1},{l:"Often or daily",v:-3}] },
  { id:"stress",          cat:"Lifestyle",  icon:"🧘", q:"How stressed do you usually feel?",                            opts:[{l:"Calm and balanced",v:2},{l:"Mildly stressed",v:0},{l:"Often overwhelmed",v:-2},{l:"Chronically stressed",v:-3}] },
  { id:"sleep",           cat:"Lifestyle",  icon:"🌙", q:"How many hours do you sleep each night?",                      opts:[{l:"7–9 hours",v:2},{l:"6–7 hours",v:1},{l:"5–6 hours",v:-1},{l:"Under 5 hours",v:-3}] },
  { id:"exercise",        cat:"Lifestyle",  icon:"🏃", q:"How often do you do physical activity (any kind)?",            opts:[{l:"5–7 times a week",v:2},{l:"3–4 times a week",v:1},{l:"1–2 times a week",v:-1},{l:"Rarely or never",v:-2}] },
  { id:"smoking",         cat:"Lifestyle",  icon:"🚬", q:"Do you smoke or use tobacco products?",                        opts:[{l:"Never",v:2},{l:"Quit more than a year ago",v:1},{l:"Occasionally",v:-2},{l:"Daily smoker",v:-3}] },
  { id:"mindful_eating",  cat:"Lifestyle",  icon:"🍽️", q:"Do you eat mindfully — slowly, without screens, chewing well?", opts:[{l:"Always — very mindful",v:2},{l:"Usually",v:1},{l:"Rarely — often rushed or distracted",v:-1},{l:"Never",v:-2}] },
  { id:"outdoor_time",    cat:"Lifestyle",  icon:"🌿", q:"How much time do you spend outdoors or in nature weekly?",     opts:[{l:"Several hours most days",v:2},{l:"A few hours a week",v:1},{l:"Very little — mostly indoors",v:-1},{l:"Almost never outdoors",v:-2}] },
];

const CAT_COLORS = { Diet:"#4ade80", Medication:"#fb923c", Symptoms:"#f472b6", Lifestyle:"#60a5fa" };
const CAT_ICONS  = { Diet:"🥗", Medication:"💊", Symptoms:"🩺", Lifestyle:"🏃" };

// ─── ANALYSIS ENGINE ─────────────────────────────────────────────────
const CATEGORY_KEYS = {
  Diet:["fruits_veggies","junk_food","fermented","water","fiber","sugar","plant_diversity","meal_timing","alcohol"],
  Medication:["antibiotics","probiotics"],
  Symptoms:["bloating","acidity","bristol","bowel_freq","fatigue","skin","food_intol","nausea"],
  Lifestyle:["stress","sleep","exercise","smoking","mindful_eating","outdoor_time"],
};
const CATEGORY_ART = {
  Diet:{ emoji:"🥗", title:"Diet Analysis", subtitle:"How food is shaping digestion day to day", accent:C.green },
  Medication:{ emoji:"💊", title:"Medication Signals", subtitle:"How recovery support and antibiotics affect balance", accent:C.orange },
  Symptoms:{ emoji:"🌿", title:"Gut Signals", subtitle:"What your body is trying to tell you", accent:"#f472b6" },
  Lifestyle:{ emoji:"⚡", title:"Lifestyle Analysis", subtitle:"Sleep, movement and stress patterns behind your score", accent:C.blue },
};
const ARCHETYPE_GUIDES = {
  "Balanced Gut": {
    emoji:"🌸",
    color:C.green,
    desc:"Your habits look supportive overall, and your gut seems fairly steady right now.",
    traits:["Comfortable digestion most days","Good food variety","Energy feels fairly stable"],
    actions:["Keep your fiber and water routine steady","Rotate different plant foods through the week","Protect sleep to stay in balance"],
  },
  "Sensitive Gut": {
    emoji:"🌿",
    color:C.yellow,
    desc:"Your gut may react quickly to certain foods, stress, or rushed eating habits.",
    traits:["Bloating or food reactions show up easily","Symptoms may change from day to day","Triggers matter more than quantity"],
    actions:["Track likely trigger foods for 7 days","Choose simpler meals when symptoms flare","Eat slowly and keep portions moderate"],
  },
  "Inflamed Gut": {
    emoji:"🔥",
    color:C.red,
    desc:"Your current pattern suggests irritation from food choices, symptoms, or recovery strain.",
    traits:["Frequent discomfort or heaviness","Low-fiber or high-sugar choices may be adding pressure","Stress can make digestion feel worse"],
    actions:["Focus on soft, fiber-rich whole foods","Reduce fried or sugary foods for a few days","If symptoms keep building, seek medical advice"],
  },
  "Slow Digestion Type": {
    emoji:"🐢",
    color:C.orange,
    desc:"Your body may be moving food more slowly than ideal, which can leave you feeling heavy or irregular.",
    traits:["Constipation or infrequent bowel movements","Low water or low movement patterns","Meals may sit heavy after eating"],
    actions:["Increase water steadily through the day","Take a short walk after meals","Add oats, fruit, dal, or vegetables tomorrow"],
  },
};
const SECTION_ART = {
  home: homeInsightsArt,
  analysis: homeInsightsArt,
  smart: homeInsightsArt,
  forecast: homeInsightsArt,
  food: foodJourneyArt,
  microbiome: gutBalanceArt,
  archetype: archetypeGardenArt,
  profile: profileWellnessArt,
  category: {
    Diet: dietSaladArt,
    Medication: homeInsightsArt,
    Symptoms: gutBalanceArt,
    Lifestyle: lifestyleMotionArt,
  },
};

const BACTERIA_GUIDANCE = {
  Firmicutes: {
    foods:"oats, bananas, dal, beans, whole grains, onions, and garlic",
    benefit:"These bacteria help break down fiber and can support the gut lining by producing calming compounds.",
    low:"Your reading looks a little low, so your gut may need more steady fiber support.",
    balanced:"This looks fairly steady, which usually supports smoother digestion.",
    elevated:"This does not always mean something is wrong, but balance still matters more than chasing one number.",
  },
  Bacteroidetes: {
    foods:"lentils, vegetables, leafy greens, fruit, beans, and other plant-rich meals",
    benefit:"They help digest complex carbohydrates and are often linked with better food breakdown and gut balance.",
    low:"A lower reading can be a sign that plant variety is not strong enough yet.",
    balanced:"A balanced level here is a good sign that your gut is handling plant foods fairly well.",
    elevated:"This can still be fine, but the bigger goal is keeping the overall ecosystem balanced.",
  },
  Actinobacteria: {
    foods:"curd, yogurt, kefir, banana, oats, onion, and other prebiotic-rich foods",
    benefit:"This group includes helpful bacteria linked with digestion support, immunity, and better gut comfort.",
    low:"Your gut may benefit from more probiotic and prebiotic foods to support this group.",
    balanced:"This level gives your gut a useful support layer for recovery and digestion.",
    elevated:"A moderate to slightly high reading is not usually the main concern here.",
  },
  Proteobacteria: {
    foods:"this is not a bacteria group you try to increase with food directly",
    benefit:"A smaller amount is normal, but if it rises too much it can reflect gut stress or irritation.",
    low:"Lower is usually better here because it suggests less gut stress.",
    balanced:"This looks controlled, which is a reassuring sign for gut balance.",
    elevated:"If this rises, the best response is usually more fiber, less fried or sugary food, and steadier recovery habits.",
  },
  Others: {
    foods:"plant variety across the week, such as fruits, vegetables, beans, grains, nuts, and seeds",
    benefit:"This group represents the rest of your gut variety, and variety is what helps the ecosystem stay resilient.",
    low:"A lower reading here can mean your gut would benefit from more food diversity.",
    balanced:"This suggests your gut still has a broader mix of bacteria supporting it.",
    elevated:"More variety can be a positive sign as long as the whole picture stays balanced.",
  },
};

const WEIGHTS = {
  fruits_veggies:0.13,junk_food:0.12,fermented:0.12,water:0.10,fiber:0.11,
  sugar:0.10,plant_diversity:0.11,meal_timing:0.07,alcohol:0.09,
  antibiotics:0.09,probiotics:0.07,
  bloating:0.10,acidity:0.08,bristol:0.11,bowel_freq:0.09,
  fatigue:0.10,skin:0.07,food_intol:0.09,nausea:0.08,
  stress:0.11,sleep:0.12,exercise:0.10,smoking:0.10,mindful_eating:0.08,outdoor_time:0.07,
};
const MAX_V = {
  fruits_veggies:3,junk_food:2,fermented:3,water:2,fiber:2,
  sugar:2,plant_diversity:3,meal_timing:2,alcohol:2,
  antibiotics:1,probiotics:2,
  bloating:2,acidity:2,bristol:2,bowel_freq:2,
  fatigue:2,skin:2,food_intol:2,nausea:2,
  stress:2,sleep:2,exercise:2,smoking:2,mindful_eating:2,outdoor_time:2,
};
const MIN_V = {
  fruits_veggies:-2,junk_food:-3,fermented:-2,water:-2,fiber:-2,
  sugar:-3,plant_diversity:-2,meal_timing:-2,alcohol:-3,
  antibiotics:-4,probiotics:-1,
  bloating:-3,acidity:-3,bristol:-3,bowel_freq:-2,
  fatigue:-3,skin:-2,food_intol:-3,nausea:-3,
  stress:-3,sleep:-3,exercise:-2,smoking:-3,mindful_eating:-2,outdoor_time:-2,
};

const QUESTION_LOOKUP = Object.fromEntries(QUESTIONS.map((question) => [question.id, question]));

const FACTOR_GUIDANCE = {
  fruits_veggies: {
    helping:"Regular fruits and vegetables feed fiber-loving gut bacteria and keep bowel movements easier.",
    hurting:"Low fruit and vegetable intake usually means your gut is missing fiber, water-rich foods, and plant variety.",
    care:"You have some plant foods, but your gut would benefit from seeing them more consistently.",
    nextHelping:"Keep at least one fruit or vegetable in two meals a day.",
    nextHurting:"Start with one simple daily win like banana, carrot, cucumber, or cooked vegetables.",
    nextCare:"Add one extra fruit or one cooked vegetable serving tomorrow.",
  },
  junk_food: {
    helping:"Keeping processed or fried foods low gives your gut less inflammatory load to handle.",
    hurting:"Frequent fried or processed meals can feel heavy, worsen acidity, and reduce gut balance.",
    care:"Your intake is not extreme, but cutting back a little could calm digestion quickly.",
    nextHelping:"Keep saving fried foods for occasional meals instead of daily choices.",
    nextHurting:"Swap one fried meal this week for dal, rice, curd, roti, or a homemade option.",
    nextCare:"Choose one lighter meal each day to reduce digestive load.",
  },
  fermented: {
    helping:"Fermented foods can gently support beneficial bacteria and improve gut resilience.",
    hurting:"Not eating fermented foods often means your gut misses an easy source of probiotic support.",
    care:"You get some support here, but not enough to make it a steady habit yet.",
    nextHelping:"Keep rotating curd, buttermilk, or yogurt into your routine.",
    nextHurting:"Add curd, buttermilk, or yogurt once a day if it suits you.",
    nextCare:"Try one fermented food 3 to 4 times this week.",
  },
  water: {
    helping:"Good hydration helps food move well, softens stool, and reduces that heavy bloated feeling.",
    hurting:"Low water intake can slow digestion and make bloating or constipation feel worse.",
    care:"You are close, but a little more hydration would support your gut better.",
    nextHelping:"Keep pairing meals with water and carry a bottle through the day.",
    nextHurting:"Aim for one extra glass with each meal tomorrow.",
    nextCare:"Set an easy target like 6 to 8 glasses across the day.",
  },
  fiber: {
    helping:"Fiber feeds beneficial bacteria and helps your gut stay more regular and comfortable.",
    hurting:"Low fiber makes it harder for good bacteria to thrive and may slow digestion.",
    care:"Your gut needs a bit more daily fiber support to feel steadier.",
    nextHelping:"Keep using oats, dal, fruit, beans, and vegetables as regular staples.",
    nextHurting:"Add one fiber-rich item tomorrow like oats, fruit, dal, or salad.",
    nextCare:"Build one meal a day around a fiber source first.",
  },
  sugar: {
    helping:"Keeping added sugar low reduces strain on your gut and supports steadier energy.",
    hurting:"Too much added sugar can throw off gut balance and feed the bacteria you do not want to overgrow.",
    care:"This area is mixed, so a few smarter swaps could improve your score quickly.",
    nextHelping:"Keep sugary drinks and sweets as occasional treats.",
    nextHurting:"Replace one sugary drink or dessert this week with fruit, water, or buttermilk.",
    nextCare:"Watch the easiest source first, like sweet drinks or packaged snacks.",
  },
  plant_diversity: {
    helping:"Eating a wider mix of plant foods helps grow a more resilient and diverse gut ecosystem.",
    hurting:"Low plant variety limits the range of bacteria your gut can support.",
    care:"You have some variety, but not enough to give your gut broad support yet.",
    nextHelping:"Keep rotating colors and plant foods through the week.",
    nextHurting:"Add two new plant foods this week, even simple ones like spinach and apple.",
    nextCare:"Aim to rotate your usual meals instead of repeating the same foods every day.",
  },
  meal_timing: {
    helping:"Regular mealtimes help digestion stay more predictable and can reduce acidity swings.",
    hurting:"Irregular meal timing can stress digestion and make symptoms feel less predictable.",
    care:"Your timing is not too far off, but a steadier routine would help.",
    nextHelping:"Keep meals around similar times each day when possible.",
    nextHurting:"Start by fixing just breakfast or dinner to one regular time.",
    nextCare:"Choose one meal to keep consistent for the next few days.",
  },
  alcohol: {
    helping:"Keeping alcohol low gives your gut lining and bacteria a calmer environment.",
    hurting:"Frequent alcohol can irritate the gut, worsen acidity, and disturb recovery.",
    care:"Alcohol may not be the biggest problem, but reducing it would still help your score.",
    nextHelping:"Keep alcohol occasional and hydrate around it.",
    nextHurting:"Cut back one drinking day this week and replace it with water-rich meals.",
    nextCare:"Notice whether alcohol-heavy days line up with worse symptoms.",
  },
  antibiotics: {
    helping:"Not needing antibiotics recently usually means your gut bacteria have had more time to stay stable.",
    hurting:"Recent antibiotics can reduce helpful bacteria, so your gut may need gentle rebuilding support.",
    care:"There may still be some recovery support needed depending on how recent the course was.",
    nextHelping:"Keep supporting your gut with steady food variety and hydration.",
    nextHurting:"Focus on simple meals, fermented foods, and routine for the next few weeks.",
    nextCare:"Add recovery habits like curd, sleep, and regular meals while your gut rebuilds.",
  },
  probiotics: {
    helping:"Probiotic or prebiotic support can help your gut recover faster after stressors.",
    hurting:"Without some probiotic support, recovery after antibiotics or digestive upset can feel slower.",
    care:"A little more consistent support here may help your gut settle faster.",
    nextHelping:"Keep using probiotic support if it suits your digestion.",
    nextHurting:"Consider curd, buttermilk, yogurt, or a clinician-approved supplement.",
    nextCare:"Use probiotic foods a few times a week to build consistency.",
  },
  bloating: {
    helping:"Low bloating is a good sign that your gut is tolerating your current routine fairly well.",
    hurting:"Frequent bloating suggests your gut is reacting to food choices, meal pace, or poor rhythm.",
    care:"You have some digestive sensitivity here, so your gut wants gentler support.",
    nextHelping:"Keep repeating the foods and routines that feel comfortable.",
    nextHurting:"Try simpler meals for a day or two and track which foods trigger symptoms.",
    nextCare:"Slow down meals and reduce one likely trigger food this week.",
  },
  acidity: {
    helping:"Low acidity suggests your meal timing and food triggers may be better controlled.",
    hurting:"Frequent acidity often points to trigger foods, stress, or irregular meal timing.",
    care:"This area needs a little attention before it turns into a bigger daily issue.",
    nextHelping:"Keep spicy, greasy, or late heavy meals in check.",
    nextHurting:"Go easier on spicy, fried, or late-night meals for the next few days.",
    nextCare:"Try smaller portions and more regular timing to calm acid flare-ups.",
  },
  bristol: {
    helping:"A smoother stool pattern usually means your digestion is moving in a healthier rhythm.",
    hurting:"An irregular stool pattern can signal low fiber, low water, or gut irritation.",
    care:"Your stool pattern is mixed, so your gut likely needs more consistency.",
    nextHelping:"Keep up the routine that gives you comfortable, regular motions.",
    nextHurting:"Increase water, fiber, and walking after meals to support a better rhythm.",
    nextCare:"Track stool pattern for a few days while improving hydration and fiber.",
  },
  bowel_freq: {
    helping:"Regular bowel movements are a practical sign that your gut rhythm is working better.",
    hurting:"Infrequent or very irregular bowel movements often mean digestion is moving too slowly.",
    care:"Your bowel rhythm is not ideal yet and needs steady basics like water and movement.",
    nextHelping:"Keep the food, water, and movement rhythm that supports regularity.",
    nextHurting:"Add a short walk after meals and one extra fiber source daily.",
    nextCare:"Build a repeatable morning and meal routine to help your gut stay regular.",
  },
  fatigue: {
    helping:"Better energy often shows your digestion and recovery habits are supporting you well.",
    hurting:"Frequent fatigue can show that your gut, sleep, or food routine is not supporting recovery enough.",
    care:"Energy is mixed, which usually means your gut still needs steadier support.",
    nextHelping:"Keep your current sleep and meal rhythm steady.",
    nextHurting:"Protect sleep, hydration, and simpler meals to reduce daytime drain.",
    nextCare:"Choose one recovery habit first, like earlier sleep or better hydration.",
  },
  skin: {
    helping:"Calmer skin can be a good side signal that inflammation and trigger exposure are lower.",
    hurting:"Recurring skin issues can appear when stress, food triggers, or gut imbalance stay high.",
    care:"There may be low-grade irritation showing up through your skin.",
    nextHelping:"Keep supporting your gut with balanced food and recovery habits.",
    nextHurting:"Watch sugar, sleep, and known trigger foods for a week.",
    nextCare:"Track whether flare-ups follow certain foods or stressful days.",
  },
  food_intol: {
    helping:"Good food tolerance suggests your gut is handling your current meals fairly well.",
    hurting:"Frequent discomfort after meals means your gut may be reacting to triggers or rushed eating.",
    care:"Your gut is giving some warnings here, so slower meals and simpler foods would help.",
    nextHelping:"Keep repeating the foods that feel safe and steady.",
    nextHurting:"Use a 7-day food and symptom note to spot repeat triggers.",
    nextCare:"Simplify meals and test one change at a time instead of many together.",
  },
  nausea: {
    helping:"Low nausea suggests your gut is not under heavy day-to-day stress right now.",
    hurting:"Frequent nausea or cramps are signs that your gut is struggling with irritation or poor rhythm.",
    care:"You may need gentler meals and more routine to calm things down.",
    nextHelping:"Stick with foods and patterns that feel calm and predictable.",
    nextHurting:"Choose lighter meals, hydrate well, and reduce rich or spicy foods.",
    nextCare:"Watch whether nausea appears after certain foods or stressful days.",
  },
  stress: {
    helping:"Lower stress helps the gut-brain connection stay calmer and makes symptoms less reactive.",
    hurting:"High stress can make bloating, acidity, and bowel changes feel much worse.",
    care:"Stress is not extreme, but it is likely still affecting your digestion.",
    nextHelping:"Protect the routines that keep you calmer, especially meals and sleep.",
    nextHurting:"Add one daily reset like deep breathing, a short walk, or a screen-free meal.",
    nextCare:"Start with one reliable 5-minute stress reset each day.",
  },
  sleep: {
    helping:"Good sleep gives your gut more time to repair and keeps hunger and stress signals steadier.",
    hurting:"Low sleep makes recovery harder and can quickly lower gut comfort and energy.",
    care:"Your sleep is not far off, but your gut would benefit from a steadier routine.",
    nextHelping:"Keep protecting 7 to 9 hours whenever possible.",
    nextHurting:"Aim for one earlier bedtime this week and reduce late caffeine or screens.",
    nextCare:"Stabilize sleep timing before trying bigger changes.",
  },
  exercise: {
    helping:"Regular movement supports gut motility, better mood, and healthier digestion.",
    hurting:"Too little movement can slow digestion and make your gut feel heavier.",
    care:"A little more movement would likely improve your gut score quickly.",
    nextHelping:"Keep your movement routine steady through the week.",
    nextHurting:"Start with a 20-minute walk after one meal each day.",
    nextCare:"Add a small daily activity target instead of aiming for intense workouts.",
  },
  smoking: {
    helping:"Avoiding tobacco reduces gut irritation and supports better long-term recovery.",
    hurting:"Smoking or tobacco use can increase inflammation and work against gut healing.",
    care:"Any reduction here helps, even before fully quitting.",
    nextHelping:"Keep protecting this strength in your routine.",
    nextHurting:"Reduce frequency and seek support if quitting is part of your plan.",
    nextCare:"Treat each reduction as progress because it directly helps gut recovery.",
  },
  mindful_eating: {
    helping:"Eating slowly and mindfully helps digestion start well and can reduce bloating.",
    hurting:"Rushed, distracted eating can leave you swallowing air and missing fullness signals.",
    care:"This habit is mixed, so a calmer meal routine would help your gut.",
    nextHelping:"Keep at least one screen-free meal in your day.",
    nextHurting:"Slow one meal down tomorrow and chew more thoroughly.",
    nextCare:"Choose one meal a day to eat without screens or rushing.",
  },
  outdoor_time: {
    helping:"Time outdoors usually supports lower stress, better sleep, and a healthier routine overall.",
    hurting:"Very little outdoor time often goes with low movement, stress, and weaker recovery habits.",
    care:"You would likely benefit from a bit more daylight and movement.",
    nextHelping:"Keep making outdoor time part of your weekly routine.",
    nextHurting:"Take one short daylight walk each day if possible.",
    nextCare:"Pair outdoor time with an easy habit like a post-meal walk.",
  },
};

function formatTrendLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Today";
  return date.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}

function buildOverallTrendData(result, trendData) {
  if (trendData?.scores?.length > 1) {
    return trendData.scores.slice(-5).map((score, index) => ({
      label: formatTrendLabel(trendData.dates.slice(-5)[index]),
      value: score,
    }));
  }
  return [{ label:"Today", value:result.score }];
}

function buildCategoryTrendData(category, result, historyRecords) {
  const key = category.toLowerCase();
  const records = (historyRecords || [])
    .filter((record) => typeof record?.category_scores?.[key] === "number")
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (records.length > 1) {
    return records.slice(-5).map((record) => ({
      label: formatTrendLabel(record.timestamp),
      value: record.category_scores[key],
    }));
  }

  return [{ label:"Today", value:result.catScores[category] }];
}

function buildDiversityTrendData(result, historyRecords) {
  const records = (historyRecords || [])
    .filter((record) => record?.answers)
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (records.length > 1) {
    return records.slice(-5).map((record) => ({
      label: formatTrendLabel(record.timestamp),
      value: Math.round(analyze(record.answers).d * 100),
    }));
  }

  return [{ label:"Today", value:Math.round(result.d * 100) }];
}

function getAnswerState(value) {
  if (value >= 1) return "helping";
  if (value >= 0) return "needs care";
  return "hurting";
}

function getFactorGuidanceItem(key, answers) {
  const question = QUESTION_LOOKUP[key];
  const value = answers[key] ?? 0;
  const pct = key in MAX_V ? Math.round(((value - MIN_V[key]) / (MAX_V[key] - MIN_V[key])) * 100) : 50;
  const state = getAnswerState(value);
  const copy = FACTOR_GUIDANCE[key] || {
    helping:"This habit is supporting your gut right now.",
    hurting:"This habit is likely pulling your gut score down right now.",
    care:"This habit is mixed and needs steadier support.",
    nextHelping:"Keep this habit steady.",
    nextHurting:"Make one small improvement here this week.",
    nextCare:"Add a small improvement here tomorrow.",
  };
  const selected = question?.opts?.find((option) => option.v === value)?.l || "Current response";
  const title = question?.q?.replace(/\?$/, "") || key.replace(/_/g, " ");
  const stateMeta = {
    helping: { label:"Helping", color:C.green, detailTitle:"How it is helping" },
    "needs care": { label:"Needs care", color:C.yellow, detailTitle:"Necessary care" },
    hurting: { label:"Hurting", color:C.red, detailTitle:"Why it is hurting" },
  }[state];

  return {
    key,
    title,
    selected,
    state,
    color: stateMeta.color,
    stateLabel: stateMeta.label,
    detailTitle: stateMeta.detailTitle,
    summary: copy[state],
    nextStep: state === "helping" ? copy.nextHelping : state === "hurting" ? copy.nextHurting : copy.nextCare,
    value: Math.max(0, Math.min(100, pct)),
    weight: Math.round((WEIGHTS[key] || 0.08) * 100),
    category: question?.cat || "General",
  };
}

function buildFactorBreakdown(keys, answers) {
  return keys
    .filter((key) => key in answers)
    .map((key) => getFactorGuidanceItem(key, answers))
    .sort((a, b) => {
      const priority = { hurting:0, "needs care":1, helping:2 };
      return priority[a.state] - priority[b.state] || b.weight - a.weight;
    });
}

function getPrimaryGap(result) {
  const [category] = Object.entries(result.catScores).sort((a, b) => a[1] - b[1])[0] || ["Diet", result.score];
  if (category === "Diet") return "Food quality, fiber, hydration, or timing are the biggest place to improve first.";
  if (category === "Lifestyle") return "Stress, sleep, or movement are the strongest reasons your gut is not feeling steadier yet.";
  if (category === "Symptoms") return "Your body is already showing gut discomfort, so calming symptoms is the first priority.";
  return "Medication and recovery support are influencing your gut more than they should right now.";
}

function getScoreMeaning(result) {
  if (result.score >= 75) {
    return `Your score of ${result.score} suggests your current habits are supporting your gut well. Food quality, recovery, and symptoms look fairly steady, so the main goal now is staying consistent with what is already helping you.`;
  }
  if (result.score >= 60) {
    return `Your score of ${result.score} suggests your gut is doing reasonably okay, but there are still a few mixed signals. Some habits are helping, while one or two weaker areas are likely stopping your gut from feeling fully steady.`;
  }
  if (result.score >= 45) {
    return `Your score of ${result.score} suggests your gut needs more support right now. This usually means symptoms, food choices, hydration, sleep, or stress are pulling your gut health down enough to affect comfort and recovery.`;
  }
  return `Your score of ${result.score} suggests your gut is under noticeable strain right now. Your answers point to more than one area needing attention, so gentler meals, better recovery habits, and symptom-focused care should be the priority.`;
}

function getHomeConditionSummary(result) {
  const [lowestCategory, lowestScore] = Object.entries(result.catScores).sort((a, b) => a[1] - b[1])[0] || ["Diet", result.score];

  if (result.score >= 75) {
    return `Your gut condition looks well supported right now. ${lowestCategory} is currently your lowest area at ${lowestScore}, but overall your routine is staying steady.`;
  }
  if (result.score >= 60) {
    return `Your gut condition looks mostly stable, but ${lowestCategory.toLowerCase()} is the main area holding you back right now. A little support there can lift your score further.`;
  }
  if (result.score >= 45) {
    return `Your gut condition shows mixed stress signals. ${lowestCategory} is your weakest area at ${lowestScore}, so improving that first should help you feel better faster.`;
  }
  return `Your gut condition needs careful support right now. ${lowestCategory} is the biggest pressure point at ${lowestScore}, so start with gentle food, recovery, and symptom-calming habits there.`;
}

function runDecisionTree(answers) {
  const get = (k) => answers[k] ?? 0;
  let node = "root";
  let path = [];

  if (get("antibiotics") < -1) {
    path.push("⚠️ Recent antibiotic use detected");
    if (get("probiotics") >= 1) {
      path.push("✅ Probiotic supplementation partially compensates");
      node = "moderate_recovering";
    } else {
      path.push("❌ No probiotic support — microbiome likely depleted");
      if (get("fermented") >= 2 && get("fiber") >= 1) {
        path.push("🥗 Good diet providing partial recovery support");
        node = "moderate_at_risk";
      } else {
        node = "high_risk";
      }
    }
  } else if (get("stress") < -1 && get("sleep") < -1) {
    path.push("😰 High stress + poor sleep combo detected");
    if (get("exercise") >= 1 && get("water") >= 1) {
      path.push("🏃 Exercise & hydration partially offset lifestyle risk");
      node = "moderate_at_risk";
    } else {
      node = "high_risk";
    }
  } else {
    const dietPositive = (get("fruits_veggies") + get("fermented") + get("fiber") + get("plant_diversity"));
    const dietNegative = (get("junk_food") + get("sugar") + get("alcohol"));
    const netDiet = dietPositive + dietNegative;
    path.push(`🥗 Diet net score: ${netDiet > 0 ? "+" : ""}${netDiet}`);
    if (netDiet >= 4) {
      if (get("bloating") >= 0 && get("acidity") >= 0 && get("bristol") >= 0) {
        path.push("✅ Low symptom burden — diet and digestion aligned");
        node = "low_risk";
      } else {
        path.push("🔔 Some symptoms despite good diet — possible sensitivity");
        node = "moderate_recovering";
      }
    } else if (netDiet >= 0) {
      path.push("📊 Average diet — lifestyle factors decide outcome");
      const lifestyleScore = get("sleep") + get("stress") + get("exercise");
      node = lifestyleScore >= 2 ? "moderate_recovering" : "moderate_at_risk";
    } else {
      path.push("⚠️ Poor dietary pattern detected");
      node = "high_risk";
    }
  }

  const nodeMap = {
    low_risk:            { label:"Low Risk",              color: C.green,  emoji:"🌸", score: 80, desc:"Your gut health pattern suggests a well-functioning microbiome. Keep up current habits." },
    moderate_recovering: { label:"Moderate – Improving", color: C.lime,   emoji:"🌿", score: 62, desc:"Some risk factors present but positive habits are compensating. Targeted improvements will accelerate recovery." },
    moderate_at_risk:    { label:"Moderate – At Risk",   color: C.yellow, emoji:"🌾", score: 45, desc:"Multiple risk factors detected. Without intervention, symptoms may worsen over the next 2–3 months." },
    high_risk:           { label:"High Risk",              color: C.red,    emoji:"🥀", score: 25, desc:"Significant gut disruption pattern. Immediate lifestyle changes and possible consultation with a healthcare provider recommended." },
  };

  const result = nodeMap[node] || nodeMap["moderate_at_risk"];
  return { ...result, node, path, agreement: null };
}

function analyze(answers) {
  const norm = {};
  for (const [k,v] of Object.entries(answers)) {
    if (k in MAX_V) norm[k] = (v - MIN_V[k]) / (MAX_V[k] - MIN_V[k]);
  }
  let t1=0,t2=0,t3=0,tw=0;
  for (const [k,nv] of Object.entries(norm)) {
    const w = WEIGHTS[k]||0.1;
    t1 += nv*w*(1+Math.sin(k.length*0.7)*0.1);
    t2 += nv*w*(1+Math.cos(k.length*0.5)*0.08);
    t3 += nv*w;
    tw += w;
  }
  const score = tw>0 ? Math.round(Math.max(0,Math.min(100,((t1+t2+t3)/3/tw)*100))) : 50;
  const confidence = Math.min(75+Object.keys(answers).length*1.5, 95);

  const cats = { Diet:["fruits_veggies","junk_food","fermented","water","fiber","sugar","plant_diversity","meal_timing","alcohol"], Medication:["antibiotics","probiotics"], Symptoms:["bloating","acidity","bristol","bowel_freq","fatigue","skin","food_intol","nausea"], Lifestyle:["stress","sleep","exercise","smoking","mindful_eating","outdoor_time"] };
  const catScores = {};
  for (const [cat,keys] of Object.entries(cats)) {
    const sub = Object.fromEntries(keys.filter(k=>k in answers).map(k=>[k,answers[k]]));
    let s=0,w=0;
    for (const [k,v] of Object.entries(sub)) { const nv=(v-MIN_V[k])/(MAX_V[k]-MIN_V[k]); s+=nv*(WEIGHTS[k]||0.1); w+=WEIGHTS[k]||0.1; }
    catScores[cat] = w>0 ? Math.round(s/w*100) : 50;
  }

  const dietKeys = ["fruits_veggies","fermented","water","fiber","plant_diversity","sugar"];
  const dNorm = dietKeys.filter(k=>k in norm).map(k=>norm[k]);
  const d = dNorm.length>0 ? dNorm.reduce((a,b)=>a+b,0)/dNorm.length : 0.5;

  const rawScore = Object.values(answers).reduce((a,b)=>a+b,0);
  const tier = rawScore>=24?"Thriving":rawScore>=10?"Growing":rawScore>=-4?"Wilting":"Struggling";
  const tierEmoji = {Thriving:"🌸",Growing:"🌿",Wilting:"🌾",Struggling:"🥀"}[tier];
  const tierColor = {Thriving:C.green,Growing:C.lime,Wilting:C.yellow,Struggling:C.red}[tier];

  const importance = Object.entries(WEIGHTS)
    .filter(([k])=>k in answers)
    .map(([k,w])=>({key:k,label:k.replace(/_/g," "),weight:Math.round(w*100),pct:Math.round((norm[k]||0)*100)}))
    .sort((a,b)=>b.weight-a.weight);

  const microbiome = [
    {name:"Firmicutes",      pct:Math.round(30+d*15), status:d>0.6?"Balanced":"Low",    color:C.green},
    {name:"Bacteroidetes",  pct:Math.round(25+d*10), status:d>0.5?"Balanced":"Low",    color:C.blue},
    {name:"Actinobacteria", pct:Math.round(15-d*3),  status:"Moderate",                 color:C.teal},
    {name:"Proteobacteria", pct:Math.round(12-d*8),  status:d<0.4?"Elevated":"Normal", color:C.orange},
    {name:"Others",         pct:8,                    status:"Stable",                   color:C.muted},
  ];

  const insights = [];
  if (answers.fermented !== undefined && answers.fermented < 0) insights.push({type:"warning",icon:"🫙",title:"Low probiotic intake",text:"You're not getting enough fermented foods. Add curd, buttermilk, or kefir daily to boost your beneficial bacteria."});
  if (answers.stress !== undefined && answers.stress < -1) insights.push({type:"danger",icon:"🧠",title:"Stress is harming your gut",text:"High stress triggers inflammation and disrupts gut balance. Even 5 minutes of deep breathing daily can make a measurable difference."});
  if (answers.sleep !== undefined && answers.sleep < 0) insights.push({type:"danger",icon:"🌙",title:"Poor sleep weakens your gut",text:"Less than 6 hours of sleep reduces microbiome diversity. Your gut repairs itself during deep sleep — protect that time."});
  if (answers.water !== undefined && answers.water < 0) insights.push({type:"warning",icon:"💧",title:"You need more water",text:"Dehydration slows digestion and reduces beneficial bacteria. Aim for at least 2 litres daily."});
  if (answers.antibiotics !== undefined && answers.antibiotics < -1) insights.push({type:"danger",icon:"💊",title:"Recent antibiotic use detected",text:"Antibiotics can reduce gut diversity by up to 40%. Take a probiotic supplement for at least 4 weeks after your course."});
  if (answers.exercise !== undefined && answers.exercise < 0) insights.push({type:"warning",icon:"🏃",title:"Move more for your gut",text:"Even 20 minutes of walking increases gut motility and microbiome diversity. Try to move your body every day."});
  if (answers.sugar !== undefined && answers.sugar < 0) insights.push({type:"warning",icon:"🍬",title:"High sugar intake detected",text:"Excess sugar feeds harmful bacteria and yeast, disrupting your microbial balance. Swap sugary drinks for water."});
  if (score > 65) insights.push({type:"good",icon:"✅",title:"Your gut is on the right track",text:"Your habits show a solid foundation. Small consistent improvements will compound over time."});

  const speculations = [];
  if (score >= 70) {
    speculations.push({horizon:"1 Month",icon:"🌱",outcome:"Expect reduced bloating and improved energy",confidence:82,positive:true});
    speculations.push({horizon:"3 Months",icon:"🌿",outcome:"Microbiome diversity likely to increase significantly",confidence:76,positive:true});
    speculations.push({horizon:"6 Months",icon:"🌸",outcome:"Strong immune response and mental clarity improvement",confidence:68,positive:true});
  } else if (score >= 50) {
    speculations.push({horizon:"1 Month",icon:"⚠️",outcome:"Symptoms may persist without dietary changes",confidence:75,positive:false});
    speculations.push({horizon:"3 Months",icon:"🌱",outcome:"With small habit changes, expect 15–20% score improvement",confidence:70,positive:true});
    speculations.push({horizon:"6 Months",icon:"🌿",outcome:"Consistent changes could bring you to a thriving state",confidence:62,positive:true});
  } else {
    speculations.push({horizon:"1 Month",icon:"🔴",outcome:"Gut inflammation risk may increase without intervention",confidence:80,positive:false});
    speculations.push({horizon:"3 Months",icon:"⚠️",outcome:"Digestive discomfort likely to worsen if habits unchanged",confidence:72,positive:false});
    speculations.push({horizon:"6 Months",icon:"🌱",outcome:"Professional guidance + habit changes can reverse trajectory",confidence:65,positive:true});
  }

  const recs = [];
  if (catScores.Diet < 60) recs.push({priority:"High",icon:"🥗",action:"Add one fermented food to every meal",impact:"Directly seeds your gut with beneficial bacteria"});
  if (catScores.Lifestyle < 60) recs.push({priority:"High",icon:"😴",action:"Protect 7–8 hours of sleep nightly",impact:"Your gut microbiome repairs itself during sleep"});
  if (catScores.Symptoms < 60) recs.push({priority:"Medium",icon:"📋",action:"Keep a 7-day food and symptom diary",impact:"Identifies your personal trigger foods accurately"});
  recs.push({priority:"Medium",icon:"🚶",action:"30-minute walk after dinner daily",impact:"Improves gut motility by up to 30%"});
  recs.push({priority:"Low",icon:"🌾",action:"Aim for 30 different plant foods per week",impact:"Each unique plant feeds a different beneficial bacteria strain"});

  const dtResult = runDecisionTree(answers);
  const xgbTier = score>=70?"low":score>=50?"moderate_recovering":"high";
  const dtTier  = dtResult.score>=70?"low":dtResult.score>=50?"moderate_recovering":"high";
  dtResult.agreement = xgbTier === dtTier ? "agree" : "disagree";
  dtResult.agreementText = dtResult.agreement === "agree"
    ? "Both models agree on your risk level — higher confidence in assessment."
    : "Models disagree — your case has mixed signals. Review both assessments carefully.";

  return { score, confidence, rawScore, tier, tierEmoji, tierColor, catScores, microbiome, importance, insights, speculations, recs, d, dtResult };
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────
function getDetectedIssues(answers, result) {
  const issues = [];

  if ((answers.fiber ?? 0) < 0) issues.push({ section:"Diet", icon:"🌾", color:C.yellow, title:"Low Fiber Intake Detected", cause:"Your answers suggest fiber-rich foods are not showing up often enough.", impact:"Low fiber can slow digestion and starve the good bacteria that help keep your gut calm.", fix:"Add one easy fiber source tomorrow like oats, fruit, dal, or vegetables." });
  if ((answers.water ?? 0) < 0) issues.push({ section:"Diet", icon:"💧", color:C.blue, title:"Hydration Dip Detected", cause:"Your current water intake looks lower than ideal.", impact:"When water is low, digestion slows down and bloating can feel worse.", fix:"Keep a bottle nearby and aim for a glass with every meal." });
  if ((answers.stress ?? 0) < -1) issues.push({ section:"Lifestyle", icon:"🧠", color:C.red, title:"Stress Load Is High", cause:"Your answers point to frequent stress or overwhelm.", impact:"Stress can make the gut more sensitive and can worsen acidity, bloating, and appetite swings.", fix:"Try a 5-minute reset today: slow breathing, a short walk, or a no-screen meal." });
  if ((answers.sleep ?? 0) < 0) issues.push({ section:"Lifestyle", icon:"🌙", color:C.orange, title:"Recovery Sleep Looks Low", cause:"You may not be getting enough deep rest consistently.", impact:"Poor sleep makes it harder for the gut to recover and can lower energy the next day.", fix:"Aim for one earlier bedtime this week and keep caffeine lighter later in the day." });
  if ((answers.bloating ?? 0) < 0 || (answers.food_intol ?? 0) < 0) issues.push({ section:"Symptoms", icon:"🌿", color:"#f472b6", title:"Sensitive Digestion Signals", cause:"You reported signs like bloating, discomfort, or reactions after certain foods.", impact:"Your gut may be reacting to triggers, rushed meals, or low variety.", fix:"Keep meals simpler for a day and notice which foods make symptoms calmer or worse." });
  if ((answers.bristol ?? 0) < 0 || (answers.bowel_freq ?? 0) < 0) issues.push({ section:"Symptoms", icon:"🐢", color:C.orange, title:"Slow Digestion Pattern", cause:"Your bowel pattern suggests things may be moving too slowly or irregularly.", impact:"This can leave you feeling heavy, uncomfortable, and less regular.", fix:"Water, movement after meals, and daily fiber are the best next steps." });
  if ((answers.antibiotics ?? 0) < -1) issues.push({ section:"Medication", icon:"💊", color:C.red, title:"Recovery Support Needed", cause:"Recent antibiotic use can knock back helpful gut bacteria.", impact:"Your digestion may feel off for a while even after the medicine has finished.", fix:"Focus on gentle foods, fermented foods, and consistent meals while your gut rebuilds." });
  if (!issues.length && result.score >= 70) issues.push({ section:"General", icon:"🌸", color:C.green, title:"No Major Gut Issues Detected", cause:"Your habits look supportive overall.", impact:"Your digestion has a stronger base to work from right now.", fix:"Stay consistent with food variety, sleep, and hydration." });

  return issues.slice(0, 4);
}

function getCategorySummary(category, score, issues) {
  if (category==="Diet") return score >= 70 ? "Your food routine is giving your gut solid support." : "Your gut would likely feel better with a little more fiber, variety, and hydration.";
  if (category==="Lifestyle") return score >= 70 ? "Your recovery habits are helping digestion stay steady." : "Stress, sleep, or movement may be pulling your gut score down right now.";
  if (category==="Symptoms") return issues.length ? "Your body is sending a few digestive signals worth paying attention to." : "Symptoms look fairly calm at the moment.";
  return score >= 65 ? "Support habits look steady here." : "A small tune-up in this area could make your gut feel lighter.";
}

function normalizeBackendInsights(rawInsights = []) {
  return rawInsights.map((insight) => ({
    icon: insight.type === "good" ? "🌿" : insight.type === "danger" ? "🚩" : "💡",
    title: insight.title,
    text: insight.text,
    type: insight.type || "info",
  }));
}

function getBacteriaGuide(bacteria) {
  const guide = BACTERIA_GUIDANCE[bacteria.name] || BACTERIA_GUIDANCE.Others;
  const status = (bacteria.status || "").toLowerCase();
  let statusNote = guide.balanced;
  if (status.includes("low")) statusNote = guide.low;
  if (status.includes("high") || status.includes("elevated")) statusNote = guide.elevated;

  return {
    foods: guide.foods,
    benefit: guide.benefit,
    statusNote,
  };
}

function getDialogueCopy(section, result, answers, issues) {
  if (section==="forecast") return result.score >= 70 ? "If you keep these habits going, your gut is likely to stay steady and your energy should feel more reliable." : "If current habits continue, your gut may stay a little unsettled. A few small changes now can shift the trend in a better direction.";
  if (section==="food") return issues.some(issue => issue.section==="Diet") ? "Your food pattern suggests your gut wants simpler, more fiber-friendly meals right now. Think fruit, curd, oats, dal, and enough water." : "Your meals already include some gut-friendly choices. Keeping that rhythm tomorrow should help digestion stay calmer.";
  if (section==="microbiome") return result.d > 0.6 ? "Your gut ecosystem looks reasonably varied. Keeping plant variety high is the best way to protect that balance." : "Your gut diversity looks a little low today. More plant variety, water, and regular meals can help it recover.";
  if (section==="archetype") return "This archetype is just a friendly pattern summary. Use it as a guide for what to focus on next, not as a medical label.";
  const topIssue = issues[0];
  if (topIssue) return `Your digestion looks a little challenged by ${topIssue.title.toLowerCase()}. ${topIssue.fix}`;
  return result.score >= 70 ? "Your gut habits are looking supportive right now. Staying consistent is more important than being perfect." : "Your gut can still improve quickly with a few steady habits. Focus on one or two easy wins first.";
}

function getCategorySpotlight(category, result, answers, historyRecords=[]) {
  const score = result.catScores[category];
  const items = buildFactorBreakdown(CATEGORY_KEYS[category], answers);
  const issues = getDetectedIssues(answers, result).filter((issue) => issue.section === category);
  return {
    ...CATEGORY_ART[category],
    score,
    trend: buildCategoryTrendData(category, result, historyRecords),
    items,
    issues: issues.length ? issues : getDetectedIssues(answers, result).slice(0, 2),
    summary: getCategorySummary(category, score, issues),
  };
}

function getArchetypeDetails(rawArchetype, answers) {
  const symptomPressure = (answers.bloating ?? 0) + (answers.acidity ?? 0) + (answers.food_intol ?? 0);
  const slowDigestion = (answers.bristol ?? 0) + (answers.bowel_freq ?? 0) + (answers.water ?? 0);
  const inflammation = (answers.junk_food ?? 0) + (answers.sugar ?? 0) + symptomPressure;
  let key = "Balanced Gut";
  if (slowDigestion <= -3) key = "Slow Digestion Type";
  if (symptomPressure <= -3) key = "Sensitive Gut";
  if (inflammation <= -5) key = "Inflamed Gut";
  return { ...ARCHETYPE_GUIDES[key], name:key, confidence:rawArchetype?.confidence ?? 82 };
}

function getFoodImpact(entry) {
  const label = entry.effect?.label || "";
  if (label.includes("Gut-friendly")) return 78;
  if (label.includes("Trigger")) return 34;
  return 56;
}

function summarizeFoodDay(entries) {
  if (!entries.length) return { title:"Light logging day", summary:"You have not logged enough meals yet to spot a clear pattern.", tomorrow:"Start with breakfast or dinner and log a few foods to unlock clearer feedback tomorrow.", trend:[] };
  const avg = Math.round(entries.reduce((total, entry) => total + getFoodImpact(entry), 0) / entries.length);
  const triggerCount = entries.filter((entry) => getFoodImpact(entry) < 45).length;
  const helpfulCount = entries.filter((entry) => getFoodImpact(entry) > 70).length;
  return {
    title:avg >= 70 ? "Mostly gut-friendly day" : avg >= 50 ? "Mixed digestion day" : "Heavy digestion day",
    summary:avg >= 70 ? `Yesterday included ${helpfulCount} meal choices that likely supported calmer digestion.` : avg >= 50 ? "Yesterday had a mix of soothing foods and possible triggers, so today may feel a bit uneven." : `Yesterday included ${triggerCount} likely trigger foods, which may explain slower or heavier digestion today.`,
    tomorrow:avg >= 70 ? "Keep tomorrow simple: repeat one meal that felt good and add one extra fruit or vegetable." : avg >= 50 ? "Tomorrow, swap one trigger food for a gentler option like curd rice, oats, fruit, or dal." : "Tomorrow, go lighter: more water, one fermented food, and fewer fried or sugary items.",
    trend:entries.map((entry, index) => ({ label:entry.time || `Meal ${index + 1}`, value:getFoodImpact(entry) })),
  };
}

function getBmi(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const meters = heightCm / 100;
  if (!meters) return null;
  return +(weight / (meters * meters)).toFixed(1);
}

function getProfileImageStorageKey(user) {
  return `flora-profile-image-${user?.id || user?.email || "guest"}`;
}

function getFoodLogStorageKey(userId) {
  return `flora-food-log-${userId || "guest"}`;
}

function moveLocalStorageValue(fromKey, toKey) {
  if (!fromKey || !toKey || fromKey === toKey) return;
  const value = localStorage.getItem(fromKey);
  if (value === null) return;
  localStorage.setItem(toKey, value);
  localStorage.removeItem(fromKey);
}

function getBmiCategory(bmi) {
  if (!bmi) return { label:"Add your details", color:C.muted };
  if (bmi < 18.5) return { label:"Underweight", color:C.yellow };
  if (bmi < 25) return { label:"Normal", color:C.green };
  if (bmi < 30) return { label:"Overweight", color:C.orange };
  return { label:"Obesity range", color:C.red };
}

function buildBmiTrend(bmi) {
  if (!bmi) return [];
  return [{ label:"2 months", value:Math.max(14, +(bmi - 1.1).toFixed(1)) }, { label:"Last month", value:Math.max(14, +(bmi - 0.6).toFixed(1)) }, { label:"Today", value:bmi }];
}

function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  const base = { fontFamily:C.sans, fontWeight:600, border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:"12px", transition:"all 0.2s", fontSize:"0.95rem", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"8px", ...style };
  const styles = {
    primary: { background:`linear-gradient(135deg,${C.green},#22c55e)`, color:"#052e16", padding:"14px 32px", ...base },
    outline: { background:"transparent", color:C.green, border:`1.5px solid ${C.green}`, padding:"13px 32px", ...base },
    ghost:   { background:"rgba(255,255,255,0.05)", color:C.text, padding:"12px 24px", ...base },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], opacity:disabled?0.5:1 }}
    onMouseEnter={e=>{if(!disabled)e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.opacity=disabled?"0.5":"0.9"}}
    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="1"}}>{children}</button>;
}

function Card({ children, style={}, glow=false, onClick=null }) {
  return <div onClick={onClick} style={{ background:C.card, border:`1px solid ${glow?C.border:C.border2}`, borderRadius:"16px", padding:"24px", boxShadow:glow?`0 0 40px rgba(74,222,128,0.06)`:"none", cursor:onClick?"pointer":"default", transition:"all 0.2s", ...style }}>{children}</div>;
}

function Label({ children, style={} }) {
  return <div style={{ fontSize:"0.65rem", letterSpacing:"2px", textTransform:"uppercase", color:C.muted, marginBottom:"12px", ...style }}>{children}</div>;
}

function Bar({ pct, color, height="6px", delay="0s" }) {
  return (
    <div style={{ height, background:"rgba(255,255,255,0.05)", borderRadius:"4px", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:"4px", transformOrigin:"left", animation:`grow 1s ${delay} cubic-bezier(0.34,1.56,0.64,1) both` }} />
    </div>
  );
}

function InsightCard({ icon, title, text, type="info" }) {
  const colors = { good:C.green, warning:C.yellow, danger:C.red, info:C.blue };
  const c = colors[type];
  return (
    <div style={{ display:"flex", gap:"14px", padding:"16px", background:`${c}08`, border:`1px solid ${c}22`, borderRadius:"12px", marginBottom:"10px" }}>
      <span style={{ fontSize:"1.4rem", flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:"0.9rem", fontWeight:600, color:c, marginBottom:"4px" }}>{title}</div>
        <div style={{ fontSize:"0.82rem", color:C.muted, lineHeight:1.7 }}>{text}</div>
      </div>
    </div>
  );
}

function Ring({ pct, color, size=120, strokeWidth=10, children }) {
  const r = size/2 - strokeWidth;
  const circ = 2*Math.PI*r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={circ-(circ*pct/100)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </svg>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
        {children}
      </div>
    </div>
  );
}

function IllustrationCard({ emoji, title, subtitle, color=C.green, imageSrc=null, imageAlt="" }) {
  return (
    <div className="image-card" style={{ display:"flex", gap:"14px", alignItems:"center", padding:"18px 20px", borderRadius:"18px", background:`linear-gradient(135deg, ${color}18, rgba(255,255,255,0.03))`, border:`1px solid ${color}35`, marginBottom:"18px", overflow:"hidden" }}>
      <div className="image-card-media" style={{ width:imageSrc ? "118px" : "58px", height:imageSrc ? "88px" : "58px", borderRadius:"18px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", background:`${color}18`, border:`1px solid ${color}30`, flexShrink:0, overflow:"hidden", boxShadow:`inset 0 1px 0 rgba(255,255,255,0.04)` }}>
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt || title} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
        ) : (
          emoji
        )}
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:"0.95rem", fontWeight:700, color:C.text, marginBottom:"4px" }}>{title}</div>
        <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.6 }}>{subtitle}</div>
      </div>
    </div>
  );
}

function DialogueBox({ text, title="Friendly Note", icon="💬", color=C.green }) {
  return (
    <div style={{ display:"flex", gap:"12px", padding:"16px 18px", borderRadius:"14px", background:`${color}0f`, border:`1px solid ${color}33`, marginBottom:"18px" }}>
      <div style={{ fontSize:"1.3rem", lineHeight:1 }}>{icon}</div>
      <div>
        <div style={{ fontSize:"0.82rem", color:color, fontWeight:700, marginBottom:"4px" }}>{title}</div>
        <div style={{ fontSize:"0.82rem", color:C.text, lineHeight:1.7 }}>{text}</div>
      </div>
    </div>
  );
}

function IssueCard({ issue }) {
  return (
    <Card style={{ padding:"18px", borderLeft:`4px solid ${issue.color}` }}>
      <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"8px" }}>
        <span style={{ fontSize:"1.2rem" }}>{issue.icon}</span>
        <div style={{ fontSize:"0.9rem", fontWeight:700, color:issue.color }}>{issue.title}</div>
      </div>
      <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.65, marginBottom:"10px" }}>
        <strong style={{ color:C.text }}>Cause:</strong> {issue.cause}
      </div>
      <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.65, marginBottom:"10px" }}>
        <strong style={{ color:C.text }}>Impact:</strong> {issue.impact}
      </div>
      <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.65 }}>
        <strong style={{ color:issue.color }}>Suggested fix:</strong> {issue.fix}
      </div>
    </Card>
  );
}

function FactorInsightCard({ factor }) {
  return (
    <Card style={{ padding:"18px", borderLeft:`4px solid ${factor.color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:"12px", alignItems:"flex-start", marginBottom:"10px" }}>
        <div>
          <div style={{ fontSize:"0.92rem", color:C.text, fontWeight:700, lineHeight:1.45 }}>{factor.title}</div>
          <div style={{ fontSize:"0.72rem", color:C.muted, marginTop:"4px" }}>Your answer: {factor.selected}</div>
        </div>
        <div style={{ padding:"6px 10px", borderRadius:"999px", background:`${factor.color}14`, color:factor.color, fontSize:"0.72rem", fontWeight:700, whiteSpace:"nowrap" }}>
          {factor.stateLabel}
        </div>
      </div>
      <Bar pct={factor.value} color={factor.color} height="5px" />
      <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.7, marginTop:"12px", marginBottom:"10px" }}>
        <strong style={{ color:C.text }}>{factor.detailTitle}:</strong> {factor.summary}
      </div>
      <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.7 }}>
        <strong style={{ color:factor.color }}>Next step:</strong> {factor.nextStep}
      </div>
    </Card>
  );
}

function LineGraph({ data, color=C.green, max=100, min=0, height=150, valueSuffix="" }) {
  if (!data?.length) return null;
  const width = 320;
  const padX = 20;
  const padY = 18;
  const range = Math.max(1, max - min);
  const step = data.length === 1 ? 0 : (width - padX * 2) / (data.length - 1);
  const points = data.map((point, index) => {
    const x = padX + step * index;
    const y = height - padY - ((point.value - min) / range) * (height - padY * 2);
    return { ...point, x, y };
  });

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width:"100%", height:`${height}px`, overflow:"visible" }}>
        <path d={`M ${padX} ${height - padY} L ${width - padX} ${height - padY}`} stroke="rgba(255,255,255,0.08)" />
        <polyline fill="none" stroke={color} strokeWidth="3" points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" fill={color} />
            <circle cx={point.x} cy={point.y} r="10" fill={`${color}22`} />
          </g>
        ))}
      </svg>
      <div style={{ display:"grid", gridTemplateColumns:`repeat(${data.length}, 1fr)`, gap:"8px" }}>
        {data.map((point) => (
          <div key={point.label} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"0.84rem", color:C.text, fontWeight:600 }}>{point.value}{valueSuffix}</div>
            <div style={{ fontSize:"0.68rem", color:C.muted }}>{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarGraph({ items, max=100 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} style={{ padding:"12px 14px", borderRadius:"12px", background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border2}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:"12px", marginBottom:"6px" }}>
            <span style={{ fontSize:"0.8rem", color:C.text }}>{item.label}</span>
            <span style={{ fontSize:"0.76rem", color:item.color || C.green, fontWeight:700 }}>{item.value}/{max}</span>
          </div>
          <Bar pct={(item.value / max) * 100} color={item.color || C.green} height="5px" delay={`${index * 0.04}s`} />
          {item.note && <div style={{ fontSize:"0.7rem", color:C.muted, marginTop:"6px" }}>{item.note}</div>}
        </div>
      ))}
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border2}`, borderRadius:"10px", padding:"8px 16px", color:C.muted, fontSize:"0.85rem", cursor:"pointer", fontFamily:C.sans, marginBottom:"24px", transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.background="rgba(255,255,255,0.08)"}}
      onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.background="rgba(255,255,255,0.05)"}}>
      ← Back
    </button>
  );
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = mode==="register" ? "/auth/register" : "/auth/login";
      const body = mode==="register" ? { name:form.name, email:form.email, password:form.password } : { email:form.email, password:form.password };
      const data = await apiFetch(endpoint, { method:"POST", body:JSON.stringify(body) });
      onLogin(data.user);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const inputStyle = { width:"100%", padding:"14px 16px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.9rem", marginBottom:"12px" };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", overflow:"hidden" }}>
      <div style={{ position:"fixed", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,0.04) 0%,transparent 70%)", top:"0%", left:"10%", pointerEvents:"none" }} />
      <div className="fadeUp" style={{ textAlign:"center", marginBottom:"48px" }}>
        <div style={{ fontSize:"3rem", marginBottom:"12px" }} className="float">🌿</div>
        <h1 style={{ fontFamily:C.serif, fontSize:"3.5rem", fontWeight:700, color:C.green, letterSpacing:"-1px", marginBottom:"8px" }}>Flora</h1>
        <p style={{ color:C.muted, fontSize:"0.9rem", maxWidth:"280px", lineHeight:1.7 }}>Your personal gut health companion. Understand your microbiome and feel better every day.</p>
      </div>
      <div className="fadeUp" style={{ width:"100%", maxWidth:"400px", animationDelay:"0.1s" }}>
        <Card glow>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:"10px", padding:"4px", marginBottom:"24px" }}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"10px", borderRadius:"8px", border:"none", cursor:"pointer", fontFamily:C.sans, fontWeight:600, fontSize:"0.85rem", background:mode===m?C.green:"transparent", color:mode===m?"#052e16":C.muted, transition:"all 0.2s" }}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          {mode==="register" && <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />}
          <input style={inputStyle} placeholder="Email address" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
          <input style={{...inputStyle,marginBottom:"20px"}} placeholder="Password" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} />
          {error && <div style={{ padding:"12px", borderRadius:"8px", background:`${C.red}15`, border:`1px solid ${C.red}30`, color:C.red, fontSize:"0.82rem", marginBottom:"16px", textAlign:"center" }}>{error}</div>}
          <Btn onClick={submit} disabled={loading} style={{ width:"100%", padding:"15px", fontSize:"1rem", animation:"pulse 2s infinite" }}>
            {loading?"Please wait…":mode==="login"?"Sign In →":"Create My Account →"}
          </Btn>
          <div style={{ textAlign:"center", marginTop:"16px" }}>
            <button onClick={()=>onLogin({id:"guest",name:"Guest",email:"guest@flora.app"})} style={{ background:"none", border:"none", color:C.muted, fontSize:"0.8rem", cursor:"pointer", fontFamily:C.sans }}>
              Continue without account →
            </button>
          </div>
          <div style={{ marginTop:"12px", borderTop:`1px solid ${C.border2}`, paddingTop:"16px" }}>
            <button onClick={()=>onLogin({id:"guest",name:"Guest",email:"guest@flora.app"}, true)} style={{ width:"100%", padding:"12px", borderRadius:"10px", border:`1px solid ${C.border}`, background:C.greenDim, color:C.green, fontFamily:C.sans, fontSize:"0.85rem", fontWeight:600, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${C.green}20`}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.greenDim}}>
              🏡 Go directly to Dashboard
            </button>
          </div>
        </Card>
      </div>
      <p style={{ marginTop:"32px", fontSize:"0.7rem", color:C.dim }}>Not medical advice · For educational purposes only</p>
    </div>
  );
}

// ─── QUIZ SCREEN ─────────────────────────────────────────────────────
function QuizScreen({ user, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;
  const catColor = CAT_COLORS[q.cat] || C.green;

  const pick = (v) => {
    if (animating) return;
    setSelected(v); setAnimating(true);
    setTimeout(() => {
      const newAnswers = { ...answers, [q.id]: v };
      setAnswers(newAnswers);
      if (current < QUESTIONS.length - 1) { setCurrent(p=>p+1); setSelected(null); }
      else { onComplete(newAnswers); }
      setAnimating(false);
    }, 350);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <style>{css}</style>
      <div style={{ width:"100%", maxWidth:"520px" }}>
        <div style={{ marginBottom:"32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <span style={{ fontSize:"0.72rem", letterSpacing:"2px", textTransform:"uppercase", color:catColor, fontWeight:600 }}>{q.cat}</span>
            <span style={{ fontSize:"0.8rem", color:C.muted }}>{current+1} of {QUESTIONS.length}</span>
          </div>
          <div style={{ height:"4px", background:C.border2, borderRadius:"4px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${catColor},${catColor}88)`, borderRadius:"4px", transition:"width 0.4s ease" }} />
          </div>
        </div>
        <div key={current} className="fadeUp">
          <Card style={{ marginBottom:"20px", padding:"32px" }}>
            <div style={{ fontSize:"2.8rem", marginBottom:"16px" }}>{q.icon}</div>
            <h2 style={{ fontFamily:C.serif, fontSize:"1.5rem", fontWeight:600, color:C.text, lineHeight:1.4 }}>{q.q}</h2>
          </Card>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {q.opts.map((opt, i) => (
              <button key={i} onClick={()=>pick(opt.v)}
                style={{ width:"100%", padding:"16px 20px", borderRadius:"12px", border:`1.5px solid ${selected===opt.v?catColor:C.border2}`, background:selected===opt.v?`${catColor}15`:"rgba(255,255,255,0.03)", color:selected===opt.v?catColor:C.text, fontFamily:C.sans, fontSize:"0.92rem", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:"14px", transition:"all 0.2s", fontWeight:selected===opt.v?600:400 }}
                onMouseEnter={e=>{if(selected!==opt.v){e.currentTarget.style.borderColor=`${catColor}66`;e.currentTarget.style.background=`${catColor}08`}}}
                onMouseLeave={e=>{if(selected!==opt.v){e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.background="rgba(255,255,255,0.03)"}}}>
                <span style={{ width:"28px", height:"28px", borderRadius:"8px", background:selected===opt.v?`${catColor}22`:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700, color:selected===opt.v?catColor:C.muted, flexShrink:0 }}>
                  {String.fromCharCode(65+i)}
                </span>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION VIEWS ────────────────────────────────────────────────────

function SectionCategoryFocus({ category, result, answers, historyRecords = [], onBack }) {
  const focus = getCategorySpotlight(category, result, answers, historyRecords);
  const hasTrendHistory = focus.trend.length > 1;

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:focus.accent, marginBottom:"4px" }}>{focus.emoji} {focus.title}</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>{focus.subtitle}</p>
      <IllustrationCard emoji={focus.emoji} title={`${category} is one of your biggest levers`} subtitle={focus.summary} color={focus.accent} imageSrc={SECTION_ART.category[category]} imageAlt={`${category} wellness illustration`} />
      <DialogueBox text={focus.summary} color={focus.accent} />
      <Card style={{ marginBottom:"18px" }}>
        <Label>Trend graph</Label>
        <LineGraph data={focus.trend} color={focus.accent} />
        {!hasTrendHistory && <div style={{ fontSize:"0.76rem", color:C.muted, marginTop:"10px" }}>You only have one saved assessment so far, so this graph is showing today only. It will turn into a real trend after your next assessment.</div>}
      </Card>
      <Card style={{ marginBottom:"18px" }}>
        <Label>What is helping and what needs work</Label>
        <div style={{ display:"grid", gap:"14px" }}>
          {focus.items.slice(0, 4).map((item) => <FactorInsightCard key={item.key} factor={item} />)}
        </div>
      </Card>
      <div style={{ display:"grid", gap:"14px" }}>
        {focus.issues.map((issue) => <IssueCard key={issue.title} issue={issue} />)}
      </div>
    </div>
  );
}

function SectionAnalysisFriendly({ result, answers, onBack, trendData, backendInsights = [] }) {
  const [activeTab, setActiveTab] = useState("overview");
  const issues = getDetectedIssues(answers, result);
  const trend = buildOverallTrendData(result, trendData);
  const factorCards = buildFactorBreakdown(Object.keys(answers), answers).slice(0, 4);
  const backendCards = normalizeBackendInsights(backendInsights).slice(0, 2);
  const tabs = ["overview","body signals","issues","food guidance"];

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>📊 Your Health Status</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>A clear, friendly breakdown of what your gut is dealing with today.</p>
      <IllustrationCard emoji="🤖" title="Powered by Smart Health Insights Engine" subtitle="Your answers are turned into simple trend graphs, issue alerts, and easy next steps." color={C.green} imageSrc={SECTION_ART.analysis} imageAlt="Wellness dashboard illustration" />
      <DialogueBox text={getDialogueCopy("analysis", result, answers, issues)} color={result.tierColor} />
      <div style={{ display:"flex", gap:"6px", marginBottom:"18px", background:C.surface, padding:"4px", borderRadius:"12px", border:`1px solid ${C.border2}` }}>
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex:1, padding:"10px 8px", borderRadius:"9px", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"0.74rem", fontWeight:activeTab===tab?600:400, textTransform:"capitalize", background:activeTab===tab?C.greenDim:"transparent", color:activeTab===tab?C.green:C.muted }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab==="overview" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"18px" }}>
            <Card glow>
              <Label>Overall trend</Label>
              <LineGraph data={trend} color={result.tierColor} />
              {trend.length === 1 && <div style={{ fontSize:"0.76rem", color:C.muted, marginTop:"10px" }}>This is your first saved result, so Flora is showing today only instead of inventing a past trend.</div>}
            </Card>
            <Card>
              <Label>Today at a glance</Label>
              <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                <Ring pct={result.score} color={result.tierColor} size={108}>
                  <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:result.tierColor, fontWeight:700 }}>{result.score}</div>
                </Ring>
                <div>
                  <div style={{ fontFamily:C.serif, fontSize:"1.1rem", color:result.tierColor, marginBottom:"4px" }}>{result.tierEmoji} {result.tier}</div>
                  <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.6 }}>{result.score >= 70 ? "Your habits are supporting your gut well." : result.score >= 55 ? "Your gut has mixed signals, but small fixes can help fast." : "Your gut needs gentler support right now."}</div>
                </div>
              </div>
            </Card>
          </div>
          <Card style={{ marginBottom:"18px" }}>
            <Label>Area-by-area graph</Label>
            <BarGraph items={Object.entries(result.catScores).map(([cat, score]) => ({ label:`${CAT_ICONS[cat]} ${cat}`, value:score, note:score >= 70 ? "steady support" : score >= 55 ? "mixed picture" : "needs care", color:CAT_COLORS[cat] }))} />
          </Card>
          <Card>
            <Label>What is shaping your score</Label>
            <div style={{ display:"grid", gap:"14px" }}>
              {factorCards.map((factor) => <FactorInsightCard key={factor.key} factor={factor} />)}
            </div>
          </Card>
          {!!backendCards.length && (
            <Card style={{ marginTop:"18px" }}>
              <Label>What the backend picked up</Label>
              {backendCards.map((insight) => <InsightCard key={insight.title} {...insight} />)}
            </Card>
          )}
        </div>
      )}

      {activeTab==="body signals" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <IllustrationCard emoji="🪴" title="Body signals in plain language" subtitle="These are simple estimated signals based on your habits, not medical test results." color={C.blue} imageSrc={SECTION_ART.microbiome} imageAlt="Gut balance illustration" />
          <Card>
            <Label>Signal graph</Label>
            <BarGraph items={[
              { label:"Gut diversity", value:Math.round(result.d * 100), note:result.d > 0.6 ? "looks balanced" : "add more variety", color:C.teal },
              { label:"Food support", value:result.catScores.Diet, note:result.catScores.Diet >= 70 ? "good rhythm" : "fiber and timing can improve", color:C.green },
              { label:"Recovery support", value:result.catScores.Lifestyle, note:result.catScores.Lifestyle >= 70 ? "sleep and stress look steady" : "recovery is lowering your score", color:C.blue },
            ]} />
          </Card>
        </div>
      )}

      {activeTab==="issues" && (
        <div style={{ display:"grid", gap:"14px" }}>
          {issues.map((issue) => <IssueCard key={issue.title} issue={issue} />)}
        </div>
      )}

      {activeTab==="food guidance" && (
        <div>
          <IllustrationCard emoji="🍎" title="Food guidance for tomorrow" subtitle="Simple meal ideas that are easier on digestion." color={C.green} imageSrc={SECTION_ART.food} imageAlt="Food guidance illustration" />
          <Card style={{ marginBottom:"18px" }}>
            <Label>Helpful foods graph</Label>
            <BarGraph items={[
              { label:"Curd or buttermilk", value:84, note:"gentle probiotic support", color:C.green },
              { label:"Oats and dal", value:82, note:"easy fiber win", color:C.green },
              { label:"Banana or apple", value:76, note:"simple snack support", color:C.lime },
              { label:"Cooked vegetables", value:74, note:"supports variety without feeling heavy", color:C.teal },
            ]} />
          </Card>
          <Card>
            <Label>Go easy on</Label>
            <BarGraph items={[
              { label:"Fried or ultra-processed foods", value:38, note:"can feel heavy fast", color:C.red },
              { label:"Very spicy meals", value:44, note:"may worsen acidity", color:C.orange },
              { label:"Too much sugar", value:40, note:"can throw off balance", color:C.red },
            ]} />
          </Card>
        </div>
      )}
    </div>
  );
}

function SectionSmartInsights({ result, answers, onBack, trendData, backendInsights = [] }) {
  const dt = result.dtResult;
  const issues = getDetectedIssues(answers, result);
  const analyzerTrend = buildOverallTrendData(result, trendData);
  const factorCards = buildFactorBreakdown(Object.keys(answers), answers).slice(0, 4);
  const backendCards = normalizeBackendInsights(backendInsights).slice(0, 3);

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🤖 Smart Health Tools</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>Two smart checks look at your answers from different angles so the advice feels more balanced.</p>
      <DialogueBox text={dt.agreement==="agree" ? "Both smart checks are telling a similar story, so this guidance is more reliable." : "Your answers show mixed signals, so we are highlighting the areas with the clearest patterns first."} color={dt.agreement==="agree" ? C.green : C.yellow} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"18px" }}>
        <Card glow>
          <Label>Health Pattern Analyzer</Label>
          <LineGraph data={analyzerTrend} color={result.tierColor} />
          {analyzerTrend.length === 1 && <div style={{ fontSize:"0.76rem", color:C.muted, marginTop:"10px" }}>You are a new user, so this analyzer is showing your current baseline instead of a made-up past trend.</div>}
        </Card>
        <Card>
          <Label>Smart Health Predictor</Label>
          <BarGraph items={[
            { label:dt.label, value:dt.score, note:"your current pattern", color:dt.color },
            { label:"Confidence", value:dt.agreement==="agree" ? 82 : 63, note:dt.agreementText, color:dt.agreement==="agree" ? C.green : C.yellow },
          ]} />
        </Card>
      </div>
      <Card style={{ marginBottom:"18px" }}>
        <Label>What both tools are telling us</Label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
          <div style={{ padding:"14px", borderRadius:"12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border2}` }}>
            <div style={{ fontSize:"0.72rem", color:C.muted, marginBottom:"6px" }}>Your Health Status</div>
            <div style={{ fontFamily:C.serif, fontSize:"1.5rem", color:result.tierColor }}>{result.score}</div>
            <div style={{ fontSize:"0.76rem", color:C.text, marginTop:"6px" }}>{result.tierEmoji} {result.tier}</div>
          </div>
          <div style={{ padding:"14px", borderRadius:"12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border2}` }}>
            <div style={{ fontSize:"0.72rem", color:C.muted, marginBottom:"6px" }}>Habit Path Guide</div>
            <div style={{ fontFamily:C.serif, fontSize:"1.5rem", color:dt.color }}>{dt.score}</div>
            <div style={{ fontSize:"0.76rem", color:C.text, marginTop:"6px" }}>{dt.label}</div>
          </div>
        </div>
        <div style={{ fontSize:"0.82rem", color:C.text, lineHeight:1.7 }}>
          <strong style={{ color:C.green }}>Main gap:</strong> {getPrimaryGap(result)}
        </div>
      </Card>
      <Card>
        <Label>Main reasons these tools care</Label>
        <div style={{ display:"grid", gap:"14px" }}>
          {factorCards.map((factor) => <FactorInsightCard key={factor.key} factor={factor} />)}
        </div>
      </Card>
      {!!backendCards.length && (
        <Card style={{ marginTop:"18px" }}>
          <Label>Backend insight notes</Label>
          {backendCards.map((insight) => <InsightCard key={insight.title} {...insight} />)}
        </Card>
      )}
      <div style={{ marginTop:"18px", display:"grid", gap:"14px" }}>
        {issues.slice(0,2).map((issue) => <IssueCard key={issue.title} issue={issue} />)}
      </div>
    </div>
  );
}

function SectionCheckin({ user, onBack }) {
  const [checkin, setCheckin] = useState({ bloating:2, cramps:1, nausea:0, gas:3, heartburn:1, water:1.5, sleepH:7, stressL:4, mood:"😊", bristol:4 });
  const [saved, setSaved] = useState(false);

  const saveCheckin = async () => {
    try { await apiFetch("/api/checkin", { method:"POST", body:JSON.stringify({user_id:user?.id,...checkin}) }); } catch(e) {}
    setSaved(true); setTimeout(()=>setSaved(false),2500);
  };

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>✅ Daily Check-in</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>Track how your gut feels today</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Bristol Stool Type Today</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"6px", marginBottom:"12px" }}>
              {["🟤","🟫","🟤","✅","🟡","🟠","🔴"].map((e,i)=>(
                <div key={i} onClick={()=>setCheckin(p=>({...p,bristol:i+1}))} style={{ padding:"8px 4px", borderRadius:"8px", textAlign:"center", cursor:"pointer", background:checkin.bristol===i+1?C.greenDim:"rgba(255,255,255,0.03)", border:`1.5px solid ${checkin.bristol===i+1?C.green:C.border2}`, transition:"all 0.15s" }}>
                  <div style={{ fontSize:"1.2rem" }}>{e}</div>
                  <div style={{ fontSize:"0.6rem", color:C.muted, marginTop:"2px" }}>T{i+1}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Symptom Levels</Label>
            {[{key:"bloating",label:"🫃 Bloating"},{key:"cramps",label:"😖 Cramps"},{key:"nausea",label:"🤢 Nausea"},{key:"gas",label:"💨 Gas"},{key:"heartburn",label:"🔥 Heartburn"}].map(s=>(
              <div key={s.key} style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={{ fontSize:"0.85rem" }}>{s.label}</span>
                  <span style={{ color:checkin[s.key]>6?C.red:checkin[s.key]>3?C.yellow:C.green, fontWeight:600 }}>{checkin[s.key]}/10</span>
                </div>
                <input type="range" min="0" max="10" value={checkin[s.key]||0} onChange={e=>setCheckin(p=>({...p,[s.key]:+e.target.value}))} style={{ width:"100%", accentColor:C.green }} />
              </div>
            ))}
          </Card>
        </div>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Water Today</Label>
            <div style={{ display:"flex", alignItems:"baseline", gap:"6px", marginBottom:"10px" }}>
              <span style={{ fontFamily:C.serif, fontSize:"2.5rem", color:C.blue, fontWeight:700 }}>{checkin.water}</span>
              <span style={{ color:C.muted }}>L · Goal: 2.5L</span>
            </div>
            <Bar pct={Math.min(100,checkin.water/2.5*100)} color={C.blue} height="8px" />
            <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
              {[0.25,0.5,1].map(ml=>(<Btn key={ml} variant="ghost" onClick={()=>setCheckin(p=>({...p,water:Math.round((p.water+ml)*10)/10}))} style={{ padding:"8px 16px", fontSize:"0.82rem" }}>+{ml}L</Btn>))}
            </div>
          </Card>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Sleep & Stress</Label>
            <div style={{ marginBottom:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"0.85rem" }}>🌙 Hours slept</span>
                <span style={{ fontWeight:600 }}>{checkin.sleepH}h</span>
              </div>
              <input type="range" min="3" max="12" step="0.5" value={checkin.sleepH} onChange={e=>setCheckin(p=>({...p,sleepH:+e.target.value}))} style={{ width:"100%", accentColor:C.green }} />
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"0.85rem" }}>🧠 Stress level</span>
                <span style={{ color:checkin.stressL>6?C.red:C.text, fontWeight:600 }}>{checkin.stressL}/10</span>
              </div>
              <input type="range" min="0" max="10" value={checkin.stressL} onChange={e=>setCheckin(p=>({...p,stressL:+e.target.value}))} style={{ width:"100%", accentColor:checkin.stressL>6?C.red:C.green }} />
            </div>
          </Card>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Today's Mood</Label>
            <div style={{ display:"flex", gap:"8px" }}>
              {["😄","😊","😐","😔","😩"].map(m=>(
                <div key={m} onClick={()=>setCheckin(p=>({...p,mood:m}))} style={{ padding:"10px 14px", borderRadius:"10px", cursor:"pointer", fontSize:"1.4rem", background:checkin.mood===m?C.greenDim:"rgba(255,255,255,0.03)", border:`1.5px solid ${checkin.mood===m?C.green:C.border2}`, transition:"all 0.15s" }}>{m}</div>
              ))}
            </div>
          </Card>
          <Btn onClick={saveCheckin} style={{ width:"100%", padding:"15px", fontSize:"1rem", background:saved?`rgba(74,222,128,0.15)`:`linear-gradient(135deg,${C.green},#22c55e)`, color:saved?C.green:"#052e16", border:saved?`1.5px solid ${C.green}`:"none" }}>
            {saved?"✅ Saved! Keep it up":"Save Today's Check-in"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function SectionForecastFriendly({ result, answers, onBack }) {
  const issues = getDetectedIssues(answers, result);
  const projection = [
    { label:"Today", value:result.score },
    { label:"1 month", value:result.score >= 70 ? Math.min(96, result.score + 4) : result.score >= 55 ? result.score + 8 : result.score - 4 },
    { label:"3 months", value:result.score >= 70 ? Math.min(98, result.score + 6) : result.score >= 55 ? result.score + 14 : result.score + 2 },
    { label:"6 months", value:result.score >= 70 ? Math.min(99, result.score + 7) : result.score >= 55 ? result.score + 20 : result.score + 12 },
  ];

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🔮 Future Outlook</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>If current habits continue, this is the direction your gut health is likely to move.</p>
      <IllustrationCard emoji="📈" title="Projection graph" subtitle="This is a friendly forecast based on your current patterns, not a guarantee." color={C.teal} imageSrc={SECTION_ART.forecast} imageAlt="Future wellness projection illustration" />
      <DialogueBox text={getDialogueCopy("forecast", result, answers, issues)} color={C.teal} />
      <Card style={{ marginBottom:"18px" }}>
        <Label>Projection graph</Label>
        <LineGraph data={projection} color={result.score >= 55 ? C.green : C.yellow} />
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px", marginBottom:"18px" }}>
        {result.speculations.map((item) => (
          <Card key={item.horizon} style={{ padding:"18px" }}>
            <div style={{ fontSize:"1.6rem", marginBottom:"8px" }}>{item.icon}</div>
            <div style={{ fontSize:"0.7rem", color:C.muted, textTransform:"uppercase", marginBottom:"6px" }}>{item.horizon}</div>
            <div style={{ fontSize:"0.84rem", color:item.positive ? C.green : C.yellow, fontWeight:600, lineHeight:1.5 }}>{item.outcome}</div>
          </Card>
        ))}
      </div>
      <Card>
        <Label>30-day focus plan</Label>
        <BarGraph items={[
          { label:"Hydration and meal timing", value:78, note:"build the basics first", color:C.blue },
          { label:"Fiber and fermented foods", value:82, note:"biggest gut payoff", color:C.green },
          { label:"Sleep and stress reset", value:74, note:"helps calm gut sensitivity", color:C.teal },
        ]} />
      </Card>
    </div>
  );
}

function SectionFoodLogFriendly({ user, onBack }) {
  const storageKey = getFoodLogStorageKey(user?.id);
  const seedLog = [
    { name:"Curd rice", time:"Breakfast", day:"yesterday", effect:{ label:"✅ Gut-friendly", color:C.green } },
    { name:"Spicy noodles", time:"Lunch", day:"yesterday", effect:{ label:"⚠️ Trigger food", color:C.yellow } },
    { name:"Banana", time:"Snack", day:"yesterday", effect:{ label:"✅ Gut-friendly", color:C.green } },
  ];
  const [foodLog, setFoodLog] = useState(seedLog);
  const [foodInput, setFoodInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { setFoodLog(JSON.parse(saved)); } catch (_) {}
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(foodLog));
  }, [foodLog, storageKey]);

  const logFood = (name = foodInput) => {
    if (!name.trim()) return;
    const good = ["banana","oats","dal","broccoli","curd","kefir","rice","ginger","garlic","apple","carrot","spinach","idli","dosa","buttermilk","lentil"];
    const bad = ["milk","spicy","coffee","burger","alcohol","fried","sweet","cake","pizza","chips","junk","processed"];
    const value = name.toLowerCase();
    const effect = bad.some((item) => value.includes(item)) ? { label:"⚠️ Trigger food", color:C.yellow } : good.some((item) => value.includes(item)) ? { label:"✅ Gut-friendly", color:C.green } : { label:"📋 Logged", color:C.muted };
    setFoodLog((current) => [{ name, time:"Today", day:"today", effect }, ...current]);
    setFoodInput("");
  };

  const yesterdayLog = foodLog.filter((entry) => entry.day === "yesterday");
  const todayLog = foodLog.filter((entry) => entry.day !== "yesterday");
  const yesterdaySummary = summarizeFoodDay(yesterdayLog);

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🍽️ Food Log</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>Log meals, see how yesterday may be affecting today, and get a simple nudge for tomorrow.</p>
      <IllustrationCard emoji="🥗" title="Food patterns matter more than perfect meals" subtitle="A few gentle, repeatable meals often help more than extreme diet changes." color={C.green} imageSrc={SECTION_ART.food} imageAlt="Food journey illustration" />
      <DialogueBox text={yesterdaySummary.tomorrow} color={C.green} />
      <Card style={{ marginBottom:"18px" }}>
        <Label>Add food</Label>
        <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
          <input value={foodInput} onChange={(e) => setFoodInput(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&logFood()} placeholder="Type a meal or snack..." style={{ flex:1, padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.88rem" }} />
          <Btn onClick={() => logFood()} style={{ padding:"12px 20px" }}>Log</Btn>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
          {["Banana","Curd rice","Oats","Spicy noodles","Coffee"].map((item) => (
            <button key={item} onClick={() => logFood(item)} style={{ padding:"7px 12px", borderRadius:"999px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, cursor:"pointer", fontFamily:C.sans }}>
              {item}
            </button>
          ))}
        </div>
      </Card>
      <Card style={{ marginBottom:"18px" }}>
        <Label>Yesterday's graph</Label>
        <LineGraph data={yesterdaySummary.trend.length ? yesterdaySummary.trend : [{ label:"No meals", value:50 }]} color={C.green} />
        <div style={{ fontSize:"0.84rem", color:C.text, fontWeight:600, marginTop:"14px" }}>{yesterdaySummary.title}</div>
        <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.7, marginTop:"6px" }}>{yesterdaySummary.summary}</div>
      </Card>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"18px" }}>
        <Card>
          <Label>Impact on today</Label>
          <div style={{ fontSize:"0.82rem", color:C.text, lineHeight:1.7 }}>{yesterdaySummary.summary}</div>
        </Card>
        <Card>
          <Label>Tomorrow's suggestion</Label>
          <div style={{ fontSize:"0.82rem", color:C.text, lineHeight:1.7 }}>{yesterdaySummary.tomorrow}</div>
        </Card>
      </div>
      <Card>
        <Label>Today's log</Label>
        {todayLog.length===0 && <div style={{ color:C.muted, fontSize:"0.82rem" }}>Nothing logged today yet.</div>}
        {todayLog.map((entry, index) => (
          <div key={`${entry.name}-${index}`} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.border2}` }}>
            <span style={{ fontSize:"1.2rem" }}>🍽️</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.84rem", color:C.text }}>{entry.name}</div>
              <div style={{ fontSize:"0.72rem", color:C.muted }}>{entry.time}</div>
            </div>
            <span style={{ padding:"4px 10px", borderRadius:"999px", fontSize:"0.68rem", background:`${entry.effect.color}14`, color:entry.effect.color, border:`1px solid ${entry.effect.color}30` }}>{entry.effect.label}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SectionMicrobiomeFriendly({ result, answers, historyRecords = [], onBack }) {
  const issues = getDetectedIssues(answers, result);
  const diversityTrend = buildDiversityTrendData(result, historyRecords);

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🧬 Gut Balance</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>A simple picture of your gut ecosystem and how balanced it looks right now.</p>
      <IllustrationCard emoji="🫙" title="Think of your gut like a garden" subtitle="The more variety and steady care it gets, the more resilient it usually becomes." color={C.teal} imageSrc={SECTION_ART.microbiome} imageAlt="Gut ecosystem illustration" />
      <DialogueBox text={getDialogueCopy("microbiome", result, answers, issues)} color={C.teal} />
      <Card style={{ marginBottom:"18px" }}>
        <Label>Diversity graph</Label>
        <LineGraph data={diversityTrend} color={C.teal} />
        {diversityTrend.length === 1 && <div style={{ fontSize:"0.76rem", color:C.muted, marginTop:"10px" }}>This is your current gut balance snapshot. Flora will show a real diversity trend after more saved assessments.</div>}
      </Card>
      <Card style={{ marginBottom:"18px" }}>
        <Label>Bacteria balance</Label>
        <BarGraph items={result.microbiome.map((bug) => ({ label:bug.name, value:bug.pct, note:bug.status, color:bug.color }))} />
        <div style={{ display:"grid", gap:"12px", marginTop:"14px" }}>
          {result.microbiome.map((bug) => {
            const guide = getBacteriaGuide(bug);
            return (
              <div key={`${bug.name}-guide`} style={{ padding:"14px 16px", borderRadius:"14px", background:`${bug.color}0d`, border:`1px solid ${bug.color}30` }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"10px", marginBottom:"8px" }}>
                  <div style={{ fontSize:"0.84rem", color:bug.color, fontWeight:700 }}>{bug.name}</div>
                  <div style={{ fontSize:"0.72rem", color:C.muted }}>{bug.pct}/100 · {bug.status}</div>
                </div>
                <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.7, marginBottom:"8px" }}>
                  <strong style={{ color:bug.color }}>Foods that support it:</strong> {guide.foods}.
                </div>
                <div style={{ fontSize:"0.78rem", color:C.text, lineHeight:1.7, marginBottom:"8px" }}>
                  <strong style={{ color:bug.color }}>Why it matters:</strong> {guide.benefit}
                </div>
                <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.7 }}>
                  <strong style={{ color:C.text }}>What your result means:</strong> {guide.statusNote}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ display:"grid", gap:"14px" }}>
        {issues.filter((issue) => issue.section==="Symptoms" || issue.section==="Diet").slice(0,2).map((issue) => <IssueCard key={issue.title} issue={issue} />)}
      </div>
    </div>
  );
}

function SectionArchetypeFriendly({ answers, onBack }) {
  const archetype = getArchetypeDetails(null, answers);

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:archetype.color, marginBottom:"4px" }}>🧬 Gut Archetype</h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"18px" }}>A simple gut type based on your current food, symptom, and lifestyle pattern.</p>
      <IllustrationCard emoji={archetype.emoji} title={archetype.name} subtitle={archetype.desc} color={archetype.color} imageSrc={SECTION_ART.archetype} imageAlt="Gut archetype illustration" />
      <DialogueBox text="This archetype is just a friendly pattern summary. Use it to decide what to focus on next." color={archetype.color} />
      <Card style={{ marginBottom:"18px" }}>
        <Label>Your key traits</Label>
        {archetype.traits.map((trait) => (
          <div key={trait} style={{ padding:"10px 0", borderBottom:`1px solid ${C.border2}`, fontSize:"0.82rem", color:C.text }}>{trait}</div>
        ))}
      </Card>
      <Card>
        <Label>Recommended actions</Label>
        <BarGraph items={archetype.actions.map((action, index) => ({ label:action, value:88 - index * 8, note:index===0 ? "best next step" : "supporting action", color:archetype.color }))} />
      </Card>
    </div>
  );
}

function SectionProfileFriendly({ user, result, onRetake, onOpenSection, onLogout, onClaimGuestAccount }) {
  const [weight, setWeight] = useState(user?.profile?.weight || 62);
  const [height, setHeight] = useState(user?.profile?.height || 168);
  const [profileImage, setProfileImage] = useState("");
  const [imageError, setImageError] = useState("");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({ name:"", email:"", password:"" });
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const profileImageKey = getProfileImageStorageKey(user);
  const isGuestUser = user?.id === "guest";
  const bmi = getBmi(Number(weight), Number(height));
  const bmiState = getBmiCategory(bmi);
  const bmiTrend = buildBmiTrend(bmi);

  useEffect(() => {
    const savedImage = localStorage.getItem(profileImageKey) || "";
    setProfileImage(savedImage);
    setImageError("");
    setShowImageOptions(false);
  }, [profileImageKey]);

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file. GIF, PNG, JPG, WEBP, and similar formats are supported.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setImageError("Please choose an image smaller than 6 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = typeof reader.result === "string" ? reader.result : "";
      setProfileImage(imageData);
      localStorage.setItem(profileImageKey, imageData);
      setImageError("");
      setShowImageOptions(false);
    };
    reader.onerror = () => {
      setImageError("Could not load that image. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setProfileImage("");
    localStorage.removeItem(profileImageKey);
    setImageError("");
    setShowImageOptions(false);
  };

  const handleGuestUpgrade = async () => {
    if (!onClaimGuestAccount) return;
    setUpgradeError("");
    setUpgradeLoading(true);
    try {
      await onClaimGuestAccount(upgradeForm, user);
    } catch (error) {
      setUpgradeError(error.message || "Could not create your account right now.");
    }
    setUpgradeLoading(false);
  };

  return (
    <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"20px" }}>👤 Profile</h2>
      {!profileImage && (
        <Card style={{ marginBottom:"18px" }}>
          <Label>Profile picture</Label>
          <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.6, marginBottom:"14px" }}>Upload PNG, JPG, WEBP, or GIF. Once you add one, tap the avatar beside your name anytime to change or remove it.</div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <label style={{ padding:"11px 16px", borderRadius:"10px", background:C.greenDim, border:`1px solid ${C.green}55`, color:C.green, fontSize:"0.82rem", fontWeight:700, cursor:"pointer" }}>
              Upload image
              <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display:"none" }} />
            </label>
          </div>
          {imageError && <div style={{ marginTop:"12px", fontSize:"0.76rem", color:C.red, lineHeight:1.6 }}>{imageError}</div>}
        </Card>
      )}
      <Card style={{ marginBottom:"18px", display:"flex", alignItems:"center", gap:"16px" }}>
        <button onClick={() => profileImage && setShowImageOptions((value) => !value)} style={{ width:"78px", height:"78px", borderRadius:"22px", overflow:"hidden", border:`2px solid ${profileImage ? `${C.green}88` : `${C.green}44`}`, background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:profileImage ? "pointer" : "default", padding:0 }}>
          {profileImage ? (
            <img src={profileImage} alt="Profile" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          ) : (
            <div style={{ fontSize:"2rem", color:C.green }}>{user?.name?.[0] || "G"}</div>
          )}
        </button>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:C.serif, fontSize:"1.75rem", color:C.text, lineHeight:1.15, marginBottom:"6px" }}>{user?.name || "Guest"}</div>
          <div style={{ fontSize:"0.88rem", color:C.muted, wordBreak:"break-word", marginBottom:"8px" }}>{user?.email || "No account connected"}</div>
          <div style={{ fontSize:"0.76rem", color:C.green }}>{profileImage ? "Tap your avatar to change or remove it." : "Upload an image to personalize your profile."}</div>
        </div>
      </Card>
      {profileImage && showImageOptions && (
        <Card style={{ marginBottom:"18px" }}>
          <Label>Profile picture options</Label>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            <label style={{ padding:"11px 16px", borderRadius:"10px", background:C.greenDim, border:`1px solid ${C.green}55`, color:C.green, fontSize:"0.82rem", fontWeight:700, cursor:"pointer" }}>
              Upload image
              <input type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display:"none" }} />
            </label>
            <button onClick={removeProfileImage} style={{ padding:"11px 16px", borderRadius:"10px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border2}`, color:C.text, fontSize:"0.82rem", cursor:"pointer", fontFamily:C.sans }}>
              Remove image
            </button>
          </div>
          {imageError && <div style={{ marginTop:"12px", fontSize:"0.76rem", color:C.red, lineHeight:1.6 }}>{imageError}</div>}
        </Card>
      )}
      {isGuestUser && (
        <Card style={{ marginBottom:"18px" }}>
          <Label>Create Account</Label>
          <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.6, marginBottom:"14px" }}>
            Create an account now and Flora will sync your guest assessment, trends, food log, and profile image into it.
          </div>
          <input value={upgradeForm.name} onChange={(e) => setUpgradeForm((current) => ({ ...current, name:e.target.value }))} placeholder="Your name" style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.88rem", marginBottom:"10px" }} />
          <input value={upgradeForm.email} type="email" onChange={(e) => setUpgradeForm((current) => ({ ...current, email:e.target.value }))} placeholder="Email address" style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.88rem", marginBottom:"10px" }} />
          <input value={upgradeForm.password} type="password" onChange={(e) => setUpgradeForm((current) => ({ ...current, password:e.target.value }))} placeholder="Password" style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.88rem", marginBottom:"12px" }} />
          {upgradeError && <div style={{ marginBottom:"12px", fontSize:"0.76rem", color:C.red, lineHeight:1.6 }}>{upgradeError}</div>}
          <Btn onClick={handleGuestUpgrade} disabled={upgradeLoading || !upgradeForm.name.trim() || !upgradeForm.email.trim() || !upgradeForm.password.trim()} style={{ width:"100%", padding:"14px" }}>
            {upgradeLoading ? "Creating account..." : "Create account and sync my data"}
          </Btn>
        </Card>
      )}
      <DialogueBox text={bmi ? `Your BMI is ${bmi}, which falls in the ${bmiState.label.toLowerCase()} range. Use it as a simple trend marker, not a full health judgment.` : "Add your height and weight to unlock the BMI graph."} color={bmiState.color} />
      <Card style={{ marginBottom:"18px" }}>
        <Label>BMI calculator</Label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
          <input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (kg)" style={{ padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans }} />
          <input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height (cm)" style={{ padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans }} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontFamily:C.serif, fontSize:"2rem", color:bmiState.color }}>{bmi || "--"}</div>
            <div style={{ fontSize:"0.78rem", color:C.muted }}>{bmiState.label}</div>
          </div>
          {result && <div style={{ fontSize:"0.84rem", color:result.tierColor }}>{result.tierEmoji} {result.tier}</div>}
        </div>
      </Card>
      <Card style={{ marginBottom:"18px" }}>
        <Label>BMI graph</Label>
        {bmiTrend.length ? <LineGraph data={bmiTrend} color={bmiState.color} max={Math.max(32, ...bmiTrend.map((point) => point.value + 2))} min={14} /> : <div style={{ fontSize:"0.82rem", color:C.muted }}>Enter height and weight to see your graph.</div>}
      </Card>
      {result && (
        <Card style={{ marginBottom:"18px" }}>
          <Label>Wellness areas</Label>
          <div style={{ display:"grid", gap:"12px" }}>
            {Object.entries(result.catScores).map(([cat, score]) => (
              <div key={cat} className="metric-card" onClick={() => onOpenSection?.(cat.toLowerCase())} style={{ padding:"14px 16px", borderRadius:"14px", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border2}`, cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", marginBottom:"8px" }}>
                  <div style={{ fontSize:"0.82rem", color:C.text, fontWeight:600 }}>{CAT_ICONS[cat]} {cat}</div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"0.74rem", color:score >= 70 ? C.green : C.muted }}>{score >= 70 ? "steady" : "watch this area"}</span>
                    <span style={{ color:C.muted }}>›</span>
                  </div>
                </div>
                <div style={{ fontFamily:C.serif, fontSize:"1.35rem", color:CAT_COLORS[cat], marginBottom:"8px" }}>{score}</div>
                <Bar pct={score} color={CAT_COLORS[cat]} height="5px" />
              </div>
            ))}
          </div>
          <div style={{ fontSize:"0.76rem", color:C.muted, marginTop:"12px" }}>Tap any wellness area to open its detailed analysis page.</div>
        </Card>
      )}
      <div className="metric-card" onClick={onLogout} style={{ padding:"16px 20px", background:"rgba(248,113,113,0.08)", borderRadius:"16px", border:`1px solid ${C.red}33`, cursor:"pointer", display:"flex", alignItems:"center", gap:"12px", marginBottom:"14px" }}>
        <span style={{ fontSize:"1.35rem" }}>↩</span>
        <div>
          <div style={{ fontSize:"0.9rem", color:C.text }}>Log out</div>
          <div style={{ fontSize:"0.75rem", color:C.muted }}>Return to sign in</div>
        </div>
      </div>
      <div className="metric-card" onClick={onRetake} style={{ padding:"16px 20px", background:C.card, borderRadius:"16px", border:`1px solid ${C.border2}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"12px" }}>
        <span style={{ fontSize:"1.5rem" }}>🔄</span>
        <div>
          <div style={{ fontSize:"0.9rem", color:C.text }}>Retake Assessment</div>
          <div style={{ fontSize:"0.75rem", color:C.muted }}>Refresh your graphs and advice</div>
        </div>
      </div>
    </div>
  );
}

function PageWrapper({ children, onRetake }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, maxWidth:"480px", margin:"0 auto", padding:"24px 16px 100px" }}>
      <style>{css}</style>
      {children}
      <div style={{ marginTop:"24px" }}>
        <button onClick={onRetake} style={{ background:"none", border:"none", color:C.muted, fontSize:"0.8rem", cursor:"pointer", fontFamily:C.sans }}>
          ← Retake Quiz
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
function Dashboard({ user, answers, onRetake, onLogout, onClaimGuestAccount }) {
  const [section, setSection] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [backendInsights, setBackendInsights] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const result = answers && Object.keys(answers).length > 0 ? analyze(answers) : null;
  const hasResult = !!result;

  // Only load dashboard data ONCE per user session — never re-fire on section changes
  useEffect(() => {
    let cancelled = false;

    // Skip if already loaded for this user, or if no user/result
    if (dataLoaded) return;

    async function loadDashboardData() {
      if (!user?.id || !hasResult) {
        if (!cancelled) {
          setHistoryRecords([]);
          setTrendData(null);
          setBackendInsights([]);
        }
        return;
      }

      const [historyRes, trendsRes, insightsRes] = await Promise.allSettled([
        apiFetch(`/api/history/${user.id}`),
        apiFetch(`/api/trends/${user.id}`),
        apiFetch(`/api/insights/${user.id}`),
      ]);

      if (cancelled) return;

      setHistoryRecords(historyRes.status === "fulfilled" ? historyRes.value.history || [] : []);
      setTrendData(trendsRes.status === "fulfilled" ? trendsRes.value : null);
      setBackendInsights(insightsRes.status === "fulfilled" ? insightsRes.value.insights || [] : []);
      setDataLoaded(true);
    }

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [user?.id, hasResult, dataLoaded]);

  const NAV = [
    { id:"home",     icon:"🏠", label:"Home" },
    { id:"analysis", icon:"📊", label:"Analysis" },
    { id:"checkin",  icon:"📅", label:"Check-in" },
    { id:"profile",  icon:"👤", label:"Profile" },
  ];

  if (section === "analysis")   return <PageWrapper onRetake={onRetake}><SectionAnalysisFriendly result={result} answers={answers} trendData={trendData} backendInsights={backendInsights} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "ml")         return <PageWrapper onRetake={onRetake}><SectionSmartInsights result={result} answers={answers} trendData={trendData} backendInsights={backendInsights} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "forecast")   return <PageWrapper onRetake={onRetake}><SectionForecastFriendly result={result} answers={answers} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "checkin")    return <PageWrapper onRetake={onRetake}><SectionCheckin user={user} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "food")       return <PageWrapper onRetake={onRetake}><SectionFoodLogFriendly user={user} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "microbiome") return <PageWrapper onRetake={onRetake}><SectionMicrobiomeFriendly result={result} answers={answers} historyRecords={historyRecords} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "archetype")  return <PageWrapper onRetake={onRetake}><SectionArchetypeFriendly answers={answers} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "diet")       return <PageWrapper onRetake={onRetake}><SectionCategoryFocus category="Diet" result={result} answers={answers} historyRecords={historyRecords} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "lifestyle")  return <PageWrapper onRetake={onRetake}><SectionCategoryFocus category="Lifestyle" result={result} answers={answers} historyRecords={historyRecords} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "symptoms")   return <PageWrapper onRetake={onRetake}><SectionCategoryFocus category="Symptoms" result={result} answers={answers} historyRecords={historyRecords} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "medication") return <PageWrapper onRetake={onRetake}><SectionCategoryFocus category="Medication" result={result} answers={answers} historyRecords={historyRecords} onBack={()=>setSection(null)} /></PageWrapper>;

  const renderTab = () => {
    if (activeTab === "home") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <div>
            <div style={{ fontSize:"0.78rem", color:C.muted }}>Good day,</div>
            <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:C.green }}>{user?.name || "Guest"} 🌿</div>
          </div>
          <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:C.greenDim, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>
            {user?.name?.[0] || "G"}
          </div>
        </div>
        {result && (
          <>
            <Card glow style={{ marginBottom:"18px", textAlign:"center" }}>
              <Label>Your Health Status</Label>
              <div style={{ display:"flex", alignItems:"center", gap:"18px", justifyContent:"center" }}>
                <Ring pct={result.score} color={result.tierColor} size={126}>
                  <div style={{ fontFamily:C.serif, fontSize:"2rem", color:result.tierColor, fontWeight:700 }}>{result.score}</div>
                  <div style={{ fontSize:"0.62rem", color:C.muted, marginTop:"2px", letterSpacing:"0.08em", textTransform:"uppercase" }}>score</div>
                </Ring>
                <div style={{ textAlign:"left", maxWidth:"180px" }}>
                  <div style={{ fontFamily:C.serif, fontSize:"1.2rem", color:result.tierColor, marginBottom:"4px" }}>{result.tierEmoji} {result.tier}</div>
                  <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.6 }}>{getHomeConditionSummary(result)}</div>
                </div>
              </div>
              <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:`1px solid ${C.border2}`, fontSize:"0.8rem", color:C.muted, lineHeight:1.7 }}>
                {getScoreMeaning(result)}
              </div>
            </Card>
            <DialogueBox text={getDialogueCopy("analysis", result, answers, getDetectedIssues(answers, result))} color={result.tierColor} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
              {Object.entries(result.catScores).map(([cat, score]) => (
                <div key={cat} className="metric-card" onClick={()=>setSection(cat.toLowerCase())} style={{ padding:"16px", background:C.card, borderRadius:"16px", border:`1px solid ${C.border2}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"10px", marginBottom:"10px" }}>
                    <div>
                      <div style={{ fontSize:"1.2rem", marginBottom:"6px" }}>{CAT_ICONS[cat]}</div>
                      <div style={{ fontSize:"0.75rem", color:C.muted }}>{cat}</div>
                    </div>
                    <Ring pct={score} color={CAT_COLORS[cat]} size={68} strokeWidth={7}>
                      <div style={{ fontFamily:C.serif, fontSize:"1.05rem", color:CAT_COLORS[cat], fontWeight:700, lineHeight:1 }}>{score}</div>
                    </Ring>
                  </div>
                  <div style={{ fontSize:"0.72rem", color:score >= 70 ? C.green : score >= 50 ? C.yellow : C.red, lineHeight:1.5 }}>
                    {score >= 70 ? "Strong support right now" : score >= 50 ? "Needs a little more support" : "Needs focused care"}
                  </div>
                  <div style={{ fontSize:"0.7rem", color:C.muted, marginTop:"8px" }}>Tap for details</div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"0.78rem", color:C.muted, marginBottom:"12px", fontWeight:600, letterSpacing:"0.05em" }}>SMART SHORTCUTS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {[
              { icon:"🤖", label:"Smart Tools", key:"ml" },
              { icon:"🔮", label:"Future Outlook", key:"forecast" },
              { icon:"🧬", label:"Gut Balance", key:"microbiome" },
              { icon:"🍎", label:"Food Log", key:"food" },
            ].map((action) => (
              <div key={action.key} className="metric-card" onClick={()=>setSection(action.key)} style={{ padding:"14px 16px", background:C.card, borderRadius:"14px", border:`1px solid ${C.border2}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"1.3rem" }}>{action.icon}</span>
                <span style={{ fontSize:"0.82rem", color:C.text }}>{action.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (activeTab === "analysis") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"20px" }}>📊 Analysis</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {[
            { icon:"📊", label:"Your Health Status", sub:"Friendly graphs and gut issue detection", key:"analysis" },
            { icon:"🤖", label:"Smart Tools", sub:"Human-friendly smart analysis", key:"ml" },
            { icon:"🔮", label:"Future Outlook", sub:"Projection graph if habits stay the same", key:"forecast" },
            { icon:"🧬", label:"Gut Balance", sub:"Simple gut ecosystem picture", key:"microbiome" },
            { icon:"🎯", label:"Gut Archetype", sub:"Balanced, sensitive, inflamed, or slow digestion", key:"archetype" },
          ].map((item) => (
            <div key={item.key} className="metric-card" onClick={()=>setSection(item.key)} style={{ padding:"16px 20px", background:C.card, borderRadius:"16px", border:`1px solid ${C.border2}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"16px" }}>
              <span style={{ fontSize:"1.8rem" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize:"0.9rem", color:C.text, fontWeight:600 }}>{item.label}</div>
                <div style={{ fontSize:"0.75rem", color:C.muted }}>{item.sub}</div>
              </div>
              <div style={{ marginLeft:"auto", color:C.muted }}>›</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (activeTab === "checkin") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <SectionCheckin user={user} onBack={()=>setActiveTab("home")} />
      </div>
    );

    if (activeTab === "profile") return (
      <SectionProfileFriendly user={user} result={result} onRetake={onRetake} onOpenSection={setSection} onLogout={onLogout} onClaimGuestAccount={onClaimGuestAccount} />
    );

    if (activeTab === "home") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <div>
            <div style={{ fontSize:"0.78rem", color:C.muted }}>Good day,</div>
            <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:C.green }}>{user?.name || "Guest"} 🌿</div>
          </div>
          <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:C.greenDim, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem" }}>
            {user?.name?.[0] || "G"}
          </div>
        </div>
        <IllustrationCard emoji="🤖" title="Powered by Smart Health Insights Engine" subtitle="Friendly graphs and simple explanations help you understand your gut without technical overload." color={C.green} imageSrc={SECTION_ART.home} imageAlt="Wellness app hero illustration" />
        {result && (
          <div style={{ textAlign:"center", marginBottom:"28px", padding:"28px 20px", background:C.card, borderRadius:"20px", border:`1px solid ${C.border}` }}>
            <Ring pct={result.score} color={result.tierColor} size={140}>
              <div style={{ fontFamily:C.serif, fontSize:"2.5rem", color:result.tierColor, fontWeight:700 }}>{result.score}</div>
              <div style={{ fontSize:"0.65rem", color:C.muted }}>/100</div>
            </Ring>
            <div style={{ fontFamily:C.serif, fontSize:"1.3rem", color:result.tierColor, marginTop:"12px" }}>{result.tierEmoji} {result.tier}</div>
            <div style={{ fontSize:"0.78rem", color:C.muted, marginTop:"4px" }}>Gut Health Score</div>
          </div>
        )}
        {result && <DialogueBox text={getDialogueCopy("analysis", result, answers, getDetectedIssues(answers, result))} color={result.tierColor} />}
        {result && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
            {Object.entries(result.catScores).map(([cat, score]) => (
              <div key={cat} className="metric-card feature-tile" onClick={()=>setSection(cat.toLowerCase())} style={{ padding:"16px", background:C.card, borderRadius:"16px", border:`1px solid ${C.border2}` }}>
                <div style={{ fontSize:"1.2rem", marginBottom:"6px" }}>{CAT_ICONS[cat]}</div>
                <div style={{ fontSize:"0.75rem", color:C.muted, marginBottom:"4px" }}>{cat}</div>
                <div style={{ fontFamily:C.serif, fontSize:"1.5rem", color:CAT_COLORS[cat] }}>{score}</div>
                <Bar pct={score} color={CAT_COLORS[cat]} height="3px" delay="0s" />
                <div className="feature-thumb">
                  <img src={SECTION_ART.category[cat] || SECTION_ART.home} alt={`${cat} illustration`} />
                </div>
                <div style={{ fontSize:"0.7rem", color:C.muted, marginTop:"8px" }}>Tap for details</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginBottom:"16px" }}>
          <div style={{ fontSize:"0.78rem", color:C.muted, marginBottom:"12px", fontWeight:600, letterSpacing:"0.05em" }}>SMART SHORTCUTS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {[
              { icon:"🤖", label:"ML Models",  key:"ml" },
              { icon:"🔮", label:"Forecast",   key:"forecast" },
              { icon:"🧬", label:"Microbiome", key:"microbiome" },
              { icon:"🍎", label:"Food Log",   key:"food" },
            ].map(a => (
              <div key={a.key} className="metric-card" onClick={()=>setSection(a.key)}
                style={{ padding:"14px 16px", background:C.card, borderRadius:"14px", border:`1px solid ${C.border2}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"1.3rem" }}>{a.icon}</span>
                <span style={{ fontSize:"0.82rem", color:C.text }}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    if (activeTab === "analysis") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"20px" }}>📊 Analysis</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {[
            { icon:"🔬", label:"Deep Analysis",  sub:"XGBoost feature breakdown",  key:"analysis" },
            { icon:"🤖", label:"ML Models",       sub:"XGBoost vs Decision Tree",   key:"ml" },
            { icon:"🔮", label:"Future Forecast", sub:"1, 3 & 6 month projections", key:"forecast" },
            { icon:"🧬", label:"My Microbiome",   sub:"Bacterial composition",      key:"microbiome" },
            { icon:"🎯", label:"Gut Archetype",   sub:"K-Means cluster profile",    key:"archetype" },
          ].map(a => (
            <div key={a.key} className="metric-card" onClick={()=>setSection(a.key)}
              style={{ padding:"16px 20px", background:C.card, borderRadius:"16px", border:`1px solid ${C.border2}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"16px" }}>
              <span style={{ fontSize:"1.8rem" }}>{a.icon}</span>
              <div>
                <div style={{ fontSize:"0.9rem", color:C.text, fontWeight:600 }}>{a.label}</div>
                <div style={{ fontSize:"0.75rem", color:C.muted }}>{a.sub}</div>
              </div>
              <div style={{ marginLeft:"auto", color:C.muted }}>›</div>
            </div>
          ))}
        </div>
      </div>
    );

    if (activeTab === "checkin") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <SectionCheckin user={user} onBack={()=>setActiveTab("home")} />
      </div>
    );

    if (activeTab === "profile") return (
      <div className="fadeUp" style={{ padding:"20px 16px 100px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"20px" }}>👤 Profile</h2>
        <div style={{ padding:"24px", background:C.card, borderRadius:"20px", border:`1px solid ${C.border}`, marginBottom:"16px", textAlign:"center" }}>
          <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:C.greenDim, border:`2px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.8rem", margin:"0 auto 12px" }}>
            {user?.name?.[0] || "G"}
          </div>
          <div style={{ fontFamily:C.serif, fontSize:"1.4rem", color:C.text }}>{user?.name || "Guest"}</div>
          <div style={{ fontSize:"0.8rem", color:C.muted }}>{user?.email || "No account"}</div>
          {result && <div style={{ marginTop:"12px", fontSize:"1rem", color:result.tierColor }}>{result.tierEmoji} {result.tier}</div>}
        </div>
        {result && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
            {Object.entries(result.catScores).map(([cat,score])=>(
              <div key={cat} style={{ padding:"16px", background:C.card, borderRadius:"14px", border:`1px solid ${C.border2}` }}>
                <div style={{ fontSize:"0.75rem", color:C.muted, marginBottom:"4px" }}>{CAT_ICONS[cat]} {cat}</div>
                <div style={{ fontFamily:C.serif, fontSize:"1.5rem", color:CAT_COLORS[cat] }}>{score}</div>
                <Bar pct={score} color={CAT_COLORS[cat]} height="3px" delay="0s" />
              </div>
            ))}
          </div>
        )}
        <div className="metric-card" onClick={onRetake}
          style={{ padding:"16px 20px", background:C.card, borderRadius:"16px", border:`1px solid ${C.border2}`, cursor:"pointer", display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontSize:"1.5rem" }}>🔄</span>
          <div>
            <div style={{ fontSize:"0.9rem", color:C.text }}>Retake Assessment</div>
            <div style={{ fontSize:"0.75rem", color:C.muted }}>Update your gut health quiz</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, maxWidth:"480px", margin:"0 auto", position:"relative" }}>
      <style>{css}</style>
      {renderTab()}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:"480px", background:"rgba(5,12,7,0.95)", backdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100 }}>
        {NAV.map(tab => (
          <div key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{ flex:1, padding:"12px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", cursor:"pointer", transition:"all 0.2s" }}>
            <span style={{ fontSize:"1.4rem", filter:activeTab===tab.id?"none":"grayscale(1) opacity(0.5)" }}>{tab.icon}</span>
            <span style={{ fontSize:"0.65rem", color:activeTab===tab.id?C.green:C.muted, fontWeight:activeTab===tab.id?600:400 }}>{tab.label}</span>
            {activeTab===tab.id && <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:C.green }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("auth");
  const [user, setUser] = useState(null);
  const [answers, setAnswers] = useState({});

  const handleLogin = (u, goToDashboard=false) => { setUser(u); setScreen(goToDashboard?"dashboard":"quiz"); };
  const handleQuizDone = async (ans) => {
    setAnswers(ans);

    try {
      await apiFetch("/api/assess", {
        method:"POST",
        body:JSON.stringify({ user_id:user?.id, answers:ans })
      });
    } catch (error) {
      console.error("Could not save assessment", error);
    }

    setScreen("dashboard");
  };
  const handleRetake = () => setScreen("quiz");
  const handleClaimGuestAccount = async (form, guestUser) => {
    const registerResponse = await apiFetch("/auth/register", {
      method:"POST",
      body:JSON.stringify({
        name:form.name,
        email:form.email,
        password:form.password,
      }),
    });

    const newUser = registerResponse.user;

    await apiFetch("/auth/claim-guest-data", {
      method:"POST",
      body:JSON.stringify({
        guest_user_id: guestUser?.id || "guest",
        new_user_id: newUser.id,
      }),
    });

    moveLocalStorageValue(getProfileImageStorageKey(guestUser), getProfileImageStorageKey(newUser));
    moveLocalStorageValue(getFoodLogStorageKey(guestUser?.id), getFoodLogStorageKey(newUser.id));

    setUser(newUser);
    setScreen("dashboard");
    return newUser;
  };
  const handleLogout = () => {
    setUser(null);
    setAnswers({});
    setScreen("auth");
  };

  return (
    <>
      <style>{css}</style>
      {screen==="auth"      && <AuthScreen onLogin={handleLogin} />}
      {screen==="quiz"      && <QuizScreen user={user} onComplete={handleQuizDone} />}
      {screen==="dashboard" && <Dashboard user={user} answers={answers} onRetake={handleRetake} onLogout={handleLogout} onClaimGuestAccount={handleClaimGuestAccount} />}
    </>
  );
}