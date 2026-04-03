'use client';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ── English ──────────────────────────────────────────────────────────────────
const en = {
  appTitle: "Krishi-Route", appSubtitle: "Most profitable mandi, not just nearest.",
  mvp: "Live", tripInput: "Trip Input", loadingOptions: "Loading options…",
  crop: "Crop", vehicle: "Vehicle", quantity: "Quantity", unit: "Unit",
  quintal: "Quintal", ton: "Ton", searchRadius: "Search radius (km)",
  useMyLocation: "Use my location", originLat: "Origin latitude", originLng: "Origin longitude",
  enableCostSharing: "Enable cost-sharing (ride-share)", neighborQty: "Neighbor quantity",
  neighborUnit: "Neighbor unit", optimizing: "Optimizing…", compareMandis: "Compare mandis",
  decisionDashboard: "Decision dashboard", runComparisonMsg: "Run a comparison to see profits across nearby mandis.",
  winner: "Winner ⭐", km: "km", profitMargin: "margin {{margin}}%",
  profitComparison: "Profit comparison", selectedMandiBreakdown: "Selected mandi breakdown",
  mandi: "Mandi", distance: "Distance", revenue: "Revenue", transportCost: "Transport cost",
  handling: "Handling", netProfit: "Net profit", soloTripProfit: "Solo trip profit",
  predictedPriceNextDay: "Predicted price (next day)", predictedNetProfit: "Predicted net profit",
  rideSharingInfo: "Ride-sharing: you and neighbor share the truck. You save ₹{{savings}} ({{savingsPct}}% of transport).",
  selectMandiCardMsg: "Select a mandi card to see the breakdown.",
  historicalPriceTrend: "Historical price trend (last 7 days)",
  selectMandiRecentPricesMsg: "Select a mandi to see its recent prices.",
  routeMapMVP: "Route map", origin: "Origin", demandIndexPopup: "Demand index: {{index}}/100",
  mapNote: "Road distance via OSRM. Farm pin = green circle. Click mandi nodes for details.",
  heatmapNote: "Demand heatmap: blue = lower demand, amber = medium, red = higher demand (based on recent prices).",
  pinDropBtn: "Drop Pin", pinDropActive: "Dropping Pin — click map!",
  pinDropHint: "Click anywhere on the map below to set your farm location as the origin.",
  marketsCompared: "Markets Compared", bestMargin: "Best Profit Margin",
  potentialSavings: "Extra profit vs nearest: {{nearestDist}}km → {{winnerDist}}km",
  nearestIsWinner: "Nearest mandi is the best choice!",
  volatility_downtrend: "⚠️ Price fell 3 days straight (−₹{{drop}}/q). Sell sooner or try another mandi.",
  volatility_uptrend: "📈 Price rose 3 days straight (+₹{{rise}}/q). Great time to sell!",
  perishability_high: "🚨 High spoilage risk for {{crop}} at {{km}} km. Use faster transport or sell closer.",
  perishability_medium: "⚠️ Spoilage risk for {{crop}} beyond {{maxKm}} km. Ensure quick delivery.",
  shareWhatsApp: "Share on WhatsApp", copyResult: "Copy Result",
  insight_uptrend: "Prices are showing a steady upward trend! 📈",
  insight_downtrend: "Caution: Prices are in a steady downward trend. 📉",
  insight_peak_day: "Historically, prices peak on {{day}}s. ⭐",
  insight_stable: "Prices have been relatively stable this week.",
  sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday",
  thursday: "Thursday", friday: "Friday", saturday: "Saturday",
};

// ── Hindi ────────────────────────────────────────────────────────────────────
const hi = {
  appTitle: "कृषि मार्ग", appSubtitle: "सिर्फ निकटतम नहीं, सबसे लाभदायक मंडी।",
  tripInput: "यात्रा विवरण", loadingOptions: "विकल्प लोड हो रहे हैं…",
  crop: "फसल", vehicle: "वाहन", quantity: "मात्रा", unit: "इकाई", quintal: "क्विंटल", ton: "टन",
  searchRadius: "खोज दायरा (किमी)", useMyLocation: "मेरे स्थान का उपयोग करें",
  originLat: "मूल अक्षांश", originLng: "मूल देशांतर",
  enableCostSharing: "लागत-साझाकरण सक्षम करें (राइड-शेयर)", neighborQty: "पड़ोसी की मात्रा",
  neighborUnit: "पड़ोसी की इकाई", optimizing: "अनुकूलन हो रहा है…",
  compareMandis: "मंडियों की तुलना करें", decisionDashboard: "निर्णय डैशबोर्ड",
  runComparisonMsg: "आस-पास की मंडियों में मुनाफा देखने के लिए तुलना करें।",
  winner: "विजेता ⭐", km: "किमी", profitMargin: "मार्जिन {{margin}}%",
  profitComparison: "मुनाफा तुलना", selectedMandiBreakdown: "चयनित मंडी विवरण",
  mandi: "मंडी", distance: "दूरी", revenue: "राजस्व", transportCost: "परिवहन लागत",
  handling: "हैंडलिंग", netProfit: "शुद्ध लाभ", soloTripProfit: "सोलो ट्रिप लाभ",
  predictedPriceNextDay: "अनुमानित मूल्य (अगले दिन)", predictedNetProfit: "अनुमानित शुद्ध लाभ",
  rideSharingInfo: "राइड-शेयरिंग: आप और पड़ोसी ट्रक साझा करते हैं। बचत ₹{{savings}} ({{savingsPct}}%)।",
  selectMandiCardMsg: "विवरण देखने के लिए मंडी कार्ड चुनें।",
  historicalPriceTrend: "ऐतिहासिक मूल्य प्रवृत्ति (पिछले 7 दिन)",
  selectMandiRecentPricesMsg: "हाल के मूल्य देखने के लिए मंडी चुनें।",
  routeMapMVP: "मार्ग मानचित्र", origin: "मूल", demandIndexPopup: "मांग सूचकांक: {{index}}/100",
  mapNote: "रोड दूरी OSRM से। हरा वृत्त = आपका खेत। मंडी नोड पर क्लिक करें।",
  heatmapNote: "मांग हीटमैप: नीला = कम, एम्बर = मध्यम, लाल = उच्च मांग।",
  pinDropBtn: "पिन डालें", pinDropActive: "पिन डाल रहे हैं — नक्शे पर क्लिक करें!",
  pinDropHint: "अपने खेत की लोकेशन सेट करने के लिए नीचे नक्शे पर कहीं भी क्लिक करें।",
  marketsCompared: "तुलना की गई मंडियां", bestMargin: "सर्वोत्तम लाभ मार्जिन",
  potentialSavings: "अवसर: {{nearestDist}} km → {{winnerDist}} km", nearestIsWinner: "निकटतम मंडी सबसे बेहतर!",
  volatility_downtrend: "⚠️ कीमत 3 दिन लगातार गिरी (−₹{{drop}}/क्विं). जल्दी बेचें।",
  volatility_uptrend: "📈 कीमत 3 दिन लगातार बढ़ी (+₹{{rise}}/क्विं). बेचने का सही समय!",
  perishability_high: "🚨 {{crop}} की {{km}} किमी पर खराब होने का उच्च जोखिम।",
  perishability_medium: "⚠️ {{crop}} की {{maxKm}} किमी से अधिक पर खराब होने का जोखिम।",
  shareWhatsApp: "व्हाट्सएप पर शेयर करें", copyResult: "परिणाम कॉपी करें",
  insight_uptrend: "कीमतें लगातार बढ़ रही हैं! 📈", insight_downtrend: "सावधान: कीमतें लगातार गिर रही हैं। 📉",
  insight_peak_day: "ऐतिहासिक रूप से, {{day}} को कीमतें सबसे अधिक होती हैं। ⭐",
  insight_stable: "इस सप्ताह कीमतें अपेक्षाकृत स्थिर रही हैं।",
  sunday: "रविवार", monday: "सोमवार", tuesday: "मंगलवार", wednesday: "बुधवार",
  thursday: "गुरुवार", friday: "शुक्रवार", saturday: "शनिवार",
};

// ── Bengali ──────────────────────────────────────────────────────────────────
const bn = { appTitle: "কৃষি রুট", appSubtitle: "শুধু নিকটতম নয়, সবচেয়ে লাভজনক মান্ডি।", crop: "ফসল", vehicle: "যানবাহন", quantity: "পরিমাণ", unit: "একক", quintal: "কুইন্টাল", ton: "টন", searchRadius: "অনুসন্ধানের ব্যাসার্ধ (কিমি)", useMyLocation: "আমার অবস্থান ব্যবহার করুন", originLat: "উৎস অক্ষাংশ", originLng: "উৎস দ্রাঘিমাংশ", enableCostSharing: "খরচ-অংশীদারি সক্ষম করুন", neighborQty: "প্রতিবেশীর পরিমাণ", neighborUnit: "প্রতিবেশীর একক", optimizing: "অপ্টিমাইজ করা হচ্ছে…", compareMandis: "মান্ডি তুলনা করুন", decisionDashboard: "সিদ্ধান্ত ড্যাশবোর্ড", winner: "বিজয়ী ⭐", km: "কিমি", profitMargin: "মার্জিন {{margin}}%", mandi: "মান্ডি", distance: "দূরত্ব", revenue: "রাজস্ব", transportCost: "পরিবহন খরচ", handling: "হ্যান্ডলিং", netProfit: "নিট লাভ", pinDropBtn: "পিন দিন", marketsCompared: "তুলনা করা বাজার", bestMargin: "সর্বোচ্চ লাভ মার্জিন", shareWhatsApp: "WhatsApp-এ শেয়ার করুন", copyResult: "ফলাফল কপি করুন" };
const mr = { appTitle: "कृषी मार्ग", appSubtitle: "केवळ जवळची नाही, सर्वाधिक फायदेशीर बाजारपेठ.", crop: "पीक", vehicle: "वाहन", quantity: "प्रमाण", unit: "एकक", quintal: "क्विंटल", ton: "टन", searchRadius: "शोध त्रिज्या (किमी)", useMyLocation: "माझे स्थान वापरा", originLat: "मूळ अक्षांश", originLng: "मूळ रेखांश", enableCostSharing: "खर्च-वाटप सक्षम करा", neighborQty: "शेजाऱ्याचे प्रमाण", neighborUnit: "शेजाऱ्याचे एकक", optimizing: "अनुकूल करत आहे…", compareMandis: "बाजारपेठांची तुलना करा", decisionDashboard: "निर्णय डॅशबोर्ड", winner: "विजेता ⭐", km: "किमी", profitMargin: "मार्जिन {{margin}}%", mandi: "बाजारपेठ", distance: "अंतर", revenue: "महसूल", transportCost: "वाहतूक खर्च", handling: "हाताळणी", netProfit: "निव्वळ नफा", pinDropBtn: "पिन सोडा", marketsCompared: "तुलना केलेल्या बाजारपेठा", bestMargin: "सर्वोत्तम नफा मार्जिन", shareWhatsApp: "WhatsApp वर शेयर करा", copyResult: "निकाल कॉपी करा" };
const te = { appTitle: "కృషి రూట్", appSubtitle: "కేవలం సమీపమే కాదు, అత్యంత లాభదాయకమైన మండి.", crop: "పంట", vehicle: "వాహనం", quantity: "పరిమాణం", unit: "యూనిట్", quintal: "క్వింటాల్", ton: "టన్ను", searchRadius: "శోధన వ్యాసార్ధం (కిమీ)", useMyLocation: "నా స్థానాన్ని ఉపయోగించండి", originLat: "మూల అక్షాంశం", originLng: "మూల రేఖాంశం", enableCostSharing: "ఖర్చు పంచుకోవడం ప్రారంభించు", neighborQty: "పొరుగువారి పరిమాణం", neighborUnit: "పొరుగువారి యూనిట్", optimizing: "ఆప్టిమైజ్ చేస్తోంది…", compareMandis: "మండీలను సరిపోల్చండి", decisionDashboard: "నిర్ణయ డాష్‌బోర్డ్", winner: "విజేత ⭐", km: "కి.మీ", profitMargin: "మార్జిన్ {{margin}}%", mandi: "మండి", distance: "దూరం", revenue: "ఆదాయం", transportCost: "రవాణా ఖర్చు", handling: "హ్యాండ్లింగ్", netProfit: "నికర లాభం", pinDropBtn: "పిన్ వేయండి", marketsCompared: "పోల్చిన మార్కెట్లు", bestMargin: "అత్యుత్తమ లాభపు మార్జిన్", shareWhatsApp: "WhatsApp లో Share చేయండి", copyResult: "ఫలితం కాపీ" };
const ta = { appTitle: "கிருஷி ரூட்", appSubtitle: "மிக நெருக்கமானது மட்டுமல்ல, அதிக லாபகரமான மண்டி.", crop: "பயிர்", vehicle: "வாகனம்", quantity: "அளவு", unit: "அலகு", quintal: "குவிண்டால்", ton: "டன்", searchRadius: "தேடல் ஆரம் (கிமீ)", useMyLocation: "என் இருப்பிடத்தை பயன்படுத்து", originLat: "அசல் அட்சரேகை", originLng: "அசல் தீர்க்கரேகை", enableCostSharing: "செலவு-பகிர்வை இயக்கு", neighborQty: "அண்டைக்காரரின் அளவு", neighborUnit: "அண்டைக்காரரின் அலகு", optimizing: "உகந்ததாக்குகிறது…", compareMandis: "மண்டிகளை ஒப்பிடு", decisionDashboard: "முடிவு டேஷ்போர்டு", winner: "வெற்றியாளர் ⭐", km: "கிமீ", profitMargin: "விளிம்பு {{margin}}%", mandi: "மண்டி", distance: "தூரம்", revenue: "வருவாய்", transportCost: "போக்குவரத்து செலவு", handling: "கையாளல்", netProfit: "நிகர லாபம்", pinDropBtn: "பின் செலுத்து", marketsCompared: "ஒப்பிட்ட சந்தைகள்", bestMargin: "சிறந்த லாப விகிதம்", shareWhatsApp: "WhatsApp-ல் பகிர்", copyResult: "நகலெடு" };
const gu = { appTitle: "કૃષિ રૂટ", appSubtitle: "ફક્ત નજીકની જ નહીં, સૌથી નફાકારક મંડી.", crop: "પાક", vehicle: "વાહન", quantity: "જથ્થો", unit: "એકમ", quintal: "ક્વિન્ટલ", ton: "ટન", searchRadius: "શોધ ત્રિજ્યા (કિમી)", useMyLocation: "મારા સ્થાનનો ઉપયોગ કરો", originLat: "મૂળ અક્ષાંશ", originLng: "મૂળ રેખાંશ", enableCostSharing: "ખર્ચ-વહેંચણી સક્ષમ કરો", neighborQty: "પડોશીનો જથ્થો", neighborUnit: "પડોશીનો એકમ", optimizing: "ઑપ્ટિમાઇઝ કરી રહ્યું છે…", compareMandis: "મંડીઓની સરખામણી કરો", decisionDashboard: "નિર્ણય ડેશબોર્ડ", winner: "વિજેતા ⭐", km: "કિમી", profitMargin: "માર્જિન {{margin}}%", mandi: "મંડી", distance: "અંતર", revenue: "આવક", transportCost: "પરિવહન ખર્ચ", handling: "હેન્ડલિંગ", netProfit: "ચોખ્ખો નફો", pinDropBtn: "પિન નાખો", marketsCompared: "તુલના કરેલા બાજારો", bestMargin: "શ્રેષ્ઠ નફા માર્જિન", shareWhatsApp: "WhatsApp પર Share કરો", copyResult: "Copy" };
const ur = { appTitle: "کرشی روٹ", appSubtitle: "صرف قریب ترین نہیں، سب سے زیادہ منافع بخش منڈی۔", crop: "فصل", vehicle: "گاڑی", quantity: "مقدار", unit: "اکائی", quintal: "کونٹل", ton: "ٹن", searchRadius: "تلاش کا دائرہ (کلومیٹر)", useMyLocation: "میرا مقام استعمال کریں", originLat: "اصل عرض بلد", originLng: "اصل طول بلد", enableCostSharing: "لاگت کی شراکت کو فعال کریں", neighborQty: "پڑوسی کی مقدار", neighborUnit: "پڑوسی کی اکائی", optimizing: "بہتر بنارہا ہے…", compareMandis: "منڈیوں کا موازنہ کریں", decisionDashboard: "فیصلہ ڈیش بورڈ", winner: "فاتح ⭐", km: "کلومیٹر", profitMargin: "مارجن {{margin}}%", mandi: "منڈی", distance: "فاصلہ", revenue: "آمدنی", transportCost: "نقل و حمل", handling: "ہینڈلنگ", netProfit: "خالص منافع", pinDropBtn: "پن ڈالیں", marketsCompared: "تقابل شدہ منڈیاں", bestMargin: "بہترین منافع مارجن", shareWhatsApp: "WhatsApp پر Share", copyResult: "نقل کریں" };
const kn = { appTitle: "ಕೃಷಿ ರೂಟ್", appSubtitle: "ಕೇವಲ ಹತ್ತಿರದದಲ್ಲ, ಹೆಚ್ಚು ಲಾಭದಾಯಕ ಮಾರುಕಟ್ಟೆ.", crop: "ಬೆಳೆ", vehicle: "ವಾಹನ", quantity: "ಪ್ರಮಾಣ", unit: "ಘಟಕ", quintal: "ಕ್ವಿಂಟಲ್", ton: "ಟನ್", searchRadius: "ಹುಡುಕಾಟದ ತ್ರಿಜ್ಯ (ಕಿ.ಮೀ)", useMyLocation: "ನನ್ನ ಸ್ಥಳ ಬಳಸಿ", originLat: "ಮೂಲ ಅಕ್ಷಾಂಶ", originLng: "ಮೂಲ ರೇಖಾಂಶ", enableCostSharing: "ವೆಚ್ಚ-ಹಂಚಿಕೆ ಸಕ್ರಿಯ", neighborQty: "ನೆರೆಯ ಪ್ರಮಾಣ", neighborUnit: "ನೆರೆಯ ಘಟಕ", optimizing: "ಆಪ್ಟಿಮೈಸ್ ಮಾಡಲಾಗುತ್ತಿದೆ…", compareMandis: "ಮಂಡಿಗಳನ್ನು ಹೋಲಿಸಿ", decisionDashboard: "ನಿರ್ಧಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", winner: "ವಿಜೇತ ⭐", km: "ಕಿ.ಮೀ", profitMargin: "ಮಾರ್ಜಿನ್ {{margin}}%", mandi: "ಮಂಡಿ", distance: "ದೂರ", revenue: "ಆದಾಯ", transportCost: "ಸಾರಿಗೆ ವೆಚ್ಚ", handling: "ನಿರ್ವಹಣೆ", netProfit: "ನಿವ್ವಳ ಲಾಭ", pinDropBtn: "ಪಿನ್ ಹಾಕಿ", marketsCompared: "ಹೋಲಿಸಿದ ಮಾರುಕಟ್ಟುಗಳು", bestMargin: "ಶ್ರೇಷ್ಟ ಲಾಭ ಮಾರ್ಜಿನ್", shareWhatsApp: "WhatsApp ನಲ್ಲಿ Share", copyResult: "ನಕಲಿಸಿ" };
const pa = { appTitle: "ਕ੍ਰਿਸ਼ੀ ਰੂਟ", appSubtitle: "ਸਿਰਫ਼ ਨੇੜੇ ਦੀ ਨਹੀਂ, ਸਭ ਤੋਂ ਲਾਭਦਾਇਕ ਮੰਡੀ।", crop: "ਫ਼ਸਲ", vehicle: "ਵਾਹਨ", quantity: "ਮਾਤਰਾ", unit: "ਇਕਾਈ", quintal: "ਕੁਇੰਟਲ", ton: "ਟਨ", useMyLocation: "ਮੇਰੀ ਲੋਕੇਸ਼ਨ ਵਰਤੋ", compareMandis: "ਮੰਡੀਆਂ ਦੀ ਤੁਲਨਾ ਕਰੋ", winner: "ਜੇਤੂ ⭐", km: "ਕਿਮੀ", mandi: "ਮੰਡੀ", netProfit: "ਸ਼ੁੱਧ ਲਾਭ", shareWhatsApp: "WhatsApp ਤੇ ਸਾਂਝਾ ਕਰੋ", copyResult: "ਕਾਪੀ" };
const ml = { appTitle: "കൃഷി റൂട്ട്", appSubtitle: "ഏറ്റവും അടുത്തല്ല, ഏറ്റവും ലാഭകരമായ മണ്ഡി.", crop: "വിള", vehicle: "വാഹനം", quantity: "അളവ്", unit: "യൂണിറ്റ്", quintal: "ക്വിന്റൽ", ton: "ടൺ", useMyLocation: "എൻ്റെ ലൊക്കേഷൻ ഉപയോഗിക്കുക", compareMandis: "മണ്ഡികൾ താരതമ്യം ചെയ്യുക", winner: "വിജയി ⭐", km: "കി.മീ", mandi: "മണ്ഡി", netProfit: "അറ്റ ലാഭം", shareWhatsApp: "WhatsApp ൽ Share", copyResult: "Copy" };
const or = { appTitle: "କୃଷି ରୁଟ", crop: "ଫସଲ", vehicle: "ଯାନ", quantity: "ପରିମାଣ", quintal: "କ୍ୱିଣ୍ଟାଲ", ton: "ଟନ", useMyLocation: "ମୋ ଅବସ୍ଥାନ ବ୍ୟବହାର କର", compareMandis: "ମଣ୍ଡି ତୁଳନା", winner: "ବିଜୟୀ ⭐", km: "କି.ମି", mandi: "ମଣ୍ଡି", netProfit: "ନିଟ୍ ଲାଭ" };
const as = { appTitle: "কৃষি ৰুট", crop: "শস্য", vehicle: "বাহন", quantity: "পৰিমাণ", quintal: "কুইণ্টেল", ton: "টন", compareMandis: "মণ্ডী তুলনা কৰক", winner: "বিজয়ী ⭐", km: "কি.মি", mandi: "মণ্ডী", netProfit: "নিট লাভ" };

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en }, hi: { translation: hi }, bn: { translation: bn },
        mr: { translation: mr }, te: { translation: te }, ta: { translation: ta },
        gu: { translation: gu }, ur: { translation: ur }, kn: { translation: kn },
        pa: { translation: pa }, ml: { translation: ml }, or: { translation: or },
        as: { translation: as },
      },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });
}

export default i18n;
