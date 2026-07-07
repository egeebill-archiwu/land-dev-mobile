'use strict';

const FONT_CHINESE = "Noto Sans TC";
const FONT_ENGLISH = "Montserrat";

function getBlueprintPNG() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        // Draw deep navy background
        ctx.fillStyle = '#0b111e';
        ctx.fillRect(0, 0, 1280, 720);

        // Draw grids
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 1280; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 720);
            ctx.stroke();
        }
        for (let y = 0; y < 720; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1280, y);
            ctx.stroke();
        }

        // Draw dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let x = 20; x < 1280; x += 20) {
            for (let y = 20; y < 720; y += 20) {
                ctx.beginPath();
                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        // Draw tech circles
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.arc(640, 360, 180, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(640, 360, 120, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw crosshairs
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(640, 100);
        ctx.lineTo(640, 620);
        ctx.moveTo(200, 360);
        ctx.lineTo(1080, 360);
        ctx.stroke();

        return canvas.toDataURL('image/png');
    } catch (e) {
        console.error('Error generating blueprint PNG:', e);
        return '';
    }
}

function handleStagingImageUpload(key, inputEl, previewId, btnId) {
    const file = inputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        window._stagingUploads[key] = dataUrl;
        const btn = document.getElementById(btnId);
        if (btn) btn.textContent = '✅ ' + file.name;
        const preview = document.getElementById(previewId);
        const img = document.getElementById(previewId.replace('-preview', '-img'));
        if (preview && img) {
            img.src = dataUrl;
            preview.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

function clearStagingImage(key, previewId, btnId) {
    delete window._stagingUploads[key];
    const btn = document.getElementById(btnId);
    const inputId = btnId.replace('-btn', '-input');
    const inputEl = document.getElementById(inputId);
    if (btn) btn.textContent = btnId.includes('map') ? '📁 點擊上傳地圖截圖 PNG / JPG' : '📁 點擊上傳或拖曳 PNG / JPG';
    if (inputEl) inputEl.value = '';
    const preview = document.getElementById(previewId);
    if (preview) preview.classList.add('hidden');
}

function closeStagingModal() {
    document.getElementById('staging-table-modal').classList.add('hidden');
}

function openStagingModal() {
    const r = S.currentResult;
    if (!r || !r.landArea) {
        alert('請先在主頁面進行至少一次試算（點擊計算按鈕），才能生成包含正確數據的 PPT 簡報！');
        return;
    }

    const constM = parseFloat(document.getElementById('c-constMonths').value) || 24;
    
    const isJoint = S.mode === 'joint';
    const landCost = isJoint ? 0 : Math.round(r.totalLandCost);
    const intAdmin = Math.round((r.totalInterest || 0) + (r.adminCost || 0) + (r.advisorCost || 0) + (r.trustCost || 0) + (r.salesCost || 0)) + (isJoint ? Math.round(r.totalLandCost) : 0);

    stagingData = {
        builderRevenue: Math.round(r.builderRevenue),
        totalCost: Math.round(r.totalCost),
        totalConstructionCost: Math.round(r.totalConstructionCost),
        totalLandCost: landCost,
        interestAdmin: intAdmin,
        parkingRev: Math.round(r.parkingRev),
        netProfit: Math.round(r.netProfit),
        roi: r.roi,
        bepPrice: r.bepPrice,
        avgPrice: r.avgPrice,
        saleableArea: r.saleableArea,
        soldRatioPct: r.soldRatioPct,
        constMonths: constM,
        
        s2_title: r.netProfit < 0 || r.roi < 0 
            ? "開發可行性面臨重大財務瓶頸" 
            : `預期財務效益：本案預估淨利 ${(r.netProfit / 10000).toFixed(2)} 億元`,
        s10_title: r.netProfit < 0 || r.roi < 0 
            ? "財務分析：預估損益表反映建方赤字" 
            : `財務分析：預估淨利達 ${(r.netProfit / 10000).toFixed(2)} 億元，開發效益顯著`,
            
        h1_title: "法規與量體規劃合理",
        h1_body: `基準容積率高，且面前道路及整合效益符合危老重建/都市更新規劃。`,
        h2_title: r.netProfit < 0 || r.roi < 0 ? "財務結構需重組" : "本案財務穩健",
        h2_body: r.netProfit < 0 || r.roi < 0
            ? `建方收益無法覆蓋營建及土地取得成本，利潤率倒掛，建議重啟協商。`
            : `預估開發投資報酬率（ROI）高於市場平均安全邊際，損益平衡點具優勢。`
    };

    // 同步數值至 UI 元件
    document.getElementById('stage-builderRevenue').value = stagingData.builderRevenue;
    document.getElementById('stage-totalCost').value = stagingData.totalCost;
    document.getElementById('stage-totalConstructionCost').value = stagingData.totalConstructionCost;
    const landInp = document.getElementById('stage-totalLandCost');
    if (landInp) {
        if (isJoint) {
            landInp.disabled = true;
            landInp.style.opacity = '0.55';
            landInp.style.pointerEvents = 'none';
        } else {
            landInp.disabled = false;
            landInp.style.opacity = '1';
            landInp.style.pointerEvents = 'auto';
        }
    }
    document.getElementById('stage-totalLandCost').value = stagingData.totalLandCost;
    document.getElementById('stage-interestAdmin').value = stagingData.interestAdmin;
    document.getElementById('stage-parkingRev').value = stagingData.parkingRev;
    document.getElementById('stage-constMonths').value = stagingData.constMonths;

    document.getElementById('stage-s2-title').value = stagingData.s2_title;
    document.getElementById('stage-s10-title').value = stagingData.s10_title;
    document.getElementById('stage-h1-title').value = stagingData.h1_title;
    document.getElementById('stage-h1-body').value = stagingData.h1_body;
    document.getElementById('stage-h2-title').value = stagingData.h2_title;
    document.getElementById('stage-h2-body').value = stagingData.h2_body;

    recalcStaging();
    recalcTimeline();

    // ── A 軌：從 localStorage 讀取 API Key 並預填欄位 ──
    const savedKey = localStorage.getItem('gmaps_api_key') || '';
    const keyInput = document.getElementById('stage-gmaps-key');
    if (keyInput) {
        keyInput.value = savedKey;
        updateGMapsKeyStatus(savedKey);
    }

    // ── 自動預填已擷取的地圖畫面到中繼層 ──
    if (S.mapScreenshotDataUrl) {
        window._stagingUploads['mapShot'] = S.mapScreenshotDataUrl;
        
        const mapImg = document.getElementById('upload-map-img');
        const mapPreview = document.getElementById('upload-map-preview');
        const mapBtn = document.getElementById('upload-map-btn');
        if (mapImg) mapImg.src = S.mapScreenshotDataUrl;
        if (mapPreview) mapPreview.classList.remove('hidden');
        if (mapBtn) mapBtn.textContent = '📸 已自動載入地圖截圖';
    }

    // 顯示 Modal
    document.getElementById('staging-table-modal').classList.remove('hidden');
}

// ── 建築外觀搜尋器聯動功能 ──
function openFacadeFinderModal() {
    const modal = document.getElementById('facade-finder-modal');
    const iframe = document.getElementById('facade-finder-iframe');
    if (modal && iframe) {
        // 設定 iframe src 並顯式地覆寫 display 樣式，繞過 Tailwind !important 阻擋
        iframe.src = 'facade-finder/index.html';
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.remove('hidden');
    }
}

function closeFacadeFinderModal() {
    const modal = document.getElementById('facade-finder-modal');
    const iframe = document.getElementById('facade-finder-iframe');
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.add('hidden');
    }
    if (iframe) iframe.src = '';
}

// 監聽來自外觀搜尋器 iframe 的選取訊息
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'select-facade') {
        const base64Img = event.data.image;
        const styleName = event.data.facadeType || '';
        
        // 1. 寫入中繼資料層
        window._stagingUploads['render3d'] = base64Img;
        if (styleName) {
            window._stagingUploads['facadeType'] = styleName;
        }
        
        // 2. 更新中繼表 UI 預覽
        const btn = document.getElementById('upload-3d-btn');
        if (btn) btn.textContent = '✅ 已匯入素材：' + (event.data.title || '外觀透視');
        
        const preview = document.getElementById('upload-3d-preview');
        const img = document.getElementById('upload-3d-img');
        if (preview && img) {
            img.src = base64Img;
            preview.classList.remove('hidden');
        }
        
        // 3. 關閉搜尋器模態框
        closeFacadeFinderModal();
    }
});

function recalcStaging() {
    if (!stagingData) return;

    stagingData.builderRevenue = parseFloat(document.getElementById('stage-builderRevenue').value) || 0;
    stagingData.totalConstructionCost = parseFloat(document.getElementById('stage-totalConstructionCost').value) || 0;
    stagingData.totalLandCost = parseFloat(document.getElementById('stage-totalLandCost').value) || 0;
    stagingData.interestAdmin = parseFloat(document.getElementById('stage-interestAdmin').value) || 0;
    stagingData.parkingRev = parseFloat(document.getElementById('stage-parkingRev').value) || 0;

    stagingData.totalCost = stagingData.totalConstructionCost + stagingData.totalLandCost + stagingData.interestAdmin;
    document.getElementById('stage-totalCost').value = stagingData.totalCost;

    stagingData.netProfit = stagingData.builderRevenue - stagingData.totalCost;
    stagingData.roi = stagingData.totalCost > 0 ? (stagingData.netProfit / stagingData.totalCost) * 100 : 0;
    
    const bepDenom = stagingData.saleableArea * (stagingData.soldRatioPct / 100);
    stagingData.bepPrice = bepDenom > 0 ? (stagingData.totalCost - stagingData.parkingRev) / bepDenom : 0;

    document.getElementById('stage-netProfit-disp').innerText = Math.round(stagingData.netProfit).toLocaleString() + ' 萬';
    document.getElementById('stage-roi-disp').innerText = stagingData.roi.toFixed(1) + ' %';
    document.getElementById('stage-bep-disp').innerText = stagingData.bepPrice.toFixed(1) + ' 萬/坪';

    const formulaStatus = document.getElementById('stage-audit-status');
    const formulaPanel = document.getElementById('stage-audit-verdict');
    const diff = Math.abs(stagingData.builderRevenue - stagingData.totalCost - stagingData.netProfit);
    if (diff < 1) {
        formulaStatus.innerHTML = '✅ 方程式百分百平衡';
        formulaStatus.className = 'font-black text-emerald-400 flex items-center gap-1';
        formulaPanel.className = 'p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex items-center justify-between text-xs mt-2';
    } else {
        formulaStatus.innerHTML = '⚠️ 數據公式失衡';
        formulaStatus.className = 'font-black text-rose-400 flex items-center gap-1';
        formulaPanel.className = 'p-3 bg-rose-950/20 border border-rose-800/30 rounded-xl flex items-center justify-between text-xs mt-2';
    }
}

function recalcTimeline() {
    if (!stagingData) return;
    
    stagingData.constMonths = parseFloat(document.getElementById('stage-constMonths').value) || 24;
    const t = stagingData.constMonths;

    const m1_end = Math.max(1, Math.round(t * 0.15));
    const m2_end = Math.max(m1_end + 1, Math.round(t * 0.30));
    const m3_end = Math.max(m2_end + 1, Math.round(t * 0.70));
    const m4_end = t;

    const fmt = (start, end) => {
        const pad = (num) => String(num).padStart(2, '0');
        return `M ${pad(start)}-${pad(end)}`;
    };

    stagingData.t1_range = fmt(1, m1_end);
    stagingData.t2_range = fmt(m1_end + 1, m2_end);
    stagingData.t3_range = fmt(m2_end + 1, m3_end);
    stagingData.t4_range = fmt(m3_end + 1, m4_end);

    document.getElementById('stage-t1-range').innerText = stagingData.t1_range;
    document.getElementById('stage-t2-range').innerText = stagingData.t2_range;
    document.getElementById('stage-t3-range').innerText = stagingData.t3_range;
    document.getElementById('stage-t4-range').innerText = stagingData.t4_range;
}

function commitStagingAndGenerate() {
    if (!stagingData) return;

    stagingData.s2_title = document.getElementById('stage-s2-title').value.trim();
    stagingData.s10_title = document.getElementById('stage-s10-title').value.trim();
    stagingData.h1_title = document.getElementById('stage-h1-title').value.trim();
    stagingData.h1_body = document.getElementById('stage-h1-body').value.trim();
    stagingData.h2_title = document.getElementById('stage-h2-title').value.trim();
    stagingData.h2_body = document.getElementById('stage-h2-body').value.trim();

    closeStagingModal();
    triggerPDFGeneration();
}

function generateDefaultStagingData() {
    const r = S.currentResult || {};
    const constM = parseFloat(document.getElementById('c-constMonths')?.value) || 24;
    
    const data = {
        builderRevenue: Math.round(r.builderRevenue || 0),
        totalCost: Math.round(r.totalCost || 0),
        totalConstructionCost: Math.round(r.totalConstructionCost || 0),
        totalLandCost: Math.round(r.totalLandCost || 0),
        interestAdmin: Math.round((r.totalInterest || 0) + (r.adminCost || 0) + (r.advisorCost || 0) + (r.trustCost || 0) + (r.salesCost || 0)),
        parkingRev: Math.round(r.parkingRev || 0),
        netProfit: Math.round(r.netProfit || 0),
        roi: r.roi || 0,
        bepPrice: r.bepPrice || 0,
        avgPrice: r.avgPrice || 0,
        saleableArea: r.saleableArea || 0,
        soldRatioPct: r.soldRatioPct || 100,
        constMonths: constM,
        
        s2_title: (r.netProfit || 0) < 0 || (r.roi || 0) < 0 
            ? "開發可行性面臨重大財務瓶頸" 
            : `預期財務效益：本案預估淨利 ${((r.netProfit || 0) / 10000).toFixed(2)} 億元`,
        s10_title: (r.netProfit || 0) < 0 || (r.roi || 0) < 0 
            ? "財務分析：預估損益表反映建方赤字" 
            : `財務分析：預估淨利達 ${((r.netProfit || 0) / 10000).toFixed(2)} 億元，開發效益顯著`,
            
        h1_title: "法規與量體規劃合理",
        h1_body: `基準容積率高，且面前道路及整合效益符合危老重建/都市更新規劃。`,
        h2_title: (r.netProfit || 0) < 0 ? "財務結構需重組" : "本案財務穩健",
        h2_body: (r.netProfit || 0) < 0
            ? `建方收益無法覆蓋營建及土地取得成本，利潤率倒掛，建議重啟協商。`
            : `預估開發投資報酬率（ROI）高於市場平均安全邊際，損益平衡點具優勢。`
    };

    const t = constM;
    const m1_end = Math.max(1, Math.round(t * 0.15));
    const m2_end = Math.max(m1_end + 1, Math.round(t * 0.30));
    const m3_end = Math.max(m2_end + 1, Math.round(t * 0.70));
    const m4_end = t;

    const fmt = (start, end) => {
        const pad = (num) => String(num).padStart(2, '0');
        return `M ${pad(start)}-${pad(end)}`;
    };

    data.t1_range = fmt(1, m1_end);
    data.t2_range = fmt(m1_end + 1, m2_end);
    data.t3_range = fmt(m2_end + 1, m3_end);
    data.t4_range = fmt(m3_end + 1, m4_end);

    return data;
}

async function triggerPDFGeneration() {
    const btn = document.getElementById('export-pptx-btn');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="flex items-center gap-1.5 justify-center"><div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white flex-shrink-0"></div><span>正在生成中...</span></div>';
    }
    
    try {
        const r = S.currentResult;
        if (!r) {
            alert('請先進行至少一次試算！');
            if (btn) { btn.disabled = false; btn.innerHTML = origHtml; }
            return;
        }
        
        const constM = parseFloat(document.getElementById('c-constMonths').value) || 24;
        const addressVal = document.getElementById('location').value || '本案開發基地';
        const zoningVal = S.cadastralZone || '第三種住宅區';
        const farBase = parseFloat(document.getElementById('floorAreaRatio').value) || 225;
        const farBonus = getFarTotal('bonus');
        const farXfer = getFarTotal('transfer');
        const farTotal = farBase + farBonus + farXfer;
        const roadWidth = parseFloat(document.getElementById('c-roadWidth')?.value) || 12;

        if (!stagingData) {
            stagingData = generateDefaultStagingData();
        }

        const payload = {
            Project_Metadata: {
                Address: addressVal,
                Development_Mode: S.mode === 'joint' ? '合建分售' : '土地買斷',
                Engine_Version: 'MOBILE PRO v4.0'
            },
            Land_Metrics: {
                Total_Land_Area_Ping: parseFloat(r.landArea) || 0,
                Zoning_Type: zoningVal,
                Base_FAR_Pct: farBase,
                Actual_FAR_Pct: farTotal,
                Road_Width_Meters: roadWidth,
                Bonus_FAR_Pct: farBonus,
                Transfer_FAR_Pct: farXfer
            },
            Execution_Gantt: {
                Total_Months: parseFloat(stagingData.constMonths) || constM,
                Stage1_Months: stagingData.t1_range || 'M 01-04',
                Stage2_Months: stagingData.t2_range || 'M 05-07',
                Stage3_Months: stagingData.t3_range || 'M 08-17',
                Stage4_Months: stagingData.t4_range || 'M 18-24'
            },
            Financial_HUD: {
                Net_Profit_亿: parseFloat((stagingData.netProfit / 10000).toFixed(2)),
                ROI_Pct: parseFloat(stagingData.roi.toFixed(2)),
                BEP_Price_萬坪: parseFloat(stagingData.bepPrice.toFixed(2)),
                Market_Price_萬坪: parseFloat(stagingData.avgPrice.toFixed(2)),
                Safety_Margin_萬坪: parseFloat((stagingData.avgPrice - stagingData.bepPrice).toFixed(2)),
                CAPEX_Build_亿: parseFloat((stagingData.totalConstructionCost / 10000).toFixed(2)),
                CAPEX_Land_Acquire_亿: parseFloat((stagingData.totalLandCost / 10000).toFixed(2)),
                CAPEX_Mgt_Interest_亿: parseFloat((stagingData.interestAdmin / 10000).toFixed(2))
            },
            Gemini_API_Key: localStorage.getItem('gemini_api_key') || '',
            Theme: (document.getElementById('ppt-style-select') ? document.getElementById('ppt-style-select').value : 'dark') === 'dark' ? 'dark' : 'light',
            Map_Image: window._stagingUploads['mapShot'] || S.mapScreenshotDataUrl || '',
            Volume_Image: window._stagingUploads['render3d'] || '',
            Street_Image: window._stagingUploads['streetView'] || '',
            Facade_Type: (() => {
                const sel = document.getElementById('c-facadeType');
                return sel ? sel.options[sel.selectedIndex].text.replace(/\s*\(.*\)\s*/g, '') : '一般磁磚';
            })()
        };

        const host = (window.location.protocol === 'file:') ? 'http://127.0.0.1:8000' : window.location.origin;
        const response = await fetch(`${host}/api/generate-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || '後台渲染服務錯誤');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${addressVal}_AI全案診斷簡報.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        alert("🎉 成功匯出 15 頁 Full Edge PDF 簡報！");
    } catch (err) {
        console.error('PDF generation failed:', err);
        alert('匯出簡報失敗 ❌\n\n錯誤訊息：' + err.message + '\n\n請確認：\n1. 已啟動後台服務 (FastAPI)\n2. 後台依賴包與 Chrome 環境已就緒\n3. 刷新頁面後再試');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
}
