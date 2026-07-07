'use strict';

// ═══════════════════════════════════════
//  GLOBAL STATE
// ═══════════════════════════════════════
const S = {
    mode: 'joint',
    currentTab: 'land',
    matrixUnitCost: 20,   // 萬/坪 (from Tab2 matrix)
    useMatrix: false,     // whether to use matrix cost
    currentResult: {},
    pptStyle: 'dark',
    customCosts: [],
    customRevenues: [],
    customKpis: [],
    summaryExpanded: { cost: true, revenue: true, kpi: true },
    isSearching: false,
    unitLayouts: [],
    unitLayoutsExpanded: false,
    cadastral: [],
    cadastralCounty: '臺北市',
    cadastralDistrict: '中正區',
    cadastralZone: '',
    cadastralCollapsed: false,
    cadastralMaximized: false,
    projects: [],
    currentProjectId: null,
    currentScenarioId: null
};

try {
    S.customCosts = JSON.parse(localStorage.getItem('s_customCosts') || '[]');
    S.customRevenues = JSON.parse(localStorage.getItem('s_customRevenues') || '[]');
    S.customKpis = JSON.parse(localStorage.getItem('s_customKpis') || '[]');
    S.unitLayouts = JSON.parse(localStorage.getItem('s_unitLayouts') || '[]');
    S.unitLayoutsExpanded = localStorage.getItem('s_unitLayoutsExpanded') === 'true';
    S.cadastral = JSON.parse(localStorage.getItem('s_cadastral') || '[]');
    S.cadastralCounty = localStorage.getItem('s_cadastralCounty') || '臺北市';
    S.cadastralDistrict = localStorage.getItem('s_cadastralDistrict') || '中正區';
    S.cadastralZone = localStorage.getItem('s_cadastralZone') || '';
    S.cadastralCollapsed = localStorage.getItem('s_cadastralCollapsed') === 'true';
    S.cadastralMaximized = localStorage.getItem('s_cadastralMaximized') === 'true';
    
    S.projects = JSON.parse(localStorage.getItem('s_projects') || '[]');
    S.currentProjectId = localStorage.getItem('s_currentProjectId');
    S.currentScenarioId = localStorage.getItem('s_currentScenarioId');
} catch (e) {
    console.error('Failed to parse custom items', e);
}

if (!S.unitLayouts || S.unitLayouts.length === 0) {
    S.unitLayouts = [
        { area: 30, count: 4 },
        { area: 25, count: 4 },
        { area: 18, count: 4 }
    ];
}

// Matrix constants
const BEIAN   = { hypothetical:0.0777, foundation:0.1523, structure:0.2266, decoration:0.2456, equipment:0.0289, landscape:0.0245, mep:0.1741, management:0.0704 };
const MINQUAN = { hypothetical:0.0574, foundation:0.1239, structure:0.3209, decoration:0.2258, equipment:0.0133, landscape:0.0206, mep:0.1639, management:0.0742 };
const BASE_RATES = { RC:19.5, SRC:24.5, SC:28.0, SS:29.5 };
let currentStruct = 'RC';
let _inCalc = false;

// ═══════════════════════════════════════
//  SMART CONSTRUCTION DURATION ESTIMATION (智慧工期預估)
// ═══════════════════════════════════════
const CONSTRUCTION_STANDARDS = {
    '7F_B1F_RC': {
        name: '7F/B1F (RC)',
        months: 19.5,
        aboveFloors: 7,
        bsmtFloors: 1,
        signing: 63,
        slurry: 35,
        excav: 26,
        bsmt: 50,
        above: 111,
        deco: 135,
        license: 45,
        inspect: 60,
        handover: 60,
        days: 585
    },
    '12F_B2F_RC': {
        name: '12F/B2F (RC)',
        months: 24.8,
        aboveFloors: 12,
        bsmtFloors: 2,
        signing: 63,
        slurry: 35,
        excav: 39,
        bsmt: 75,
        above: 186,
        deco: 165,
        license: 45,
        inspect: 60,
        handover: 75,
        days: 744
    },
    '14F_B3F_RC': {
        name: '14F/B3F (RC)',
        months: 31.5,
        aboveFloors: 14,
        bsmtFloors: 3,
        signing: 63,
        slurry: 83,
        excav: 80,
        bsmt: 100,
        above: 228,
        deco: 210,
        license: 45,
        inspect: 60,
        handover: 75,
        days: 944
    },
    '20F_B4F_RC': {
        name: '20F/B4F (RC)',
        months: 37.6,
        aboveFloors: 20,
        bsmtFloors: 4,
        signing: 67,
        slurry: 99,
        excav: 128,
        bsmt: 125,
        above: 319,
        deco: 210,
        license: 45,
        inspect: 60,
        handover: 75,
        days: 1128
    },
    '25F_B4F_RC': {
        name: '25F/B4F (RC)',
        months: 40.1,
        aboveFloors: 25,
        bsmtFloors: 4,
        signing: 67,
        slurry: 99,
        excav: 128,
        bsmt: 125,
        above: 394,
        deco: 210,
        license: 45,
        inspect: 60,
        handover: 75,
        days: 1203
    },
    '29F_B4F_SRC': {
        name: '29F/B4F (SRC)',
        months: 45.8,
        aboveFloors: 29,
        bsmtFloors: 4,
        signing: 67,
        slurry: 102,
        excav: 194,
        bsmt: 167,
        above: 455,
        deco: 210,
        license: 45,
        inspect: 60,
        handover: 75,
        days: 1375
    }
};

let currentConstructionStandard = null;

let costChart   = null;
let marketChart = null;
let profitChart = null;
let salesRatioChart = null;

let apiKey = '';
let apiModel = 'gemini-2.5-flash';
try {
    apiKey = localStorage.getItem('gemini_api_key') || '';
    apiModel = localStorage.getItem('gemini_api_model') || 'gemini-2.5-flash';
    // 自動將舊版的無效模型名稱升級為有效的 Gemini 2.5 Flash
    let migrated = false;
    if (apiModel === 'gemini-1.5-flash' || apiModel === 'gemini-2.0-flash' || apiModel === 'gemini-3.5-flash' || apiModel === 'gemini-3.1-flash-lite') {
        apiModel = 'gemini-2.5-flash';
        migrated = true;
    }
    if (apiModel === 'gemini-1.5-pro') {
        apiModel = 'gemini-2.5-pro';
        migrated = true;
    }
    if (migrated) {
        localStorage.setItem('gemini_api_model', apiModel);
    }
} catch (e) {
    console.warn('localStorage is not accessible:', e);
}

// ═══════════════════════════════════════
//  MODE SWITCHING (preserve original logic)
// ═══════════════════════════════════════
// ─── 試算明細卡片開合功能 ───
let _modeDetailOpen = true; // 預設展開

// ── 圖資嵌入 B 軌：handleStagingImageUpload / clearStagingImage ──
if (!window._stagingUploads) window._stagingUploads = {};

// ── 數據中繼審計前台 (Staging Table) 全域變數與邏輯 ──
let stagingData = null;

let importedAIReportText = null;

let lastAIPrompt = '';

let chatMessages = [];

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
// ═══════════════════════════════════════
//  FAR PANEL SYSTEM
// ═══════════════════════════════════════
const FAR_BONUS_OPTIONS    = ['都更獎勵','危老獎勵','防災型都更','開放空間','智慧建築標章','綠建築標章','能效標章','耐震標章','無障礙標章','規模/時程','其它（手動填入）'];
const FAR_TRANSFER_OPTIONS = ['古蹟','歷建','TOD增額','道移','代金','其它（手動填入）'];
let _farCnt = 0;

// ═══════════════════════════════════════
//  IN-APP INTERACTIVE MAP MODAL (Leaflet + OSM)
// ═══════════════════════════════════════
let mapInstance = null;
let markerInstance = null;
let currentMapStyle = 'colorful'; // default to colorful maps
let tileLayerInstance = null;

// Marker coordinates state
let currentMarkerLat = 25.0330;
let currentMarkerLng = 121.5654;

// --- Measurement and TOD Concentric Circles State ---
let isMeasureMode = false;
let measureStartLatLng = null;
let measureLayers = [];

let todCirclesEnabled = false;
let todCircles = [];
let cadastralLayerInstance = null;
let zoningLayerInstance = null;

// --- WMS/WMTS 疊圖與都計系統跳轉邏輯 ---

// --- Map Measurement and TOD Circles JavaScript Logic ---

// ═══════════════════════════════════════
//  MARKET PRICE QUERY
// ═══════════════════════════════════════
const _mq = {
    open591:   () => { const l=document.getElementById('location').value||'台北'; window.open('https://sale.591.com.tw/?q='+encodeURIComponent(l),'_blank'); },
    openLeju:  () => { const l=document.getElementById('location').value||'台北'; window.open('https://www.leju.com.tw/buy/?q='+encodeURIComponent(l),'_blank'); },
    openLvr:   () => window.open('https://lvr.land.moi.gov.tw/','_blank'),
    openGoogle:() => { const l=document.getElementById('location').value||'台北'; window.open('https://www.google.com/search?q='+encodeURIComponent(l+' 不動產 實價登錄 房價 2025'),'_blank'); }
};

// ═══════════════════════════════════════
//  CADASTRAL LAND PLOTS MANAGEMENT (地籍圖管理系統)
// ═══════════════════════════════════════
const TAIWAN_DISTRICTS = {
    '臺北市': ['中正區', '萬華區', '大同區', '中山區', '松山區', '大安區', '信義區', '內湖區', '南港區', '士林區', '北投區', '文山區'],
    '新北市': ['板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區', '樹林區', '鶯歌區', '三峽區', '淡水區', '汐止區', '瑞芳區', '土城區', '蘆洲區', '五股區', '泰山區', '林口區', '深坑區', '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區', '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區'],
    '桃園市': ['桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區', '大溪區', '龍潭區', '大園區', '龜山區', '觀音區', '新屋區', '復興區'],
    '臺中市': ['中區', '東區', '南區', '西區', '北區', '北屯區', '西屯區', '南屯區', '太平區', '大里區', '霧峰區', '烏日區', '丰原區', '后里區', '石岡區', '東勢區', '和平區', '新社區', '潭子區', '大雅區', '神岡區', '大肚區', '沙鹿區', '龍井區', '梧棲區', '清水區', '大甲區', '外埔區', '大安區'],
    '臺南市': ['中西區', '東區', '南區', '北區', '安平區', '安南區', '永康區', '歸仁區', '新化區', '左鎮區', '玉井區', '楠西區', '南化區', '仁德區', '關廟區', '龍崎區', '官田區', '麻豆區', '佳里區', '西港區', '七股區', '將軍區', '學甲區', '北門區', '新營區', '後壁區', '白河區', '東山區', '六甲區', '下營區', '柳營區', '鹽水區', '善化區', '大內區', '山上區', '新市區', '安定區'],
    '高雄市': ['新興區', '前金區', '苓雅區', '鹽埕區', '鼓山區', '旗津區', '前鎮區', '三民區', '楠梓區', '小港區', '左營區', '仁武區', '大社區', '岡山區', '路竹區', '阿蓮區', '田寮區', '燕巢區', '橋頭區', '梓官區', '彌陀區', '永安區', '湖內區', '鳳山區', '大寮區', '林園區', '鳥松區', '大樹區', '旗山區', '美濃區', '六龜區', '內門區', '杉林區', '甲仙區', '桃源區', '那瑪夏區', '茂林區', '茄萣區'],
    '基隆市': ['仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區'],
    '新竹市': ['東區', '北區', '香山區'],
    '新竹縣': ['竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉', '寶山鄉', '橫山鄉', '北埔鄉', '峨眉鄉', '尖石鄉', '五峰鄉', '芎林鄉'],
    '苗栗縣': ['苗栗市', '頭份市', '竹南鎮', '後龍鎮', '通霄鎮', '苑裡鎮', '造橋鄉', '西湖鄉', '頭屋鄉', '公館鄉', '銅鑼鄉', '三義鄉', '大湖鄉', '獅潭鄉', '三灣鄉', '南庄鄉', '泰安鄉', '卓蘭鎮'],
    '彰化縣': ['彰化市', '員林市', '鹿港鎮', '和美鎮', '溪湖鎮', '田中鎮', '北斗鎮', '二林鎮', '線西鄉', '伸港鄉', '福興鄉', '秀水鄉', '花壇鄉', '芬園鄉', '大村鄉', '埔鹽鄉', '埔心鄉', '永靖鄉', '社頭鄉', '二水鄉', '田尾鄉', '埤頭鄉', '芳苑鄉', '大城鄉', '竹塘鄉', '溪州鄉'],
    '南投縣': ['南投市', '埔里鎮', '草屯鎮', '竹山鎮', '集集鎮', '名間鄉', '鹿谷鄉', '中寮鄉', '魚池鄉', '國姓鄉', '信義鄉', '仁愛鄉', '水里鄉'],
    '雲林縣': ['斗六市', '斗南鎮', '虎尾鎮', '西螺鎮', '土庫鎮', '北港鎮', '古坑鄉', '大埤鄉', '莿桐鄉', '林內鄉', '二崙鄉', '崙背鄉', '麥寮鄉', '東勢鄉', '褒忠鄉', '台西鄉', '元長鄉', '四湖鄉', '口湖鄉', '水林鄉'],
    '嘉義市': ['東區', '西區'],
    '嘉義縣': ['太保市', '朴子市', '布袋鎮', '大林鎮', '民雄鄉', '溪口鄉', '新港鄉', '六腳鄉', '東石鄉', '義竹鄉', '鹿草鄉', '水上鄉', '中埔鄉', '竹崎鄉', '梅山鄉', '番路鄉', '大埔鄉', '阿里山鄉'],
    '屏東縣': ['屏東市', '潮州鎮', '東港鎮', '恆春鎮', '萬丹鄉', '長治鄉', '麟洛鄉', '九如鄉', '里港鄉', '鹽埔鄉', '高樹鄉', '萬巒鄉', '內埔鄉', '竹田鄉', '新埤鄉', '枋寮鄉', '新園鄉', '崁頂鄉', '林邊鄉', '南州鄉', '佳冬鄉', '琉球鄉', '車城鄉', '滿州鄉', '枋山鄉', '三地門鄉', '霧台鄉', '瑪家鄉', '泰武鄉', '來義鄉', '春日鄉', '獅子鄉', '牡丹鄉'],
    '宜蘭縣': ['宜蘭市', '羅東鎮', '蘇澳鎮', '頭城鎮', '礁溪鄉', '壯圍鄉', '員山鄉', '冬山鄉', '五結鄉', '三星鄉', '大同鄉', '南澳鄉'],
    '花蓮縣': ['花蓮市', '鳳林鎮', '玉里鎮', '新城鄉', '吉安鄉', '壽豐鄉', '光復鄉', '豐濱鄉', '瑞穗鄉', '富里鄉', '秀林鄉', '萬榮鄉', '卓溪鄉'],
    '臺東縣': ['臺東市', '成功鎮', '關山鎮', '卑南鄉', '大武鄉', '太麻里鄉', '東河鄉', '長濱鄉', '鹿野鄉', '池上鄉', '綠島鄉', '延平鄉', '海端鄉', '達仁鄉', '金峰鄉', '蘭嶼鄉'],
    '澎湖縣': ['馬公市', '湖西鄉', '白沙鄉', '西嶼鄉', '望安鄉', '七美鄉'],
    '金門縣': ['金城鎮', '金湖鎮', '金沙鎮', '金寧鄉', '烈嶼鄉', '烏坵鄉'],
    '連江縣': ['南竿鄉', '北竿鄉', '莒光鄉', '東引鄉']
};

const CADASTRAL_SECTIONS = {
    '臺北市': {
        '中正區': ['介壽段', '公園段', '懷寧段', '城中段', '衡陽段', '寶慶段', '延平段', '撫順段', '武昌段', '中正段', '仁愛段', '信義段', '杭州段', '臨沂段', '忠孝段', '華山段', '成功段', '南海段', '新營段', '龍津段', '古亭段', '同安段', '螢雪段', '河邊段', '富水段', '板溪段'],
        '大安區': ['金華段', '大安段', '復興段', '仁愛段', '敦化段', '瑞安段', '和平段', '古風段', '龍坡段', '光武段', '建國段', '永康段'],
        '松山區': ['延吉段', '中崙段', '慈佑段', '敦化段', '民有段', '光復段', '精忠段', '三民段', '健康段', '民生段', '富錦段', '東榮段'],
        '信義區': ['中強段', '嘉仁段', '西村段', '虎林段', '廣德段', '景雲段', '吳興段', '道南段', '五常段', '景新段', '福德段', '崇孝段'],
        '中山區': ['江山段', '台灣段', '力行段', '聚安段', '中庄段', '朱厝崙段', '大稻埕段', '幸町段', '錦州段', '農林段', '龍江段', '酒泉段'],
        '萬華區': ['古亭段', '南機場段', '龍山段', '和平段', '青山段', '頂碩段', '西盛段', '太平段', '大理段', '雙園段', '中正段', '福星段'],
        '文山區': ['木柵段', '新光段', '光興段', '指南段', '樟新段', '坡內段', '公館段', '政大段', '仙岩段', '興邦段', '萬慶段', '福興段'],
        '南港區': ['東湖段', '玉成段', '中研段', '後山段', '四分段', '重陽段', '九如段', '六合段', '三重段', '葫蘆堵段'],
        '內湖區': ['大湖段', '碧湖段', '成功段', '石潭段', '港墘段', '東湖段', '金龍段', '內湖段', '潭美段', '西湖段'],
        '士林區': ['社子段', '葫蘆段', '舊街段', '社中段', '社北段', '蘭雅段', '天母段', '芝山段', '劍潭段', '溪山段'],
        '北投區': ['大南段', '北新段', '頂北投段', '石牌段', '建民段', '泉源段', '秀山段', '稻香段', '農場段', '唭哩岸段'],
    }
};

// Cache for NLSC fetched sections
let nlscFetchedSections = {};

const TAIWAN_COUNTY_CODES = {
    '臺北市': 'A', '台北市': 'A',
    '新北市': 'F',
    '桃園市': 'H', '桃園縣': 'H',
    '臺中市': 'B', '台中市': 'B',
    '臺南市': 'D', '台南市': 'D',
    '高雄市': 'E',
    '基隆市': 'C',
    '新竹市': 'O',
    '新竹縣': 'J',
    '苗栗縣': 'K',
    '彰化縣': 'N',
    '南投縣': 'M',
    '雲林縣': 'P',
    '嘉義市': 'I',
    '嘉義縣': 'Q',
    '屏東縣': 'T',
    '宜蘭縣': 'G',
    '花蓮縣': 'U',
    '臺東縣': 'V', '台東縣': 'V',
    '澎湖縣': 'X',
    '金門縣': 'W',
    '連江縣': 'Z'
};

// ─── 法規資料庫 ─────────────────────────────────────────────────────────────
// 結構：地方包依縣市分層，每個法規包含名稱、描述、適用分區、獎勵項目清單
const REGULATION_DB = {
    // 國家級通用（所有縣市共用，不在此重複，直接寫在 HTML 中）
    local: {
        '臺北市': [
            {
                id: 'tpe-tod',
                name: 'TOD 大眾運輸導向增額容積',
                shortName: 'TOD增額',
                desc: '臺北市土地使用分區管制自治條例第 80 條之 1',
                color: '#6366f1',
                zones: ['第一種商業區','第二種商業區','第三種商業區','第四種商業區',
                        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區'],
                items: [
                    { name: 'TOD增額容積', defaultPct: 20, max: 40, type: 'transfer' }
                ]
            },
            {
                id: 'tpe-renewal',
                name: '都市更新特點容積獎勵',
                shortName: '都更特點',
                desc: '臺北市都市更新自治條例、都更條例施行細則',
                color: '#f59e0b',
                zones: null, // null = 全分區適用
                items: [
                    { name: '都更獎勵', defaultPct: 50, max: 50, type: 'bonus' }
                ]
            },
            {
                id: 'tpe-hazard',
                name: '危老重建特點（臺北加成）',
                shortName: '危老特點',
                desc: '臺北市危老重建補助自治條例',
                color: '#ef4444',
                zones: null,
                items: [
                    { name: '危老容積獎勵', defaultPct: 40, max: 40, type: 'bonus' }
                ]
            },
            {
                id: 'tpe-design',
                name: '綜合設計容積放寬',
                shortName: '綜合設計',
                desc: '臺北市土地使用分區管制自治條例第 44 條',
                color: '#10b981',
                zones: ['第二種商業區','第三種商業區','第四種商業區',
                        '第二種住宅區','第三種住宅區','第四種住宅區'],
                items: [
                    { name: '綜合設計容積', defaultPct: 20, max: 30, type: 'bonus' }
                ]
            },
            {
                id: 'tpe-transfer',
                name: '容積移入（古蹟/保存）',
                shortName: '容積移入',
                desc: '都市計畫容積移轉實施辦法',
                color: '#8b5cf6',
                zones: null,
                items: [
                    { name: '容積移入', defaultPct: 0, max: 30, type: 'transfer' }
                ]
            }
        ],
        '新北市': [
            {
                id: 'ntpc-renewal106',
                name: '都更 106 專案容積獎勵',
                shortName: '都更106',
                desc: '新北市都市更新自治條例第 19 條',
                color: '#f59e0b',
                zones: null,
                items: [
                    { name: '都更獎勵', defaultPct: 50, max: 50, type: 'bonus' }
                ]
            },
            {
                id: 'ntpc-road',
                name: '臨路容積放寬',
                shortName: '臨路放寬',
                desc: '新北市土地使用分區管制自治條例',
                color: '#10b981',
                zones: ['第一種商業區','第二種商業區','第三種商業區'],
                items: [
                    { name: '臨路容積', defaultPct: 10, max: 20, type: 'bonus' }
                ]
            },
            {
                id: 'ntpc-hazard',
                name: '危老重建容積獎勵',
                shortName: '危老',
                desc: '危老條例',
                color: '#ef4444',
                zones: null,
                items: [
                    { name: '危老容積獎勵', defaultPct: 40, max: 40, type: 'bonus' }
                ]
            }
        ],
        '臺中市': [
            {
                id: 'txg-livable',
                name: '宜居建築免計容積獎勵',
                shortName: '宜居建築',
                desc: '臺中市宜居建築自治條例',
                color: '#10b981',
                zones: ['第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區'],
                items: [
                    { name: '宜居建築', defaultPct: 10, max: 15, type: 'bonus' }
                ]
            },
            {
                id: 'txg-renewal',
                name: '都市更新容積獎勵',
                shortName: '都更',
                desc: '都市更新條例',
                color: '#f59e0b',
                zones: null,
                items: [
                    { name: '都更獎勵', defaultPct: 50, max: 50, type: 'bonus' }
                ]
            }
        ],
        '高雄市': [
            {
                id: 'kh-renewal',
                name: '都市更新容積獎勵',
                shortName: '都更',
                desc: '都市更新條例 + 高市自治條例',
                color: '#f59e0b',
                zones: null,
                items: [
                    { name: '都更獎勵', defaultPct: 50, max: 50, type: 'bonus' }
                ]
            },
            {
                id: 'kh-hazard',
                name: '危老重建容積獎勵',
                shortName: '危老',
                desc: '危老條例',
                color: '#ef4444',
                zones: null,
                items: [
                    { name: '危老容積獎勵', defaultPct: 40, max: 40, type: 'bonus' }
                ]
            }
        ]
    }
};

// 套用法規建議獎勵到容積獎勵/移入列表
// 法規名稱 → FAR 選單選項的對照表
const REG_FAR_KEY_MAP = {
    // 獎勵 (bonus) - key 必須完全符合 FAR_BONUS_OPTIONS 的實際選項字串
    // FAR_BONUS_OPTIONS = ['都更獎勵','防災型都更','開放空間','智慧建築標章','綠建築標章','能效標章','耐震標章','無障礙標章','規模/時程','其它（手動填入）']
    '都市更新容積獎勵': { key: '都更獎勵',    type: 'bonus' },
    '危老重建容積獎勵': { key: '危老獎勵',    type: 'bonus',  customName: '危老重建容積獎勵' },
    '都更獎勵':         { key: '都更獎勵',    type: 'bonus' },
    '危老容積獎勵':     { key: '危老獎勵',    type: 'bonus',  customName: '危老容積獎勵' },
    '危老獎勵':         { key: '危老獎勵',    type: 'bonus' },
    'TOD增額容積':      { key: 'TOD增額',    type: 'transfer' },   // TOD 屬容積移入
    '綜合設計容積':     { key: '其它（手動填入）', type: 'bonus',    customName: '綜合設計容積放寬' },
    '宜居建築':         { key: '其它（手動填入）', type: 'bonus',    customName: '宜居建築免計容積' },
    '臨路容積':         { key: '其它（手動填入）', type: 'bonus',    customName: '臨路容積放寬' },
    // 移入 (transfer) - key 必須完全符合 FAR_TRANSFER_OPTIONS 的實際選項字串
    // FAR_TRANSFER_OPTIONS = ['古蹟','歷建','TOD增額','道移','代金','其它（手動填入）']
    '容積移入':         { key: '古蹟',    type: 'transfer' },
    'TOD增額':          { key: 'TOD增額', type: 'transfer' },
    '道路移入':         { key: '道移',    type: 'transfer' },
};

// 內嵌結果展開/收合
let lastLegalAnalysisText = null;

// ─── 土地使用分區靜態資料庫 ───────────────────────────────────────────────────
// 資料來源：都市計畫法施行細則、各縣市土地使用分區管制自治條例
// 依縣市類型提供對應的常見分區清單（實際以地號查詢為準）
const LAND_ZONE_DB = {
    // ── 直轄市 ──
    '臺北市': [
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區','第四種商業區',
        '甲種工業區','乙種工業區','零星工業區',
        '行政區','文教區','體育運動區','風景區','保存區','保護區','農業區',
        '停車場用地','公園用地','廣場用地','綠地','兒童遊樂場用地',
        '學校用地','機關用地','市場用地','醫療衛生用地','社會福利設施用地',
        '道路用地','河川用地','特定專用區'
    ],
    '新北市': [
        '第一種住宅區(新莊副都心)','第一種商業區(新莊副都心)','第二種商業區(新莊副都心)',
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區','第四種商業區',
        '甲種工業區','乙種工業區','特種工業區','零星工業區',
        '行政區','文教區','體育運動區','風景區','保存區','保護區','農業區',
        '公園用地','綠地','廣場用地','學校用地','機關用地','市場用地',
        '停車場用地','道路用地','河川用地','特定專用區'
    ],
    '桃園市': [
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區','丙種工業區','特種工業區','零星工業區',
        '行政區','文教區','體育運動區','風景區','保護區','農業區',
        '公園用地','綠地','廣場用地','學校用地','機關用地','市場用地',
        '停車場用地','道路用地','特定專用區'
    ],
    '臺中市': [
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區','第四種商業區',
        '甲種工業區','乙種工業區','特種工業區','零星工業區',
        '行政區','文教區','體育運動區','風景區','保存區','保護區','農業區',
        '公園用地','綠地','廣場用地','學校用地','機關用地','市場用地',
        '停車場用地','道路用地','河川用地','特定專用區'
    ],
    '臺南市': [
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區','特種工業區','零星工業區',
        '行政區','文教區','體育運動區','風景區','保存區','保護區','農業區',
        '公園用地','綠地','廣場用地','學校用地','機關用地','市場用地',
        '停車場用地','道路用地','特定專用區'
    ],
    '高雄市': [
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區','第四種商業區',
        '甲種工業區','乙種工業區','特種工業區','零星工業區',
        '行政區','文教區','體育運動區','風景區','保存區','保護區','農業區',
        '公園用地','綠地','廣場用地','學校用地','機關用地','市場用地',
        '停車場用地','道路用地','河川用地','特定專用區'
    ],
    // ── 省轄市/縣市 ──
    '基隆市': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '新竹市': [
        '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區','科學工業園區',
        '行政區','文教區','體育運動區','風景區','保護區','農業區',
        '公園用地','綠地','廣場用地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '嘉義市': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    // ── 縣 ──
    '新竹縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區','特種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '苗栗縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '彰化縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區','特種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '南投縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '雲林縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區','特種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '嘉義縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '屏東縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區','第三種商業區',
        '甲種工業區','乙種工業區','特種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '宜蘭縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '花蓮縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '臺東縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '澎湖縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '金門縣': [
        '第一種住宅區','第二種住宅區','第三種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區','乙種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ],
    '連江縣': [
        '第一種住宅區','第二種住宅區',
        '第一種商業區','第二種商業區',
        '甲種工業區',
        '行政區','文教區','風景區','保護區','農業區',
        '公園用地','綠地','學校用地','機關用地','停車場用地','道路用地','特定專用區'
    ]
};

// 通用分區（適用於未在資料庫中的縣市或作為後備）
const LAND_ZONE_DEFAULT = [
    '第一種住宅區','第二種住宅區','第三種住宅區','第四種住宅區',
    '第一種商業區','第二種商業區','第三種商業區','第四種商業區',
    '甲種工業區','乙種工業區','特種工業區','零星工業區',
    '行政區','文教區','體育運動區','風景區','保存區','保護區','農業區',
    '公園用地','綠地','廣場用地','學校用地','機關用地','市場用地',
    '停車場用地','道路用地','河川用地','特定專用區'
];

// 全國主要直轄市基準法定建蔽率與容積率資料庫
const CADASTRAL_ZONE_RULES = {
    '臺北市': {
        '第一種住宅區': { bcr: 30, far: 60, law: '臺北市土管自治條例第10條' },
        '第二種住宅區': { bcr: 35, far: 120, law: '臺北市土管自治條例第10條' },
        '第二之一種住宅區': { bcr: 35, far: 160, law: '臺北市土管自治條例第10條' },
        '第二之二種住宅區': { bcr: 35, far: 220, law: '臺北市土管自治條例第10條' },
        '第三種住宅區': { bcr: 45, far: 225, law: '臺北市土管自治條例第10條' },
        '第三之一種住宅區': { bcr: 45, far: 300, law: '臺北市土管自治條例第10條' },
        '第三之二種住宅區': { bcr: 45, far: 400, law: '臺北市土管自治條例第10條' },
        '第四種住宅區': { bcr: 50, far: 300, law: '臺北市土管自治條例第10條' },
        '第四之一種住宅區': { bcr: 50, far: 400, law: '臺北市土管自治條例第10條' },
        '第一種商業區': { bcr: 55, far: 360, law: '臺北市土管自治條例第10條' },
        '第二種商業區': { bcr: 65, far: 630, law: '臺北市土管自治條例第10條' },
        '第三種商業區': { bcr: 65, far: 560, law: '臺北市土管自治條例第10條' },
        '第四種商業區': { bcr: 75, far: 800, law: '臺北市土管自治條例第10條' },
        '甲種工業區': { bcr: 55, far: 240, law: '臺北市土管自治條例第10條' },
        '乙種工業區': { bcr: 60, far: 240, law: '臺北市土管自治條例第10條' },
        '行政區': { bcr: 35, far: 240, law: '臺北市土管自治條例第10條' },
        '文教區': { bcr: 40, far: 240, law: '臺北市土管自治條例第10條' },
        '體育運動區': { bcr: 40, far: 160, law: '臺北市土管自治條例第10條' },
        '風景區': { bcr: 15, far: 60, law: '臺北市土管自治條例第10條' },
        '保護區': { bcr: 15, far: 60, law: '臺北市土管自治條例第10條' },
        '農業區': { bcr: 15, far: 60, law: '臺北市土管自治條例第10條' },
        '特定專用區': { bcr: 40, far: 200, law: '個別細部計畫管制規定', isSpecial: true }
    },
    '新北市': {
        '第一種住宅區(新莊副都心)': { bcr: 50, far: 300, law: '新莊副都市中心細部計畫' },
        '第一種商業區(新莊副都心)': { bcr: 70, far: 425, law: '新莊副都市中心細部計畫' },
        '第二種商業區(新莊副都心)': { bcr: 70, far: 440, law: '新莊副都市中心細部計畫' },
        '第一種住宅區': { bcr: 30, far: 60, law: '新北市都市計畫細部計畫' },
        '第二種住宅區': { bcr: 50, far: 120, law: '新北市都市計畫細部計畫' },
        '第三種住宅區': { bcr: 50, far: 200, law: '新北市都市計畫細部計畫' },
        '第四種住宅區': { bcr: 50, far: 300, law: '新北市都市計畫細部計畫' },
        '住宅區': { bcr: 50, far: 200, law: '新北市土管自治條例第5條' },
        '第一種商業區': { bcr: 70, far: 280, law: '新北市都市計畫細部計畫' },
        '第二種商業區': { bcr: 70, far: 320, law: '新北市都市計畫細部計畫' },
        '第三種商業區': { bcr: 70, far: 440, law: '新北市都市計畫細部計畫' },
        '第四種商業區': { bcr: 80, far: 320, law: '新北市都市計畫細部計畫' },
        '商業區': { bcr: 70, far: 320, law: '新北市土管自治條例第5條' },
        '乙種工業區': { bcr: 60, far: 210, law: '新北市土管自治條例第5條' },
        '特定專用區': { bcr: 50, far: 200, law: '個別細部計畫管制規定', isSpecial: true }
    },
    '桃園市': {
        '第一種住宅區': { bcr: 50, far: 150, law: '都市計畫法桃園市施行細則' },
        '第二種住宅區': { bcr: 60, far: 200, law: '都市計畫法桃園市施行細則' },
        '第三種住宅區': { bcr: 50, far: 200, law: '都市計畫法桃園市施行細則' },
        '第四種住宅區': { bcr: 50, far: 300, law: '都市計畫法桃園市施行細則' },
        '住宅區': { bcr: 60, far: 200, law: '都市計畫法桃園市施行細則' },
        '第一種商業區': { bcr: 80, far: 280, law: '都市計畫法桃園市施行細則' },
        '第二種商業區': { bcr: 80, far: 320, law: '都市計畫法桃園市施行細則' },
        '第三種商業區': { bcr: 80, far: 380, law: '都市計畫法桃園市施行細則' },
        '商業區': { bcr: 80, far: 320, law: '都市計畫法桃園市施行細則' },
        '乙種工業區': { bcr: 60, far: 210, law: '都市計畫法桃園市施行細則' },
        '特定專用區': { bcr: 60, far: 200, law: '個別細部計畫管制規定', isSpecial: true }
    },
    '臺中市': {
        '第一種住宅區': { bcr: 50, far: 140, law: '都市計畫法臺中市施行細則' },
        '第二種住宅區': { bcr: 50, far: 220, law: '都市計畫法臺中市施行細則' },
        '第三種住宅區': { bcr: 55, far: 280, law: '都市計畫法臺中市施行細則' },
        '第四種住宅區': { bcr: 55, far: 320, law: '都市計畫法臺中市施行細則' },
        '住宅區': { bcr: 60, far: 200, law: '都市計畫法臺中市施行細則' },
        '第一種商業區': { bcr: 70, far: 280, law: '都市計畫法臺中市施行細則' },
        '第二種商業區': { bcr: 70, far: 350, law: '都市計畫法臺中市施行細則' },
        '第三種商業區': { bcr: 70, far: 420, law: '都市計畫法臺中市施行細則' },
        '第四種商業區': { bcr: 80, far: 500, law: '都市計畫法臺中市施行細則' },
        '商業區': { bcr: 70, far: 350, law: '都市計畫法臺中市施行細則' },
        '乙種工業區': { bcr: 60, far: 210, law: '都市計畫法臺中市施行細則' },
        '特定專用區': { bcr: 60, far: 200, law: '個別細部計畫管制規定', isSpecial: true }
    },
    '高雄市': {
        '第一種住宅區': { bcr: 30, far: 90, law: '都市計畫法高雄市施行細則' },
        '第二種住宅區': { bcr: 40, far: 120, law: '都市計畫法高雄市施行細則' },
        '第三種住宅區': { bcr: 50, far: 240, law: '都市計畫法高雄市施行細則' },
        '第四種住宅區': { bcr: 50, far: 300, law: '都市計畫法高雄市施行細則' },
        '第五種住宅區': { bcr: 60, far: 420, law: '都市計畫法高雄市施行細則' },
        '住宅區': { bcr: 50, far: 240, law: '都市計畫法高雄市施行細則' },
        '第一種商業區': { bcr: 70, far: 360, law: '都市計畫法高雄市施行細則' },
        '第二種商業區': { bcr: 70, far: 500, law: '都市計畫法高雄市施行細則' },
        '第三種商業區': { bcr: 70, far: 630, law: '都市計畫法高雄市施行細則' },
        '第四種商業區': { bcr: 80, far: 630, law: '都市計畫法高雄市施行細則' },
        '第五種商業區': { bcr: 80, far: 840, law: '都市計畫法高雄市施行細則' },
        '商業區': { bcr: 70, far: 500, law: '都市計畫法高雄市施行細則' },
        '乙種工業區': { bcr: 60, far: 210, law: '都市計畫法高雄市施行細則' },
        '特定專用區': { bcr: 60, far: 240, law: '個別細部計畫管制規定', isSpecial: true }
    }
};

// ─── 專案管理與方案比較核心函式 ───
const PROJECT_INPUT_IDS = [
    'c-buildingType', 'location', 'landArea', 'floorAreaRatio', 'buildingCoverageRatio',
    'saleFactor', 'avgPrice', 'adminRate', 'advisorRate', 'trustRate', 'salesRate', 'taxRate',
    'constructionCost', 'splitRatio', 'transferLandlordRatio', 'basementFloors',
    'excavationRate', 'refAnnouncementValue', 'cashWeight', 'todValuationParam',
    'parkingModeSelector', 'stdFloorModeSelector', 'c-constMonths', 'buildLoanRatio',
    'buildLoanYears', 'buildLoanInterest', 'landLoanRatio', 'landLoanYears',
    'landLoanInterest', 'm-soldRatio', 'm-parkingPrice', 'mechanicalParkingSelect',
    'case-res-name', 'case-res-area', 'case-res-total',
    'case-ret-name', 'case-ret-area', 'case-ret-total',
    'case-park-name', 'case-park-count', 'case-park-total',
    'projectNotesArea'
];

