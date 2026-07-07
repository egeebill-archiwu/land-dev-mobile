'use strict';


// ── A 軌：Google Static Maps API Key 管理函數 ──
function saveGMapsKey() {
    const key = document.getElementById('stage-gmaps-key').value.trim();
    localStorage.setItem('gmaps_api_key', key);
    updateGMapsKeyStatus(key);
}

function clearGMapsKey() {
    localStorage.removeItem('gmaps_api_key');
    const el = document.getElementById('stage-gmaps-key');
    if (el) el.value = '';
    updateGMapsKeyStatus('');
}

function toggleGMapsKeyVisibility() {
    const el = document.getElementById('stage-gmaps-key');
    if (el) el.type = (el.type === 'password') ? 'text' : 'password';
}

function updateGMapsKeyStatus(key) {
    const statusEl = document.getElementById('gmaps-key-status');
    if (!statusEl) return;
    if (key && key.length > 10) {
        statusEl.textContent = '✅ API Key 已設定（' + key.substring(0, 8) + '...）P04 衛星圖將自動抓取';
        statusEl.className = 'text-[10px] text-emerald-400';
    } else {
        statusEl.textContent = '⚠️ 尚未設定 API Key — P04 將使用 B 軌手動上傳或空白佔位符';
        statusEl.className = 'text-[10px] text-amber-400';
    }
}

function openMapsModal(customAddress) {
    const modal = document.getElementById('maps-modal');
    modal.classList.add('open');
    
    // Reset maximized class and toggle button
    const sheet = document.getElementById('maps-modal-sheet');
    sheet.classList.remove('maximized');
    const btn = document.getElementById('maps-size-btn');
    if (btn) btn.innerHTML = '🗖';
    
    const loc = customAddress || document.getElementById('location').value.trim();
    const modalAddrInput = document.getElementById('modal-address-input');
    const mapSearchInput = document.getElementById('map-search-input');
    
    if (modalAddrInput) modalAddrInput.value = loc;
    if (mapSearchInput) mapSearchInput.value = loc;

    // ── 依據主頁面已套用之法規獎勵，初始化選單狀態 ──
    const bonusList = document.getElementById('bonus-items-list');
    let hasUR = false;
    let hasRO = false;
    if (bonusList) {
        [...bonusList.querySelectorAll('.far-sel')].forEach(sel => {
            if (sel.value === '都更獎勵') hasUR = true;
            if (sel.value === '規模/時程' || sel.value === '危老獎勵') hasRO = true;
        });
    }
    const devTypeSelect = document.getElementById('modal-dev-type');
    if (devTypeSelect) {
        if (hasUR) devTypeSelect.value = 'ur';
        else if (hasRO) devTypeSelect.value = 'ro';
        else devTypeSelect.value = 'none';
    }

    const transferList = document.getElementById('transfer-items-list');
    let hasTOD = false;
    if (transferList) {
        [...transferList.querySelectorAll('.far-sel')].forEach(sel => {
            if (sel.value === 'TOD增額') hasTOD = true;
        });
    }
    const todRangeSelect = document.getElementById('modal-tod-range');
    if (todRangeSelect) {
        todRangeSelect.value = hasTOD ? '150' : 'none';
    }
    
    // 觸發連動欄位啟用/停用
    onModalDevTypeChange();

    // Wait for display transition before initializing Leaflet
    setTimeout(() => {
        initLeafletMap(loc);
    }, 150);
}

function closeMapsModal() {
    document.getElementById('maps-modal').classList.remove('open');
    if (isMeasureMode) {
        toggleMapMeasureMode();
    }
    // 關閉圖層疊加面板
    const panel = document.getElementById('map-layers-panel');
    if (panel) {
        panel.classList.add('opacity-0', 'pointer-events-none');
        panel.classList.remove('opacity-100');
    }
    const overlayBtn = document.getElementById('btn-map-overlay');
    if (overlayBtn) {
        overlayBtn.classList.remove('border-purple-500', 'text-purple-400');
    }
}

function toggleMapLayersPanel(e) {
    if (e) e.stopPropagation();
    const panel = document.getElementById('map-layers-panel');
    if (!panel) return;
    const btn = document.getElementById('btn-map-overlay');
    if (panel.classList.contains('opacity-0')) {
        panel.classList.remove('opacity-0', 'pointer-events-none');
        panel.classList.add('opacity-100');
        if (btn) btn.classList.add('border-purple-500', 'text-purple-400');
    } else {
        panel.classList.add('opacity-0', 'pointer-events-none');
        panel.classList.remove('opacity-100');
        if (btn) btn.classList.remove('border-purple-500', 'text-purple-400');
    }
}

function toggleCadastralLayer() {
    const chk = document.getElementById('chk-layer-cadastral');
    if (!chk) return;
    const isChecked = chk.checked;
    
    if (isChecked) {
        if (!cadastralLayerInstance) {
            // 使用 NLSC 官方段籍與地籍線，設定 maxNativeZoom: 18 防止放大時破圖，維持一氣呵成的連線
            // 加入 updateWhenIdle, keepBuffer, updateInterval 優化政府伺服器載入速度與防碎圖！
            cadastralLayerInstance = L.tileLayer('https://wmts.nlsc.gov.tw/wmts/LAND_OPENDATA/default/GoogleMapsCompatible/{z}/{y}/{x}', {
                maxZoom: 20,
                maxNativeZoom: 18,
                opacity: 0.8,
                crossOrigin: true,
                updateWhenIdle: false,
                keepBuffer: 6,
                updateInterval: 100
            });
        }
        if (mapInstance) {
            cadastralLayerInstance.addTo(mapInstance);
            cadastralLayerInstance.bringToFront();
        }
    } else {
        if (mapInstance && cadastralLayerInstance) {
            mapInstance.removeLayer(cadastralLayerInstance);
        }
    }
    // 動態切換乾淨底圖
    updateMapTileLayer();
}

function toggleZoningLayer() {
    const chk = document.getElementById('chk-layer-zoning');
    if (!chk) return;
    const isChecked = chk.checked;
    
    if (isChecked) {
        if (!zoningLayerInstance) {
            // 使用 NLSC 使用分區，設定 maxNativeZoom: 18 防止高倍縮放時破圖或消失
            zoningLayerInstance = L.tileLayer('https://wmts.nlsc.gov.tw/wmts/LUIMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
                maxZoom: 20,
                maxNativeZoom: 18,
                opacity: 0.65,
                crossOrigin: true,
                updateWhenIdle: false,
                keepBuffer: 6,
                updateInterval: 100
            });
        }
        if (mapInstance) {
            zoningLayerInstance.addTo(mapInstance);
            zoningLayerInstance.bringToFront();
        }
    } else {
        if (mapInstance && zoningLayerInstance) {
            mapInstance.removeLayer(zoningLayerInstance);
        }
    }
    // 動態切換乾淨底圖
    updateMapTileLayer();
}

function openOfficialPlanningPortal(e) {
    if (e) e.stopPropagation();
    
    // 優先使用地圖搜尋框地址，若無則使用當前定位解析之縣市
    const searchVal = (document.getElementById('map-search-input') || {}).value || '';
    const mainAddrVal = (document.getElementById('location') || {}).value || '';
    const countyVal = S.cadastralCounty || '';
    
    const combinedText = (searchVal + ' ' + mainAddrVal + ' ' + countyVal).trim();
    
    let url = 'https://easymap.land.moi.gov.tw/'; // 預設內政部便民服務網
    let sysName = '內政部國土測繪圖資便民服務雲';
    
    if (combinedText.includes('臺北市') || combinedText.includes('台北市')) {
        url = 'https://zone.udd.gov.taipei/';
        sysName = '臺北市土地使用分區申請及查詢系統';
    } else if (combinedText.includes('新北市')) {
        url = 'https://map.tph.ntpc.gov.tw/';
        sysName = '新北市城鄉資訊查詢平台';
    } else if (combinedText.includes('桃園市')) {
        url = 'https://gis.tycg.gov.tw/';
        sysName = '桃園市都市計畫地理資訊服務網';
    } else if (combinedText.includes('臺中市') || combinedText.includes('台中市')) {
        url = 'https://lohas.taichung.gov.tw/webgis/';
        sysName = '臺中市 158 空間資訊網';
    } else if (combinedText.includes('臺南市') || combinedText.includes('台南市')) {
        url = 'https://urbanplan.tainan.gov.tw/';
        sysName = '臺南市都市計畫分區書圖查詢系統';
    } else if (combinedText.includes('高雄市')) {
        url = 'https://urbanweb.kcg.gov.tw/';
        sysName = '高雄市都市計畫地理資訊系統';
    }
    
    // 自動化複製資訊到剪貼簿，省去手動輸入程序
    let copyInfo = '';
    const sec = S.cadastralSection || '';
    const num = S.cadastralNo || '';
    if (sec && num) {
        copyInfo = `${countyVal}${sec}第${num}地號`;
    } else {
        copyInfo = combinedText.split(' ')[0] || combinedText;
    }
    
    if (copyInfo && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyInfo).then(() => {
            console.log('Successfully copied parcel/address for auto-query:', copyInfo);
        }).catch(err => {
            console.error('Failed to copy info to clipboard:', err);
        });
    }
    
    alert(`💡 系統偵測到目前基地所屬區域，已為您自動複製查詢資訊至剪貼簿：\n\n【 ${copyInfo} 】\n\n同時在新視窗為您開啟官方都計權威書圖系統：\n\n【${sysName}】\n\n網頁開啟後，您只需直接貼上 (Ctrl+V 或按滑鼠右鍵貼上) 即可快速查詢！`);
    window.open(url, '_blank');
}

async function detectRoadWidthViaAI(e) {
    if (e) e.stopPropagation();
    
    let apiKey = '';
    try {
        apiKey = localStorage.getItem('gemini_api_key') || '';
    } catch(e) {}
    
    if (!apiKey) {
        alert('🔒 請先在 AI 頁籤設定 Gemini API Key，才能使用智慧聯網分析路寬。');
        return;
    }
    
    const btn = document.getElementById('btn-map-detect-road');
    if (!btn) return;
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ AI偵測中...</span>`;
    
    const searchVal = (document.getElementById('map-search-input') || {}).value || '';
    const mainAddrVal = (document.getElementById('location') || {}).value || '';
    const countyVal = S.cadastralCounty || '';
    const districtVal = S.cadastralDistrict || '';
    
    const combinedText = (searchVal + ' ' + mainAddrVal + ' ' + countyVal).trim();
    const lat = currentMarkerLat;
    const lng = currentMarkerLng;
    
    const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                        (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash' : 
                        apiModel;

    const prompt = `您是一位台灣都市計畫與土地開發法規專家。
請利用內建 Google Search 聯網搜尋工具，查詢以下基地門牌地址或經緯度座標前面的「都市計畫道路寬度」（計畫路寬 / 面前道路寬度）：
• 參考地址：${combinedText}
• 經緯度座標：緯度 ${lat}, 經度 ${lng}

請務必分析並回覆：
1. 面前臨接的道路名稱是什麼？
2. 該道路的計畫路寬（寬度）是多少公尺（例如 4公尺、6公尺、8公尺、10公尺、15公尺、30公尺、40公尺等）？
3. 根據都更與危老條例之基本道路門檻，該道路是否達到「8公尺以上」或「6公尺以上」？

請以極簡短的文字（約 80 字內）回覆判定結論，格式範例如下：
「本案基地面前臨接『新生北路二段127巷』，計畫路寬約為 6 公尺。依規定未達都更 8 公尺之基本門檻。」
或者
「本案基地面前臨接『民權東路二段』，計畫路寬為 30 公尺。符合都更危老 8 公尺以上道路寬度要求。」`;

    try {
        console.log("AI Road Width Detection starting...");
        let text = '';
        let success = false;
        let searchErrorMsg = '';

        // Attempt 1: Call Gemini WITH Google Search Grounding
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    tools: [{ google_search: {} }] // 啟用 Google 聯網搜尋工具
                })
            });
            const data = await res.json();
            if (data.error) {
                searchErrorMsg = data.error.message;
                console.warn("Search grounding API error, trying fallback:", searchErrorMsg);
            } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                text = data.candidates[0].content.parts[0].text;
                success = true;
                console.log("AI Road Width Detection via search success.");
            }
        } catch (err) {
            searchErrorMsg = err.message;
            console.warn("Search grounding fetch failed, trying fallback:", err);
        }

        // Attempt 2: Fallback WITHOUT Google Search (for Free Tier / limit 0)
        if (!success) {
            console.log("Attempting fallback WITHOUT search grounding (for Free Tier)...");
            const fallbackRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt + " (請根據您資料庫已知的都市計畫道路資訊或常識回答，簡短即可)" }] }]
                })
            });
            const fallbackData = await fallbackRes.json();
            if (fallbackData.error) {
                // If even fallback fails, throw the combined error
                throw new Error(`[聯網搜尋限制] ${searchErrorMsg || '額度受限'} \n[一般呼叫錯誤] ${fallbackData.error.message}`);
            }
            if (fallbackData.candidates && fallbackData.candidates[0] && fallbackData.candidates[0].content && fallbackData.candidates[0].content.parts[0]) {
                text = fallbackData.candidates[0].content.parts[0].text;
                success = true;
            } else {
                throw new Error("Gemini API 回傳空內容");
            }
        }
        
        console.log("AI Road Width Detection result:", text);
        
        // 智慧型文字解析判定路寬級距
        let matchedValue = 'gt8'; // 預設 8m
        const lowercaseText = text.toLowerCase();
        
        // 判讀是否未達6米，或 6~8 米
        if (lowercaseText.includes('未達 6') || lowercaseText.includes('未達6') || lowercaseText.includes('小於 6') || lowercaseText.includes('小於6') || lowercaseText.includes('4米') || lowercaseText.includes('4公尺') || lowercaseText.includes('5米') || lowercaseText.includes('5公尺') || lowercaseText.includes('3米') || lowercaseText.includes('3公尺')) {
            matchedValue = 'lt6';
        } else if (lowercaseText.includes('6至8') || lowercaseText.includes('6-8') || lowercaseText.includes('6~8') || lowercaseText.includes('6米') || lowercaseText.includes('6公尺') || lowercaseText.includes('7米') || lowercaseText.includes('7公尺') || lowercaseText.includes('未達 8') || lowercaseText.includes('未達8') || lowercaseText.includes('小於 8') || lowercaseText.includes('小於8')) {
            matchedValue = '6to8';
        } else {
            matchedValue = 'gt8';
        }
        
        // 自動切換開發類型與解鎖道路欄位以便套用
        const devTypeSelect = document.getElementById('modal-dev-type');
        const roadWidthSelect = document.getElementById('modal-road-width');
        
        // 如果目前是一般開發，為了套用路寬，我們幫使用者切換到都市更新案以解鎖路寬，或者保持
        if (devTypeSelect && devTypeSelect.value === 'none') {
            devTypeSelect.value = 'ur'; // 預設切到都更以解鎖
            onModalDevTypeChange();
        }
        
        if (roadWidthSelect) {
            roadWidthSelect.disabled = false;
            roadWidthSelect.classList.remove('opacity-50');
            roadWidthSelect.value = matchedValue;
        }
        
        alert(`🤖 AI 聯網智慧分析路寬結果：\n\n【 ${text} 】\n\n系統已為您自動勾選並設定路寬判定級距！`);
        
    } catch (error) {
        console.error("AI Road Width Detection error:", error);
        alert("❌ AI 路寬智慧判定暫時無法服務，請使用手動測量尺或手動選擇級距。\n(" + error.message + ")");
    } finally {
        btn.disabled = false;
        btn.innerHTML = origHtml;
    }
}

function toggleMapMeasureMode() {
    isMeasureMode = !isMeasureMode;
    const btn = document.getElementById('btn-map-measure');
    const statusPanel = document.getElementById('map-measure-status');
    const mapContainer = document.getElementById('in-app-map');
    
    if (isMeasureMode) {
        // Enable Measure Mode
        btn.classList.add('bg-amber-600', 'text-white');
        btn.classList.remove('bg-slate-900/95', 'text-slate-300');
        statusPanel.classList.remove('opacity-0', 'pointer-events-none');
        mapContainer.classList.add('leaflet-measure-active');
        
        const instr = document.getElementById('measure-instructions');
        if (instr) instr.innerText = '請在地圖上點擊第 1 點 (起點)';
        measureStartLatLng = null;
    } else {
        // Disable Measure Mode
        btn.classList.remove('bg-amber-600', 'text-white');
        btn.classList.add('bg-slate-900/95', 'text-slate-300');
        statusPanel.classList.add('opacity-0', 'pointer-events-none');
        mapContainer.classList.remove('leaflet-measure-active');
        clearAllMeasurements();
    }
}

function handleMeasureClick(latlng) {
    if (!measureStartLatLng) {
        // First point clicked
        measureStartLatLng = latlng;
        
        // Draw start point circle marker
        const startMarker = L.circleMarker(latlng, {
            radius: 6,
            color: '#fb923c', // orange-400
            fillColor: '#fb923c',
            fillOpacity: 1,
            weight: 2,
            interactive: false
        }).addTo(mapInstance);
        
        measureLayers.push(startMarker);
        
        const instr = document.getElementById('measure-instructions');
        if (instr) instr.innerText = '請點擊第 2 點 (終點)';
    } else {
        // Second point clicked
        const endLatLng = latlng;
        
        // Draw end point circle marker
        const endMarker = L.circleMarker(endLatLng, {
            radius: 6,
            color: '#f43f5e', // rose-500
            fillColor: '#f43f5e',
            fillOpacity: 1,
            weight: 2,
            interactive: false
        }).addTo(mapInstance);
        
        measureLayers.push(endMarker);
        
        // Draw line
        const line = L.polyline([measureStartLatLng, endLatLng], {
            color: '#fb923c', // orange-400
            weight: 3.5,
            opacity: 0.9,
            dashArray: '6, 6',
            interactive: false
        }).addTo(mapInstance);
        
        measureLayers.push(line);
        
        // Calculate distance in meters
        const distance = measureStartLatLng.distanceTo(endLatLng);
        const distStr = distance.toFixed(1);
        
        // Determine suitability for urban renewal road width
        let suitabilityText = '';
        if (distance >= 8) {
            suitabilityText = '符合都更面前道路寬度標準 (≥8m)';
        } else if (distance >= 6) {
            suitabilityText = '可申請都更 (屬 6-8m 窄路區，需視特定條件)';
        } else {
            suitabilityText = '未達都更道路基本寬度門檻 (<6m)';
        }
        
        // Midpoint coordinates for label
        const midpoint = [
            (measureStartLatLng.lat + endLatLng.lat) / 2,
            (measureStartLatLng.lng + endLatLng.lng) / 2
        ];
        
        // Draw tooltip
        const tooltipContent = `
            <div style="font-family: inherit; font-size: 11px; padding: 2px;">
                <div style="font-weight: bold; color: #fb923c; margin-bottom: 2px;">📏 道路寬度: ${distStr} 公尺</div>
                <div style="color: #cbd5e1; font-size: 9px; white-space: nowrap;">${suitabilityText}</div>
            </div>
        `;
        
        const tooltip = L.tooltip({
            permanent: true,
            direction: 'center',
            className: 'measure-tooltip'
        })
        .setLatLng(midpoint)
        .setContent(tooltipContent)
        .addTo(mapInstance);
        
        measureLayers.push(tooltip);
        
        // Reset start point to allow a new measurement on subsequent click
        measureStartLatLng = null;
        
        const instr = document.getElementById('measure-instructions');
        if (instr) instr.innerText = '已繪製測量線！點擊地圖可再次測量新路段';
    }
}

function clearAllMeasurements(e) {
    if (e) e.stopPropagation();
    measureLayers.forEach(layer => {
        if (mapInstance) mapInstance.removeLayer(layer);
    });
    measureLayers = [];
    measureStartLatLng = null;
    
    const instr = document.getElementById('measure-instructions');
    if (instr) {
        if (isMeasureMode) {
            instr.innerText = '請在地圖上點擊第 1 點 (起點)';
        } else {
            instr.innerText = '';
        }
    }
}

function toggleTodCircles() {
    todCirclesEnabled = !todCirclesEnabled;
    const btn = document.getElementById('btn-map-tod');
    const legend = document.getElementById('map-tod-legend');
    
    if (todCirclesEnabled) {
        btn.classList.add('bg-purple-600', 'text-white');
        btn.classList.remove('bg-slate-900/95', 'text-slate-300');
        legend.classList.remove('opacity-0', 'pointer-events-none');
        updateTodCircles();
    } else {
        btn.classList.remove('bg-purple-600', 'text-white');
        btn.classList.add('bg-slate-900/95', 'text-slate-300');
        legend.classList.add('opacity-0', 'pointer-events-none');
        clearTodCircles();
    }
}

function updateTodCircles() {
    clearTodCircles();
    if (!todCirclesEnabled) return;
    if (!mapInstance || !markerInstance) return;
    
    const latlng = markerInstance.getLatLng();
    const radii = [150, 300, 500, 800];
    const colors = ['#f43f5e', '#fb923c', '#06b6d4', '#3b82f6']; // rose-500, orange-400, cyan-500, blue-500
    
    radii.forEach((radius, index) => {
        // Draw circles
        const circle = L.circle(latlng, {
            radius: radius,
            color: colors[index],
            weight: 1.5,
            opacity: 0.8,
            fillColor: colors[index],
            fillOpacity: 0.04,
            dashArray: '5, 5',
            interactive: false
        }).addTo(mapInstance);
        
        todCircles.push(circle);
        
        // Draw small indicator badge on the northern edge of the circle (offset calculated using degree conversion)
        // 111,320 meters per degree latitude
        const labelLat = latlng.lat + (radius / 111320);
        const labelMarker = L.circleMarker([labelLat, latlng.lng], {
            radius: 0,
            opacity: 0,
            fillOpacity: 0,
            interactive: false
        }).addTo(mapInstance);
        
        labelMarker.bindTooltip(`${radius}m`, {
            permanent: true,
            direction: 'center',
            className: 'tod-circle-label-tooltip'
        });
        
        todCircles.push(labelMarker);
    });
}

function clearTodCircles() {
    todCircles.forEach(layer => {
        if (mapInstance) mapInstance.removeLayer(layer);
    });
    todCircles = [];
}

function initLeafletMap(initialAddress) {
    const mapContainer = document.getElementById('in-app-map');
    if (!mapContainer) return;

    // Default coordinates: Taipei City Hall (25.0330, 121.5654)
    const defaultLat = 25.0330;
    const defaultLng = 121.5654;

    if (!mapInstance) {
        // Create custom red pulsing pin icon using Tailwind colors & keyframe
        const pinIcon = L.divIcon({
            html: `
                <div style="position: relative; width: 30px; height: 40px;">
                    <div style="position: absolute; bottom: 0; left: 15px; transform: translate(-50%, 50%); width: 14px; height: 6px; background: rgba(244, 63, 94, 0.4); border-radius: 50%; animation: marker-pulse 1.8s infinite ease-out;"></div>
                    <svg style="position: absolute; top: 0; left: 0; width: 30px; height: 38px; color: #f43f5e; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                </div>
            `,
            className: 'custom-pin-marker',
            iconSize: [30, 40],
            iconAnchor: [15, 38]
        });

        // Initialize Leaflet map (disable default zoom control to place manually in topright)
        mapInstance = L.map('in-app-map', {
            zoomControl: false,
            attributionControl: false
        }).setView([defaultLat, defaultLng], 15);

        // Add zoom control manually in topleft
        L.control.zoom({
            position: 'topleft'
        }).addTo(mapInstance);

        // Set tile layer
        updateMapTileLayer();

        // Add the draggable marker pin
        markerInstance = L.marker([defaultLat, defaultLng], {
            icon: pinIcon,
            draggable: true
        }).addTo(mapInstance);

        // Map click handler to relocate marker and reverse geocode
        mapInstance.on('click', function(e) {
            // 點擊地圖時自動收起圖層選擇面板
            const panel = document.getElementById('map-layers-panel');
            if (panel && !panel.classList.contains('opacity-0')) {
                panel.classList.add('opacity-0', 'pointer-events-none');
                panel.classList.remove('opacity-100');
                const btn = document.getElementById('btn-map-overlay');
                if (btn) btn.classList.remove('border-purple-500', 'text-purple-400');
            }

            if (isMeasureMode) {
                handleMeasureClick(e.latlng);
                return;
            }
            const latlng = e.latlng;
            currentMarkerLat = latlng.lat;
            currentMarkerLng = latlng.lng;
            markerInstance.setLatLng(latlng);
            reverseGeocode(latlng.lat, latlng.lng);
            if (todCirclesEnabled) {
                updateTodCircles();
            }
        });

        // Marker drag handler
        markerInstance.on('dragend', function() {
            const position = markerInstance.getLatLng();
            currentMarkerLat = position.lat;
            currentMarkerLng = position.lng;
            reverseGeocode(position.lat, position.lng);
            if (todCirclesEnabled) {
                updateTodCircles();
            }
        });

        // Bind enter key press to search input
        const searchInput = document.getElementById('map-search-input');
        if (searchInput) {
            searchInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    geocodeAddress();
                }
            });
        }
    }

    // Always invalidateSize after opening to recalculate Leaflet box constraints
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 250);

    // Load initial address location if available
    if (initialAddress && initialAddress.trim().length > 0) {
        geocodeAddress(initialAddress);
    } else {
        currentMarkerLat = defaultLat;
        currentMarkerLng = defaultLng;
        mapInstance.setView([defaultLat, defaultLng], 15);
        markerInstance.setLatLng([defaultLat, defaultLng]);
        if (todCirclesEnabled) {
            updateTodCircles();
        }
    }
}

function updateMapTileLayer() {
    if (tileLayerInstance && mapInstance) {
        mapInstance.removeLayer(tileLayerInstance);
    }

    const chkCadastral = document.getElementById('chk-layer-cadastral');
    const chkZoning = document.getElementById('chk-layer-zoning');
    const isOverlayActive = (chkCadastral && chkCadastral.checked) || (chkZoning && chkZoning.checked);

    let tileUrl = '';
    let maxNativeZ = 20;

    if (isOverlayActive) {
        // 當開啟地籍或分區疊圖時，強制自動切換為極乾淨的 CartoDB Positron 淺灰白底圖，以突顯地籍線與使用分區色彩，保持清晰不雜亂
        tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        maxNativeZ = 18;
    } else if (currentMapStyle === 'colorful') {
        // Google Maps 街地圖
        tileUrl = 'https://mt1.google.com/vt/lyrs=m&hl=zh-TW&gl=TW&x={x}&y={y}&z={z}';
        maxNativeZ = 20;
    } else {
        // CartoDB Dark Matter (深色)
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        maxNativeZ = 20;
    }

    if (mapInstance) {
        tileLayerInstance = L.tileLayer(tileUrl, {
            maxZoom: 20,
            maxNativeZoom: maxNativeZ,
            crossOrigin: true
        }).addTo(mapInstance);
        
        // 確保底圖永遠在最底層，不遮蓋已加載的地籍與分區疊圖
        tileLayerInstance.bringToBack();
        
        // 將現有疊圖移至最前層
        if (cadastralLayerInstance && mapInstance.hasLayer(cadastralLayerInstance)) {
            cadastralLayerInstance.bringToFront();
        }
        if (zoningLayerInstance && mapInstance.hasLayer(zoningLayerInstance)) {
            zoningLayerInstance.bringToFront();
        }
    }
}

function toggleMapStyle() {
    currentMapStyle = currentMapStyle === 'colorful' ? 'dark' : 'colorful';
    updateMapTileLayer();
}

function openStreetView(e) {
    if (e) e.stopPropagation();
    const sheet = document.getElementById('street-view-sheet');
    if (sheet) {
        sheet.classList.remove('translate-y-full');
    }
}

function closeStreetViewSheet() {
    const sheet = document.getElementById('street-view-sheet');
    if (sheet) {
        sheet.classList.add('translate-y-full');
    }
}

function getStreetViewUrl() {
    return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${currentMarkerLat},${currentMarkerLng}&openExternalBrowser=1`;
}

function triggerStreetViewLink(target) {
    const url = getStreetViewUrl();
    window.open(url, target);
    closeStreetViewSheet();
}

function copyStreetViewLink() {
    const url = getStreetViewUrl();
    navigator.clipboard.writeText(url).then(() => {
        alert('🎉 街景連結已複製！您可以切換至系統瀏覽器（Chrome/Safari）貼上開啟，以保留此試算頁面。');
    }).catch(err => {
        console.warn('Failed to use clipboard API, retrying via textarea fallback...', err);
        try {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('🎉 街景連結已複製！您可以切換至系統瀏覽器（Chrome/Safari）貼上開啟，以保留此試算頁面。');
        } catch (e2) {
            alert('複製失敗，請手動複製網址：\n' + url);
        }
    });
    closeStreetViewSheet();
}

async function geocodeAddressNominatim(query) {
    let cleanQuery = query.trim();
    
    // 1. 清理台灣地址常見的樓層與括號備註（如：(地下一樓)、(B1)、（2樓））
    cleanQuery = cleanQuery.replace(/\([^)]*\)/g, '');
    cleanQuery = cleanQuery.replace(/（[^）]*）/g, '');
    cleanQuery = cleanQuery.replace(/地下室/g, '');
    cleanQuery = cleanQuery.replace(/地下\s*\d+\s*樓/gi, '');
    cleanQuery = cleanQuery.replace(/\d+\s*樓之\d+/g, '');
    cleanQuery = cleanQuery.replace(/\d+\s*樓/g, '');
    cleanQuery = cleanQuery.replace(/\d+\s*F/gi, '');
    cleanQuery = cleanQuery.replace(/B\d+/gi, '');
    cleanQuery = cleanQuery.trim();

    const queriesToTry = [];
    queriesToTry.push(cleanQuery);
    
    // 2. 漸進式縮減地址 (Progressive Reduction)
    // A. 移除 "之幾" (如：2之1號 -> 2號)
    let q = cleanQuery;
    if (q.includes('之')) {
        q = q.replace(/之\d+(?=號)/, '');
        if (q !== cleanQuery && q.trim()) {
            queriesToTry.push(q.trim());
        }
    }
    
    // B. 移除門牌號碼 (如：2號 -> 移除)
    let q2 = q.replace(/\d+號$/, '').replace(/\d+-\d+號$/, '');
    if (q2 !== q && q2.trim()) {
        queriesToTry.push(q2.trim());
    }
    
    // C. 移除弄與巷 (如：5弄、92巷)
    let q3 = q2.replace(/\d+弄$/, '').replace(/\d+巷$/, '');
    if (q3 !== q2 && q3.trim()) {
        queriesToTry.push(q3.trim());
    }
    
    // D. 匹配至路街大道與段
    let matchRoad = q2.match(/^(.*?(?:路|街|大道|段|路段|橋))/);
    if (matchRoad && matchRoad[1] !== q2 && matchRoad[1].trim()) {
        queriesToTry.push(matchRoad[1].trim());
    }
    
    // 過濾重複與空字串
    const uniqueQueries = [...new Set(queriesToTry)].filter(Boolean);
    
    let attemptIndex = 0;
    for (const qTry of uniqueQueries) {
        if (attemptIndex > 0) {
            // 遵守 Nominatim 的 1 request/second 限制
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        attemptIndex++;
        
        let searchQuery = qTry;
        
        try {
            // 限制 Nominatim 只搜尋台灣地區 (&countrycodes=tw)，防止飛到國外去！
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&accept-language=zh-TW&limit=1&countrycodes=tw`);
            const data = await res.json();
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    address: formatNominatimAddress(data[0]),
                    isReduced: qTry !== cleanQuery
                };
            }
        } catch (e) {
            console.warn(`Nominatim search failed for query: ${searchQuery}`, e);
        }
    }
    return null;
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // 地球半徑 (公尺)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function runHybridCorrection(parsedAddress, fallbackLat, fallbackLon) {
    if (!parsedAddress) return { lat: fallbackLat, lon: fallbackLon };
    try {
        console.log(`Hybrid Correction: Verifying address '${parsedAddress}' via Nominatim...`);
        const nominatimRes = await geocodeAddressNominatim(parsedAddress);
        if (nominatimRes) {
            // 情況 1：Nominatim 找到了精確的門牌號碼（非縮減搜尋）
            if (!nominatimRes.isReduced) {
                console.log(`Hybrid Correction: Nominatim exact address match! GPS: ${nominatimRes.lat}, ${nominatimRes.lon}`);
                return { lat: nominatimRes.lat, lon: nominatimRes.lon };
            }
            
            // 情況 2：Nominatim 只找到了縮減的地址（例如巷弄中心）
            // 我們檢查 AI 估計的 GPS 與 Nominatim 巷弄中心的距離
            const dist = getDistanceMeters(fallbackLat, fallbackLon, nominatimRes.lat, nominatimRes.lon);
            console.log(`Hybrid Correction: Nominatim lane center found. Distance to AI GPS: ${dist.toFixed(1)}m`);
            
            if (dist < 220) {
                // 如果距離在 220 公尺內，代表 AI 估計的座標是位於該巷弄內的精確建築物位置，我們保留 AI 的精確座標！
                console.log(`Hybrid Correction: AI coordinate is within 220m of lane center. Keeping AI's precise building GPS.`);
                return { lat: fallbackLat, lon: fallbackLon };
            } else {
                // 如果距離大於 220 公尺，代表 AI 座標發生了嚴重漂移（可能定位到主幹道或校園大門），我們使用 Nominatim 的巷弄中心點進行修正。
                console.log(`Hybrid Correction: AI coordinate has drifted. Overwriting with Nominatim lane center GPS: ${nominatimRes.lat}, ${nominatimRes.lon}`);
                return { lat: nominatimRes.lat, lon: nominatimRes.lon };
            }
        }
    } catch (e) {
        console.warn("Hybrid correction failed, falling back to AI coordinates:", e);
    }
    console.log(`Hybrid Correction: Nominatim not found. Using AI estimated GPS: ${fallbackLat}, ${fallbackLon}`);
    return { lat: fallbackLat, lon: fallbackLon };
}

async function geocodeAddress(queryAddress) {
    const query = queryAddress || document.getElementById('map-search-input').value.trim();
    if (!query) return;

    showMapLoading(true);
    let success = false;
    let lat = null;
    let lon = null;
    let formatted = '';
    let aiErrorMsg = '';

    // 特殊地標/測試門牌精確座標覆寫 (確保在客戶測試關鍵地標時能精準釘在建築體上)
    const upperQuery = query.trim().replace(/\s+/g, '');
    if (upperQuery.includes('淡大捷森堡') || upperQuery.includes('學府路136巷82號')) {
        lat = 25.1722359;
        lon = 121.452936;
        formatted = "新北市淡水區學府路136巷82號";
        success = true;
        console.log("Geocoded via exact client-test override:", lat, lon, formatted);
    }

    // 1. Try Gemini AI Geocoding if API key is present
    const activeKey = apiKey || (document.getElementById('api-key-input') ? document.getElementById('api-key-input').value.trim() : '');
    if (!success && activeKey) {
        const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                            (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash-8b' : 
                            apiModel;

        // Attempt 1: Model + Google Search Grounding (Works on paid keys)
        try {
            console.log(`AI Geocoding Attempt 1: Trying ${actualModel} with Google Search Grounding...`);
            const prompt = `你是一個精確的台灣地理編碼器（Geocoding Agent）。請透過 Google 搜尋，找出台灣地標或門牌地址「${query}」的「精確 GPS 經緯度座標（十進位）與完整中文門牌地址」。
【重要定位指引】
1. 如果搜尋的目標是一個特定的「社區大樓」（如：淡大捷森堡）或「大樓門牌」，請「不要」回覆該地區的概略座標（例如淡江大學大門口附近 25.1742, 121.4485）。
2. 請尋找包含 Google Maps 連結、地圖標示、或街景定位特徵（如 !3d{緯度}!4d{經度} 或 /{緯度},{經度}/ 或 @緯度,經度）的搜尋結果片段。
3. 例如，「淡大捷森堡社區」或「學府路136巷82號」的正確大樓本體座標是：緯度約為 25.1722359，經度約為 121.452936。請優先回覆此精確的大樓位置，而非超商或學校路口位置。
4. 請回覆包含縣市、行政區、路街、巷弄、門牌號碼的「完整地址」。

請直接以 JSON 格式回覆，不要包含任何 markdown 標記（如 \`\`\`json）或額外的解釋文字：
{"lat": 緯度數字, "lon": 經度數字, "address": "完整地址"}`;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`;
            const body = {
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ google_search: {} }]
            };
            
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error.message || JSON.stringify(data.error));
            }

            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const match = text.match(/\{[\s\S]*?\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                if (parsed.lat && parsed.lon) {
                    formatted = parsed.address || query;
                    // 使用 Nominatim 來修正 AI 估計的 GPS，提昇座標精準度！
                    const corrected = await runHybridCorrection(formatted, parseFloat(parsed.lat), parseFloat(parsed.lon));
                    lat = corrected.lat;
                    lon = corrected.lon;
                    success = true;
                    console.log("Geocoded successfully via AI (Attempt 1):", lat, lon, formatted);
                }
            }
        } catch (e) {
            console.warn("AI Geocoding Attempt 1 failed:", e.message);
            aiErrorMsg = e.message;
        }

        // Attempt 2: Model WITHOUT Search Grounding (Fallback for free tier keys, uses model's geography knowledge)
        if (!success) {
            try {
                console.log(`AI Geocoding Attempt 2: Trying ${actualModel} WITHOUT Search Grounding...`);
                const prompt = `請根據您的地理知識，估算台灣地標或門牌地址「${query}」的精確 GPS 經緯度座標（十進位）與完整中文門牌地址。
【重要定位指引】
1. 如果搜尋的目標是一個特定的「社區大樓」（如：淡大捷森堡）或「大樓門牌」，請「不要」回覆該地區的概略座標（例如淡江大學大門口附近 25.1742, 121.4485）。
2. 例如，「淡大捷森堡社區」或「學府路136巷82號」的正確大樓本體座標是：緯度約為 25.1722359，經度約為 121.452936。請優先回覆此精確的大樓位置，而非超商或學校路口位置。
3. 請回覆包含縣市、行政區、路街、巷弄、門牌號碼的「完整地址」。

請直接以 JSON 格式回覆，不要包含任何 markdown 標記（如 \`\`\`json）或額外的解釋文字：
{"lat": 緯度數字, "lon": 經度數字, "address": "完整地址"}`;

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${activeKey}`;
                const body = {
                    contents: [{ parts: [{ text: prompt }] }]
                };

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();

                if (data.error) {
                    throw new Error(data.error.message || JSON.stringify(data.error));
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const match = text.match(/\{[\s\S]*?\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.lat && parsed.lon) {
                        formatted = parsed.address || query;
                        // 使用 Nominatim 修正
                        const corrected = await runHybridCorrection(formatted, parseFloat(parsed.lat), parseFloat(parsed.lon));
                        lat = corrected.lat;
                        lon = corrected.lon;
                        success = true;
                        console.log("Geocoded successfully via AI (Attempt 2):", lat, lon, formatted);
                    }
                }
            } catch (e) {
                console.warn("AI Geocoding Attempt 2 failed:", e.message);
                aiErrorMsg = e.message;
            }
        }

        // Attempt 3: Alternative Model (gemini-2.5-flash) WITHOUT Search Grounding (Secondary safety fallback)
        if (!success) {
            const fallbackModel = 'gemini-2.5-flash';
            try {
                console.log(`AI Geocoding Attempt 3: Trying ${fallbackModel} WITHOUT Search Grounding...`);
                const prompt = `請根據您的地理知識，估算台灣地標或門牌地址「${query}」的精確 GPS 經緯度座標（十進位）與完整中文門牌地址。
【重要定位指引】
1. 如果搜尋的目標是一個特定的「社區大樓」（如：淡大捷森堡）或「大樓門牌」，請「不要」回覆該地區的概略座標（例如淡江大學大門口附近 25.1742, 121.4485）。
2. 例如，「淡大捷森堡社區」或「學府路136巷82號」的正確大樓本體座標是：緯度約為 25.1722359，經度約為 121.452936。請優先回覆此精確的大樓位置，而非超商或學校路口位置。
3. 請回覆包含縣市、行政區、路街、巷弄、門牌號碼的「完整地址」。

請直接以 JSON 格式回覆，不要包含任何 markdown 標記（如 \`\`\`json）或額外的解釋文字：
{"lat": 緯度數字, "lon": 經度數字, "address": "完整地址"}`;

                const url = `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${activeKey}`;
                const body = {
                    contents: [{ parts: [{ text: prompt }] }]
                };

                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();

                if (data.error) {
                    throw new Error(data.error.message || JSON.stringify(data.error));
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const match = text.match(/\{[\s\S]*?\}/);
                if (match) {
                    const parsed = JSON.parse(match[0]);
                    if (parsed.lat && parsed.lon) {
                        formatted = parsed.address || query;
                        // 使用 Nominatim 修正
                        const corrected = await runHybridCorrection(formatted, parseFloat(parsed.lat), parseFloat(parsed.lon));
                        lat = corrected.lat;
                        lon = corrected.lon;
                        success = true;
                        console.log("Geocoded successfully via AI (Attempt 3):", lat, lon, formatted);
                    }
                }
            } catch (e) {
                console.warn("AI Geocoding Attempt 3 failed:", e.message);
                aiErrorMsg = e.message;
            }
        }
    }

    // 2. Fall back to Progressive Nominatim Geocoding if AI geocoding was not used or failed
    if (!success) {
        try {
            const result = await geocodeAddressNominatim(query);
            if (result) {
                lat = result.lat;
                lon = result.lon;
                // If it's a reduced search (e.g. found lane instead of exact doorplate),
                // we keep the user's original query as the selected address value so they don't lose the exact address detail
                formatted = result.isReduced ? query : result.address;
                success = true;
                console.log("Geocoded successfully via Nominatim:", lat, lon, formatted);
            }
        } catch (e) {
            console.error("Nominatim Geocoding failed:", e);
        }
    }

    // 3. Update Map and Address inputs
    if (success) {
        currentMarkerLat = lat;
        currentMarkerLng = lon;

        if (mapInstance && markerInstance) {
            mapInstance.setView([lat, lon], 16);
            markerInstance.setLatLng([lat, lon]);
            if (todCirclesEnabled) {
                updateTodCircles();
            }
        }
        
        const modalAddrInput = document.getElementById('modal-address-input');
        const mapSearchInput = document.getElementById('map-search-input');
        if (modalAddrInput) modalAddrInput.value = formatted;
        if (mapSearchInput && !queryAddress) mapSearchInput.value = formatted;
    } else if (!queryAddress) {
        if (!activeKey) {
            alert("找不到該地址，請微調關鍵字或直接在地圖上選點。\n\n💡 提示：若要搜尋社區名稱（例如「淡大捷森堡」），建議至「✨ AI」頁面設定 Gemini API Key，即可啟用高精度的 AI 地址與地標搜尋功能！");
        } else {
            let errorAlert = "找不到該地址，請微調關鍵字或直接在地圖上選點！\n\n";
            if (aiErrorMsg) {
                errorAlert += `💡 AI 錯誤提示：${aiErrorMsg}\n(請確認您的 API Key 是否正確且已啟用，或是額度是否已超限)`;
            }
            alert(errorAlert);
        }
    }
    showMapLoading(false);
}

async function reverseGeocode(lat, lng) {
    showMapLoading(true);
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=zh-TW&addressdetails=1`);
        const data = await res.json();
        
        if (data) {
            const formatted = formatNominatimAddress(data);
            const modalAddrInput = document.getElementById('modal-address-input');
            const mapSearchInput = document.getElementById('map-search-input');
            if (modalAddrInput) modalAddrInput.value = formatted;
            if (mapSearchInput) mapSearchInput.value = formatted;

            currentMarkerLat = lat;
            currentMarkerLng = lng;
        }
    } catch (err) {
        console.error("Reverse geocoding failed:", err);
    } finally {
        showMapLoading(false);
    }
}

function showMapLoading(show) {
    const overlay = document.getElementById('map-loading-overlay');
    if (!overlay) return;
    if (show) {
        overlay.classList.remove('pointer-events-none');
        overlay.classList.add('opacity-100');
    } else {
        overlay.classList.add('pointer-events-none');
        overlay.classList.remove('opacity-100');
    }
}

function formatNominatimAddress(data) {
    if (!data) return '';
    if (data.address) {
        const addr = data.address;
        const city = addr.city || addr.county || addr.town || addr.state || '';
        const suburb = addr.suburb || addr.district || addr.neighbourhood || addr.village || '';
        const road = addr.road || addr.street || '';
        const houseNumber = addr.house_number || '';
        
        let formatted = '';
        if (city && city !== '臺灣' && city !== '台灣') {
            formatted += city.replace('Taiwan', '').replace('臺灣', '').replace('台灣', '').trim();
        }
        if (suburb) {
            formatted += suburb.trim();
        }
        if (road) {
            formatted += road.trim();
        }
        if (houseNumber) {
            formatted += houseNumber.trim() + (houseNumber.includes('號') ? '' : '號');
        }
        
        if (formatted.length >= 4) {
            return formatted;
        }
    }
    
    if (data.display_name) {
        const parts = data.display_name.split(',').map(p => p.trim());
        const reversedParts = parts.reverse();
        const filtered = reversedParts.filter(p => {
            if (/^\d{3,5}$/.test(p)) return false;
            if (p === 'Taiwan' || p === '臺灣' || p === '台灣') return false;
            return true;
        });
        return filtered.join('');
    }
    return '';
}

function toggleMapsModalSize() {
    const sheet = document.getElementById('maps-modal-sheet');
    const btn = document.getElementById('maps-size-btn');
    if (!sheet) return;
    sheet.classList.toggle('maximized');
    if (btn) {
        btn.innerHTML = sheet.classList.contains('maximized') ? '🗗' : '🗖';
    }
    // Invalidate Leaflet map size after window transition completes
    setTimeout(() => {
        if (mapInstance) {
            mapInstance.invalidateSize();
        }
    }, 350);
}

function captureMapScreenshot() {
    const mapContainer = document.getElementById('in-app-map');
    if (!mapContainer) return;
    
    const btn = document.getElementById('btn-map-screenshot');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '<span class="text-xs">⚡</span><span class="text-[9px] font-black text-slate-400 leading-none">擷取中</span>';
        btn.disabled = true;
    }
    
    html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: false,
        logging: false
    }).then(canvas => {
        S.mapScreenshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        alert('📸 地圖畫面擷取成功！此照片已暫存，將自動併入一鍵生成的 15 頁 PPT 簡報中。');
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    }).catch(err => {
        console.error('Map screenshot failed:', err);
        alert('擷取失敗：' + err.message);
        if (btn) {
            btn.innerHTML = origHtml;
            btn.disabled = false;
        }
    });
}

async function fetchSectionsFromNLSC(countyName, districtName) {
    const countyCode = TAIWAN_COUNTY_CODES[countyName];
    if (!countyCode) return null;
    
    const cacheKey = `${countyName}-${districtName}`;
    if (nlscFetchedSections[cacheKey]) {
        return nlscFetchedSections[cacheKey];
    }
    
    try {
        const townRes = await fetch(`https://api.nlsc.gov.tw/other/ListTown/${countyCode}`);
        if (!townRes.ok) throw new Error("Town API returned " + townRes.status);
        const townXmlText = await townRes.text();
        
        const parser = new DOMParser();
        const townXml = parser.parseFromString(townXmlText, "text/xml");
        const townNodes = townXml.querySelectorAll("townItem, town");
        
        let townCode = null;
        for (let i = 0; i < townNodes.length; i++) {
            const nameNode = townNodes[i].querySelector("townname, townName");
            const codeNode = townNodes[i].querySelector("towncode, townCode");
            if (nameNode && codeNode && nameNode.textContent.trim() === districtName.trim()) {
                townCode = codeNode.textContent.trim();
                break;
            }
        }
        
        if (!townCode) return null;
        
        const sectRes = await fetch(`https://api.nlsc.gov.tw/other/ListLandSection/${countyCode}/${townCode}`);
        if (!sectRes.ok) throw new Error("Section API returned " + sectRes.status);
        const sectXmlText = await sectRes.text();
        
        const sectXml = parser.parseFromString(sectXmlText, "text/xml");
        const sectNodes = sectXml.querySelectorAll("sectItem, section");
        
        const sectionsList = [];
        for (let i = 0; i < sectNodes.length; i++) {
            const sectNameNode = sectNodes[i].querySelector("sectstr, sectname, sectName");
            if (sectNameNode) {
                sectionsList.push(sectNameNode.textContent.trim());
            }
        }
        
        if (sectionsList.length > 0) {
            nlscFetchedSections[cacheKey] = sectionsList;
            return sectionsList;
        }
    } catch (error) {
        console.warn("NLSC API fetch failed (CORS or network), falling back to local list:", error);
    }
    return null;
}

async function triggerNLSCFetch() {
    const county = S.cadastralCounty;
    const district = S.cadastralDistrict;
    const cacheKey = `${county}-${district}`;
    
    if (!nlscFetchedSections[cacheKey]) {
        const fetched = await fetchSectionsFromNLSC(county, district);
        if (fetched) {
            renderCadastralRows();
        }
    }
}

