'use strict';


// Debounce Utility Helper
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}


function toggleSchedulePanel() {
    const panel = document.getElementById('schedulePanelBody');
    const chevron = document.getElementById('schedulePanelChevron');
    if (panel && chevron) {
        const isHidden = panel.classList.toggle('hidden');
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

function toggleTransferFootnote(btn) {
    const el = document.getElementById('transferFootnote');
    if (el) {
        const isHidden = el.classList.toggle('hidden');
        if (btn) {
            btn.querySelector('span').innerText = isHidden ? '顯示公式說明' : '收合公式說明';
        }
    }
}

function openEasyMap() {
    window.open('https://easymap.moi.gov.tw/Index?openExternalBrowser=1', '_blank');
    const modal = document.getElementById('easyMapHelpModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function toggleSummaryPanel(type) {
    const body = document.getElementById(`p-${type}Body`);
    const chevron = document.getElementById(`p-${type}Chevron`);
    if (body && chevron) {
        const isHidden = body.classList.toggle('hidden');
        chevron.style.transform = isHidden ? 'rotate(-90deg)' : 'rotate(0deg)';
        S.summaryExpanded[type] = !isHidden;
    }
}

function quickFillCost(name) {
    document.getElementById('addCostName').value = name;
    document.getElementById('addCostAmt').focus();
}

function quickFillRevenue(name) {
    document.getElementById('addRevenueName').value = name;
    document.getElementById('addRevenueAmt').focus();
}

function addCustomCost() {
    const nameInput = document.getElementById('addCostName');
    const amtInput = document.getElementById('addCostAmt');
    const name = nameInput.value.trim();
    const amount = parseFloat(amtInput.value) || 0;
    if (!name) {
        alert('請輸入項目名稱！');
        return;
    }
    if (amount <= 0) {
        alert('請輸入大於 0 的金額！');
        return;
    }
    S.customCosts.push({ name, amount });
    localStorage.setItem('s_customCosts', JSON.stringify(S.customCosts));
    nameInput.value = '';
    amtInput.value = '';
    calculateAll();
}

function deleteCustomCost(index) {
    S.customCosts.splice(index, 1);
    localStorage.setItem('s_customCosts', JSON.stringify(S.customCosts));
    calculateAll();
}

function addCustomRevenue() {
    const nameInput = document.getElementById('addRevenueName');
    const amtInput = document.getElementById('addRevenueAmt');
    const name = nameInput.value.trim();
    const amount = parseFloat(amtInput.value) || 0;
    if (!name) {
        alert('請輸入項目名稱！');
        return;
    }
    if (amount <= 0) {
        alert('請輸入大於 0 的金額！');
        return;
    }
    S.customRevenues.push({ name, amount });
    localStorage.setItem('s_customRevenues', JSON.stringify(S.customRevenues));
    nameInput.value = '';
    amtInput.value = '';
    calculateAll();
}

function deleteCustomRevenue(index) {
    S.customRevenues.splice(index, 1);
    localStorage.setItem('s_customRevenues', JSON.stringify(S.customRevenues));
    calculateAll();
}

function addCustomKpi() {
    const nameInput = document.getElementById('addKpiName');
    const valInput = document.getElementById('addKpiVal');
    const name = nameInput.value.trim();
    const value = valInput.value.trim();
    if (!name || !value) {
        alert('請輸入指標名稱與數值！');
        return;
    }
    S.customKpis.push({ name, value });
    localStorage.setItem('s_customKpis', JSON.stringify(S.customKpis));
    nameInput.value = '';
    valInput.value = '';
    calculateAll();
}

function deleteCustomKpi(index) {
    S.customKpis.splice(index, 1);
    localStorage.setItem('s_customKpis', JSON.stringify(S.customKpis));
    calculateAll();
}

function toggleCostChartPanel() {
    const panel = document.getElementById('costChartPanelBody');
    const chevron = document.getElementById('costChartPanelChevron');
    if (panel && chevron) {
        const isHidden = panel.classList.toggle('hidden');
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        if (!isHidden && costChart) {
            setTimeout(() => {
                costChart.resize();
            }, 50);
        }
    }
}

function toggleCostTablePanel() {
    const panel = document.getElementById('costTablePanelBody');
    const chevron = document.getElementById('costTablePanelChevron');
    if (panel && chevron) {
        const isHidden = panel.classList.toggle('hidden');
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    }
}

function onScheduleManualInput() {
    // 使用者手動修改工期，清除選定的標準案型
    currentConstructionStandard = null;
    try {
        localStorage.removeItem('activeConstructionStandardCase');
    } catch (e) {
        console.warn('Failed to remove activeConstructionStandardCase from localStorage:', e);
    }
    
    // 隱藏詳細資訊
    const detailBlock = document.getElementById('scheduleStandardDetails');
    if (detailBlock) detailBlock.classList.add('hidden');
    
    // 清除按鈕高亮樣式
    Object.keys(CONSTRUCTION_STANDARDS).forEach(k => {
        const btn = document.querySelector(`[onclick="applyConstructionStandard('${k}')"]`);
        if (btn) {
            btn.className = "tap px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700/80 transition-all font-black text-center";
        }
    });

    calcMatrix();
}

function changeApiModel() {
    const val = document.getElementById('api-model-select').value;
    apiModel = val;
    try {
        localStorage.setItem('gemini_api_model', val);
    } catch (e) {
        console.warn('Failed to save apiModel to localStorage:', e);
    }
}

function updateApiModelSelect() {
    const el = document.getElementById('api-model-select');
    if (el) {
        if (apiModel === 'gemini-1.5-flash' || apiModel === 'gemini-2.0-flash' || apiModel === 'gemini-3.5-flash' || apiModel === 'gemini-3.1-flash-lite') {
            apiModel = 'gemini-2.5-flash';
        }
        if (apiModel === 'gemini-1.5-pro') {
            apiModel = 'gemini-2.5-pro';
        }
        el.value = apiModel;
    }
}


// ═══════════════════════════════════════
//  TAB SWITCHING
// ═══════════════════════════════════════
function switchTab(tab) {
    ['land','construction','market','result','ai'].forEach(t => {
        document.getElementById('tab-' + t).classList.toggle('hidden', t !== tab);
        const nb = document.getElementById('nav-' + t);
        nb.classList.toggle('active', t === tab);
    });
    S.currentTab = tab;
    
    // Switch to result tab: refresh collapsible detail card height
    if (tab === 'result') {
        initModeDetail();
    }

    // Trigger chart resize
    setTimeout(() => {
        if (tab === 'construction' && costChart)   costChart.resize();
        if (tab === 'market'       && marketChart) marketChart.resize();
        if (tab === 'result'       && profitChart) profitChart.resize();
    }, 60);
    document.getElementById('app-content').scrollTop = 0;
}

function initModeDetail() {
    const content = document.getElementById('r-modeDetailContent');
    const arrow   = document.getElementById('r-modeDetailArrow');
    if (!content) return;
    if (_modeDetailOpen) {
        const sh = content.scrollHeight;
        content.style.maxHeight = sh > 0 ? sh + 'px' : 'none';
        content.style.opacity   = '1';
        content.style.paddingBottom = ''; // 恢復 pb-4 預設內縮
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = '0px';
        content.style.opacity   = '0';
        content.style.paddingBottom = '0px'; // 閉合時將 padding-bottom 設為 0，避免文字溢出可見
        if (arrow) arrow.style.transform = 'rotate(-90deg)';
    }
}

function toggleModeDetail() {
    _modeDetailOpen = !_modeDetailOpen;
    initModeDetail();
}

function switchMode(mode) {
    S.mode = mode;
    ['joint','purchase','mixed'].forEach(m => {
        const id = 'mode' + m.charAt(0).toUpperCase() + m.slice(1);
        const btn = document.getElementById(id);
        btn.classList.toggle('active', m === mode);
        if (m !== mode) btn.classList.remove('text-white');
        else btn.classList.add('text-white');
    });

    const splitCard         = document.getElementById('splitCard');
    const purchaseCard      = document.getElementById('purchaseCard');
    const financingCard     = document.getElementById('financingCard');
    const transferSplitC    = document.getElementById('transferSplitContainer');
    const mixedSplitHint    = document.getElementById('mixedSplitHint');
    const purePurchFields   = document.getElementById('purePurchaseFields');
    const mixedPurchFields  = document.getElementById('mixedPurchaseFields');
    const landLoanSection   = document.getElementById('landLoanSection');
    const financingCardTitle = document.getElementById('financingCardTitle');
    const purchaseCardTitle = document.getElementById('purchaseCardTitle');
    const landCostSummaryRow = document.getElementById('landCostSummaryRow');

    purchaseCard.classList.remove('hidden');

    if (mode === 'joint') {
        splitCard.classList.remove('hidden');
        financingCard.classList.remove('hidden');
        landLoanSection.classList.add('hidden');
        financingCardTitle.innerText = '建築融資設定';
        transferSplitC.classList.remove('hidden');
        mixedSplitHint.classList.add('hidden');
        document.getElementById('splitCardTitle').innerText = '合建分售：分配比例';
        
        purePurchFields.classList.add('hidden');
        mixedPurchFields.classList.add('hidden');
        landCostSummaryRow.classList.add('hidden');
        if (purchaseCardTitle) purchaseCardTitle.innerText = '容移/代金成本設定';
    } else if (mode === 'purchase') {
        splitCard.classList.add('hidden');
        financingCard.classList.remove('hidden');
        landLoanSection.classList.remove('hidden');
        financingCardTitle.innerText = '土地/建築融資設定';
        transferSplitC.classList.add('hidden');
        purePurchFields.classList.remove('hidden');
        mixedPurchFields.classList.add('hidden');
        mixedSplitHint.classList.add('hidden');
        
        landCostSummaryRow.classList.remove('hidden');
        if (purchaseCardTitle) purchaseCardTitle.innerText = '土地購入與容移設定';
    } else { // mixed
        splitCard.classList.remove('hidden');
        financingCard.classList.remove('hidden');
        landLoanSection.classList.remove('hidden');
        financingCardTitle.innerText = '土地/建築融資設定';
        transferSplitC.classList.remove('hidden');
        purePurchFields.classList.add('hidden');
        mixedPurchFields.classList.remove('hidden');
        mixedSplitHint.classList.remove('hidden');
        document.getElementById('splitCardTitle').innerText = '混合模式：合建部分分配比例';
        
        landCostSummaryRow.classList.remove('hidden');
        if (purchaseCardTitle) purchaseCardTitle.innerText = '土地購入與容移設定';
    }
    calculateAll();
}


// ═══════════════════════════════════════
//  RATIO SLIDER
// ═══════════════════════════════════════
function updateRatio(val) {
    document.getElementById('landlordRatioText').innerText = val;
    document.getElementById('builderRatioText').innerText  = 100 - val;
    calculateAll();
}

function matchAllocationRatioForTargetEquityRoi(targetRoi = 15) {
    if (S.mode === 'purchase') {
        alert('土地買斷模式下無須分配比例！');
        return;
    }
    
    let low = 30;
    let high = 80;
    let bestRatio = 60;
    
    S.isSearching = true;
    
    for (let i = 0; i < 20; i++) {
        let mid = (low + high) / 2;
        document.getElementById('splitRatio').value = mid;
        
        calculateAll();
        
        const res = S.currentResult;
        if (!res) break;
        
        const buildLoanR = parseFloat(document.getElementById('buildLoanRatio').value) || 0;
        const landLoanR  = parseFloat(document.getElementById('landLoanRatio').value) || 0;
        const landArea   = parseFloat(document.getElementById('landArea').value) || 0;
        let baseLandCost = 0;
        if (S.mode === 'purchase') {
            const landPurchasePrice = parseFloat(document.getElementById('landPurchasePrice').value) || 0;
            baseLandCost = landArea * landPurchasePrice;
        } else if (S.mode === 'mixed') {
            const mixedPrice = parseFloat(document.getElementById('mixedPurchasePrice').value) || 0;
            const mixedArea  = parseFloat(document.getElementById('mixedPurchaseArea').value) || 0;
            baseLandCost = mixedArea * mixedPrice;
        }
        
        const landCost = res.totalLandCost;
        const buildCost = res.totalConstructionCost;
        const landLoanAmt = baseLandCost * (landLoanR / 100);
        const buildLoanAmt = buildCost * (buildLoanR / 100);
        const totalLoanAmt = landLoanAmt + buildLoanAmt;
        const equityCapital = Math.max(0, res.totalCost - totalLoanAmt);
        const incomeTax = res.netProfit > 0 ? res.netProfit * 0.20 : 0;
        const netProfitAfterTax = res.netProfit - incomeTax;
        const equityRoi = equityCapital > 0 ? (netProfitAfterTax / equityCapital) * 100 : 0;
        
        if (equityRoi > targetRoi) {
            low = mid;
        } else {
            high = mid;
        }
    }
    
    bestRatio = (low + high) / 2;
    S.isSearching = false;
    
    const finalRatio = Math.round(bestRatio);
    document.getElementById('splitRatio').value = finalRatio;
    updateRatio(finalRatio);
    
    const finalRes = S.currentResult;
    const buildLoanR = parseFloat(document.getElementById('buildLoanRatio').value) || 0;
    const landLoanR  = parseFloat(document.getElementById('landLoanRatio').value) || 0;
    const landArea   = parseFloat(document.getElementById('landArea').value) || 0;
    let baseLandCost = 0;
    if (S.mode === 'purchase') {
        const landPurchasePrice = parseFloat(document.getElementById('landPurchasePrice').value) || 0;
        baseLandCost = landArea * landPurchasePrice;
    } else if (S.mode === 'mixed') {
        const mixedPrice = parseFloat(document.getElementById('mixedPurchasePrice').value) || 0;
        const mixedArea  = parseFloat(document.getElementById('mixedPurchaseArea').value) || 0;
        baseLandCost = mixedArea * mixedPrice;
    }
    const landCost = finalRes.totalLandCost;
    const buildCost = finalRes.totalConstructionCost;
    const landLoanAmt = baseLandCost * (landLoanR / 100);
    const buildLoanAmt = buildCost * (buildLoanR / 100);
    const totalLoanAmt = landLoanAmt + buildLoanAmt;
    const equityCapital = Math.max(0, finalRes.totalCost - totalLoanAmt);
    const incomeTax = finalRes.netProfit > 0 ? finalRes.netProfit * 0.20 : 0;
    const netProfitAfterTax = finalRes.netProfit - incomeTax;
    const actualRoi = equityCapital > 0 ? (netProfitAfterTax / equityCapital) * 100 : 0;
    
    const btn = (window.event && (window.event.currentTarget || window.event.target)) || document.querySelector('[onclick^="matchAllocationRatioForTargetEquityRoi"]');
    if (btn) {
        const origText = btn.innerHTML;
        btn.innerHTML = '✅ 已套用分配比！';
        setTimeout(() => {
            btn.innerHTML = origText;
        }, 1500);
    }
    
    alert(`【自動分配比例計算結果】
目標自有資金投報率：${targetRoi}.0%
計算得出分配比例：地主 ${finalRatio}% / 建方 ${100 - finalRatio}%
實際自有資金投報率：${actualRoi.toFixed(1)}%

系統已自動為您將分配比例設定為地主 ${finalRatio}%。`);
}


// ═══════════════════════════════════════
//  STRUCTURE BUTTONS
// ═══════════════════════════════════════
function setStruct(type) {
    currentStruct = type;
    ['RC','SRC','SC','SS'].forEach(t => {
        document.getElementById('btn' + t).classList.toggle('active', t === type);
    });
    calcMatrix();
}


// ═══════════════════════════════════════
//  MIXED MODE LINKAGE
// ═══════════════════════════════════════
function handleMixedAreaChange() {
    const la = parseFloat(document.getElementById('landArea').value) || 0;
    const ma = parseFloat(document.getElementById('mixedPurchaseArea').value) || 0;
    if (la > 0) document.getElementById('mixedPurchaseRatio').value = ((ma / la) * 100).toFixed(2);
    calculateAll();
}

function handleMixedRatioChange() {
    const la = parseFloat(document.getElementById('landArea').value) || 0;
    const mr = parseFloat(document.getElementById('mixedPurchaseRatio').value) || 0;
    if (la > 0) document.getElementById('mixedPurchaseArea').value = ((mr / 100) * la).toFixed(2);
    calculateAll();
}

function onManualCostChange() {
    S.useMatrix = false;
    document.getElementById('costSrcBadge').innerText = '手動';
    document.getElementById('costSrcBadge').className = 'pill bg-slate-700 text-slate-400 normal-case font-medium';
    calculateAll();
}


// ─── Market tab UI ───
function updateMarketTab(bepPrice, avgPrice, totalCost, saleableArea, soldRatioPct, parkingRev, resRevenue, shopRevenue, builderResSaleArea, builderShopSaleArea, parkingCount, parkingPrice, costPerFloor) {
    // Update BEP formula display with values
    const formulaValEl = document.getElementById('m-bepFormulaValue');
    if (formulaValEl) {
        if (bepPrice > 0) {
            const tcVal = Math.round(totalCost).toLocaleString();
            const prVal = Math.round(parkingRev).toLocaleString();
            const saVal = Math.round(saleableArea).toLocaleString();
            const srVal = soldRatioPct;
            const resVal = bepPrice.toFixed(1);
            formulaValEl.innerText = `= (${tcVal}萬 - ${prVal}萬) / (${saVal}坪 × ${srVal}%) = ${resVal} 萬/坪`;
        } else {
            formulaValEl.innerText = '= (總成本 - 車位銷售額) / (可銷售坪數 × 銷售率) = -- 萬/坪';
        }
    }

    document.getElementById('m-kpi-parking').innerText  = Math.round(parkingRev).toLocaleString();
    document.getElementById('m-kpi-revenue').innerText  = Math.round(resRevenue).toLocaleString();
    
    const resAreaEl = document.getElementById('m-kpi-res-area');
    if (resAreaEl) resAreaEl.innerText = Math.round(builderResSaleArea).toLocaleString();
    const shopAreaEl = document.getElementById('m-kpi-shop-area');
    if (shopAreaEl) shopAreaEl.innerText = Math.round(builderShopSaleArea).toLocaleString();
    
    const shopRevEl = document.getElementById('m-kpi-shop-revenue');
    if (shopRevEl) shopRevEl.innerText = Math.round(shopRevenue).toLocaleString();
    document.getElementById('m-bepLabel').innerText     = bepPrice > 0 ? bepPrice.toFixed(1) : '--';
    document.getElementById('m-priceLabel').innerText   = avgPrice > 0  ? avgPrice.toFixed(1) : '--';

    // BEP bar (now acts as sold ratio slider)
    const bepBar  = document.getElementById('m-bepBar');
    const bepPill = document.getElementById('m-bepStatusPill');
    const bepHint = document.getElementById('m-bepHint');
    const sliderValEl = document.getElementById('m-bepSliderVal');
    
    if (bepBar) bepBar.value = soldRatioPct;
    if (sliderValEl) sliderValEl.innerText = soldRatioPct + '%';
    
    if (avgPrice > 0 && bepPrice > 0) {
        if (avgPrice >= bepPrice) {
            if (bepBar) bepBar.className = 'w-full accent-emerald-500 cursor-pointer';
            bepPill.className = 'pill bg-emerald-900/60 text-emerald-300 border border-emerald-700/40';
            bepPill.innerText = '✓ 已超過損益平衡';
            bepHint.className = 'text-xs text-emerald-400 mt-2';
            bepHint.innerText = '售價超過 BEP 約 ' + ((avgPrice / bepPrice - 1) * 100).toFixed(1) + '%，利潤空間良好';
        } else {
            if (bepBar) bepBar.className = 'w-full accent-amber-500 cursor-pointer';
            bepPill.className = 'pill bg-amber-900/60 text-amber-300 border border-amber-700/40';
            bepPill.innerText = '⚠ 尚未達損益平衡';
            bepHint.className = 'text-xs text-amber-400 mt-2';
            bepHint.innerText = '需再提升 ' + (bepPrice - avgPrice).toFixed(1) + ' 萬/坪才達損益平衡';
        }
    } else {
        if (bepBar) bepBar.className = 'w-full accent-emerald-500/50 cursor-pointer';
        bepPill.className = 'pill bg-slate-700 text-slate-400 border border-slate-600';
        bepPill.innerText = '計算中';
        bepHint.innerText = '請確認推案單價以啟動分析';
        bepHint.className = 'text-xs text-slate-400 mt-2';
    }

    // Market comparison chart
    const mCtx = document.getElementById('marketChart').getContext('2d');
    if (marketChart) marketChart.destroy();
    const bepV = bepPrice > 0 ? bepPrice : 0;
    const isProfit = avgPrice >= bepV && avgPrice > 0;
    marketChart = new Chart(mCtx, {
        type: 'bar',
        data: {
            labels: ['造價成本\n(萬/坪)', 'BEP損益\n平衡', '推案售價\n(萬/坪)'],
            datasets: [{
                data: [costPerFloor, bepV, avgPrice],
                backgroundColor: ['rgba(56,189,248,.45)', 'rgba(251,191,36,.45)', isProfit ? 'rgba(52,211,153,.45)' : 'rgba(248,113,113,.45)'],
                borderColor:     ['#38bdf8', '#fbbf24', isProfit ? '#34d399' : '#f87171'],
                borderWidth: 2, borderRadius: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + c.raw.toFixed(1) + ' 萬/坪' } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });

    // ─── Sales Ratio Chart ───
    const bType = document.getElementById('c-buildingType').value;
    const saleFactor = parseFloat(document.getElementById('saleFactor').value) || 1.65;
    
    // Parse areas
    const shopArea = parseFloat(document.getElementById('shopAreaDisplay').value) || 0;
    const totalFARFloorArea = saleableArea / saleFactor;
    const stdSaleableArea = Math.max(0, totalFARFloorArea - shopArea) * saleFactor;
    
    const resArea = (bType === 'residential') ? stdSaleableArea : 0;
    const offArea = (bType === 'office') ? stdSaleableArea : 0;
    const retArea = shopArea * saleFactor;
    const parkCount = parkingCount;
    
    // Parse prices (fallback to defaults if empty / NaN)
    const rawRes = document.getElementById('mq-m-res').value;
    let resPrice = (rawRes === '' || isNaN(parseFloat(rawRes))) ? (bType === 'residential' ? avgPrice : 0) : parseFloat(rawRes);
    
    const rawOff = document.getElementById('mq-m-off').value;
    let offPrice = (rawOff === '' || isNaN(parseFloat(rawOff))) ? (bType === 'office' ? avgPrice : 0) : parseFloat(rawOff);
    
    const rawRet = document.getElementById('mq-m-ret').value;
    let retPrice = (rawRet === '' || isNaN(parseFloat(rawRet))) ? avgPrice * 1.5 : parseFloat(rawRet);
    
    const rawPark = document.getElementById('mq-m-park').value;
    let parkPriceVal = (rawPark === '' || isNaN(parseFloat(rawPark))) ? parkingPrice : parseFloat(rawPark);

    // Calculate total values ($$$)
    const resVal  = resPrice * resArea;
    const offVal  = offPrice * offArea;
    const retVal  = retPrice * retArea;
    const parkVal = parkPriceVal * parkCount;
    
    const totalVal = resVal + offVal + retVal + parkVal;
    
    // Ratios
    const resPct  = totalVal > 0 ? (resVal / totalVal) * 100 : 0;
    const offPct  = totalVal > 0 ? (offVal / totalVal) * 100 : 0;
    const retPct  = totalVal > 0 ? (retVal / totalVal) * 100 : 0;
    const parkPct = totalVal > 0 ? (parkVal / totalVal) * 100 : 0;

    const srCtx = document.getElementById('salesRatioChart').getContext('2d');
    if (salesRatioChart) salesRatioChart.destroy();
    
    salesRatioChart = new Chart(srCtx, {
        type: 'bar',
        data: {
            labels: ['住宅', '辦公室', '店舖', '車位'],
            datasets: [{
                data: [resPct, offPct, retPct, parkPct],
                backgroundColor: [
                    'rgba(56,189,248,.45)',  // 住宅 (Sky blue)
                    'rgba(168,85,247,.45)', // 辦公室 (Purple)
                    'rgba(52,211,153,.45)',  // 店舖 (Emerald)
                    'rgba(251,191,36,.45)'   // 車位 (Amber)
                ],
                borderColor: [
                    '#38bdf8',
                    '#a855f7',
                    '#34d399',
                    '#fbbf24'
                ],
                borderWidth: 2, borderRadius: 8
            }]
        },
        plugins: [{
            id: 'barLabels',
            afterDatasetsDraw(chart) {
                const { ctx } = chart;
                ctx.save();
                chart.data.datasets.forEach((dataset, i) => {
                    const meta = chart.getDatasetMeta(i);
                    meta.data.forEach((bar, index) => {
                        const val = dataset.data[index];
                        if (val > 0) {
                            const percentText = val.toFixed(1) + '%';
                            ctx.font = 'bold 10px monospace';
                            ctx.fillStyle = '#cbd5e1'; // slate-300
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'bottom';
                            ctx.fillText(percentText, bar.x, bar.y - 5);
                        }
                    });
                });
                ctx.restore();
            }
        }],
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }, 
                tooltip: { 
                    callbacks: { 
                        label: c => ' ' + c.raw.toFixed(1) + '%' 
                    } 
                } 
            },
            scales: {
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { 
                        color: '#64748b', 
                        font: { size: 10 },
                        callback: v => v <= 100 ? v + '%' : ''
                    },
                    max: 110
                },
                x: { 
                    grid: { display: false }, 
                    ticks: { color: '#94a3b8', font: { size: 10 } } 
                }
            }
        }
    });
}


// ─── Result tab UI ───
function updateResultTab(landCost, buildCost, adminCost, interest, totalCost, resRevenue, shopRevenue, parkRevenue, netProfit, roi, grossMargin, bepPrice, soldRatioPct) {
    const fmt  = v => Math.round(v).toLocaleString() + ' 萬';
    const fmtP = v => v.toFixed(1) + '%';

    const advisorCost = S.currentResult?.advisorCost || 0;
    const trustCost   = S.currentResult?.trustCost || 0;
    const salesCost   = S.currentResult?.salesCost || 0;
    const advisorRate  = S.currentResult?.advisorRate !== undefined ? S.currentResult.advisorRate : '3';
    const trustRate    = S.currentResult?.trustRate !== undefined ? S.currentResult.trustRate : '0.3';
    const salesRate    = S.currentResult?.salesRate !== undefined ? S.currentResult.salesRate : '5';
    const taxRate      = S.currentResult?.taxRate !== undefined ? S.currentResult.taxRate : '20';

    // Calculate financing breakdown
    const buildLoanR = parseFloat(document.getElementById('buildLoanRatio').value) || 0;
    const landLoanR  = parseFloat(document.getElementById('landLoanRatio').value) || 0;
    
    // Land financing base (only applies to land purchase cost)
    const landArea = parseFloat(document.getElementById('landArea').value) || 0;
    let baseLandCost = 0;
    if (S.mode === 'purchase') {
        const landPurchasePrice = parseFloat(document.getElementById('landPurchasePrice').value) || 0;
        baseLandCost = landArea * landPurchasePrice;
    } else if (S.mode === 'mixed') {
        const mixedPrice = parseFloat(document.getElementById('mixedPurchasePrice').value) || 0;
        const mixedArea  = parseFloat(document.getElementById('mixedPurchaseArea').value) || 0;
        baseLandCost = mixedArea * mixedPrice;
    }
    
    const landLoanAmt = baseLandCost * (landLoanR / 100);
    const landOwnAmt  = Math.max(0, landCost - landLoanAmt);
    
    const buildLoanAmt = buildCost * (buildLoanR / 100);
    const buildOwnAmt  = Math.max(0, buildCost - buildLoanAmt);

    // Keep summary panels expanded or collapsed based on state S
    ['cost', 'revenue', 'kpi'].forEach(type => {
        const body = document.getElementById(`p-${type}Body`);
        const chevron = document.getElementById(`p-${type}Chevron`);
        if (body && chevron) {
            const isExpanded = S.summaryExpanded[type];
            if (isExpanded) {
                body.classList.remove('hidden');
                chevron.style.transform = 'rotate(0deg)';
            } else {
                body.classList.add('hidden');
                chevron.style.transform = 'rotate(-90deg)';
            }
        }
    });

    // 1. Render Default Costs
    // Save active element focus and selection to prevent focus loss during typing
    const activeElementId = document.activeElement ? document.activeElement.id : null;
    let activeSelectionStart = null;
    let activeSelectionEnd = null;
    if (activeElementId === 'costListAdminRate' || 
        activeElementId === 'costListAdvisorRate' || 
        activeElementId === 'costListTrustRate' || 
        activeElementId === 'costListSalesRate' || 
        activeElementId === 'kpiListTaxRate') {
        activeSelectionStart = document.activeElement.selectionStart;
        activeSelectionEnd = document.activeElement.selectionEnd;
    }

    let htmlDefaultCosts = '';
    const todRatio = getTodRatioFromTransferList();
    const transferR = getFarTotal('transfer');
    let suffixParts = [];
    if (todRatio > 0) suffixParts.push('TOD');
    if (transferR > 0) suffixParts.push('容積移入');
    let suffix = suffixParts.length > 0 ? ('+' + suffixParts.join('+')) : '';

    if (landCost > 0) {
        if (landLoanR > 0 && baseLandCost > 0) {
            htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">土地(自有${suffix})</span><span class="font-mono text-white">${fmt(landOwnAmt)}</span></div>`;
            htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">土地(融資)</span><span class="font-mono text-slate-400">${fmt(landLoanAmt)}</span></div>`;
        } else {
            if (suffix) {
                htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">土地(自有${suffix})</span><span class="font-mono text-white">${fmt(landCost)}</span></div>`;
            } else {
                htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">土地</span><span class="font-mono text-white">${fmt(landCost)}</span></div>`;
            }
        }
    }
    if (buildCost > 0) {
        if (buildLoanR > 0) {
            htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">建築(自有)</span><span class="font-mono text-white">${fmt(buildOwnAmt)}</span></div>`;
            htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">建築(融資)</span><span class="font-mono text-slate-400">${fmt(buildLoanAmt)}</span></div>`;
        } else {
            htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">建築</span><span class="font-mono text-white">${fmt(buildCost)}</span></div>`;
        }
    }

    htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center">
        <span class="text-slate-400 flex items-center gap-1.5">
            <span class="w-20 inline-block">顧問設計費</span>
            <input type="text" inputmode="decimal" id="costListAdvisorRate" value="${advisorRate}" class="w-12 h-6 px-1 text-center bg-slate-800/50 border border-slate-700/60 rounded text-emerald-300 font-bold text-xs" oninput="this.value = this.value.replace(/[^0-9.]/g, ''); syncCostListAdvisorRate(this.value)">
            <span class="text-slate-500 text-[10px]">%</span>
        </span>
        <span class="font-mono text-white">${fmt(advisorCost)}</span>
    </div>`;

    htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center">
        <span class="text-slate-400 flex items-center gap-1.5">
            <span class="w-20 inline-block">信託費用</span>
            <input type="text" inputmode="decimal" id="costListTrustRate" value="${trustRate}" class="w-12 h-6 px-1 text-center bg-slate-800/50 border border-slate-700/60 rounded text-emerald-300 font-bold text-xs" oninput="this.value = this.value.replace(/[^0-9.]/g, ''); syncCostListTrustRate(this.value)">
            <span class="text-slate-500 text-[10px]">%</span>
        </span>
        <span class="font-mono text-white">${fmt(trustCost)}</span>
    </div>`;

    htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center">
        <span class="text-slate-400 flex items-center gap-1.5">
            <span class="w-20 inline-block">銷售費</span>
            <input type="text" inputmode="decimal" id="costListSalesRate" value="${salesRate}" class="w-12 h-6 px-1 text-center bg-slate-800/50 border border-slate-700/60 rounded text-emerald-300 font-bold text-xs" oninput="this.value = this.value.replace(/[^0-9.]/g, ''); syncCostListSalesRate(this.value)">
            <span class="text-slate-500 text-[10px]">%</span>
        </span>
        <span class="font-mono text-white">${fmt(salesCost)}</span>
    </div>`;

    const adminRate = document.getElementById('adminRate') ? document.getElementById('adminRate').value : '2.5';
    htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center">
        <span class="text-slate-400 flex items-center gap-1.5">
            <span class="w-20 inline-block">管銷</span>
            <input type="text" inputmode="decimal" id="costListAdminRate" value="${adminRate}" class="w-12 h-6 px-1 text-center bg-slate-800/50 border border-slate-700/60 rounded text-emerald-300 font-bold text-xs" oninput="this.value = this.value.replace(/[^0-9.]/g, ''); syncCostListAdminRate(this.value)">
            <span class="text-slate-500 text-[10px]">%</span>
        </span>
        <span class="font-mono text-white">${fmt(adminCost)}</span>
    </div>`;
    if (interest > 0) {
        htmlDefaultCosts += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">利息</span><span class="font-mono text-amber-300">${fmt(interest)}</span></div>`;
    }
    document.getElementById('p-defaultCosts').innerHTML = htmlDefaultCosts;

    // 2. Render Custom Costs List
    const customCostsContainer = document.getElementById('p-customCostsList');
    if (S.customCosts.length > 0) {
        customCostsContainer.classList.remove('hidden');
        customCostsContainer.innerHTML = S.customCosts.map((c, i) => `
            <div class="flex justify-between items-center py-1 border-b border-slate-800/30">
                <span class="text-slate-400 flex items-center gap-1.5">
                    <button onclick="deleteCustomCost(${i})" type="button" class="text-slate-500 hover:text-rose-400 transition-colors">🗑️</button>
                    ${c.name}
                </span>
                <span class="font-mono text-white">${fmt(c.amount)}</span>
            </div>
        `).join('');
    } else {
        customCostsContainer.classList.add('hidden');
        customCostsContainer.innerHTML = '';
    }

    // 3. Render Default Revenues
    let htmlDefaultRevenues = '';
    htmlDefaultRevenues += `<div class="flex justify-between py-1 border-b border-slate-800/30"><span id="r-resRevenue-label" class="text-slate-400">${document.getElementById('c-buildingType').value === 'office' ? '辦公室' : '住宅'}</span><span class="font-mono text-white">${fmt(resRevenue)}</span></div>`;
    
    const shopArea = parseFloat(document.getElementById('shopAreaDisplay').value) || 0;
    if (shopArea > 0 || shopRevenue > 0) {
        htmlDefaultRevenues += `<div class="flex justify-between py-1 border-b border-slate-800/30"><span class="text-slate-400">店面</span><span class="font-mono text-white">${fmt(shopRevenue)}</span></div>`;
    }
    
    htmlDefaultRevenues += `<div class="flex justify-between py-1 border-b border-slate-800/30"><span class="text-slate-400">車位</span><span class="font-mono text-white">${fmt(parkRevenue)}</span></div>`;
    htmlDefaultRevenues += `<div class="flex justify-between py-1 border-b border-slate-800/30"><span class="text-slate-400">銷售率</span><span class="font-mono text-white">${fmtP(soldRatioPct)}</span></div>`;
    document.getElementById('p-defaultRevenues').innerHTML = htmlDefaultRevenues;

    // 4. Render Custom Revenues List
    const customRevenuesContainer = document.getElementById('p-customRevenuesList');
    if (S.customRevenues.length > 0) {
        customRevenuesContainer.classList.remove('hidden');
        customRevenuesContainer.innerHTML = S.customRevenues.map((r, i) => `
            <div class="flex justify-between items-center py-1 border-b border-slate-800/30">
                <span class="text-slate-400 flex items-center gap-1.5">
                    <button onclick="deleteCustomRevenue(${i})" type="button" class="text-slate-500 hover:text-rose-400 transition-colors">🗑️</button>
                    ${r.name}
                </span>
                <span class="font-mono text-white">${fmt(r.amount)}</span>
            </div>
        `).join('');
    } else {
        customRevenuesContainer.classList.add('hidden');
        customRevenuesContainer.innerHTML = '';
    }

    // 5. Render KPIs (including professional equity & tax indices)
    const constM = parseFloat(document.getElementById('c-constMonths').value) || 0;
    const buildLoanY = constM / 12;
    const totalLoanAmt = landLoanAmt + buildLoanAmt;
    const equityCapital = Math.max(0, totalCost - totalLoanAmt);
    const incomeTax = netProfit > 0 ? netProfit * (parseFloat(taxRate) / 100) : 0;
    const netProfitAfterTax = netProfit - incomeTax;
    const equityRoi = equityCapital > 0 ? (netProfitAfterTax / equityCapital) * 100 : 0;
    const projectYears = Math.max(0.5, buildLoanY);
    const annualizedRoi = equityRoi / projectYears;

    let htmlDefaultKpis = '';
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">毛利率</span><span class="font-mono text-white">${fmtP(grossMargin)}</span></div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">全案 ROI</span><span class="font-mono text-white">${fmtP(roi)}</span></div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">BEP 損益平衡</span><span class="font-mono text-white">${bepPrice > 0 ? bepPrice.toFixed(1) + ' 萬/坪' : '--'}</span></div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center">
        <span class="text-slate-400 flex items-center gap-1.5">
            <span class="w-20 inline-block">預估所得稅</span>
            <input type="text" inputmode="decimal" id="kpiListTaxRate" value="${taxRate}" class="w-12 h-6 px-1 text-center bg-slate-800/50 border border-slate-700/60 rounded text-emerald-300 font-bold text-xs" oninput="this.value = this.value.replace(/[^0-9.]/g, ''); syncKpiListTaxRate(this.value)">
            <span class="text-slate-500 text-[10px]">%</span>
        </span>
        <span class="font-mono text-rose-300">${fmt(incomeTax)}</span>
    </div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">稅後淨利</span><span class="font-mono ${netProfitAfterTax >= 0 ? 'text-emerald-300' : 'text-rose-400'}">${fmt(netProfitAfterTax)}</span></div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">自有資金需求</span><span class="font-mono text-amber-300 font-bold">${fmt(equityCapital)}</span></div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">自有資金投投報率</span><span class="font-mono text-amber-300 font-bold">${fmtP(equityRoi)}</span></div>`;
    htmlDefaultKpis += `<div class="flex justify-between py-1 border-b border-slate-800/30 items-center"><span class="text-slate-400">年化投報率</span><span class="font-mono text-purple-300 font-bold">${fmtP(annualizedRoi)}</span></div>`;
    
    document.getElementById('p-defaultKpis').innerHTML = htmlDefaultKpis;

    // 6. Render Custom KPIs List
    const customKpisContainer = document.getElementById('p-customKpisList');
    if (S.customKpis.length > 0) {
        customKpisContainer.classList.remove('hidden');
        customKpisContainer.innerHTML = S.customKpis.map((k, i) => `
            <div class="flex justify-between items-center py-1 border-b border-slate-800/30">
                <span class="text-slate-400 flex items-center gap-1.5">
                    <button onclick="deleteCustomKpi(${i})" type="button" class="text-slate-500 hover:text-rose-400 transition-colors">🗑️</button>
                    ${k.name}
                </span>
                <span class="font-mono text-white">${k.value}</span>
            </div>
        `).join('');
    } else {
        customKpisContainer.classList.add('hidden');
        customKpisContainer.innerHTML = '';
    }

    // 7. Render Headers
    const customRevenueSum = S.customRevenues.reduce((a, b) => a + b.amount, 0);
    const totalRev = resRevenue + shopRevenue + parkRevenue + customRevenueSum;
    
    document.getElementById('p-totalCostHeader').innerText = `合計 ${fmt(totalCost)}`;
    document.getElementById('p-totalRevenueHeader').innerText = `合計 ${fmt(totalRev)}`;
    
    const netProfitHeaderEl = document.getElementById('p-netProfitHeader');
    netProfitHeaderEl.innerText = `淨利 ${fmt(netProfit)}`;
    netProfitHeaderEl.className = (netProfit >= 0) ? 'text-xs font-mono text-emerald-300 font-black' : 'text-xs font-mono text-rose-400 font-black';

    // Hero card
    const hero     = document.getElementById('profitHero');
    const heroVal  = document.getElementById('r-profitHeroVal');
    const heroNote = document.getElementById('r-profitHeroNote');
    const modeLabel = { joint:'合建分售', purchase:'土地買斷', mixed:'混合模式' }[S.mode];
    heroVal.innerText = (netProfit >= 0 ? '+' : '') + Math.round(netProfit).toLocaleString() + ' 萬';
    if (netProfit > 0) {
        hero.className    = 'p-6 text-center rounded-2xl border border-emerald-700/40 bg-emerald-900/20';
        heroVal.className = 'text-5xl font-black tracking-tight text-emerald-400';
        heroNote.innerText= modeLabel + ' · 毛利率 ' + fmtP(grossMargin) + ' · ROI ' + fmtP(roi);
    } else {
        hero.className    = 'p-6 text-center rounded-2xl border border-rose-700/40 bg-rose-900/20';
        heroVal.className = 'text-5xl font-black tracking-tight text-rose-400';
        heroNote.innerText= modeLabel + ' · 虧損 · 請調整參數';
    }

    // Mode detail section
    const modeTitle   = document.getElementById('r-modeDetailTitle');
    const modeContent = document.getElementById('r-modeDetailContent');
    const rows = [];
    if (S.mode === 'joint') {
        modeTitle.innerText = '合建分售明細';
        const lr = parseFloat(document.getElementById('splitRatio').value);
        const totalSaleAreaDisp = (S.currentResult.totalSaleArea || 0);
        const builderSaleAreaDisp = (S.currentResult.saleableArea || 0);
        const landlordSaleAreaDisp = Math.max(0, totalSaleAreaDisp - builderSaleAreaDisp);
        rows.push(['地主分回比例', lr + '%'], ['建方分回比例', (100-lr) + '%'],
                  ['全案樓地板面積', (S.currentResult.totalFloorArea||0).toFixed(0) + ' 坪'],
                  ['全案總銷售面積', totalSaleAreaDisp.toFixed(0) + ' 坪'],
                  ['建方可售面積', builderSaleAreaDisp.toFixed(0) + ' 坪'],
                  ['地主分配面積', landlordSaleAreaDisp.toFixed(0) + ' 坪']);
        if (buildLoanR > 0) {
            rows.push(['建築(自有)', fmt(buildOwnAmt)], ['建築(融資)', fmt(buildLoanAmt)]);
        }
        rows.push(['土地成本', '無現金支出（地主以土地入股）']);
        if (advisorCost > 0) rows.push(['顧問設計費', fmt(advisorCost)]);
        if (trustCost > 0) rows.push(['信託費用', fmt(trustCost)]);
        if (salesCost > 0) rows.push(['銷售費用', fmt(salesCost)]);
        rows.push(['管銷費用', fmt(adminCost)], ['融資利息', fmt(interest)],
                  ['建方總成本', fmt(totalCost)], ['建方銷售收益', fmt(totalRev)]);
    } else if (S.mode === 'purchase') {
        modeTitle.innerText = '土地買斷明細';
        if (landLoanR > 0 && baseLandCost > 0) {
            rows.push(['土地(自有)', fmt(landOwnAmt)], ['土地(融資)', fmt(landLoanAmt)]);
        } else {
            rows.push(['土地購入成本', fmt(landCost)]);
        }
        if (buildLoanR > 0) {
            rows.push(['建築(自有)', fmt(buildOwnAmt)], ['建築(融資)', fmt(buildLoanAmt)]);
        } else {
            rows.push(['建築工程造價', fmt(buildCost)]);
        }
        rows.push(['顧問設計費', fmt(advisorCost)], ['信託費用', fmt(trustCost)], ['銷售費用', fmt(salesCost)],
                  ['管銷費用', fmt(adminCost)], ['融資利息', fmt(interest)],
                  ['全案總成本', fmt(totalCost)], ['全案銷售收益', fmt(totalRev)]);
    } else {
        modeTitle.innerText = '混合模式明細';
        const mp = parseFloat(document.getElementById('mixedPurchaseRatio').value)||0;
        rows.push(['買斷比例', mp.toFixed(1)+'%'], ['合建比例', (100-mp).toFixed(1)+'%']);
        if (landLoanR > 0 && baseLandCost > 0) {
            rows.push(['土地買入(自有)', fmt(landOwnAmt)], ['土地買入(融資)', fmt(landLoanAmt)]);
        } else {
            rows.push(['土地買入成本', fmt(landCost)]);
        }
        if (buildLoanR > 0) {
            rows.push(['建築(自有)', fmt(buildOwnAmt)], ['建築(融資)', fmt(buildLoanAmt)]);
        } else {
            rows.push(['建築造價', fmt(buildCost)]);
        }
        rows.push(['顧問設計費', fmt(advisorCost)], ['信託費用', fmt(trustCost)], ['銷售費用', fmt(salesCost)],
                  ['管銷＋利息', fmt(adminCost + interest)], ['全案總成本', fmt(totalCost)], ['全案銷售收益', fmt(totalRev)]);
    }
    modeContent.innerHTML = rows.map(([k,v]) =>
        `<div class="flex justify-between py-1.5 border-b border-slate-800/60"><span class="text-slate-400">${k}</span><span class="font-mono text-white">${v}</span></div>`
    ).join('');

    // 同步更新折疊高度（若目前展開中才重設高度，避免蓋掉折疊狀態）
    initModeDetail();
    // Profit donut chart
    const pCtx = document.getElementById('profitChart').getContext('2d');
    if (profitChart) profitChart.destroy();
    const safeProfit = Math.max(netProfit, 0);
    const hasData    = totalRev > 0;
    if (hasData) {
        const labels = [], data = [], bgColors = [], bdColors = [];
        
        // Land Cost breakdown in chart
        if (landCost > 0) {
            if (landLoanR > 0 && baseLandCost > 0) {
                labels.push('土地(自有)'); data.push(landOwnAmt); bgColors.push('rgba(251,191,36,.75)'); bdColors.push('#fbbf24');
                labels.push('土地(融資)'); data.push(landLoanAmt); bgColors.push('rgba(251,191,36,.45)'); bdColors.push('#d97706');
            } else {
                labels.push('土地成本'); data.push(landCost); bgColors.push('rgba(251,191,36,.7)'); bdColors.push('#fbbf24');
            }
        }
        
        // Construction Cost breakdown in chart
        if (buildLoanR > 0) {
            labels.push('建築(自有)'); data.push(buildOwnAmt); bgColors.push('rgba(56,189,248,.75)'); bdColors.push('#38bdf8');
            labels.push('建築(融資)'); data.push(buildLoanAmt); bgColors.push('rgba(56,189,248,.45)'); bdColors.push('#0284c7');
        } else {
            labels.push('建築造價'); data.push(buildCost); bgColors.push('rgba(56,189,248,.7)'); bdColors.push('#38bdf8');
        }
        
        labels.push('管銷費用'); data.push(adminCost); bgColors.push('rgba(148,163,184,.5)'); bdColors.push('#94a3b8');
        if (interest > 0)  { labels.push('融資利息'); data.push(interest);  bgColors.push('rgba(251,191,36,.4)');  bdColors.push('#fbbf24'); }
        if (advisorCost > 0) { labels.push('顧問設計費'); data.push(advisorCost); bgColors.push('rgba(168,85,247,.6)'); bdColors.push('#a855f7'); }
        if (trustCost > 0) { labels.push('信託費用'); data.push(trustCost); bgColors.push('rgba(236,72,153,.6)'); bdColors.push('#ec4899'); }
        if (salesCost > 0) { labels.push('銷售費用'); data.push(salesCost); bgColors.push('rgba(239,68,68,.6)'); bdColors.push('#ef4444'); }
        
        // Custom Costs in chart
        if (S.customCosts.length > 0) {
            S.customCosts.forEach((c, idx) => {
                labels.push(c.name);
                data.push(c.amount);
                const opacity = 0.5 + (idx % 3) * 0.1;
                bgColors.push(`rgba(99,102,241,${opacity})`); // indigo
                bdColors.push('#6366f1');
            });
        }

        if (safeProfit > 0){ labels.push('開發利潤'); data.push(safeProfit);bgColors.push('rgba(52,211,153,.7)'); bdColors.push('#34d399'); }
        profitChart = new Chart(pCtx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: bgColors, borderColor: bdColors, borderWidth: 2, hoverOffset: 8 }] },
            options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 }, padding: 10, usePointStyle: true } },
                    tooltip: { callbacks: { label: c => ' ' + c.label + ': ' + Math.round(c.raw).toLocaleString() + ' 萬' } }
                }
            }
        });
    } else {
        profitChart = new Chart(pCtx, {
            type: 'doughnut',
            data: { labels:['尚未計算'], datasets:[{ data:[1], backgroundColor:['rgba(51,65,85,.5)'], borderColor:['#334155'], borderWidth:1 }] },
            options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }, tooltip:{ enabled:false } }, cutout:'60%' }
        });
    }

    // Restore active element focus and selection
    if (activeElementId === 'costListAdminRate' || 
        activeElementId === 'costListAdvisorRate' || 
        activeElementId === 'costListTrustRate' || 
        activeElementId === 'costListSalesRate' || 
        activeElementId === 'kpiListTaxRate') {
        const newEl = document.getElementById(activeElementId);
        if (newEl) {
            newEl.focus();
            if (activeSelectionStart !== null) {
                try {
                    newEl.setSelectionRange(activeSelectionStart, activeSelectionEnd);
                } catch (e) {}
            }
        }
    }
}


// ─── Cost trend chart (Tab 2) ───
function updateCostChart(brandMult, siteMult, smart, green, bType, facade, unit) {
    const ctx    = document.getElementById('costChart').getContext('2d');
    const floors = [1,10,20,30,40,50];
    const inflationInp = document.getElementById('c-costInflation');
    const inflationVal = inflationInp ? (parseFloat(inflationInp.value) || 0) : 0;
    const costInflation = inflationVal / 100;
    const getData = key => floors.map(f => {
        let a = f > 15 ? (f-15)*0.015 : 0;
        if (f > 25) a += (f-25)*0.02;
        return (BASE_RATES[key] * brandMult * siteMult * (1 + a + smart + green + facade + unit) * (1 + costInflation)).toFixed(1);
    });
    if (costChart) costChart.destroy();
    costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: floors.map(f => f+'F'),
            datasets: [
                { label:'RC', data:getData('RC'),  borderColor:'#38bdf8', tension:0.3, borderWidth:currentStruct==='RC'?3:1,  borderDash:currentStruct==='RC'?[]:[5,5], pointRadius:3 },
                { label:'SRC',data:getData('SRC'), borderColor:'#fbbf24', tension:0.3, borderWidth:currentStruct==='SRC'?3:1, borderDash:currentStruct==='SRC'?[]:[5,5],pointRadius:3 },
                { label:'SC', data:getData('SC'),  borderColor:'#f43f5e', tension:0.3, borderWidth:currentStruct==='SC'?3:1,  borderDash:currentStruct==='SC'?[]:[5,5], pointRadius:3 },
                { label:'SS', data:getData('SS'),  borderColor:'#a855f7', tension:0.3, borderWidth:currentStruct==='SS'?3:1,  borderDash:currentStruct==='SS'?[]:[5,5], pointRadius:3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display:true, position:'top', labels:{ color:'#94a3b8', font:{size:9}, usePointStyle:true, padding:12 } },
                tooltip: { mode:'index', intersect:false, backgroundColor:'rgba(15,23,42,.9)', titleColor:'#38bdf8', bodyColor:'#f1f5f9', borderColor:'rgba(255,255,255,.1)', borderWidth:1 }
            },
            scales: {
                y: { grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#64748b', font:{size:9} } },
                x: { grid:{ display:false }, ticks:{ color:'#64748b', font:{size:9} } }
            }
        }
    });
}


// ─── Cost breakdown table (Tab 2) ───
function updateCostTable(unitCost, mepRatio, totalGFA, W) {
    const cats = [
        { id:'hypothetical', name:'假設工程', desc:'放樣、安全圍籬及防護工程' },
        { id:'foundation',   name:'基礎工程', desc:'土方開挖、連續壁與地質改良' },
        { id:'structure',    name:'結構工程', desc:'主體結構鋼筋、模板、混凝土及SC' },
        { id:'decoration',   name:'裝修工程', desc:'外牆裝飾、室內裝修與油漆泥作' },
        { id:'equipment',    name:'機電設備', desc:'給排水、強弱電、消防與空調工程' },
        { id:'landscape',    name:'景觀工程', desc:'景觀綠化、一樓公共空間與植栽' },
        { id:'mep',          name:'設計監造', desc:'建築設計、規劃、監造及行政規費' },
        { id:'management',   name:'管理與管銷', desc:'工程管理、工地安全與建商管銷' }
    ];
    const tbody = document.getElementById('costTable');
    tbody.innerHTML = '';
    cats.forEach(cat => {
        const w   = cat.id === 'mep' ? mepRatio : (W[cat.id] * (1 - (mepRatio - W.mep) / (1 - W.mep)));
        const ic  = unitCost * w;
        const tot = (ic * totalGFA).toLocaleString(undefined, {maximumFractionDigits:0});
        tbody.innerHTML += `<tr class="tbl-row">
            <td class="px-4 py-3 text-white font-medium">${cat.name} (${(w*100).toFixed(1)}%)</td>
            <td class="px-4 py-3 text-slate-500 text-[9px]">${cat.desc}</td>
            <td class="px-4 py-3 text-right font-mono text-sky-400">${ic.toFixed(1)}</td>
            <td class="px-4 py-3 text-right font-mono text-rose-400">${tot}</td>
        </tr>`;
    });
}

function switchPptStyle(style) {
    S.pptStyle = style;
    const darkBtn  = document.getElementById('ppt-style-dark');
    const lightBtn = document.getElementById('ppt-style-light');
    if (style === 'dark') {
        if (darkBtn)  darkBtn.className  = 'px-3 py-1 bg-purple-600 border border-purple-500/50 text-white text-[10px] font-bold rounded-lg transition-all';
        if (lightBtn) lightBtn.className = 'px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold rounded-lg transition-all';
    } else {
        if (darkBtn)  darkBtn.className  = 'px-3 py-1 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold rounded-lg transition-all';
        if (lightBtn) lightBtn.className = 'px-3 py-1 bg-amber-500 border border-amber-400/50 text-white text-[10px] font-bold rounded-lg transition-all';
    }
}

function copyAIContent() {
    const content = document.getElementById('aiContent').innerText;
    navigator.clipboard.writeText(content).then(() => {
        alert('已複製至剪貼板');
    }).catch(() => {
        const el = document.createElement('textarea');
        el.value = content;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('已複製');
    });
}

function importAIToSlides() {
    const content = document.getElementById('aiContent').innerText;
    if (!content || content.trim().length === 0 || content.includes('分析失敗') || content.includes('連線異常')) {
        alert('請先點擊「生成全案 AI 分析報告」，待生成成功後再行匯入。');
        return;
    }
    importedAIReportText = content;
    
    // Change button text/color to show success
    const btn = document.getElementById('btn-import-slides');
    if (btn) {
        btn.innerHTML = '✅ 已匯入簡報';
        btn.classList.replace('text-sky-200', 'text-emerald-200');
        btn.classList.replace('bg-sky-600/30', 'bg-emerald-600/30');
        btn.classList.replace('border-sky-500/40', 'border-emerald-500/40');
        setTimeout(() => {
            btn.innerHTML = '匯入簡報';
            btn.classList.replace('text-emerald-200', 'text-sky-200');
            btn.classList.replace('bg-emerald-600/30', 'bg-sky-600/30');
            btn.classList.replace('border-sky-500/40', 'border-sky-500/40');
        }, 3000);
    }
    alert('🎉 已成功將 AI 分析報告匯入全案簡報！\n在您點擊「匯出 15 頁全案簡報 PPTX」時，系統將自動從 AI 報告中擷取對應章節，替換並豐富簡報的診斷分析。');
}

function copyLegalContent() {
    // 對應 inline 區塊或 modal
    const inlineTxt  = document.getElementById('reg-ai-inline-text');
    const modalTxt   = document.getElementById('ai-reg-result-text');
    const content    = (inlineTxt && !inlineTxt.classList.contains('hidden') && inlineTxt.innerText.trim())
                     ? inlineTxt.innerText
                     : (modalTxt && modalTxt.innerText.trim() ? modalTxt.innerText : '');
    if (!content) {
        alert('請先點擊「AI 分析法規」，待分析完成後再複製。');
        return;
    }
    navigator.clipboard.writeText(content).then(() => {
        alert('已複製 AI 法規分析內容至剪貼板！');
    }).catch(() => {
        try {
            const el = document.createElement('textarea');
            el.value = content;
            el.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alert('已複製');
        } catch(e2) {
            alert('複製失敗，請手動選取內容後複製。');
        }
    });
}

function importLegalToSlides() {
    const inlineTxt  = document.getElementById('reg-ai-inline-text');
    const modalTxt   = document.getElementById('ai-reg-result-text');
    const content    = (inlineTxt && !inlineTxt.classList.contains('hidden') && inlineTxt.innerText.trim())
                     ? inlineTxt.innerText
                     : (modalTxt && modalTxt.innerText.trim() ? modalTxt.innerText : '');
    if (!content) {
        alert('請先點擊「AI 分析法規」，待分析完成後再匯入簡報。');
        return;
    }
    importedAIReportText = (importedAIReportText ? importedAIReportText + '\n\n' : '') +
        '【AI 法規智慧適法性分析】\n' + content;

    const btn = document.getElementById('btn-import-legal-slides');
    if (btn) {
        const origHtml = btn.innerHTML;
        const origCls  = btn.className;
        btn.innerHTML = '✅ 已匯入簡報';
        btn.className = origCls
            .replace('text-sky-300',     'text-emerald-300')
            .replace('bg-sky-600/25',    'bg-emerald-600/25')
            .replace('border-sky-500/40','border-emerald-500/40');
        setTimeout(() => { btn.innerHTML = origHtml; btn.className = origCls; }, 3000);
    }
    alert('🎉 已成功將 AI 法規分析報告匯入全案簡報！\n在您點擊「匯出 15 頁全案簡報 PPTX」時，系統將自動將法規分析內容融入簡報的法規診斷章節。');
}

function parseAIReportSections(text) {
    let feasibility = "";
    let risks = "";
    let suggestions = "";
    
    if (!text) return null;
    
    const fMatch = text.match(/(?:1\.|一、|可行性評估)[\s\S]*?(?=(?:2\.|二、|風險提示|3\.|三、|優化建議|$))/);
    if (fMatch) {
        feasibility = fMatch[0].replace(/^(?:1\.|一、|可行性評估)[:：\s]*/, '').trim();
    }
    
    const rMatch = text.match(/(?:2\.|二、|風險提示)[\s\S]*?(?=(?:3\.|三、|優化建議|$))/);
    if (rMatch) {
        risks = rMatch[0].replace(/^(?:2\.|二、|風險提示)[:：\s]*/, '').trim();
    }
    
    const sMatch = text.match(/(?:3\.|三、|優化建議)[\s\S]*/);
    if (sMatch) {
        suggestions = sMatch[0].replace(/^(?:3\.|三、|優化建議)[:：\s]*/, '').trim();
    }
    
    return {
        feasibility: feasibility || null,
        risks: risks || null,
        suggestions: suggestions || null
    };
}

function copyPromptAndOpenGemini() {
    const prompt = lastAIPrompt || '';
    if (!prompt) {
        alert('尚未產生試算資料，請先填寫土地與試算參數');
        return;
    }
    navigator.clipboard.writeText(prompt).then(() => {
        alert('🎉 提示詞已複製！即將開啟網頁版 Gemini。請在對話框內直接「貼上 (Ctrl+V)」即可進行分析。');
        window.open('https://gemini.google.com/', '_blank');
    }).catch(err => {
        console.warn('Failed to use clipboard API, retrying via textarea fallback...', err);
        try {
            const ta = document.createElement('textarea');
            ta.value = prompt;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert('🎉 提示詞已複製！即將開啟網頁版 Gemini。請在對話框內直接「貼上 (Ctrl+V)」即可進行分析。');
            window.open('https://gemini.google.com/', '_blank');
        } catch (e2) {
            alert('複製失敗，請手動複製提示詞。');
        }
    });
}

async function generateAIReport() {
    if (!apiKey) {
        alert('請先在「✨ AI」頁面設定您的 Gemini API Key');
        return;
    }
    const r   = S.currentResult;
    const loc = document.getElementById('location').value || '未指定';
    const modeLabel = { joint:'合建分售', purchase:'土地買斷', mixed:'混合模式' }[S.mode];
    const aiSection = document.getElementById('aiSection');
    const aiLoading = document.getElementById('aiLoading');
    const aiContent = document.getElementById('aiContent');
    
    if (aiSection) aiSection.classList.remove('hidden');
    if (aiLoading) aiLoading.classList.remove('hidden');
    if (aiContent) aiContent.innerHTML = '';
    
    const prompt = `請以不動產開發顧問角色，針對以下土地開發案進行專業分析：
地點：${loc} | 模式：${modeLabel}
預估淨利：${Math.round(r.netProfit||0).toLocaleString()}萬 | ROI：${(r.roi||0).toFixed(1)}%
毛利率：${(r.grossMargin||0).toFixed(1)}% | BEP售價：${(r.bepPrice||0).toFixed(1)}萬/坪
推案單價：${r.avgPrice||0}萬/坪 | 建築造價：${(r.costPerFloor||0).toFixed(1)}萬/坪(樓板)
請提供：1.可行性評估 2.風險提示 3.優化建議，回覆使用繁體中文。`;
    lastAIPrompt = prompt;
    
    const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                        (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash' : 
                        apiModel;

    try {
        let res  = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
            { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }] }) });
        let data = await res.json();
        
        if (data.error && (data.error.message.includes('quota') || data.error.message.includes('Quota') || data.error.message.includes('limit'))) {
            const fallbackModel = (actualModel === 'gemini-2.0-flash') ? 'gemini-1.5-flash' : 'gemini-2.0-flash';
            console.warn(`Report generation hit limit, retrying on fallback model ${fallbackModel} on v1beta...`);
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`,
                { method:'POST', headers:{'Content-Type':'application/json'},
                  body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }] }) });
            data = await res.json();
        }
        
        if (aiLoading) aiLoading.classList.add('hidden');
        if (data.error) {
            let errorMsg = '';
            if (data.error.message.includes('quota') || data.error.message.includes('Quota') || data.error.message.includes('limit')) {
                errorMsg = '分析失敗：已超出您的 Gemini API 額度限制 (Quota Exceeded / Rate Limit)。請稍候 1 分鐘後再試，或在上方「Gemini API Key 設定」中改選其他模型。';
            } else if (data.error.message.includes('unregistered callers') || data.error.message.includes('API key') || data.error.message.includes('consumer identity')) {
                errorMsg = '分析失敗：金鑰無效或 API 未啟用 (Invalid API Key)。請確認您輸入的 Gemini API Key 是否正確。';
            } else {
                errorMsg = '分析失敗：' + data.error.message;
            }
            
            if (aiContent) {
                aiContent.innerHTML = `<div class="text-rose-400 font-bold">${errorMsg}</div>
                    <div class="mt-4 p-3.5 bg-purple-900/20 border border-purple-500/20 rounded-xl space-y-2">
                        <p class="text-[11px] text-purple-300 font-medium leading-normal">💡 您也可以點擊下方按鈕，直接將本案的完整試算數據複製到剪貼簿，並開啟您的個人免費版 Gemini 網頁進行生成：</p>
                        <button onclick="copyPromptAndOpenGemini()" type="button" class="tap w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-500/20 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-md">
                            📋 複製分析提示詞並前往 Gemini 網頁版
                        </button>
                    </div>`;
            }
        } else {
            if (aiContent) aiContent.innerText = data.candidates?.[0]?.content?.parts?.[0]?.text || '分析失敗，請稍後再試';
        }
    } catch(e) {
        if (aiLoading) aiLoading.classList.add('hidden');
        if (aiContent) {
            aiContent.innerHTML = `<div class="text-rose-400 font-bold">連線異常，請確認網路或金鑰狀態：${e.message}</div>
                <div class="mt-4 p-3.5 bg-purple-900/20 border border-purple-500/20 rounded-xl space-y-2">
                    <p class="text-[11px] text-purple-300 font-medium leading-normal">💡 您也可以點擊下方按鈕，直接將本案的完整試算數據複製到剪貼簿，並開啟您的個人免費版 Gemini 網頁進行生成：</p>
                    <button onclick="copyPromptAndOpenGemini()" type="button" class="tap w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-500/20 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-md">
                        📋 複製分析提示詞並前往 Gemini 網頁版
                    </button>
                </div>`;
        }
    }
}

function renderChatHistory() {
    const area = document.getElementById('chatHistoryArea');
    if (!area) return;
    
    if (chatMessages.length === 0) {
        area.innerHTML = `
            <div class="text-[10px] text-purple-400/70 text-center py-4">
                💡 您可以詢問本案相關的開發策略、ROI 優化或財務問題。<br>
                AI 助理會自動帶入目前試算數據進行分析！
            </div>
        `;
        return;
    }
    
    let html = '';
    chatMessages.forEach(msg => {
        if (msg.role === 'user') {
            html += `
                <div class="flex justify-end">
                    <div class="max-w-[85%] bg-purple-600 text-white text-xs px-3 py-2 rounded-2xl rounded-tr-none shadow-sm break-words">
                        ${msg.text}
                    </div>
                </div>
            `;
        } else {
            let formattedText = msg.text
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/•\s*(.*?)/g, '• $1');
                
            html += `
                <div class="flex justify-start items-start gap-1.5">
                    <div class="text-xs">🤖</div>
                    <div class="max-w-[85%] bg-slate-900 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-2xl rounded-tl-none shadow-sm break-words leading-relaxed">
                        ${formattedText}
                    </div>
                </div>
            `;
        }
    });
    
    area.innerHTML = html;
    area.scrollTop = area.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) return;
    
    if (!apiKey) {
        alert('請先在「✨ AI」頁面設定您的 Gemini API Key');
        return;
    }
    
    chatMessages.push({ role: 'user', text: text });
    input.value = '';
    renderChatHistory();
    
    const loadingHtml = `
        <div class="flex justify-start items-start gap-1.5" id="chat-loading-msg">
            <div class="text-xs">🤖</div>
            <div class="bg-slate-900 border border-slate-800 text-slate-400 text-xs px-3 py-2 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                <div class="animate-spin rounded-full h-3 w-3 border-t border-b border-purple-500"></div>
                思考中...
            </div>
        </div>
    `;
    const area = document.getElementById('chatHistoryArea');
    if (area) {
        area.innerHTML += loadingHtml;
        area.scrollTop = area.scrollHeight;
    }
    
    const r = S.currentResult || {};
    const loc = document.getElementById('location').value || '未指定';
    const modeLabel = { joint:'合建分售', purchase:'土地買斷', mixed:'混合模式' }[S.mode] || '合建分售';
    const landArea = (r.landArea || 0).toFixed(1);
    const totalGFA = Math.round(r.totalFloorArea || 0);
    const saleable = Math.round(r.totalSaleArea || 0);
    const netProfit = Math.round(r.netProfit || 0);
    const roi = (r.roi || 0).toFixed(1);
    const margin = (r.grossMargin || 0).toFixed(1);
    const bep = Math.round(r.bepPrice || 0);
    const avgPrice = r.avgPrice || 0;
    const landCost = Math.round(r.totalLandCost || 0);
    const constCost = Math.round(r.totalConstructionCost || 0);
    const notes = document.getElementById('projectNotesArea')?.value || '無';
    
    let contextPrompt = `您是專業的台灣不動產開發與財務投資顧問 AI 助理。
目前評估的開發案指標如下：
- 基地位置：${loc}
- 開發模式：${modeLabel}
- 基地面積：${landArea} 坪
- 總樓地板面積 (GFA)：${totalGFA} 坪
- 可銷售總坪數：${saleable} 坪
- 推案預估單價：${avgPrice} 萬/坪
- 損益平衡單價 (BEP)：${bep} 萬/坪
- 預估土地取得成本：${landCost} 萬元
- 預估總營造成本：${constCost} 萬元
- 建方預估開發淨利：${netProfit} 萬元
- 預估投資報酬率 (ROI)：${roi} %
- 預估毛利率：${margin} %
- 本案備忘備註：${notes}

以下是您與使用者（開發團隊成員）的歷史對話：
`;

    const historySlice = chatMessages.slice(-7, -1);
    historySlice.forEach(msg => {
        contextPrompt += `${msg.role === 'user' ? '使用者' : '助理 (🤖)'}：${msg.text}\n`;
    });
    
    contextPrompt += `\n現在，使用者提出了新的問題，請根據當前數據與備註，以專業、精簡、符合台灣不動產術語的方式回覆：\n"${text}"\n\n回覆限 150 字以內，用繁體中文。`;

    const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                        (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash' : 
                        apiModel;

    try {
        let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
            { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ contents:[{ parts:[{ text:contextPrompt }] }] }) });
        let data = await res.json();
        
        if (data.error && (data.error.message.includes('quota') || data.error.message.includes('Quota') || data.error.message.includes('limit'))) {
            const fallbackModel = (actualModel === 'gemini-2.0-flash') ? 'gemini-1.5-flash' : 'gemini-2.0-flash';
            console.warn(`Assistant chat hit limit, retrying on fallback model ${fallbackModel} on v1beta...`);
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`,
                { method:'POST', headers:{'Content-Type':'application/json'},
                  body: JSON.stringify({ contents:[{ parts:[{ text:contextPrompt }] }] }) });
            data = await res.json();
        }
        
        const loader = document.getElementById('chat-loading-msg');
        if (loader) loader.remove();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，助理暫時無法生成回應。';
        chatMessages.push({ role: 'model', text: reply.trim() });
        renderChatHistory();
        
    } catch (e) {
        const loader = document.getElementById('chat-loading-msg');
        if (loader) loader.remove();
        
        let errMsg = e.message;
        if (errMsg.includes('quota') || errMsg.includes('Quota') || errMsg.includes('limit')) {
            errMsg = '超出 API 限制。請稍後再試。';
        }
        chatMessages.push({ role: 'model', text: `❌ 助理連線失敗：${errMsg}` });
        renderChatHistory();
    }
}

function toggleShopAreaManual() {
    const isManual = document.getElementById('shopAreaManualToggle').checked;
    const input = document.getElementById('shopAreaDisplay');
    if (isManual) {
        input.readOnly = false;
        const val = parseFloat(input.value) || 0;
        input.value = val > 0 ? val.toFixed(1) : '';
        input.placeholder = '請輸入坪數';
        input.focus();
    } else {
        input.readOnly = true;
        input.placeholder = '';
    }
    calculateAll();
}

function toggleStdFloorManual() {
    const isManual = document.getElementById('stdFloorManualToggle').checked;
    const container = document.getElementById('stdFloorSliderContainer');
    const modeSelect = document.getElementById('stdFloorModeSelector');
    if (isManual) {
        container.classList.remove('hidden');
        if (modeSelect) modeSelect.disabled = true;
    } else {
        container.classList.add('hidden');
        if (modeSelect) modeSelect.disabled = false;
    }
    calculateAll();
}


// 動態渲染戶型列表
function renderUnitLayouts() {
    const container = document.getElementById('unitTypesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    S.unitLayouts.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'far-item flex items-center gap-1.5';
        div.innerHTML = `
            <input type="number" class="inp text-center text-xs text-blue-300 font-bold" 
                   style="flex: 1.2; padding: 0.5rem 0.25rem;" 
                   placeholder="坪數" min="0" step="0.1" value="${item.area}" 
                   oninput="updateUnitTypeData(${index}, 'area', this.value)">
            <span class="text-slate-500 font-bold text-xs">×</span>
            <input type="number" class="inp text-center text-xs text-blue-300 font-bold" 
                   style="flex: 1; padding: 0.5rem 0.25rem;" 
                   placeholder="戶數" min="0" step="1" value="${item.count}" 
                   oninput="updateUnitTypeData(${index}, 'count', this.value)">
            <span class="text-slate-500 font-bold text-xs">=</span>
            <span class="subtotal-span text-slate-400 font-mono text-xs text-right" style="min-width: 60px;">
                ${(item.area * item.count).toFixed(1)} 坪
            </span>
            <button type="button" class="far-del" onclick="removeUnitTypeRow(${index})">×</button>
        `;
        container.appendChild(div);
    });
}


// 新增一列
function addUnitTypeRow(area = 30, count = 2) {
    S.unitLayouts.push({ area, count });
    try {
        localStorage.setItem('s_unitLayouts', JSON.stringify(S.unitLayouts));
    } catch (e) {}
    renderUnitLayouts();
    calculateAll();
}


// 刪除一列
function removeUnitTypeRow(index) {
    S.unitLayouts.splice(index, 1);
    try {
        localStorage.setItem('s_unitLayouts', JSON.stringify(S.unitLayouts));
    } catch (e) {}
    renderUnitLayouts();
    calculateAll();
}


// 變更欄位數值
function updateUnitTypeData(index, field, value) {
    if (field === 'area') {
        S.unitLayouts[index].area = parseFloat(value) || 0;
    } else if (field === 'count') {
        S.unitLayouts[index].count = parseInt(value) || 0;
    }
    try {
        localStorage.setItem('s_unitLayouts', JSON.stringify(S.unitLayouts));
    } catch (e) {}
    
    // 即時重新計算與更新該列的小計，不重新渲染整表以防止失去焦點
    const container = document.getElementById('unitTypesContainer');
    if (container) {
        const rows = container.querySelectorAll('.far-item');
        if (rows[index]) {
            const subtotalSpan = rows[index].querySelector('.subtotal-span');
            if (subtotalSpan) {
                const item = S.unitLayouts[index];
                subtotalSpan.innerText = `${(item.area * item.count).toFixed(1)} 坪`;
            }
        }
    }
    calculateAll();
}

function toggleFloorsManual() {
    const isManual = document.getElementById('floorsManualToggle').checked;
    const slider = document.getElementById('c-floors');
    if (slider) {
        slider.disabled = !isManual;
        slider.style.opacity = isManual ? '1' : '0.55';
        slider.style.pointerEvents = isManual ? 'auto' : 'none';
    }
    calculateAll();
}

function onStdFloorSliderChange() {
    const val = parseFloat(document.getElementById('stdFloorSlider').value) || 0;
    document.getElementById('stdFloorSliderVal').innerText = val.toFixed(1) + ' 坪';
    document.getElementById('stdFloorAreaDisplay').value = val.toFixed(1) + ' 坪';
    calculateAll();
}


// ═══════════════════════════════════════
//  RESET
// ═══════════════════════════════════════
function resetAll() {
    if (!confirm('確定要重置所有資料嗎？')) return;
    ['landArea','floorAreaRatio','buildingCoverageRatio','saleFactor','avgPrice',
     'adminRate','salesRate','publicRatio','constructionCost','landPurchasePrice','mixedPurchasePrice',
     'mixedPurchaseArea','mixedPurchaseRatio','landLoanRatio','landLoanYears',
     'landLoanInterest','buildLoanRatio','buildLoanYears','buildLoanInterest',
     'transferLandlordRatio','m-soldRatio','m-parkingCount','m-parkingPrice',
     'basementFloors','excavationRate',
     'refAnnouncementValue', 'cashWeight', 'todValuationParam', 'mechanicalParkingSelect'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const defaults = { landArea:100, floorAreaRatio:225, buildingCoverageRatio:60, bonusRatio:20, transferRatio:0,
            saleFactor:1.58, avgPrice:60, adminRate:2.5, salesRate:5, publicRatio:35, constructionCost:20, landPurchasePrice:100,
            mixedPurchasePrice:100, mixedPurchaseArea:50, mixedPurchaseRatio:50,
            landLoanRatio:50, landLoanYears:5.0, landLoanInterest:3.0,
            buildLoanRatio:50, buildLoanYears:3.0, buildLoanInterest:3.0,
            transferLandlordRatio:10, 'm-soldRatio':90,
            'm-parkingCount':0, 'm-parkingPrice':150,
            basementFloors:3, excavationRate:60,
            refAnnouncementValue:10, cashWeight:160, todValuationParam:1.3, mechanicalParkingSelect:'none' };
        let val = defaults[id] ?? el.value;
        if (id === 'landLoanYears' || id === 'buildLoanYears') {
            val = parseFloat(val).toFixed(1);
        }
        el.value = val;
    });
    const modeFactor = document.getElementById('modeFactor');
    if (modeFactor) modeFactor.checked = true;
    
    document.getElementById('parkingModeSelector').value = 'all';
    document.getElementById('location').value = '';
    document.getElementById('splitRatio').value = 60;
    updateRatio(60);
    
    // 清除細項規劃顯示欄位
    document.getElementById('stdFloorModeSelector').value = 'single';
    document.getElementById('stdFloorManualToggle').checked = false;
    document.getElementById('shopAreaManualToggle').checked = false;
    document.getElementById('stdFloorSliderContainer').classList.add('hidden');
    document.getElementById('stdFloorModeSelector').disabled = false;
    document.getElementById('shopAreaDisplay').readOnly = true;
    document.getElementById('shopAreaDisplay').placeholder = '';
    document.getElementById('stdFloorAreaDisplay').value = '';
    document.getElementById('shopAreaDisplay').value = '';
    document.getElementById('floorCountAssessmentDisplay').innerText = '';
    document.getElementById('remainingFarDisplay').innerText = '';
    S.unitLayouts = [
        { area: 30, count: 4 },
        { area: 25, count: 4 },
        { area: 18, count: 4 }
    ];
    try {
        localStorage.setItem('s_unitLayouts', JSON.stringify(S.unitLayouts));
    } catch (e) {}
    renderUnitLayouts();
    const floorsToggle = document.getElementById('floorsManualToggle');
    if (floorsToggle) {
        floorsToggle.checked = false;
        const slider = document.getElementById('c-floors');
        if (slider) {
            slider.disabled = true;
            slider.style.opacity = '0.55';
            slider.style.pointerEvents = 'none';
        }
    }
    S.useMatrix = false;
    S.matrixConstMonths = 0;
    document.getElementById('costSrcBadge').innerText = '手動';
    document.getElementById('costSrcBadge').className = 'pill bg-slate-700 text-slate-400 normal-case font-medium';
    document.getElementById('aiSection').classList.add('hidden');
    document.getElementById('aiContent').innerText = '';
    const refMarketPriceLabel = document.getElementById('refMarketPriceLabel');
    if (refMarketPriceLabel) refMarketPriceLabel.innerText = '--';
    const formulaValEl = document.getElementById('m-bepFormulaValue');
    if (formulaValEl) formulaValEl.innerText = '--';
    const sliderValEl = document.getElementById('m-bepSliderVal');
    if (sliderValEl) sliderValEl.innerText = '90%';
    const bepBar = document.getElementById('m-bepBar');
    if (bepBar) bepBar.value = 90;
    const mqDefaults = { 'mq-m-res': 60, 'mq-m-off': 60, 'mq-m-ret': 90, 'mq-m-park': 150 };
    ['mq-m-res', 'mq-m-off', 'mq-m-ret', 'mq-m-park'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = mqDefaults[id];
    });
    if (salesRatioChart) {
        salesRatioChart.destroy();
        salesRatioChart = null;
    }
    apiModel = 'gemini-2.5-flash';
    try {
        localStorage.removeItem('gemini_api_model');
    } catch (e) {
        console.warn('Failed to remove gemini_api_model from localStorage:', e);
    }
    updateApiModelSelect();
    // Clear FAR panels
    // bonus (collapsible)
    document.getElementById('bonus-items-list').innerHTML = '';
    document.getElementById('bonusTotalPct').innerText = '0';
    document.getElementById('bonus-panel-body').classList.add('hidden');
    document.getElementById('bonus-toggle-icon').innerText = '＋';
    updateFarSummary('bonus');

    // transfer (collapsible)
    document.getElementById('transfer-items-list').innerHTML = '';
    document.getElementById('transferTotalPct').innerText = '0';
    document.getElementById('transfer-panel-body').classList.add('hidden');
    document.getElementById('transfer-toggle-icon').innerText = '＋';
    updateFarSummary('transfer');
    switchMode('joint');
    switchTab('land');

    // 重置智慧工期預估狀態與案型
    currentConstructionStandard = null;
    try {
        localStorage.removeItem('activeConstructionStandardCase');
    } catch (e) {}
    document.getElementById('c-buildingType').value = 'residential';
    document.getElementById('c-facadeType').value = '0';
    document.getElementById('c-unitDensity').value = '0';
    document.getElementById('c-smartLevel').value = '0';
    document.getElementById('c-greenLevel').value = '0';
    document.getElementById('c-brandLevel').value = '1.0';
    document.getElementById('c-siteScale').value = '1.0';
    document.getElementById('c-seismicLevel').value = 'none';
    currentStruct = 'RC';
    ['RC','SRC','SC','SS'].forEach(t => {
        document.getElementById('btn' + t).classList.toggle('active', t === 'RC');
    });
    autoMatchConstructionStandard();

    // 清除自訂項目與快取
    S.customCosts = [];
    S.customRevenues = [];
    S.customKpis = [];
    S.cadastral = [];
    S.cadastralCounty = '臺北市';
    S.cadastralDistrict = '中正區';
    S.cadastralZone = '';
    S.cadastralCollapsed = false;
    S.cadastralMaximized = false;
    try {
        localStorage.removeItem('s_customCosts');
        localStorage.removeItem('s_customRevenues');
        localStorage.removeItem('s_customKpis');
        localStorage.removeItem('s_cadastral');
        localStorage.setItem('s_cadastralCounty', '臺北市');
        localStorage.setItem('s_cadastralDistrict', '中正區');
        localStorage.setItem('s_cadastralZone', '');
        localStorage.setItem('s_cadastralCollapsed', 'false');
        localStorage.setItem('s_cadastralMaximized', 'false');
    } catch (e) {}
    S.summaryExpanded = { cost: true, revenue: true, kpi: true };
}

function toggleFarPanel(type) {
    const body = document.getElementById(type + '-panel-body');
    const icon = document.getElementById(type + '-toggle-icon');
    const isHidden = body.classList.toggle('hidden');
    icon.innerText = isHidden ? '＋' : '－';
    updateFarSummary(type);
}

function toggleUnitLayoutsPanel(forceState) {
    const body = document.getElementById('unit-layouts-panel-body');
    const icon = document.getElementById('unit-layouts-toggle-icon');
    if (!body || !icon) return;
    
    let isHidden;
    if (forceState !== undefined) {
        isHidden = !forceState;
        if (isHidden) {
            body.classList.add('hidden');
        } else {
            body.classList.remove('hidden');
        }
    } else {
        isHidden = body.classList.toggle('hidden');
    }
    
    icon.innerText = isHidden ? '＋' : '－';
    S.unitLayoutsExpanded = !isHidden;
    try {
        localStorage.setItem('s_unitLayoutsExpanded', S.unitLayoutsExpanded);
    } catch (e) {}
}

function dismissSplash() {
    const splash = document.getElementById('app-startup-splash');
    if (!splash) return;
    
    const video = document.getElementById('splashVideo');
    if (video) {
        try {
            video.pause();
        } catch (e) {}
    }
    
    splash.classList.add('opacity-0');
    splash.style.pointerEvents = 'none';
    
    try {
        sessionStorage.setItem('splash_dismissed', 'true');
    } catch (e) {}
    
    setTimeout(() => {
        splash.classList.add('hidden');
    }, 700);
}

function replaySplash() {
    const splash = document.getElementById('app-startup-splash');
    if (!splash) return;
    
    splash.style.display = 'flex';
    splash.classList.remove('hidden', 'opacity-0');
    splash.style.pointerEvents = 'auto';
    
    const video = document.getElementById('splashVideo');
    if (video) {
        try {
            video.currentTime = 0;
            video.muted = false;
            video.play();
        } catch (e) {
            console.error('Failed to replay video:', e);
        }
    }
}

function addFarItem(type, defaultVal, defaultPct) {
    try {

    const id   = 'fi-' + (++_farCnt);
    const opts = (type === 'bonus' ? FAR_BONUS_OPTIONS : FAR_TRANSFER_OPTIONS)
                    .map(o => `<option value="${o}">${o}</option>`).join('');
    const col  = type === 'bonus' ? '#34d399' : '#c084fc';
    const div  = document.createElement('div');
    div.id    = id;
    div.className = 'far-item';
    div.dataset.farType = type;

    // Determine initial select and pct values
    const selVal = defaultVal !== undefined ? defaultVal : (type === 'bonus' ? FAR_BONUS_OPTIONS[0] : FAR_TRANSFER_OPTIONS[0]);
    const pctVal = defaultPct !== undefined ? defaultPct : 0;
    const isCustom = selVal === '其它（手動填入）';

    div.innerHTML = `
        <div class="flex-1 min-w-0">
            <select class="inp w-full far-sel ${isCustom ? 'hidden' : ''}" style="font-size:13px;padding:0.55rem 0.5rem"
                    onchange="handleFarSelect(this,'${type}','${id}')">${opts}</select>
            <div class="far-custom-wrap ${isCustom ? '' : 'hidden'}">
                <input type="text" class="inp far-custom-inp w-full"
                       style="font-size:13px;padding:0.55rem 0.5rem"
                       placeholder="輸入自訂名稱…"
                       oninput="updateFarSummary('${type}')">
            </div>
        </div>
        <div class="far-pct-box">
            <input type="number" class="far-pct-inp" value="${pctVal}" min="0" max="999"
                   style="color:${col}" oninput="updateFarTotal('${type}')">
            <span class="text-slate-500 text-xs ml-0.5">%</span>
        </div>
        <button class="far-del" onclick="removeFarItem('${type}','${id}')">×</button>
    `;
    document.getElementById(type + '-items-list').appendChild(div);

    // Set value on select
    const sel = div.querySelector('.far-sel');
    if (sel) {
        sel.value = selVal;
        if (sel.value !== selVal) {
            // Value not found in options, treat as custom (手動填入)
            sel.value = '其它（手動填入）';
            sel.classList.add('hidden');
            const wrap = div.querySelector('.far-custom-wrap');
            if (wrap) wrap.classList.remove('hidden');
            const inp = div.querySelector('.far-custom-inp');
            if (inp) inp.value = selVal;
        }
    }

    const body = document.getElementById(type + '-panel-body');
    if (body.classList.contains('hidden')) toggleFarPanel(type);
    updateFarTotal(type);

    } catch (err) {
        alert('addFarItem error: ' + err.message + '\nStack: ' + err.stack);
        console.error(err);
    }
}

function removeFarItem(type, id) {
    const el = document.getElementById(id);
    if (el) el.remove();
    updateFarTotal(type);
}

function handleFarSelect(sel, type, id) {
    if (sel.value === '其它（手動填入）') {
        const item = document.getElementById(id);
        sel.classList.add('hidden');
        const wrap = item.querySelector('.far-custom-wrap');
        wrap.classList.remove('hidden');
        const inp = item.querySelector('.far-custom-inp');
        inp.placeholder = type === 'bonus' ? '輸入自訂獎勵名稱…' : '輸入自訂移入類型…';
        setTimeout(() => inp.focus(), 50);
    } else if (type === 'bonus') {
        // Mutual exclusion when changing dropdown manually
        const val = sel.value;
        if (val === '都更獎勵') {
            const list = document.getElementById('bonus-items-list');
            if (list) {
                list.querySelectorAll('.far-item').forEach(item => {
                    if (item.id !== id) {
                        const otherSel = item.querySelector('.far-sel');
                        if (otherSel && (otherSel.value === '危老獎勵' || otherSel.value === '規模/時程')) {
                            item.remove();
                        }
                    }
                });
            }
        } else if (val === '危老獎勵' || val === '規模/時程') {
            const list = document.getElementById('bonus-items-list');
            if (list) {
                list.querySelectorAll('.far-item').forEach(item => {
                    if (item.id !== id) {
                        const otherSel = item.querySelector('.far-sel');
                        if (otherSel && otherSel.value === '都更獎勵') {
                            item.remove();
                        }
                    }
                });
            }
        }
    }
    updateFarTotal(type);
}

function onModalDevTypeChange() {
    const devType = document.getElementById('modal-dev-type').value;
    const roadWidthSelect = document.getElementById('modal-road-width');
    if (roadWidthSelect) {
        if (devType === 'ur' || devType === 'ro') {
            roadWidthSelect.disabled = false;
            roadWidthSelect.classList.remove('opacity-50');
        } else {
            roadWidthSelect.disabled = true;
            roadWidthSelect.classList.add('opacity-50');
            roadWidthSelect.value = 'gt8'; // Reset to default
        }
    }
}

function confirmMapsAddress() {
    const modalAddrInput = document.getElementById('modal-address-input');
    const addr = modalAddrInput ? modalAddrInput.value.trim() : '';
    if (addr) {
        document.getElementById('location').value = addr;
        const aiLocDisp = document.getElementById('ai-locationDisplay');
        if (aiLocDisp) aiLocDisp.value = addr;
        updateLocationBadge();
        updateCasePlaceholders(addr);
        
        // ── 依地圖選取之開發類型與 TOD 級距自動套用主頁法規獎勵 ──
        const devType = document.getElementById('modal-dev-type').value;
        const roadWidth = document.getElementById('modal-road-width').value;
        const todRange = document.getElementById('modal-tod-range').value;
        
        // 1. 處理都更/危老與道路寬度
        if (devType === 'ur') {
            const lst = document.getElementById('bonus-items-list');
            const hasUR = lst ? [...lst.querySelectorAll('.far-sel')].some(sel => sel.value === '都更獎勵') : false;
            if (!hasUR) {
                let btn = document.querySelector('#reg-bonus-hints .reg-hint-row[data-far-key="都更獎勵"] .reg-apply-btn');
                if (btn) {
                    btn.classList.remove('applied');
                    applyRegBonus(btn);
                } else {
                    if (lst) {
                        [...lst.querySelectorAll('.far-item')].forEach(el => el.remove());
                        addFarItem('bonus', '都更獎勵', 50);
                    }
                }
            }
        } else if (devType === 'ro') {
            const lst = document.getElementById('bonus-items-list');
            const hasRO = lst ? [...lst.querySelectorAll('.far-sel')].some(sel => sel.value === '規模/時程' || sel.value === '危老獎勵') : false;
            if (!hasRO) {
                let btn = document.querySelector('#reg-bonus-hints .reg-hint-row[data-far-key="危老獎勵"] .reg-apply-btn') || 
                          document.querySelector('#reg-bonus-hints .reg-hint-row[data-far-key="規模/時程"] .reg-apply-btn');
                if (btn) {
                    btn.classList.remove('applied');
                    applyRegBonus(btn);
                } else {
                    if (lst) {
                        [...lst.querySelectorAll('.far-item')].forEach(el => el.remove());
                        addFarItem('bonus', '危老獎勵', 40);
                    }
                }
            }
        } else {
            // 一般案：清除主畫面中已套用的都更/危老獎勵項目
            const lst = document.getElementById('bonus-items-list');
            if (lst) {
                [...lst.querySelectorAll('.far-item')].forEach(el => {
                    const sel = el.querySelector('.far-sel');
                    if (sel && (sel.value === '都更獎勵' || sel.value === '規模/時程' || sel.value === '危老獎勵')) {
                        el.remove();
                    }
                });
                updateFarTotal('bonus');
            }
            // 還原速查中對應按鈕狀態
            document.querySelectorAll('#reg-bonus-hints .reg-hint-row .reg-apply-btn.applied').forEach(b => {
                const row = b.closest('[data-far-key]');
                if (row && (row.dataset.farKey === '都更獎勵' || row.dataset.farKey === '規模/時程' || row.dataset.farKey === '危老獎勵')) {
                    b.textContent = '＋套用';
                    b.classList.remove('applied');
                    b.onclick = function() { applyRegBonus(this); };
                }
            });
        }
        
        // 2. 處理 TOD 級距
        if (todRange !== 'none') {
            const lst = document.getElementById('transfer-items-list');
            const hasTOD = lst ? [...lst.querySelectorAll('.far-sel')].some(sel => sel.value === 'TOD增額') : false;
            if (!hasTOD) {
                let btn = document.querySelector('#reg-bonus-hints .reg-hint-row[data-far-key="TOD增額"] .reg-apply-btn');
                if (btn) {
                    btn.classList.remove('applied');
                    applyRegBonus(btn);
                } else {
                    if (lst) {
                        // 先移除現有的 TOD增額 避免重複
                        [...lst.querySelectorAll('.far-item')].forEach(el => {
                            const sel = el.querySelector('.far-sel');
                            if (sel && sel.value === 'TOD增額') el.remove();
                        });
                        addFarItem('transfer', 'TOD增額', 20); // 預設 20%
                    }
                }
            }
        } else {
            // 不適用：清除主畫面中已套用的 TOD增額
            const lst = document.getElementById('transfer-items-list');
            if (lst) {
                [...lst.querySelectorAll('.far-item')].forEach(el => {
                    const sel = el.querySelector('.far-sel');
                    if (sel && sel.value === 'TOD增額') {
                        el.remove();
                    }
                });
                updateFarTotal('transfer');
            }
            const btn = document.querySelector('#reg-bonus-hints .reg-hint-row[data-far-key="TOD增額"] .reg-apply-btn.applied');
            if (btn) {
                btn.textContent = '＋套用';
                btn.classList.remove('applied');
                btn.onclick = function() { applyRegBonus(this); };
            }
        }
        
        calculateAll();

        // ── 自動擷取地圖快照 ──
        const mapContainer = document.getElementById('in-app-map');
        if (mapContainer) {
            // 強制開啟並重繪 TOD 同心圓，確保捷運站關係完美呈現在簡報圖表中
            if (todRange !== 'none') {
                todCirclesEnabled = true;
                updateTodCircles();
            }
            // 將地圖中心精準聚焦對齊大頭針
            if (mapInstance && markerInstance) {
                mapInstance.setView(markerInstance.getLatLng(), mapInstance.getZoom());
            }

            const flashOverlay = document.createElement('div');
            flashOverlay.style.position = 'absolute';
            flashOverlay.style.inset = '0';
            flashOverlay.style.background = 'rgba(15,23,42,0.85)';
            flashOverlay.style.zIndex = '9999';
            flashOverlay.style.display = 'flex';
            flashOverlay.style.alignItems = 'center';
            flashOverlay.style.justify = 'center';
            flashOverlay.style.color = '#a855f7';
            flashOverlay.style.fontSize = '12px';
            flashOverlay.style.fontWeight = 'bold';
            flashOverlay.innerHTML = '📸 正在自動擷取地圖快照...';
            mapContainer.appendChild(flashOverlay);

            setTimeout(() => {
                html2canvas(mapContainer, {
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                    ignoreElements: (el) => {
                        return el === flashOverlay;
                    }
                }).then(canvas => {
                    S.mapScreenshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    flashOverlay.remove();
                    closeMapsModal();
                }).catch(err => {
                    console.error('Auto map screenshot failed:', err);
                    flashOverlay.remove();
                    closeMapsModal();
                });
            }, 250);
            return; // delay modal close until screenshot finishes
        }
    }
    closeMapsModal();
}

function updateLocationBadge() {
    const loc = (document.getElementById('location') || {}).value || '';
    const badge = document.getElementById('locationBadge');
    const badgeText = document.getElementById('locationBadgeText');
    if (!badge || !badgeText) return;
    if (loc.trim()) {
        badgeText.textContent = loc.trim();
        badgeText.className = 'text-blue-200 text-[11px] font-semibold truncate flex-1';
        badge.style.background = 'rgba(59,130,246,0.12)';
        badge.style.borderColor = 'rgba(59,130,246,0.45)';
    } else {
        badgeText.textContent = '— 尚未設定基地位置，點此選址 —';
        badgeText.className = 'text-slate-500 text-[11px] font-medium truncate flex-1';
        badge.style.background = 'rgba(59,130,246,0.04)';
        badge.style.borderColor = 'rgba(100,116,139,0.3)';
    }
}


// 動態更新鄰近個案參考案例與數據
function updateCasePlaceholders(address) {
    if (!address) return;
    const isTaipei = address.includes('台北') || address.includes('臺北') || address.includes('中山');
    if (isTaipei) {
        if (document.getElementById('case-res-name')) document.getElementById('case-res-name').value = "民權尊爵大樓";
        if (document.getElementById('case-res-area')) document.getElementById('case-res-area').value = 40.5;
        if (document.getElementById('case-res-total')) document.getElementById('case-res-total').value = 3848;
        
        if (document.getElementById('case-ret-name')) document.getElementById('case-ret-name').value = "民權東路黃金店面";
        if (document.getElementById('case-ret-area')) document.getElementById('case-ret-area').value = 50.0;
        if (document.getElementById('case-ret-total')) document.getElementById('case-ret-total').value = 7500;
        
        if (document.getElementById('case-park-name')) document.getElementById('case-park-name').value = "民權東路坡道平面車位";
        if (document.getElementById('case-park-count')) document.getElementById('case-park-count').value = 2;
        if (document.getElementById('case-park-total')) document.getElementById('case-park-total').value = 600;
    } else {
        if (document.getElementById('case-res-name')) document.getElementById('case-res-name').value = "東村齊云";
        if (document.getElementById('case-res-area')) document.getElementById('case-res-area').value = 45.2;
        if (document.getElementById('case-res-total')) document.getElementById('case-res-total').value = 2938;
        
        if (document.getElementById('case-ret-name')) document.getElementById('case-ret-name').value = "中原路金座";
        if (document.getElementById('case-ret-area')) document.getElementById('case-ret-area').value = 55.8;
        if (document.getElementById('case-ret-total')) document.getElementById('case-ret-total').value = 5580;
        
        if (document.getElementById('case-park-name')) document.getElementById('case-park-name').value = "中原一街平面車位";
        if (document.getElementById('case-park-count')) document.getElementById('case-park-count').value = 2;
        if (document.getElementById('case-park-total')) document.getElementById('case-park-total').value = 520;
    }
    calculateCasePrice('res');
    calculateCasePrice('ret');
    calculateCasePrice('park');
}

function updateMQLocation() {
    const loc = document.getElementById('location').value || '（尚未填寫地址）';
const el  = document.getElementById('mq-location');
    if (el) el.innerText = loc;
}

function openManualSearch() {
    document.getElementById('mq-manual').classList.remove('hidden');
    document.getElementById('mq-results').classList.add('hidden');
}

async function fetchPriceAI() {
    if (!apiKey) {
        document.getElementById('mq-no-key-hint').classList.remove('hidden');
        alert('請先在「✨ AI」頁面設定您的 Gemini API Key');
        return;
    }
    const location = document.getElementById('location').value.trim();
    if (!location) { alert('請先在「土地」頁填寫基地位置'); return; }

    const loadEl    = document.getElementById('mq-loading');
    const resultsEl = document.getElementById('mq-results');
    const manualEl  = document.getElementById('mq-manual');
    loadEl.style.display = 'flex';
    resultsEl.classList.add('hidden');
    manualEl.classList.add('hidden');

    const prompt = `你是台灣不動產市場分析師。請透過Google搜尋查詢台灣「${location}」附近（半徑約1公里）近2年內的不動產市場成交均價與3個代表性的實際成交個案（包含住宅個案A、店面個案B、車位個案C，必須是真實位於「${location}」周邊而非新北市）。
資料來源：591房屋網、樂居、內政部實價登錄、信義房屋、永慶房屋。

請依照以下格式回復 JSON，不要附加任何說明文字。如果某個欄位找不到資料，請填寫 null，不可填寫佔位文字：
{
  "residential": null,
  "office": null,
  "retail": null,
  "parking": null,
  "period": "例如 2024年至今",
  "sources": ["例如 實價登錄", "例如 591"],
  "notes": "簡要說明",
  "cases": {
    "res": {"name": "個案A名稱", "area": null, "total": null},
    "ret": {"name": "個案B名稱", "area": null, "total": null},
    "park": {"name": "個案C名稱", "count": null, "total": null}
  }
}

注意事項：
1. 住宅、辦公、店面單價單位為「萬/坪」，車位單位為「萬/個」。
2. 所有數值欄位（residential、office、retail、parking、area、total、count）的值必須是「單純的數字」（整數或小數）或 null。絕對不可包含『萬』、『坪』、『個』等中文字或任何單位文字。
3. 欄位名稱與字串值必須使用英文雙引號「"」括起來。`;

    const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                        (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash-8b' : 
                        apiModel;

    try {
        let res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
            { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], tools:[{"google_search":{}}] }) }
        );
        let data = await res.json();
        
        if (data.error) {
            const msg = data.error.message;
            if (msg.includes('quota') || msg.includes('Quota') || msg.includes('limit') || msg.includes('Search') || msg.includes('grounding') || msg.includes('Google Search') || msg.includes('v1beta') || msg.includes('not found') || msg.includes('not supported')) {
                const fallbackModel = actualModel;
                console.warn(`Search grounding failed or quota exceeded, retrying on fallback model ${fallbackModel} without google search tool on v1beta...`);
                res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`,
                    { method:'POST', headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}] }) }
                );
                data = await res.json();
            }
        }
        
        if (data.error) throw new Error(data.error.message);
        const text  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        // 使用貪婪匹配，以正確提取包含嵌套大括號的完整 JSON 物件
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('無法解析行情資料，請重試');
        
        let cleanedText = match[0];
        // 移除單行與多行註解
        cleanedText = cleanedText.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        // 移除數值欄位後方誤加的中文字或單位文字，以確保 JSON 符合規範 (例如 : 145.1萬/坪, 替換成 : 145.1,)
        cleanedText = cleanedText.replace(/:\s*([0-9]+(?:\.[0-9]+)?)\s*[\u4e00-\u9fa5a-zA-Z\/]+\s*([,}])/g, ':$1$2');
        
        const d = JSON.parse(cleanedText);
        
        // 輔助安全數值轉換器
        function safeParseFloat(val, fallback = null) {
            if (val === null || val === undefined) return fallback;
            const parsed = parseFloat(val);
            return isNaN(parsed) ? fallback : parsed;
        }

        const resVal = safeParseFloat(d.residential);
        const offVal = safeParseFloat(d.office);
        const retVal = safeParseFloat(d.retail);
        const parkVal = safeParseFloat(d.parking);

        document.getElementById('mq-residential').innerText = resVal ?? '--';
        document.getElementById('mq-office').innerText      = offVal      ?? '--';
        document.getElementById('mq-retail').innerText      = retVal      ?? '--';
        document.getElementById('mq-parking').innerText     = parkVal     ?? '--';
        document.getElementById('mq-period').innerText      = d.period      ?? '--';
        document.getElementById('mq-sources').innerText     = (d.sources||[]).join('、');
        document.getElementById('mq-notes').innerText       = d.notes       ?? '';
        window._mqResPrice = resVal;
        window._mqOfficePrice = offVal;
        window._mqRetPrice = retVal;
        window._mqParkPrice = parkVal;

        // 同步填入交叉分析的「實價登錄」與以 1.15 倍估算的「開價」
        if (resVal !== null) {
            document.getElementById('cross-res-lvr').value = resVal;
            document.getElementById('cross-res-ask').value = Math.round(resVal * 1.15 * 10) / 10;
        }
        if (offVal !== null) {
            document.getElementById('cross-off-lvr').value = offVal;
            document.getElementById('cross-off-ask').value = Math.round(offVal * 1.15 * 10) / 10;
        }
        if (retVal !== null) {
            document.getElementById('cross-ret-lvr').value = retVal;
            document.getElementById('cross-ret-ask').value = Math.round(retVal * 1.15 * 10) / 10;
        }
        if (parkVal !== null) {
            document.getElementById('cross-park-lvr').value = parkVal;
            document.getElementById('cross-park-ask').value = Math.round(parkVal * 1.15);
        }
        
        // 更新鄰近個案參考的案例
        if (d.cases) {
            if (d.cases.res) {
                const resName = d.cases.res.name;
                const resArea = safeParseFloat(d.cases.res.area);
                const resTotal = safeParseFloat(d.cases.res.total);
                if (resName && resName !== "無" && resName !== "個案A名稱") document.getElementById('case-res-name').value = resName;
                if (resArea !== null) document.getElementById('case-res-area').value = resArea;
                if (resTotal !== null) document.getElementById('case-res-total').value = resTotal;
                calculateCasePrice('res');
            }
            if (d.cases.ret) {
                const retName = d.cases.ret.name;
                const retArea = safeParseFloat(d.cases.ret.area);
                const retTotal = safeParseFloat(d.cases.ret.total);
                if (retName && retName !== "無" && retName !== "個案B名稱") document.getElementById('case-ret-name').value = retName;
                if (retArea !== null) document.getElementById('case-ret-area').value = retArea;
                if (retTotal !== null) document.getElementById('case-ret-total').value = retTotal;
                calculateCasePrice('ret');
            }
            if (d.cases.park) {
                const parkName = d.cases.park.name;
                const parkCount = safeParseFloat(d.cases.park.count);
                const parkTotal = safeParseFloat(d.cases.park.total);
                if (parkName && parkName !== "無" && parkName !== "個案C名稱") document.getElementById('case-park-name').value = parkName;
                if (parkCount !== null) document.getElementById('case-park-count').value = parkCount;
                if (parkTotal !== null) document.getElementById('case-park-total').value = parkTotal;
                calculateCasePrice('park');
            }
        } else {
            updateCasePlaceholders(location);
        }

        if (typeof calculateCrossAnalysis === 'function') {
            calculateCrossAnalysis();
        }

        resultsEl.classList.remove('hidden');
    } catch(e) {
        let errMsg = e.message;
        if (errMsg.includes('quota') || errMsg.includes('Quota') || errMsg.includes('limit')) {
            errMsg = '已超出您的 Gemini API 額度限制 (Quota Exceeded / Rate Limit)。（已嘗試切換備用模型，仍超出限制）\n\n提示：\n1. 免費版 API 金鑰有頻率限制，您可以稍候 1 分鐘再試，或在「✨ AI」頁面改選其他模型。\n2. Google 搜尋功能 (Search Grounding) 免費配額較低。建議使用下方「手動查詢」連結獲取行情並手動填入，即可免除金鑰額度限制。';
        } else if (errMsg.includes('unregistered callers') || errMsg.includes('API key') || errMsg.includes('consumer identity')) {
            errMsg = '金鑰無效或 API 未啟用 (Invalid API Key)。請確認您的 API 金鑰是否正確無誤、未過期，且已於 Google Cloud Console 啟用 Generative Language API。';
        }
        alert('行情查詢失敗：' + errMsg);
        manualEl.classList.remove('hidden');
    }
    loadEl.style.display = 'none';
}

async function fetchMarketPrice() {
    const location = document.getElementById('location').value;
    if (!location) { alert('請先在「土地」頁填寫基地位置'); return; }
    if (!apiKey) {
        alert('請先在「✨ AI」頁面設定您的 Gemini API Key');
        return;
    }
    
    const labelEl = document.getElementById('refMarketPriceLabel');
    if (!labelEl) return;
    const descEl  = document.getElementById('ai-market-desc');
    
    labelEl.innerText = '查詢中...';
    if (descEl) {
        descEl.classList.add('hidden');
        descEl.innerText = '';
    }
    
    const prompt = `您是台灣不動產分析專家。請透過 Google 搜尋查詢台灣「${location}」附近近 2 年內的住宅成交行情。
請務必回覆以下格式的 JSON，不要包含其他文字或 Markdown 標籤：
{"avg_market_price": 數字, "desc": "簡短的行情與區域特點說明（50-80字）"}
注意：數字必須是「萬/坪」為單位的整數（例如：若均價為 75 萬/坪，則填入 75；若均價為 750,000 元，也必須換算為 75）。`;

    const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                        (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash' : 
                        apiModel;
                        
    try {
        let res  = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
            { method:'POST', headers:{'Content-Type':'application/json'},
              body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }], tools:[{ "google_search":{} }] }) });
        let data = await res.json();
        
        if (data.error) {
            const msg = data.error.message;
            if (msg.includes('quota') || msg.includes('Quota') || msg.includes('limit') || msg.includes('Search') || msg.includes('grounding') || msg.includes('Google Search') || msg.includes('v1beta') || msg.includes('not found') || msg.includes('not supported')) {
                const fallbackModel = actualModel;
                console.warn(`Search grounding failed, retrying on fallback model ${fallbackModel} without google search tool on v1beta...`);
                res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`,
                    { method:'POST', headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({ contents:[{ parts:[{ text:prompt }] }] }) });
                data = await res.json();
            }
        }
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const match = text.match(/\{[\s\S]*?\}/);
        if (!match) throw new Error('無法解析行情資料，請重試');
        const d = JSON.parse(match[0]);
        
        const price = d.avg_market_price;
        const desc = d.desc || '';
        
        labelEl.innerText = price + ' 萬/坪';
        const refEl = document.getElementById('refMarketPrice');
        if (refEl) refEl.value = price;
        if (descEl) {
            descEl.innerText = desc;
            descEl.classList.remove('hidden');
        }
    } catch(e) {
        labelEl.innerText = '連線異常';
        if (descEl) {
            descEl.classList.remove('hidden');
            if (e.message.includes('quota') || e.message.includes('Quota') || e.message.includes('limit') || e.message.includes('limit exceeded')) {
                descEl.innerText = '獲取失敗：已超出您的 Gemini API 額度限制 (Quota Exceeded / Rate Limit)。\n\n提示：免費版 API 金鑰有頻率限制，您可以稍候 1 分鐘再試，或在上方改選其他模型。';
            } else if (e.message.includes('unregistered callers') || e.message.includes('API key') || e.message.includes('consumer identity')) {
                descEl.innerText = '獲取失敗：金鑰無效或 API 未啟用 (Invalid API Key)。請確認您的 API 金鑰是否正確。';
            } else {
                descEl.innerText = '獲取失敗：' + e.message;
            }
        }
    }
}

function applyMarketPrice() {
    const bType = document.getElementById('c-buildingType').value;
    const price = (bType === 'office') ? window._mqOfficePrice : window._mqResPrice;
    const typeName = (bType === 'office') ? '辦公' : '住宅';
    if (price && parseFloat(price) > 0) {
        // 同步 AI 行情數據至手動查詢對應欄位，避免 calculateAll(true) 時被舊的手動預設值覆蓋
        if (window._mqResPrice !== undefined && window._mqResPrice !== null) {
            document.getElementById('mq-m-res').value = window._mqResPrice;
        }
        if (window._mqOfficePrice !== undefined && window._mqOfficePrice !== null) {
            document.getElementById('mq-m-off').value = window._mqOfficePrice;
        }
        if (window._mqRetPrice !== undefined && window._mqRetPrice !== null) {
            document.getElementById('mq-m-ret').value = window._mqRetPrice;
        }
        if (window._mqParkPrice !== undefined && window._mqParkPrice !== null) {
            const pkPrice = parseFloat(window._mqParkPrice);
            if (!isNaN(pkPrice) && pkPrice >= 0) {
                document.getElementById('m-parkingPrice').value = pkPrice;
                document.getElementById('mq-m-park').value = pkPrice;
            }
        }
        
        document.getElementById('avgPrice').value = price;
        
        calculateAll(true);
        alert('✓ 已套用' + typeName + '均價 ' + price + ' 萬/坪 至推案單價，並同步更新參考行情與車位單價');
    } else {
        alert('未偵測到有效的' + typeName + '均價');
    }
}


// 套用推薦售價至本專案定價
function applyCrossRecommended() {
    calculateCrossAnalysis(); // 確保最新計算

    const resRec = parseFloat(document.getElementById('cross-res-rec').innerText) || 0;
    const offRec = parseFloat(document.getElementById('cross-off-rec').innerText) || 0;
    const retRec = parseFloat(document.getElementById('cross-ret-rec').innerText) || 0;
    const parkRec = parseFloat(document.getElementById('cross-park-rec').innerText) || 0;

    const bType = document.getElementById('c-buildingType').value;
    const typeName = (bType === 'office') ? '辦公' : '住宅';
    const mainPrice = (bType === 'office') ? offRec : resRec;

    // 同步到行情查詢的手動輸入欄位
    document.getElementById('mq-m-res').value = resRec.toFixed(1);
    document.getElementById('mq-m-off').value = offRec.toFixed(1);
    document.getElementById('mq-m-ret').value = retRec.toFixed(1);
    document.getElementById('mq-m-park').value = parkRec;

    // 同步到專案的車位與主推案定價
    document.getElementById('m-parkingPrice').value = parkRec;
    document.getElementById('avgPrice').value = mainPrice;

    calculateAll(true);

    alert(
        `✓ 已成功將市場建議售價套入本案定價！\n` +
        `- ${typeName}單價：${mainPrice.toFixed(1)} 萬/坪\n` +
        `- 店面單價：${retRec.toFixed(1)} 萬/坪\n` +
        `- 車位售價：${parkRec} 萬/個`
    );
}

function applyManualMarketPrice() {
    const bType = document.getElementById('c-buildingType').value;
    const priceId = (bType === 'office') ? 'mq-m-off' : 'mq-m-res';
    const price = parseFloat(document.getElementById(priceId).value) || 0;
    const typeName = (bType === 'office') ? '辦公' : '住宅';
    if (price > 0) {
        document.getElementById('avgPrice').value = price;
        
        const pkPriceRaw = document.getElementById('mq-m-park').value;
        const pkPrice = parseFloat(pkPriceRaw);
        if (pkPriceRaw !== '' && !isNaN(pkPrice) && pkPrice >= 0) {
            document.getElementById('m-parkingPrice').value = pkPrice;
        }
        
        calculateAll(true);
        alert('✓ 已套用' + typeName + '均價 ' + price + ' 萬/坪 至推案單價');
    } else {
        alert('請先填入' + typeName + '均價');
    }
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('api-key-input');
    const openIcon = document.getElementById('eye-icon-open');
    const closedIcon = document.getElementById('eye-icon-closed');
    if (input && openIcon && closedIcon) {
        if (input.type === 'password') {
            input.type = 'text';
            openIcon.classList.add('hidden');
            closedIcon.classList.remove('hidden');
        } else {
            input.type = 'password';
            openIcon.classList.remove('hidden');
            closedIcon.classList.add('hidden');
        }
    }
}

function saveApiKey() {
    const keyInput = document.getElementById('api-key-input');
    const key = keyInput.value.trim();
    apiKey = key;
    try {
        if (key) localStorage.setItem('gemini_api_key', key);
        else     localStorage.removeItem('gemini_api_key');
    } catch (e) {
        console.warn('Failed to save apiKey to localStorage:', e);
    }
    
    const btn = document.querySelector('[onclick="saveApiKey()"]');
    if (btn) {
        const origText = btn.innerText;
        btn.innerText = key ? '✓ 已儲存' : '✓ 已清除';
        btn.className = 'tap px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl flex-shrink-0';
        setTimeout(() => {
            btn.innerText = origText;
            btn.className = 'tap px-4 py-2 bg-violet-600 text-white text-xs font-black rounded-xl flex-shrink-0';
        }, 2000);
    }
    
    updateApiKeyStatus();
}

async function testApiKeyConnection() {
    const keyInput = document.getElementById('api-key-input');
    let key = keyInput ? keyInput.value.trim() : '';
    if (!key) {
        try {
            key = localStorage.getItem('gemini_api_key') || '';
        } catch(e) {}
    }
    if (!key) {
        alert('請先輸入 API Key 再進行測試！');
        return;
    }
    
    alert('正在測試連線與查詢可用模型，請稍候...');
    
    try {
        // 測試 v1 接口
        const resV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
        const dataV1 = await resV1.json();
        
        let msg = '【v1 接口測試結果】\n';
        if (dataV1.error) {
            msg += `❌ 失敗: ${dataV1.error.message}\n\n`;
        } else if (dataV1.models) {
            msg += `✅ 成功！可用模型列表：\n` + dataV1.models.map(m => m.name.replace('models/', '')).join('\n') + `\n\n`;
        } else {
            msg += `❌ 失敗: 未知錯誤 (回傳內容: ${JSON.stringify(dataV1)})\n\n`;
        }
        
        // 測試 v1beta 接口
        const resBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const dataBeta = await resBeta.json();
        
        msg += '【v1beta 接口測試結果】\n';
        if (dataBeta.error) {
            msg += `❌ 失敗: ${dataBeta.error.message}\n`;
        } else if (dataBeta.models) {
            msg += `✅ 成功！可用模型列表：\n` + dataBeta.models.map(m => m.name.replace('models/', '')).join('\n') + `\n`;
        } else {
            msg += `❌ 失敗: 未知錯誤 (回傳內容: ${JSON.stringify(dataBeta)})\n`;
        }
        
        alert(msg);
    } catch (e) {
        alert('連線測試發生網路異常: ' + e.message);
    }
}

function updateApiKeyStatus() {
    const statusEl = document.getElementById('api-key-status');
    const mqBadge  = document.getElementById('mq-mode-badge');
    const mqAiBtn  = document.getElementById('mq-ai-btn');
    const mqHint   = document.getElementById('mq-no-key-hint');
    
    const keyInput = document.getElementById('api-key-input');
    const currentVal = keyInput ? keyInput.value.trim() : '';
    
    if (currentVal) {
        apiKey = currentVal;
        try {
            localStorage.setItem('gemini_api_key', currentVal);
        } catch (e) {}
    } else {
        let savedKey = '';
        try {
            savedKey = localStorage.getItem('gemini_api_key') || '';
        } catch (e) {}
        if (savedKey) {
            apiKey = savedKey;
        } else {
            apiKey = '';
            try {
                localStorage.removeItem('gemini_api_key');
            } catch (e) {}
        }
    }

    let badgeText = '未設定';
    let badgeClass = 'pill bg-rose-950/40 text-rose-400 border border-rose-900/30';

    if (apiKey) {
        badgeText = '✓ 已儲存';
        badgeClass = 'pill bg-emerald-900/50 text-emerald-300 border border-emerald-700/40';
    }

    if (statusEl) {
        statusEl.innerText = badgeText;
        statusEl.className = badgeClass;
    }

    if (apiKey) {
        if (mqBadge)  { mqBadge.innerText  = 'AI 模式';  mqBadge.className  = 'pill bg-violet-900/50 text-violet-300 border border-violet-700/40 text-[9px]'; }
        if (mqAiBtn)  mqAiBtn.classList.remove('opacity-50');
        if (mqHint)   mqHint.classList.add('hidden');
    } else {
        if (mqBadge)  { mqBadge.innerText  = '手動模式'; mqBadge.className  = 'pill bg-slate-700 text-slate-400 border border-slate-600 text-[9px]'; }
        if (mqAiBtn)  mqAiBtn.classList.add('opacity-50');
        if (mqHint)   mqHint.classList.remove('hidden');
    }
}

function openCadastralModal() {
    const modal = document.getElementById('cadastral-modal');
    if (!modal) return;
    modal.classList.add('open');
    
    // Initialize county select
    const countySelect = document.getElementById('cadastral-county-select');
    if (countySelect) {
        countySelect.innerHTML = Object.keys(TAIWAN_DISTRICTS).map(c => 
            `<option value="${c}" ${c === S.cadastralCounty ? 'selected' : ''}>${c}</option>`
        ).join('');
    }
    
    // Populate districts
    populateCadastralDistricts();

    // Populate land use zones
    populateCadastralZones();
    
    // Background load sections from official NLSC API
    triggerNLSCFetch();
    
    // If empty, add a default row silently
    if (S.cadastral.length === 0) {
        const sections = (CADASTRAL_SECTIONS[S.cadastralCounty] && CADASTRAL_SECTIONS[S.cadastralCounty][S.cadastralDistrict]) || ['第一段'];
        const defaultSection = sections.length > 0 ? sections[0] : '';
        S.cadastral.push({
            id: Date.now(),
            section: defaultSection,
            subsection: '(無小段)',
            plotNumber: '',
            area: '',
            announcedValue: '',
            proportion: ''
        });
        try {
            localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
        } catch(e){}
    }
    
    // Maximized state class
    const sheet = document.getElementById('cadastral-modal-sheet');
    const btn = document.getElementById('cadastral-size-btn');
    if (sheet) {
        if (S.cadastralMaximized) {
            sheet.classList.add('maximized');
            if (btn) btn.innerHTML = '🗗';
        } else {
            sheet.classList.remove('maximized');
            if (btn) btn.innerHTML = '🗖';
        }
    }
    
    // Always force the list to be expanded on open
    S.cadastralCollapsed = false;
    try {
        localStorage.setItem('s_cadastralCollapsed', 'false');
    } catch(e){}
    
    const listContent = document.getElementById('cadastral-list-content');
    const arrow = document.getElementById('cadastral-toggle-arrow');
    if (listContent && arrow) {
        listContent.classList.remove('hidden');
        arrow.innerHTML = '▲';
    }
    
    // Render rows
    renderCadastralRows();
}

function closeCadastralModal() {
    const modal = document.getElementById('cadastral-modal');
    if (modal) modal.classList.remove('open');
}

function toggleCadastralList() {
    const listContent = document.getElementById('cadastral-list-content');
    const arrow = document.getElementById('cadastral-toggle-arrow');
    if (!listContent || !arrow) return;
    
    const collapsed = listContent.classList.toggle('hidden');
    S.cadastralCollapsed = collapsed;
    try {
        localStorage.setItem('s_cadastralCollapsed', collapsed);
    } catch(e){}
    arrow.innerHTML = collapsed ? '▼' : '▲';
}

function toggleCadastralMaximize() {
    const sheet = document.getElementById('cadastral-modal-sheet');
    const btn = document.getElementById('cadastral-size-btn');
    if (!sheet) return;
    
    const maximized = sheet.classList.toggle('maximized');
    S.cadastralMaximized = maximized;
    try {
        localStorage.setItem('s_cadastralMaximized', maximized);
    } catch(e){}
    if (btn) {
        btn.innerHTML = maximized ? '🗗' : '🗖';
    }
}

function populateCadastralDistricts() {
    const countySelect = document.getElementById('cadastral-county-select');
    const districtSelect = document.getElementById('cadastral-district-select');
    if (!countySelect || !districtSelect) return;
    
    const county = countySelect.value;
    const districts = TAIWAN_DISTRICTS[county] || [];
    
    districtSelect.innerHTML = districts.map(d => 
        `<option value="${d}" ${d === S.cadastralDistrict ? 'selected' : ''}>${d}</option>`
    ).join('');
    
    if (!districts.includes(S.cadastralDistrict) && districts.length > 0) {
        S.cadastralDistrict = districts[0];
        districtSelect.value = districts[0];
        try {
            localStorage.setItem('s_cadastralDistrict', districts[0]);
        } catch(e){}
    }
}

function onCadastralCountyChange() {
    const countySelect = document.getElementById('cadastral-county-select');
    if (!countySelect) return;
    S.cadastralCounty = countySelect.value;
    try {
        localStorage.setItem('s_cadastralCounty', S.cadastralCounty);
    } catch(e){}
    populateCadastralDistricts();
    
    const districtSelect = document.getElementById('cadastral-district-select');
    if (districtSelect) {
        S.cadastralDistrict = districtSelect.value;
        try {
            localStorage.setItem('s_cadastralDistrict', S.cadastralDistrict);
        } catch(e){}
    }
    populateCadastralZones();
    triggerNLSCFetch();
    renderCadastralRows();
    // 縣市改變時刷新法規專欄
    if (!document.getElementById('regulation-panel-body')?.classList.contains('hidden')) populateRegulationPanel();
}

function onCadastralDistrictChange() {
    const districtSelect = document.getElementById('cadastral-district-select');
    if (!districtSelect) return;
    S.cadastralDistrict = districtSelect.value;
    try {
        localStorage.setItem('s_cadastralDistrict', S.cadastralDistrict);
    } catch(e){}
    populateCadastralZones();
    triggerNLSCFetch();
    renderCadastralRows();
}


// 法規專欄：折疊/展開
function toggleRegulationPanel() {
    const body = document.getElementById('regulation-panel-body');
    const chevron = document.getElementById('reg-chevron');
    if (!body) return;
    const isOpen = !body.classList.contains('hidden');
    body.classList.toggle('hidden', isOpen);
    if (chevron) chevron.classList.toggle('open', !isOpen);
    if (!isOpen) populateRegulationPanel(); // 展開時刷新
}


// 法規專欄：填充地方法規包 & 獎勵速查
function populateRegulationPanel() {
    const county = S.cadastralCounty || '';
    const zone   = S.cadastralZone   || '';

    // ── ⓪ 更新基準法定建蔽率與容積率 UI ──
    const regZoneLabel = document.getElementById('reg-bcr-far-zone');
    const regSourceLabel = document.getElementById('reg-bcr-far-source');
    const regBcrVal = document.getElementById('reg-bcr-val');
    const regFarVal = document.getElementById('reg-far-val');
    const regWarning = document.getElementById('reg-bcr-far-warning');
    const regQueryBtn = document.getElementById('reg-bcr-far-query-btn');
    const regApplyBtn = document.getElementById('reg-bcr-far-apply-btn');

    if (county && zone) {
        const countyRules = CADASTRAL_ZONE_RULES[county] || {};
        let rule = countyRules[zone];
        if (!rule) {
            // 模糊匹配
            const matchedKey = Object.keys(countyRules).find(key => zone.includes(key));
            if (matchedKey) rule = countyRules[matchedKey];
        }

        if (rule) {
            if (regZoneLabel) regZoneLabel.textContent = `${county} ${zone}`;
            if (regSourceLabel) regSourceLabel.textContent = `法源：${rule.law || '都市計畫自治條例'}`;
            if (regBcrVal) regBcrVal.textContent = `${rule.bcr} %`;
            if (regFarVal) regFarVal.textContent = `${rule.far} %`;

            // 特定計畫警告
            if (rule.isSpecial) {
                if (regWarning) regWarning.classList.remove('hidden');
                if (regQueryBtn) regQueryBtn.classList.remove('hidden');
            } else {
                if (regWarning) regWarning.classList.add('hidden');
                if (regQueryBtn) regQueryBtn.classList.add('hidden');
            }

            // 套用按鈕啟用
            if (regApplyBtn) {
                regApplyBtn.disabled = false;
                regApplyBtn.className = "tap px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-[9px] text-white font-bold transition-all";
            }
        } else {
            // 未收錄此分區
            if (regZoneLabel) regZoneLabel.textContent = `${county} ${zone}`;
            if (regSourceLabel) regSourceLabel.textContent = '未收錄此分區的法定標準值';
            if (regBcrVal) regBcrVal.textContent = '-- %';
            if (regFarVal) regFarVal.textContent = '-- %';
            if (regWarning) regWarning.classList.add('hidden');
            if (regQueryBtn) regQueryBtn.classList.remove('hidden'); // 開放手動查詢

            if (regApplyBtn) {
                regApplyBtn.disabled = true;
                regApplyBtn.className = "tap px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[9px] text-slate-500 font-bold transition-all cursor-not-allowed opacity-50";
            }
        }
    } else {
        // 未設定縣市與使用分區
        if (regZoneLabel) regZoneLabel.textContent = '請設定縣市與使用分區';
        if (regSourceLabel) regSourceLabel.textContent = '';
        if (regBcrVal) regBcrVal.textContent = '-- %';
        if (regFarVal) regFarVal.textContent = '-- %';
        if (regWarning) regWarning.classList.add('hidden');
        if (regQueryBtn) regQueryBtn.classList.add('hidden');

        if (regApplyBtn) {
            regApplyBtn.disabled = true;
            regApplyBtn.className = "tap px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[9px] text-slate-500 font-bold transition-all cursor-not-allowed opacity-50";
        }
    }

    // 縣市標籤
    const countyTag = document.getElementById('reg-county-tag');
    if (countyTag) countyTag.textContent = county || '';
    const localLabel = document.getElementById('reg-local-county-label');
    if (localLabel) localLabel.textContent = county ? county + ' 適用' : '依縣市自動篩選';

    // ── 地方法規包 ──
    const pkgContainer = document.getElementById('reg-local-packages');
    if (pkgContainer) {
        const pkgs = REGULATION_DB.local[county] || [];
        if (pkgs.length === 0) {
            pkgContainer.innerHTML = `<div class="text-[10px] text-slate-600 italic">
                ${county ? county + ' 目前尚未收錄地方法規包' : '請先在地籍圖設定「所在縣市」'}</div>`;
        } else {
            pkgContainer.innerHTML = pkgs.map(pkg => {
                const zoneMatch = !pkg.zones || pkg.zones.includes(zone);
                return `
                <div class="reg-local-pkg-row ${zoneMatch ? 'active' : ''}">
                    <span style="color:${pkg.color};font-size:9px;margin-top:3px;">●</span>
                    <div class="flex-1">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[10px] font-bold text-slate-200">${pkg.name}</span>
                            ${zoneMatch ? '<span class="reg-tag" style="background:rgba(52,211,153,0.1);color:#34d399;border-color:rgba(52,211,153,0.3);">✓ 分區適用</span>' : ''}
                        </div>
                        <div class="text-[9px] text-slate-600 mt-0.5">${pkg.desc}</div>
                    </div>
                </div>`;
            }).join('');
        }
    }

    // ── 適用獎勵速查 ──
    const hintsContainer = document.getElementById('reg-bonus-hints');
    const zoneLabel = document.getElementById('reg-zone-label');
    if (zoneLabel) zoneLabel.textContent = zone ? zone : '';
    if (hintsContainer) {
        const county = S.cadastralCounty || '';
        const allPkgs = REGULATION_DB.local[county] || [];
        const matched = allPkgs.filter(pkg => !pkg.zones || pkg.zones.includes(zone));

        // 加上國家級固定項目（含 farKey 映射）
        const nationalItems = [
            { name: '都市更新容積獎勵', defaultPct: 50, type: 'bonus',    farKey: '都更獎勵',    desc: '國家級', color: '#f59e0b' },
            { name: '危老重建容積獎勵', defaultPct: 40, type: 'bonus',    farKey: '危老獎勵', customName: '危老重建容積獎勵', desc: '國家級', color: '#ef4444' }
        ];

        if (!county && !zone) {
            hintsContainer.innerHTML = '<div class="text-[10px] text-slate-600 italic">設定縣市與使用分區後將自動顯示建議獎勵</div>';
        } else {
            const localItems = matched.flatMap(pkg => pkg.items.map(it => ({
                ...it,
                farKey: (REG_FAR_KEY_MAP[it.name] || {}).key || '其它（手動填入）',
                desc: pkg.shortName,
                color: pkg.color
            })));

            // 去重：若地方政府包內已有該主要獎勵類型（如都更或危老），則不重複顯示國家級項目
            const localFarKeys = new Set(localItems.map(it => it.farKey));
            const filteredNationalItems = nationalItems.filter(nat => !localFarKeys.has(nat.farKey));

            const hintItems = [
                ...filteredNationalItems,
                ...localItems
            ];
            const typeTag = t => t === 'transfer'
                ? '<span style="font-size:9px;color:#c084fc;background:rgba(192,132,252,0.1);border:1px solid rgba(192,132,252,0.25);padding:1px 4px;border-radius:3px;margin-left:3px;">移入</span>'
                : '';
            hintsContainer.innerHTML = hintItems.map(it => `
                <div class="reg-hint-row" data-bonus-name="${it.name}" data-bonus-max="${it.defaultPct}" data-type="${it.type}" data-far-key="${it.farKey || ''}">
                    <span style="color:${it.color};font-size:9px;">●</span>
                    <span class="text-[10px] text-slate-300 flex-1">${it.name}${typeTag(it.type)}</span>
                    <span class="reg-ceil">${it.desc} ${it.defaultPct}%</span>
                    <button onclick="applyRegBonus(this)" class="reg-apply-btn">＋套用</button>
                </div>`).join('');
        }
    }

    // 更新 AI 按鈕狀態
    checkRegAiBtn();

    // 顯示已篩選徽章
    const badge = document.getElementById('reg-active-badge');
    if (badge) badge.classList.toggle('hidden', !county && !zone);
    syncAppliedButtonsState();
}

function applyRegBonus(btn) {
    try {

    const row = btn.closest('[data-bonus-name]');
    if (!row) return;

    const bonusName  = row.dataset.bonusName;
    const maxPct     = parseFloat(row.dataset.bonusMax) || 0;

    // 查對照表決定 farKey 和實際 type
    const mapped     = REG_FAR_KEY_MAP[bonusName] || {};
    const farKey     = row.dataset.farKey || mapped.key || '其它（手動填入）';
    const type       = mapped.type || row.dataset.type || 'bonus';
    const customName = mapped.customName || bonusName;

    const list = document.getElementById(type + '-items-list');
    if (!list) return;

    if (btn.classList.contains('applied')) {
        // ── 移除項目 (Toggle Off) ──
        const currentItems = list.querySelectorAll('.far-item');
        let foundAndRemoved = false;
        for (let item of currentItems) {
            const sel = item.querySelector('.far-sel');
            const customInp = item.querySelector('.far-custom-inp');
            let matches = false;
            if (sel) {
                if (farKey === '其它（手動填入）') {
                    if (sel.value === '其它（手動填入）' && customInp && customInp.value === customName) {
                        matches = true;
                    }
                } else {
                    if (sel.value === farKey) {
                        matches = true;
                    }
                }
            }
            if (matches) {
                item.remove();
                foundAndRemoved = true;
                break;
            }
        }
        
        // 自癒機制：如果在列表中順利找到並移除了項目，就更新總計並結束。
        // 如果在列表中「找不到」該項目，說明狀態不同步（例如手動清除或載入時狀態殘留），
        // 此時不應直接 return，而是直接讓它進入下方的「Toggle On」邏輯，為使用者套用該項目。
        if (foundAndRemoved) {
            updateFarTotal(type);
            return;
        }
    }

    // ── 新增項目 / 更新項目 (Toggle On) ──
    // 防呆：如果是都更或危老，由於兩者互斥，自動移除另一者
    if (farKey === '都更獎勵' || farKey === '規模/時程' || farKey === '危老獎勵') {
        const targetRemoveKey = (farKey === '都更獎勵') ? ['規模/時程', '危老重建容積獎勵', '危老獎勵'] : ['都更獎勵', '都市更新容積獎勵'];
        const conflictItems = list.querySelectorAll('.far-item');
        conflictItems.forEach(item => {
            const sel = item.querySelector('.far-sel');
            if (sel && targetRemoveKey.includes(sel.value)) {
                item.remove();
            }
        });
    }

    // 尋找現有列中是否有符合的項目
    let targetRow = null;
    const existingItems = list.querySelectorAll('.far-item');
    for (let item of existingItems) {
        const sel = item.querySelector('.far-sel');
        const customInp = item.querySelector('.far-custom-inp');
        if (sel) {
            if (farKey === '其它（手動填入）') {
                if (sel.value === '其它（手動填入）' && customInp && customInp.value === customName) {
                    targetRow = item;
                    break;
                }
            } else {
                if (sel.value === farKey) {
                    targetRow = item;
                    break;
                }
            }
        }
    }

    if (targetRow) {
        // 如果已存在該列，直接更新它的數值
        const pctInp = targetRow.querySelector('.far-pct-inp');
        if (pctInp) {
            pctInp.value = maxPct;
            pctInp.style.color = type === 'bonus' ? '#34d399' : '#c084fc';
        }
        updateFarTotal(type);
    } else {
        // 如果不存在，以正確的初始值新增一列
        addFarItem(type, farKey === '其它（手動填入）' ? '其它（手動填入）' : farKey, maxPct);
        if (farKey === '其它（手動填入）') {
            const updatedRows = list.querySelectorAll('.far-item');
            const lastRow = updatedRows[updatedRows.length - 1];
            if (lastRow) {
                const customInp = lastRow.querySelector('.far-custom-inp');
                if (customInp) customInp.value = customName;
            }
            updateFarTotal(type);
        }
    }

    list?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
        alert('applyRegBonus error: ' + err.message + '\nStack: ' + err.stack);
        console.error(err);
    }
}


// 檢查 API Key 是否已設定，更新 AI 按鈕狀態
function checkRegAiBtn() {
    const btn = document.getElementById('reg-ai-btn');
    if (!btn) return;
    try {
        const key = localStorage.getItem('gemini_api_key');
        if (key && key.length > 10) {
            btn.disabled = false;
            btn.className = btn.className.replace('cursor-not-allowed','').replace('text-slate-500','text-violet-200');
            btn.innerHTML = '🤖 AI 分析法規';
            btn.title = '使用 Gemini AI 分析最適法規獎勵';
            btn.style.cssText = 'background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); border-bottom:2.5px solid #a78bfa; box-shadow:0 4px 12px rgba(139,92,246,0.25);';
        }
    } catch(e) {}
}


// AI 法規分析（預留框架，API Key 設定後完整實作）
function closeAiRegModal() {
    const modal = document.getElementById('ai-reg-modal');
    if (modal) modal.classList.remove('open');
}

function toggleLegalResult() {
    const area    = document.getElementById('reg-ai-inline-area');
    const txt     = document.getElementById('reg-ai-inline-text');
    const actions = document.getElementById('reg-ai-inline-actions');
    const btn     = document.getElementById('reg-ai-collapse-btn');
    if (!area) return;
    const isHidden = area.classList.contains('hidden');
    area.classList.toggle('hidden', !isHidden);
    if (txt && lastLegalAnalysisText)    txt.classList.toggle('hidden', !isHidden);
    if (actions && lastLegalAnalysisText) actions.classList.toggle('hidden', !isHidden);
    if (btn) btn.textContent = isHidden ? '\u2227' : '\u2228';
}

async function runRegulationAI() {
    const county   = S.cadastralCounty || '';
    const district = S.cadastralDistrict || '';
    const zone     = S.cadastralZone || '';
    const location = (document.getElementById('location') || {}).value || '';
    
    let apiKey = '';
    try {
        apiKey = localStorage.getItem('gemini_api_key') || '';
    } catch(e) {}
    
    if (!apiKey) {
        alert('🔒 請先在 AI 頁簽設定 Gemini API Key');
        return;
    }
    
    // 内嵌區塊元素
    const inlineArea    = document.getElementById('reg-ai-inline-area');
    const inlineLoading = document.getElementById('reg-ai-inline-loading');
    const inlineText    = document.getElementById('reg-ai-inline-text');
    const inlineActions = document.getElementById('reg-ai-inline-actions');
    const collapseBtn   = document.getElementById('reg-ai-collapse-btn');

    // 顯示內嵌區塊 + loading
    if (inlineArea)    { inlineArea.classList.remove('hidden'); }
    if (inlineLoading) { inlineLoading.classList.remove('hidden'); }
    if (inlineText)    { inlineText.classList.add('hidden'); inlineText.innerText = ''; }
    if (inlineActions) { inlineActions.classList.add('hidden'); }

    // 也開啟 Modal（守舊相容）
    const modal = document.getElementById('ai-reg-modal');
    const loading = document.getElementById('ai-reg-loading');
    const resultText = document.getElementById('ai-reg-result-text');
    if (modal) modal.classList.add('open');
    if (loading) loading.classList.remove('hidden');
    if (resultText) { resultText.classList.add('hidden'); resultText.innerText = ''; }
    
    const actualModel = (apiModel === 'gemini-3.5-flash') ? 'gemini-2.5-flash' :
                        (apiModel === 'gemini-3.1-flash-lite') ? 'gemini-2.5-flash' : 
                        apiModel;
                        
    const prompt = `您是一位台灣都市計畫與土地開發法規專家。請針對以下基地條件進行「開發適法性與基準容積率/建較率分析」：
    • 縣市：${county}
    • 行政區：${district}
    • 使用分區：${zone}
    • 基地大概地址/標的：${location}
    
    請分析並回覆以下內容（繁體中文，格式清晰，字數適中約 300-500 字，分段清晰）：
    1. 基準建較率與容積率分析：針對此分區的法定標準（如商一、住三等），列出基準數值，並特別指出有無特定的都市計畫細部計畫特例。
    2. 適用容積獎勵與移入管道：分析此基地可嘗試的法規套用。
    3. 特殊適法性或開發限制建議。
    請用條列式或段落回答，排版精緣。`;
    
    try {
        let text = '';
        let success = false;
        
        // Attempt 1: Model + Google Search Grounding
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    tools: [{ google_search: {} }]
                })
            });
            if (res.ok) {
                const data = await res.json();
                text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) success = true;
            } else {
                const errData = await res.json();
                console.warn("Attempt 1 failed:", errData.error?.message);
            }
        } catch (e) { console.warn("Attempt 1 error:", e); }
        
        // Attempt 2: Fallback WITHOUT Search Grounding
        if (!success) {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || `HTTP ${res.status}`);
            }
            const data = await res.json();
            text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) success = true;
        }
        
        if (!success) throw new Error('未能生成分析報告內容');

        // 儲存結果
        lastLegalAnalysisText = text;

        // 渲染内嵌區塊
        if (inlineLoading) inlineLoading.classList.add('hidden');
        if (inlineText)    { inlineText.innerText = text; inlineText.classList.remove('hidden'); }
        if (inlineActions) inlineActions.classList.remove('hidden');
        if (collapseBtn)   collapseBtn.classList.remove('hidden');

        // 同步更新 Modal
        if (loading) loading.classList.add('hidden');
        if (resultText) { resultText.innerText = text; resultText.classList.remove('hidden'); }

    } catch (e) {
        console.error('AI legal analysis failed:', e);
        const errHtml = `<span style="color:#f87171">❌ AI 分析失敗，請檢查 API Key 或網路連線。<br><br>(錯誤: ${e.message})</span>`;

        if (inlineLoading) inlineLoading.classList.add('hidden');
        if (inlineText)    { inlineText.innerHTML = errHtml; inlineText.classList.remove('hidden'); }
        if (loading) loading.classList.add('hidden');
        if (resultText) { resultText.innerHTML = errHtml; resultText.classList.remove('hidden'); }
        if (collapseBtn) collapseBtn.classList.remove('hidden');
    }
}

function applyBaseBcrFar() {
    const county = S.cadastralCounty;
    const zone = S.cadastralZone;
    if (!county || !zone) return;
    
    const countyRules = CADASTRAL_ZONE_RULES[county] || {};
    let rule = countyRules[zone];
    if (!rule) {
        // 嘗試模糊匹配
        const matchedKey = Object.keys(countyRules).find(key => zone.includes(key));
        if (matchedKey) rule = countyRules[matchedKey];
    }
    
    if (rule && rule.far && rule.bcr) {
        const farInput = document.getElementById('floorAreaRatio');
        const bcrInput = document.getElementById('buildingCoverageRatio');
        
        if (farInput) farInput.value = rule.far;
        if (bcrInput) bcrInput.value = rule.bcr;
        
        calculateAll();
        alert(`🎉 已成功套用基準法定值：建蔽率 ${rule.bcr}%，容積率 ${rule.far}%！`);
    } else {
        alert("❌ 找不到該使用分區的基準建蔽率與容積率數值！");
    }
}

function populateCadastralZones() {
    const zoneSelect = document.getElementById('cadastral-zone-select');
    if (!zoneSelect) return;
    const county = S.cadastralCounty;
    const zones = LAND_ZONE_DB[county] || LAND_ZONE_DEFAULT;
    // 保留目前選取值（若清單中仍有的話）
    const currentZone = S.cadastralZone;
    zoneSelect.innerHTML = '<option value="">— 請選擇 —</option>' +
        zones.map(z => `<option value="${z}" ${z === currentZone ? 'selected' : ''}>${z}</option>`).join('');
    // 若之前儲存的 zone 不在新清單裡則重置
    if (currentZone && !zones.includes(currentZone)) {
        S.cadastralZone = '';
        zoneSelect.value = '';
        try { localStorage.setItem('s_cadastralZone', ''); } catch(e){}
    }
}

function onCadastralZoneChange() {
    const zoneSelect = document.getElementById('cadastral-zone-select');
    if (!zoneSelect) return;
    S.cadastralZone = zoneSelect.value;
    try {
        localStorage.setItem('s_cadastralZone', S.cadastralZone);
    } catch(e){}
    // 使用分區改變 → 清除手動鎖定，讓自動判別重新計算開挖率
    const excavationRateEl = document.getElementById('excavationRate');
    if (excavationRateEl) excavationRateEl.removeAttribute('data-manual-lock');
    calculateAll();
    // 分區改變時刷新法規專欄
    if (!document.getElementById('regulation-panel-body')?.classList.contains('hidden')) populateRegulationPanel();
}

function renderCadastralRows() {
    const container = document.getElementById('cadastral-rows-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Choose dynamic list if successfully loaded, otherwise fallback to local static database
    let sections = (CADASTRAL_SECTIONS[S.cadastralCounty] && CADASTRAL_SECTIONS[S.cadastralCounty][S.cadastralDistrict]) || [];
    const cacheKey = `${S.cadastralCounty}-${S.cadastralDistrict}`;
    if (nlscFetchedSections[cacheKey]) {
        sections = nlscFetchedSections[cacheKey];
    }
    if (sections.length === 0) {
        sections = ['第一段', '第二段', '第三段'];
    }
    
    S.cadastral.forEach((row, index) => {
        const rowId = 'cad-row-' + row.id;
        const div = document.createElement('div');
        div.className = 'cadastral-row relative';
        div.id = rowId;
        div.innerHTML = `
            <!-- Top bar with Index and Delete button -->
            <div class="flex justify-between items-center col-span-2 pb-1 border-b border-slate-800/80 mb-1">
                <span class="text-[10px] font-bold text-slate-400">土地標示 #${index + 1}</span>
                <button onclick="deleteCadastralRow(${row.id})" class="text-rose-400 hover:text-rose-350 hover:bg-rose-950/60 text-[10px] font-bold px-2 py-0.5 bg-rose-950/30 border border-rose-900/40 rounded-md transition-colors">
                    ✕ 刪除
                </button>
            </div>
            
            <div class="flex flex-col justify-end">
                <select class="inp text-xs py-1.5 bg-slate-900 border-slate-700 text-slate-200" onchange="handleSectionChange(${row.id}, this)">
                    ${sections.map(s => `<option value="${s}" ${s === row.section ? 'selected' : ''}>${s}</option>`).join('')}
                    ${(!sections.includes(row.section) && row.section) ? `<option value="${row.section}" selected>${row.section}</option>` : ''}
                    <option value="__custom__">+ 輸入自訂地段...</option>
                </select>
            </div>
            
            <div class="flex flex-col justify-end">
                <select class="inp text-xs py-1.5 bg-slate-900 border-slate-700 text-slate-200" onchange="handleSubsectionChange(${row.id}, this)">
                    <option value="(無小段)" ${row.subsection === '(無小段)' ? 'selected' : ''}>(無小段)</option>
                    <option value="一小段" ${row.subsection === '一小段' ? 'selected' : ''}>一小段</option>
                    <option value="二小段" ${row.subsection === '二小段' ? 'selected' : ''}>二小段</option>
                    <option value="三小段" ${row.subsection === '三小段' ? 'selected' : ''}>三小段</option>
                    <option value="四小段" ${row.subsection === '四小段' ? 'selected' : ''}>四小段</option>
                    ${['(無小段)', '一小段', '二小段', '三小段', '四小段'].indexOf(row.subsection) === -1 && row.subsection ? `<option value="${row.subsection}" selected>${row.subsection}</option>` : ''}
                    <option value="__custom__">+ 輸入自訂小段...</option>
                </select>
            </div>
            
            <input type="text" class="inp text-xs py-1.5 bg-slate-900 border-slate-700 text-slate-200" placeholder="地號 (如: 0123)" value="${row.plotNumber}" oninput="updateCadastralRow(${row.id}, 'plotNumber', this.value)">
            
            <input type="number" step="0.01" class="inp text-xs py-1.5 bg-slate-900 border-slate-700 text-slate-200" placeholder="面積 m²" value="${row.area || ''}" oninput="updateCadastralRow(${row.id}, 'area', this.value)">
            
            <input type="number" step="1" class="inp text-xs py-1.5 bg-slate-900 border-slate-700 text-slate-200" placeholder="公告現值 元/m²" value="${row.announcedValue || ''}" oninput="updateCadastralRow(${row.id}, 'announcedValue', this.value)">
            
            <input type="number" step="0.1" class="inp text-xs py-1.5 bg-slate-900 border-slate-700 text-slate-200" placeholder="比例 (%)" value="${row.proportion || ''}" oninput="updateCadastralRow(${row.id}, 'proportion', this.value)">
        `;
        container.appendChild(div);
    });
    
    updateCadastralSummary();
}

function handleSectionChange(id, select) {
    const value = select.value;
    if (value === '__custom__') {
        const customVal = prompt("請輸入自訂地段名稱：");
        if (customVal && customVal.trim()) {
            updateCadastralRow(id, 'section', customVal.trim());
        } else {
            renderCadastralRows();
        }
    } else {
        updateCadastralRow(id, 'section', value);
    }
}

function handleSubsectionChange(id, select) {
    const value = select.value;
    if (value === '__custom__') {
        const customVal = prompt("請輸入自訂小段名稱（例如：五小段）：");
        if (customVal && customVal.trim()) {
            updateCadastralRow(id, 'subsection', customVal.trim());
        } else {
            renderCadastralRows();
        }
    } else {
        updateCadastralRow(id, 'subsection', value);
    }
}

function addCadastralRow() {
    let sections = (CADASTRAL_SECTIONS[S.cadastralCounty] && CADASTRAL_SECTIONS[S.cadastralCounty][S.cadastralDistrict]) || [];
    const cacheKey = `${S.cadastralCounty}-${S.cadastralDistrict}`;
    if (nlscFetchedSections[cacheKey]) {
        sections = nlscFetchedSections[cacheKey];
    }
    const defaultSection = sections.length > 0 ? sections[0] : '第一段';
    
    const newRow = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        section: defaultSection,
        subsection: '(無小段)',
        plotNumber: '',
        area: '',
        announcedValue: '',
        proportion: ''
    };
    
    S.cadastral.push(newRow);
    recalculateProportions();
    try {
        localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
    } catch(e){}
    renderCadastralRows();
}

function updateCadastralRow(id, field, value) {
    const index = S.cadastral.findIndex(row => row.id === id);
    if (index === -1) return;
    
    if (field === 'area' || field === 'announcedValue' || field === 'proportion') {
        S.cadastral[index][field] = value === '' ? '' : (parseFloat(value) || 0);
    } else {
        S.cadastral[index][field] = value;
    }
    
    try {
        localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
    } catch(e){}
    updateCadastralSummary();
}

function deleteCadastralRow(id) {
    const index = S.cadastral.findIndex(row => row.id === id);
    if (index === -1) return;
    
    S.cadastral.splice(index, 1);
    recalculateProportions();
    try {
        localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
    } catch(e){}
    renderCadastralRows();
}

function updateCadastralSummary() {
    const summaryText = document.getElementById('cadastral-summary-text');
    if (!summaryText) return;
    
    let totalM2 = 0;
    let totalProp = 0;
    let count = 0;
    S.cadastral.forEach(row => {
        totalM2 += parseFloat(row.area) || 0;
        totalProp += parseFloat(row.proportion) || 0;
        count++;
    });
    
    const totalPing = (totalM2 * 0.3025).toFixed(1);
    summaryText.innerText = `總面積: ${totalPing} 坪 (${count} 筆) / 比例總和: ${totalProp.toFixed(1)}%`;
}

function applyCadastralTotalArea() {
    let totalM2 = 0;
    S.cadastral.forEach(row => {
        totalM2 += parseFloat(row.area) || 0;
    });
    
    const totalPing = parseFloat((totalM2 * 0.3025).toFixed(2));
    
    const landAreaInput = document.getElementById('landArea');
    if (landAreaInput) {
        landAreaInput.value = totalPing;
    }

    // 計算平均公告現值 (元/㎡) - 依各筆基地的面積與比例進行面積份額加權
    let weightedSum = 0;
    let totalWeight = 0;
    S.cadastral.forEach(row => {
        const area = parseFloat(row.area) || 0;
        const val = parseFloat(row.announcedValue) || 0;
        const prop = parseFloat(row.proportion) || 0;
        
        // 權重 = 面積 * 比例
        const weight = area * (prop / 100);
        weightedSum += val * weight;
        totalWeight += weight;
    });

    let avgAnnouncedValue = 0;
    if (totalWeight > 0) {
        avgAnnouncedValue = weightedSum / totalWeight;
    } else {
        // 如果無比例設定，則退回以單純面積加權
        let totalArea = 0;
        S.cadastral.forEach(row => {
            const area = parseFloat(row.area) || 0;
            const val = parseFloat(row.announcedValue) || 0;
            weightedSum += val * area;
            totalArea += area;
        });
        if (totalArea > 0) {
            avgAnnouncedValue = weightedSum / totalArea;
        }
    }

    // 換算為 萬/㎡，並以小數點第一位(四捨五入)
    const avgAnnouncedValueWan = parseFloat((avgAnnouncedValue / 10000).toFixed(1));
    
    const refAnnouncementValueInput = document.getElementById('refAnnouncementValue');
    let alertMsg = `🎉 已成功加總地籍圖面積：${totalM2.toFixed(1)} m²，換算約 ${totalPing} 坪，已套用至主頁面基地面積！`;
    
    if (refAnnouncementValueInput && avgAnnouncedValueWan > 0) {
        refAnnouncementValueInput.value = avgAnnouncedValueWan;
        alertMsg += `\n\n💡 同步依各筆土地之面積與持分比例加權計算「平均公告現值」：${avgAnnouncedValue.toFixed(0)} 元/㎡，已自動四捨五入填入「參考公告現值」：${avgAnnouncedValueWan} 萬/㎡！`;
    }
    
    calculateAll();
    closeCadastralModal();
    alert(alertMsg);
}

function locateCadastralRow(id) {
    const row = S.cadastral.find(r => r.id === id);
    if (!row) return;
    
    const subsectionStr = (row.subsection && row.subsection !== '(無小段)') ? row.subsection : '';
    const query = `台灣${S.cadastralCounty}${S.cadastralDistrict}${row.section}${subsectionStr}${row.plotNumber}地號`;
    
    closeCadastralModal();
    openMapsModal(query);
}

function refreshCadastralData() {
    if (confirm("⚠️ 確定要清除目前已輸入的所有地籍圖資料嗎？")) {
        S.cadastral = [];
        
        // Restore to default original state with 1 empty row
        let sections = (CADASTRAL_SECTIONS[S.cadastralCounty] && CADASTRAL_SECTIONS[S.cadastralCounty][S.cadastralDistrict]) || [];
        const cacheKey = `${S.cadastralCounty}-${S.cadastralDistrict}`;
        if (nlscFetchedSections[cacheKey]) {
            sections = nlscFetchedSections[cacheKey];
        }
        const defaultSection = sections.length > 0 ? sections[0] : '第一段';
        
        S.cadastral.push({
            id: Date.now(),
            section: defaultSection,
            subsection: '(無小段)',
            plotNumber: '',
            area: '',
            announcedValue: '',
            proportion: ''
        });
        
        try {
            localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
        } catch(e){}
        renderCadastralRows();
    }
}

function downloadCadastralTemplate() {
    const csvContent = "\ufeff" + 
        "地段,小段,地號,面積(㎡),公告現值(元/㎡),比例(%)\n" +
        "介壽段,(無小段),0123-0000,150.5,120000,64\n" +
        "公園段,一小段,0456-0001,85.2,150000,36";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `土地地籍匯入範本_${S.cadastralCounty}_${S.cadastralDistrict}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function triggerCSVImport() {
    const fileInput = document.getElementById('cadastral-csv-file');
    if (fileInput) fileInput.click();
}

function importCadastralCSV(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const ab = e.target.result;
            const header = new Uint8Array(ab.slice(0, 4));
            const isZip = header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04;
            
            let rows = [];
            if (isZip) {
                // Parse as XLSX
                if (typeof XLSX === 'undefined') {
                    alert("❌ 系統偵測到您上傳了 Excel 檔案，但外部解析套件尚未載入。請確認已連接網路，或將檔案另存為「CSV (逗號分隔) (*.csv)」格式再行上傳！");
                    input.value = '';
                    return;
                }
                const data = new Uint8Array(ab);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            } else {
                // Parse as CSV/TSV
                let text;
                try {
                    const decoder = new TextDecoder('utf-8', { fatal: true });
                    text = decoder.decode(ab);
                } catch (err) {
                    const textGB = new TextDecoder('gb18030').decode(ab);
                    const textBig5 = new TextDecoder('big5').decode(ab);
                    
                    const keywords = ['地段', '小段', '地號', '面積', '現值', '地價', '段'];
                    let gbMatches = 0;
                    let b5Matches = 0;
                    for (const kw of keywords) {
                        if (textGB.includes(kw)) gbMatches++;
                        if (textBig5.includes(kw)) b5Matches++;
                    }
                    
                    if (gbMatches >= b5Matches) {
                        text = textGB;
                    } else {
                        text = textBig5;
                    }
                }
                
                const lines = text.split(/\r?\n/);
                if (lines.length > 0) {
                    const headerLine = lines[0];
                    const commaCount = (headerLine.match(/,/g) || []).length;
                    const tabCount = (headerLine.match(/\t/g) || []).length;
                    const separator = tabCount > commaCount ? '\t' : ',';
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        let cols;
                        if (separator === '\t') {
                            cols = line.split('\t');
                        } else {
                            cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                        }
                        cols = cols.map(col => col.replace(/^"|"$/g, '').trim());
                        rows.push(cols);
                    }
                }
            }
            
            if (rows.length <= 1) {
                alert("❌ 檔案為空或無效地籍資料！");
                input.value = '';
                return;
            }
            
            const newPlots = [];
            let successCount = 0;
            
            // Skip header row
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i];
                if (!cols || cols.length === 0) continue;
                
                // Skip completely empty lines
                if (cols.join('').trim() === '') continue;
                
                const section = cols[0] ? String(cols[0]).trim() : '第一段';
                const subsection = cols[1] ? String(cols[1]).trim() : '(無小段)';
                const plotNumber = cols[2] ? String(cols[2]).trim() : '';
                const area = cols[3] ? parseFloat(cols[3]) : '';
                const announcedValue = cols[4] ? parseFloat(cols[4]) : '';
                const proportion = cols[5] ? parseFloat(cols[5]) : '';
                
                newPlots.push({
                    id: Date.now() + i + Math.floor(Math.random() * 1000),
                    section: section,
                    subsection: subsection,
                    plotNumber: plotNumber,
                    area: isNaN(area) ? '' : area,
                    announcedValue: isNaN(announcedValue) ? '' : announcedValue,
                    proportion: isNaN(proportion) ? '' : proportion
                });
                successCount++;
            }
            
            if (newPlots.length > 0) {
                S.cadastral = newPlots;
                const hasProportions = S.cadastral.some(r => r.proportion !== '' && r.proportion > 0);
                if (!hasProportions) {
                    recalculateProportions();
                }
                try {
                    localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
                } catch(e){}
                renderCadastralRows();
                alert(`🎉 成功匯入 ${successCount} 筆土地地籍資料！`);
            } else {
                alert("❌ 未能成功解析任何地籍資料，請檢查檔案內容！");
            }
        } catch (err) {
            alert("❌ 解析檔案時發生錯誤：" + err.message);
        }
        input.value = '';
    };
    reader.readAsArrayBuffer(file);
}

function serializeFarItems(type) {
    const listId = type === 'bonus' ? 'bonus-items-list' : 'transfer-items-list';
    const list = document.getElementById(listId);
    if (!list) return [];
    
    const items = [];
    list.querySelectorAll('.far-item').forEach(item => {
        const sel = item.querySelector('.far-sel');
        const customInp = item.querySelector('.far-custom-inp');
        const pctInp = item.querySelector('.far-pct-inp');
        
        items.push({
            selVal: sel ? sel.value : '',
            customVal: customInp ? customInp.value : '',
            pctVal: pctInp ? (parseFloat(pctInp.value) || 0) : 0,
            selHidden: sel ? sel.classList.contains('hidden') : false
        });
    });
    return items;
}

function deserializeFarItems(type, items) {
    const listId = type === 'bonus' ? 'bonus-items-list' : 'transfer-items-list';
    const list = document.getElementById(listId);
    if (!list) return;
    
    list.innerHTML = '';
    items.forEach(it => {
        addFarItem(type);
        const rowEls = list.querySelectorAll('.far-item');
        const lastRow = rowEls[rowEls.length - 1];
        if (!lastRow) return;
        
        const sel = lastRow.querySelector('.far-sel');
        const customInp = lastRow.querySelector('.far-custom-inp');
        const customWrap = lastRow.querySelector('.far-custom-wrap');
        const pctInp = lastRow.querySelector('.far-pct-inp');
        
        if (sel) {
            sel.value = it.selVal;
            if (it.selHidden) {
                sel.classList.add('hidden');
            } else {
                sel.classList.remove('hidden');
            }
        }
        if (customInp) customInp.value = it.customVal;
        if (customWrap) {
            if (it.selHidden || it.selVal === '其它（手動填入）') {
                customWrap.classList.remove('hidden');
            } else {
                customWrap.classList.add('hidden');
            }
        }
        if (pctInp) pctInp.value = it.pctVal;
    });
    
    updateFarSummary(type);
}

function packScenarioData() {
    const data = {
        inputs: {},
        checkboxes: {},
        unitLayouts: JSON.parse(JSON.stringify(S.unitLayouts || [])),
        customCosts: JSON.parse(JSON.stringify(S.customCosts || [])),
        customRevenues: JSON.parse(JSON.stringify(S.customRevenues || [])),
        customKpis: JSON.parse(JSON.stringify(S.customKpis || [])),
        bonusItems: serializeFarItems('bonus'),
        transferItems: serializeFarItems('transfer'),
        mode: S.mode,
        aiReportText: document.getElementById('aiContent') ? document.getElementById('aiContent').innerText : '',
        chatHistoryHtml: document.getElementById('chatHistoryArea') ? document.getElementById('chatHistoryArea').innerHTML : ''
    };

    PROJECT_INPUT_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            data.inputs[id] = el.value;
        }
    });

    ['shopAreaManualToggle', 'stdFloorManualToggle', 'floorsManualToggle', 'modeFactor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            data.checkboxes[id] = el.checked;
        }
    });
    
    ['shopAreaDisplay', 'stdFloorSlider', 'c-floors'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            data.inputs[id] = el.value;
        }
    });

    return data;
}

function unpackScenarioData(data) {
    if (!data) return;

    if (data.mode) {
        switchMode(data.mode);
    }

    if (data.inputs) {
        Object.keys(data.inputs).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = data.inputs[id];
            }
        });
        
        // 如果舊專案沒有儲存案例名稱，或者案例為空，則依據專案地址動態初始化個案參考
        const locationVal = data.inputs['location'];
        if (locationVal && (!data.inputs['case-res-name'] || data.inputs['case-res-name'] === "")) {
            updateCasePlaceholders(locationVal);
        }
    }

    if (data.checkboxes) {
        Object.keys(data.checkboxes).forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.checked = data.checkboxes[id];
            }
        });
    }

    S.unitLayouts = JSON.parse(JSON.stringify(data.unitLayouts || []));
    S.customCosts = JSON.parse(JSON.stringify(data.customCosts || []));
    S.customRevenues = JSON.parse(JSON.stringify(data.customRevenues || []));
    S.customKpis = JSON.parse(JSON.stringify(data.customKpis || []));

    renderUnitLayouts();
    
    deserializeFarItems('bonus', data.bonusItems || []);
    deserializeFarItems('transfer', data.transferItems || []);

    // ── 還原 AI 顧問報告 ──
    const aiContent = document.getElementById('aiContent');
    const aiSection = document.getElementById('aiSection');
    if (aiContent && aiSection) {
        if (data.aiReportText && data.aiReportText.trim().length > 0) {
            aiContent.innerText = data.aiReportText;
            aiSection.classList.remove('hidden');
        } else {
            aiContent.innerText = '';
            aiSection.classList.add('hidden');
        }
    }

    // ── 還原 AI 助理對話記錄 ──
    const chatHistoryArea = document.getElementById('chatHistoryArea');
    if (chatHistoryArea) {
        if (data.chatHistoryHtml && data.chatHistoryHtml.trim().length > 0) {
            chatHistoryArea.innerHTML = data.chatHistoryHtml;
        } else {
            chatHistoryArea.innerHTML = `
                <div class="text-[10px] text-purple-400/70 text-center py-4">
                    💡 您可以詢問本案相關的開發策略、ROI 優化或財務問題。<br>
                    AI 助理會自動帶入目前試算數據進行分析！
                </div>
            `;
        }
    }

    toggleFloorsManual();
    toggleShopAreaManual();
    toggleStdFloorManual();

    calculateAll();
}

function openProjectModal() {
    renderProjectSelector();
    renderScenarioSelector();
    
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (proj) {
        document.getElementById('projectNameInput').value = proj.name;
        document.getElementById('projectDateInput').value = proj.date;
        
        const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
        if (scen) {
            document.getElementById('scenarioNameInput').value = scen.name;
        }
    }
    
    document.getElementById('project-modal').classList.add('open');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.remove('open');
}

function onProjectInfoInput() {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (proj) {
        proj.name = document.getElementById('projectNameInput').value.trim() || '未命名專案';
        proj.date = document.getElementById('projectDateInput').value || new Date().toISOString().split('T')[0];
        
        saveProjectsToLocalStorage();
        renderProjectSelector();
        updateProjectStatusLabel();
    }
}

function onScenarioNameInput() {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (proj) {
        const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
        if (scen) {
            scen.name = document.getElementById('scenarioNameInput').value.trim() || '未命名方案';
            
            saveProjectsToLocalStorage();
            renderScenarioSelector();
            updateProjectStatusLabel();
        }
    }
}

function renderProjectSelector() {
    const selector = document.getElementById('projectSelector');
    if (!selector) return;
    
    selector.innerHTML = S.projects.map(p => 
        `<option value="${p.id}" ${p.id === S.currentProjectId ? 'selected' : ''}>${p.name} (${p.date})</option>`
    ).join('');
}

function renderScenarioSelector() {
    const selector = document.getElementById('scenarioSelector');
    if (!selector) return;
    
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) {
        selector.innerHTML = '';
        return;
    }
    
    selector.innerHTML = proj.scenarios.map(s => 
        `<option value="${s.id}" ${s.id === S.currentScenarioId ? 'selected' : ''}>${s.name}</option>`
    ).join('');
}

function updateProjectStatusLabel() {
    const label = document.getElementById('projectStatusName');
    if (!label) return;
    
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) {
        label.innerText = '無選定專案';
        return;
    }
    
    const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
    const scenName = scen ? scen.name : '無方案';
    
    label.innerText = `${proj.name} / ${scenName} (${proj.date})`;
}

function onProjectSelectChange(projId) {
    const proj = S.projects.find(p => p.id === projId);
    if (proj) {
        S.currentProjectId = proj.id;
        
        if (proj.scenarios.length > 0) {
            S.currentScenarioId = proj.scenarios[0].id;
            unpackScenarioData(proj.scenarios[0].data);
        } else {
            S.currentScenarioId = null;
        }
        
        document.getElementById('projectNameInput').value = proj.name;
        document.getElementById('projectDateInput').value = proj.date;
        
        const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
        document.getElementById('scenarioNameInput').value = scen ? scen.name : '';
        
        saveProjectsToLocalStorage();
        renderScenarioSelector();
        updateProjectStatusLabel();
    }
}

function onScenarioSelectChange(scenId) {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (proj) {
        const scen = proj.scenarios.find(s => s.id === scenId);
        if (scen) {
            S.currentScenarioId = scen.id;
            unpackScenarioData(scen.data);
            
            document.getElementById('scenarioNameInput').value = scen.name;
            
            saveProjectsToLocalStorage();
            updateProjectStatusLabel();
        }
    }
}

function saveCurrentDataToScenario() {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) return;
    const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
    if (!scen) return;
    
    scen.data = packScenarioData();
    saveProjectsToLocalStorage();
    alert(`✅ 成功儲存數值至方案「${scen.name}」！`);
}

function addNewProject() {
    const name = prompt('請輸入新專案名稱：', '新開發專案');
    if (name === null) return;
    const projName = name.trim() || '未命名專案';
    
    const projId = 'p_' + Date.now();
    const scenId = 's_' + (Date.now() + 1);
    
    const newProj = {
        id: projId,
        name: projName,
        date: new Date().toISOString().split('T')[0],
        scenarios: [{
            id: scenId,
            name: 'A案',
            data: packScenarioData()
        }]
    };
    
    S.projects.push(newProj);
    S.currentProjectId = projId;
    S.currentScenarioId = scenId;
    
    saveProjectsToLocalStorage();
    
    renderProjectSelector();
    renderScenarioSelector();
    updateProjectStatusLabel();
    
    document.getElementById('projectNameInput').value = newProj.name;
    document.getElementById('projectDateInput').value = newProj.date;
    document.getElementById('scenarioNameInput').value = 'A案';
    
    alert(`🎉 成功新增主專案「${projName}」！`);
}

function deleteCurrentProject() {
    if (S.projects.length <= 1) {
        alert('⚠️ 系統必須保留至少一個專案，無法刪除此專案！');
        return;
    }
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) return;
    
    if (!confirm(`確定要刪除專案「${proj.name}」及其旗下的所有方案嗎？此操作無法還原！`)) return;
    
    S.projects = S.projects.filter(p => p.id !== S.currentProjectId);
    
    const nextProj = S.projects[0];
    S.currentProjectId = nextProj.id;
    S.currentScenarioId = nextProj.scenarios[0].id;
    
    unpackScenarioData(nextProj.scenarios[0].data);
    
    saveProjectsToLocalStorage();
    
    renderProjectSelector();
    renderScenarioSelector();
    updateProjectStatusLabel();
    
    document.getElementById('projectNameInput').value = nextProj.name;
    document.getElementById('projectDateInput').value = nextProj.date;
    document.getElementById('scenarioNameInput').value = nextProj.scenarios[0].name;
    
    alert(`🗑️ 專案已刪除。`);
}

function addNewScenario() {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) return;
    
    const name = prompt('請輸入新方案名稱 (如：C案)：', `方案 ${String.fromCharCode(65 + proj.scenarios.length)}`);
    if (name === null) return;
    const scenName = name.trim() || '未命名方案';
    
    const scenId = 's_' + Date.now();
    const newScen = {
        id: scenId,
        name: scenName,
        data: packScenarioData()
    };
    
    proj.scenarios.push(newScen);
    S.currentScenarioId = scenId;
    
    saveProjectsToLocalStorage();
    
    renderScenarioSelector();
    updateProjectStatusLabel();
    document.getElementById('scenarioNameInput').value = scenName;
    
    alert(`🎉 成功新增方案「${scenName}」！`);
}

function duplicateCurrentScenario() {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) return;
    const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
    if (!scen) return;
    
    const newName = prompt('請輸入複製後的方案名稱：', `${scen.name} - 複製`);
    if (newName === null) return;
    const scenName = newName.trim() || '未命名方案';
    
    const scenId = 's_' + Date.now();
    const newScen = {
        id: scenId,
        name: scenName,
        data: JSON.parse(JSON.stringify(scen.data))
    };
    
    proj.scenarios.push(newScen);
    S.currentScenarioId = scenId;
    
    saveProjectsToLocalStorage();
    
    renderScenarioSelector();
    updateProjectStatusLabel();
    document.getElementById('scenarioNameInput').value = scenName;
    
    alert(`🎉 成功複製方案為「${scenName}」！`);
}

function deleteCurrentScenario() {
    const proj = S.projects.find(p => p.id === S.currentProjectId);
    if (!proj) return;
    
    if (proj.scenarios.length <= 1) {
        alert('⚠️ 此專案底下必須保留至少一個評估方案，無法刪除！');
        return;
    }
    
    const scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
    if (!scen) return;
    
    if (!confirm(`確定要刪除方案「${scen.name}」嗎？此操作無法還原！`)) return;
    
    proj.scenarios = proj.scenarios.filter(s => s.id !== S.currentScenarioId);
    
    const nextScen = proj.scenarios[0];
    S.currentScenarioId = nextScen.id;
    
    unpackScenarioData(nextScen.data);
    saveProjectsToLocalStorage();
    
    renderScenarioSelector();
    updateProjectStatusLabel();
    document.getElementById('scenarioNameInput').value = nextScen.name;
    
    alert(`🗑️ 方案已刪除。`);
}

function exportProjectsToJSON() {
    try {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(S.projects, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        
        const dateStr = new Date().toISOString().split('T')[0];
        downloadAnchor.setAttribute("download", `土地開發專案庫備份_${dateStr}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    } catch (e) {
        alert("匯出失敗：" + e.message);
    }
}

function triggerProjectImport() {
    document.getElementById('project-import-file').click();
}

function importProjectsJSON(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedProjects = JSON.parse(e.target.result);
            if (!Array.isArray(importedProjects) || importedProjects.length === 0 || !importedProjects[0].scenarios) {
                throw new Error("無效的專案備份檔格式！");
            }
            
            if (confirm(`⚠️ 匯入此備份將覆蓋您目前瀏覽器中的所有專案資料！是否確定繼續？`)) {
                S.projects = importedProjects;
                const firstProj = S.projects[0];
                S.currentProjectId = firstProj.id;
                S.currentScenarioId = firstProj.scenarios[0].id;
                
                unpackScenarioData(firstProj.scenarios[0].data);
                saveProjectsToLocalStorage();
                
                renderProjectSelector();
                renderScenarioSelector();
                updateProjectStatusLabel();
                
                document.getElementById('projectNameInput').value = firstProj.name;
                document.getElementById('projectDateInput').value = firstProj.date;
                document.getElementById('scenarioNameInput').value = firstProj.scenarios[0].name;
                
                alert(`🎉 成功覆蓋匯入 ${importedProjects.length} 個專案與所有評估方案！`);
            }
        } catch (err) {
            alert("❌ 匯入失敗，請確認檔案格式是否正確：" + err.message);
        }
        input.value = '';
    };
    reader.readAsText(file);
}

function initProjectManager() {
    if (!S.projects || S.projects.length === 0) {
        const defaultProjId = 'p_' + Date.now();
        const defaultScenId = 's_' + (Date.now() + 1);
        
        const currentData = packScenarioData();
        
        S.projects = [{
            id: defaultProjId,
            name: document.getElementById('location')?.value.trim() || '未命名專案',
            date: new Date().toISOString().split('T')[0],
            scenarios: [{
                id: defaultScenId,
                name: 'A案',
                data: currentData
            }]
        }];
        
        S.currentProjectId = defaultProjId;
        S.currentScenarioId = defaultScenId;
        
        saveProjectsToLocalStorage();
    } else {
        // 舊資料庫自動遷移 (一併將舊預設 20% 遷移為 2.5%，並補上銷售費預設 5%)
        S.projects.forEach(proj => {
            proj.scenarios.forEach(scen => {
                if (scen.data && scen.data.inputs) {
                    if (parseFloat(scen.data.inputs['adminRate']) === 20) {
                        scen.data.inputs['adminRate'] = '2.5';
                    }
                    if (scen.data.inputs['salesRate'] === undefined || scen.data.inputs['salesRate'] === '') {
                        scen.data.inputs['salesRate'] = '5';
                    }
                }
            });
        });
        saveProjectsToLocalStorage();

        let proj = S.projects.find(p => p.id === S.currentProjectId);
        if (!proj) {
            proj = S.projects[0];
            S.currentProjectId = proj.id;
        }
        let scen = proj.scenarios.find(s => s.id === S.currentScenarioId);
        if (!scen) {
            scen = proj.scenarios[0];
            S.currentScenarioId = scen.id;
        }
        
        unpackScenarioData(scen.data);
    }
    
    renderProjectSelector();
    renderScenarioSelector();
    updateProjectStatusLabel();
}

function saveProjectsToLocalStorage() {
    try {
        localStorage.setItem('s_projects', JSON.stringify(S.projects));
        if (S.currentProjectId) localStorage.setItem('s_currentProjectId', S.currentProjectId);
        if (S.currentScenarioId) localStorage.setItem('s_currentScenarioId', S.currentScenarioId);
    } catch (e) {
        console.error('Failed to save projects to localStorage:', e);
    }
}


window.onload = () => {
    renderUnitLayouts();
    // Default bonus item: 都更獎勵 50%
    addFarItem('bonus');
    const firstBonusInp = document.querySelector('#bonus-items-list .far-pct-inp');
    if (firstBonusInp) { firstBonusInp.value = 50; updateFarTotal('bonus'); }

    // Default transfer item: 古蹟 0%（供使用者自行選擇類型並填入數值）
    addFarItem('transfer');


    try {
        const savedKey = localStorage.getItem('gemini_api_key');
        if (savedKey) {
            const keyInput = document.getElementById('api-key-input');
            if (keyInput) keyInput.value = savedKey;
        }
    } catch (e) {}

    updateApiKeyStatus();
    updateApiModelSelect();
    updateMQLocation();
    updateLocationBadge(); // 初始化地址徽章
    
    // 初始化市場行情建議交叉分析
    if (typeof calculateCrossAnalysis === 'function') {
        calculateCrossAnalysis();
    }

    // Set initial floors manual slider state
    const isManual = document.getElementById('floorsManualToggle')?.checked;
    const slider = document.getElementById('c-floors');
    if (slider) {
        slider.disabled = !isManual;
        slider.style.opacity = isManual ? '1' : '0.55';
        slider.style.pointerEvents = isManual ? 'auto' : 'none';
    }

    // 載入記憶狀態或自動匹配智慧工期對照案型
    let storedCase = null;
    try {
        storedCase = localStorage.getItem('activeConstructionStandardCase');
    } catch (e) {}
    if (storedCase) {
        applyConstructionStandard(storedCase);
    } else {
        autoMatchConstructionStandard();
    }

    initProjectManager();
    toggleUnitLayoutsPanel(S.unitLayoutsExpanded);

    // 處理瀏覽器音效與自動播放安全策略
    const splashVid = document.getElementById('splashVideo');
    if (splashVid) {
        splashVid.muted = false;
        const playPromise = splashVid.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay with sound blocked, falling back to muted autoplay.");
                splashVid.muted = true;
                splashVid.play();
            });
        }
    }

    // 監聽參考公告現值輸入框 blur 事件，自動四捨五入至小數第一位
    const refAnnInp = document.getElementById('refAnnouncementValue');
    if (refAnnInp) {
        refAnnInp.addEventListener('blur', function() {
            const val = parseFloat(this.value);
            if (!isNaN(val)) {
                this.value = val.toFixed(1);
                calculateAll(true);
            }
        });
    }
};
