'use strict';

function getAdjustedConstructionStandard(key) {
    const baseData = CONSTRUCTION_STANDARDS[key];
    if (!baseData) return null;
    
    // 複製基準對照表資料，避免污染全域常數
    const data = { ...baseData };
    
    // 讀取實際設計的地上樓層數與地下層數
    const actualAboveFloors = parseInt(document.getElementById('c-floors').value) || 0;
    const actualBsmtFloors = parseInt(document.getElementById('basementFloors').value) || 0;
    
    // 1. 地上結構工期天數調整：以對照案型的地上結構基準天數為出發點，增減樓層時一律以 15 天/樓進行加減值
    const diffAboveFloors = actualAboveFloors - baseData.aboveFloors;
    const adjustedAbove = Math.max(0, baseData.above + diffAboveFloors * 15);
    const diffAboveDays = adjustedAbove - baseData.above;
    
    // 2. 地下結構工期天數調整：相較於基準案型地下室層數，增減層數時一律以 25 天/層進行加減值 (若地下室為 0 層則地下結構天數歸零)
    let adjustedBsmt = 0;
    let diffBsmtDays = 0;
    if (actualBsmtFloors > 0) {
        adjustedBsmt = baseData.bsmt + (actualBsmtFloors - baseData.bsmtFloors) * 25;
        diffBsmtDays = adjustedBsmt - baseData.bsmt;
    } else {
        adjustedBsmt = 0;
        diffBsmtDays = -baseData.bsmt;
    }
    
    // 更新結構天數，並將差值累加至總工期天數與月份中
    data.above = adjustedAbove;
    data.bsmt = adjustedBsmt;
    data.days = baseData.days + diffAboveDays + diffBsmtDays;
    
    // 方案一：動態結構係數法
    // 當匹配到的是 RC 基準案型 (即 key 不是 '29F_B4F_SRC')，但結構為 SRC / SC / SS 時，乘上結構轉換係數
    if (key !== '29F_B4F_SRC') {
        const structType = currentStruct;
        const coef = (structType === 'SRC') ? 1.09 : ((structType === 'SC' || structType === 'SS') ? 1.05 : 1.0);
        if (coef !== 1.0) {
            data.above = Math.round(data.above * coef);
            data.bsmt = Math.round(data.bsmt * coef);
            data.signing = Math.round(data.signing * coef);
            data.slurry = Math.round(data.slurry * coef);
            data.excav = Math.round(data.excav * coef);
            data.deco = Math.round(data.deco * coef);
            data.license = Math.round(data.license * coef);
            data.inspect = Math.round(data.inspect * coef);
            data.handover = Math.round(data.handover * coef);
            // 重新計算總工期天數，以與各分項階段天數加總完全一致
            data.days = data.signing + data.slurry + data.excav + data.bsmt + data.above + data.deco + data.license + data.inspect + data.handover;
        }
    }
    
    data.months = parseFloat((data.days / 30).toFixed(2));
    
    return data;
}

function applyConstructionStandard(key) {
    const data = getAdjustedConstructionStandard(key);
    if (!data) return;
    
    currentConstructionStandard = key;
    try {
        localStorage.setItem('activeConstructionStandardCase', key);
    } catch (e) {
        console.warn('Failed to save activeConstructionStandardCase to localStorage:', e);
    }
    
    // 設定輸入框的數值 (顯示小數點後 1 位，例如 24.8)
    const inputEl = document.getElementById('c-constMonths');
    if (inputEl) {
        inputEl.value = data.months.toFixed(1);
    }
    
    // 顯示詳細資料區塊
    const detailBlock = document.getElementById('scheduleStandardDetails');
    if (detailBlock) detailBlock.classList.remove('hidden');
    
    // 設定顯示標籤
    const labelEl = document.getElementById('activeStandardLabel');
    if (labelEl) labelEl.innerText = data.name + ' (已調整)';
    
    // 更新細項天數 UI
    document.getElementById('std_signing').innerText = data.signing + ' 天';
    document.getElementById('std_slurry').innerText = data.slurry + ' 天';
    document.getElementById('std_excav').innerText = data.excav + ' 天';
    document.getElementById('std_bsmt').innerText = data.bsmt + ' 天';
    document.getElementById('std_above').innerText = data.above + ' 天';
    document.getElementById('std_deco').innerText = data.deco + ' 天';
    document.getElementById('std_license').innerText = data.license + ' 天';
    document.getElementById('std_inspect').innerText = data.inspect + ' 天';
    document.getElementById('std_handover').innerText = data.handover + ' 天';
    
    // 更新按鈕高亮樣式
    Object.keys(CONSTRUCTION_STANDARDS).forEach(k => {
        const btn = document.querySelector(`[onclick="applyConstructionStandard('${k}')"]`);
        if (btn) {
            if (k === key) {
                btn.className = "tap px-2.5 py-1.5 bg-sky-600 border border-sky-500 text-white rounded-lg transition-all font-black text-center shadow-md shadow-sky-500/20";
            } else {
                btn.className = "tap px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700/80 transition-all font-black text-center";
            }
        }
    });

    // 觸發重新計算
    calcMatrix();
}

function autoMatchConstructionStandard() {
    const actualAboveFloors = parseInt(document.getElementById('c-floors').value) || 0;
    const structType = currentStruct;
    
    let matchKey = '12F_B2F_RC'; // 預設值
    
    if (actualAboveFloors > 25) {
        // 超過 25 樓，若結構是 SRC/SC/SS 則匹配 29F_B4F_SRC，若是 RC 則匹配 25F_B4F_RC
        if (structType === 'SRC' || structType === 'SC' || structType === 'SS') {
            matchKey = '29F_B4F_SRC';
        } else {
            matchKey = '25F_B4F_RC';
        }
    } else {
        // 25 樓及以下，不論結構均依高度匹配對應的 RC 案型作為計算基礎（非 RC 結構會於計算時自動乘上調整係數）
        if (actualAboveFloors <= 9) {
            matchKey = '7F_B1F_RC';
        } else if (actualAboveFloors <= 13) {
            matchKey = '12F_B2F_RC';
        } else if (actualAboveFloors <= 17) {
            matchKey = '14F_B3F_RC';
        } else if (actualAboveFloors <= 22) {
            matchKey = '20F_B4F_RC';
        } else {
            matchKey = '25F_B4F_RC';
        }
    }
    
    applyConstructionStandard(matchKey);
}




// Parameter inputs now directly trigger calculateAll() and calcMatrix()

// ═══════════════════════════════════════
//  MATRIX COST CALCULATOR  (Tab 2)
// ═══════════════════════════════════════
function calcMatrixActual() {
    if (_inCalc) return;
    _inCalc = true;
    let costChanged = false;
    let monthsChanged = false;
    try {
        // 若有選定的標準案型，在計算前先依據當前設計層數與地下層數動態更新其工期與 UI 詳細資訊
        if (currentConstructionStandard) {
            const data = getAdjustedConstructionStandard(currentConstructionStandard);
            if (data) {
                document.getElementById('c-constMonths').value = data.months.toFixed(1);
                
                // 更新細項天數 UI
                document.getElementById('std_signing').innerText = data.signing + ' 天';
                document.getElementById('std_slurry').innerText = data.slurry + ' 天';
                document.getElementById('std_excav').innerText = data.excav + ' 天';
                document.getElementById('std_bsmt').innerText = data.bsmt + ' 天';
                document.getElementById('std_above').innerText = data.above + ' 天';
                document.getElementById('std_deco').innerText = data.deco + ' 天';
                document.getElementById('std_license').innerText = data.license + ' 天';
                document.getElementById('std_inspect').innerText = data.inspect + ' 天';
                document.getElementById('std_handover').innerText = data.handover + ' 天';
            }
        }

        // 依基地面積自動配對選定基地規模修正
        const landAreaInput = parseFloat(document.getElementById('landArea').value) || 0;
        const siteScaleEl = document.getElementById('c-siteScale');
        if (siteScaleEl) {
            if (landAreaInput <= 100) {
                siteScaleEl.value = "1.15";
            } else if (landAreaInput <= 300) {
                siteScaleEl.value = "1.05";
            } else if (landAreaInput <= 500) {
                siteScaleEl.value = "1.0";
            } else {
                siteScaleEl.value = "0.95";
            }
        }

        const bType      = document.getElementById('c-buildingType').value;
        const facadeAdd  = parseFloat(document.getElementById('c-facadeType').value);
        const unitAdd    = parseFloat(document.getElementById('c-unitDensity').value);
        const smartAdd   = parseFloat(document.getElementById('c-smartLevel').value);
        const greenAdd   = parseFloat(document.getElementById('c-greenLevel').value);
        const brandMult  = parseFloat(document.getElementById('c-brandLevel').value);
        const floors     = parseInt(document.getElementById('c-floors').value);
        const siteMult   = parseFloat(document.getElementById('c-siteScale').value);
        const seismicLv  = document.getElementById('c-seismicLevel').value;
        const constM     = parseFloat(document.getElementById('c-constMonths').value) || 0;

        // Get totalGFA from land tab
        const landArea   = parseFloat(document.getElementById('landArea').value) || 0;
        const far        = parseFloat(document.getElementById('floorAreaRatio').value) || 0;
        const bonusR     = getFarTotal('bonus');
        const transferR  = getFarTotal('transfer');
        const baseFloor  = landArea * (far / 100);
        const totalFARFloorArea = baseFloor + baseFloor * (bonusR / 100) + baseFloor * (transferR / 100);
        const bcr        = parseFloat(document.getElementById('buildingCoverageRatio').value) || 0;
        const excavationRate = parseFloat(document.getElementById('excavationRate').value) || 0;
        const basementFloors = parseInt(document.getElementById('basementFloors').value) || 0;
        const totalGFA   = totalFARFloorArea * 1.25 + (landArea * (bcr / 100)) * 0.15 * 3 + landArea * (excavationRate / 100) * basementFloors;

        document.getElementById('c-totalGFA').innerText = totalGFA.toFixed(0);
        document.getElementById('c-floorValue').innerText = floors + ' F';

        // Struct warning
        const warnEl = document.getElementById('c-structWarning');
        if (currentStruct === 'RC' && floors > 25) {
            warnEl.classList.remove('hidden');
            warnEl.className = 'mb-3 p-2 rounded-lg border text-xs bg-rose-900/20 border-rose-700/40 text-rose-300';
            warnEl.innerText = '⚠ RC 超過 25F 時低層柱斷面過大，建議改用 SRC。';
        } else if (floors > 25) {
            warnEl.classList.remove('hidden');
            warnEl.className = 'mb-3 p-2 rounded-lg border text-xs bg-emerald-900/20 border-emerald-700/40 text-emerald-300';
            warnEl.innerText = '✓ 目前 ' + currentStruct + ' 構造符合實務規範。';
        } else {
            warnEl.classList.add('hidden');
        }

        // Floor addon
        let floorAddon = 0;
        if (floors > 15) floorAddon += (floors - 15) * 0.015;
        if (floors > 25) floorAddon += (floors - 25) * 0.02;

        let base = BASE_RATES[currentStruct];
        let unitCost = base * brandMult * siteMult * (1 + floorAddon + smartAdd + greenAdd + facadeAdd + unitAdd);
        const W = (currentStruct === 'RC') ? BEIAN : MINQUAN;

        // Seismic
        let structMult = 1.0;
        if (seismicLv === 'lv1') structMult = 1.25;
        else if (seismicLv === 'lv2') structMult = 1.20;
        else if (seismicLv === 'lv3') structMult = 1.10;

        let seismicFee = 0;
        if (seismicLv === 'label' && totalGFA > 0) {
            const eng = Math.ceil((totalGFA * 3.3058) / 1500);
            seismicFee = (eng * 24 * constM) / totalGFA;
        }
        unitCost += unitCost * W.structure * (structMult - 1) + seismicFee;

        // Read risk inflation
        const inflationInp = document.getElementById('c-costInflation');
        if (inflationInp && !inflationInp.dataset.initialized) {
            const storedInflation = localStorage.getItem('c_costInflation_val');
            if (storedInflation !== null) {
                inflationInp.value = storedInflation;
            }
            inflationInp.dataset.initialized = "true";
        }
        const inflationVal = inflationInp ? (parseFloat(inflationInp.value) || 0) : 0;
        localStorage.setItem('c_costInflation_val', inflationVal);
        const costInflation = inflationVal / 100;
        unitCost = unitCost * (1 + costInflation);

        // MEP ratio
        let mepRatio = W.mep;
        if (bType === 'office') mepRatio += 0.05;
        if (smartAdd >= 0.03)   mepRatio += 0.02;
        if (unitAdd >= 0.04)    mepRatio += 0.015;

        const mepCost       = unitCost * mepRatio;
        const totalCostOkun = (unitCost * totalGFA) / 10000;

        // Update matrix output UI
        document.getElementById('c-unitCost').innerText      = unitCost.toFixed(1);
        document.getElementById('c-mepRatio').innerText      = (mepRatio * 100).toFixed(1);
        document.getElementById('c-totalCostOkun').innerText = totalCostOkun.toFixed(2);

        const oldCost = S.matrixUnitCost;
        S.matrixUnitCost = unitCost;

        updateCostChart(brandMult, siteMult, smartAdd, greenAdd, bType, facadeAdd, unitAdd);
        updateCostTable(unitCost, mepRatio, totalGFA, W);

        if (S.useMatrix) {
            const constCostEl = document.getElementById('constructionCost');
            if (constCostEl) {
                const oldVal = constCostEl.value;
                const newVal = unitCost.toFixed(1);
                if (oldVal !== newVal) {
                    constCostEl.value = newVal;
                    costChanged = true;
                }
            }
        }
        const oldMonths = S.matrixConstMonths || 0;
        monthsChanged = Math.abs(oldMonths - constM) > 0.01;
        S.matrixConstMonths = constM;
    } finally {
        _inCalc = false;
    }

    if ((S.useMatrix && costChanged) || monthsChanged) {
        calculateAll();
    }
}


// Apply matrix cost to main calc
function applyMatrixCost() {
    S.useMatrix = true;
    const val = S.matrixUnitCost.toFixed(1);
    document.getElementById('constructionCost').value = val;
    document.getElementById('costSrcBadge').innerText  = '矩陣';
    document.getElementById('costSrcBadge').className  = 'pill bg-sky-800/60 text-sky-300 normal-case font-medium';
    calculateAll();
    // Flash feedback
    const btn = event.currentTarget || document.querySelector('[onclick="applyMatrixCost()"]');
    const orig = btn.textContent;
    btn.textContent = '✅ 已套用！';
    setTimeout(() => btn.innerHTML = '⚙️ 套用此造價至主試算', 1500);
}

function getTodRatioFromTransferList() {
    const list = document.getElementById('transfer-items-list');
    if (!list) return 0;
    let todRatio = 0;
    list.querySelectorAll('.far-item').forEach(item => {
        const sel = item.querySelector('.far-sel');
        let typeVal = sel.value;
        if (sel.classList.contains('hidden') || typeVal === '其它（手動填入）') {
            const customInp = item.querySelector('.far-custom-inp');
            if (customInp) typeVal = customInp.value.trim();
        }
        if (typeVal === 'TOD增額') {
            const pctInp = item.querySelector('.far-pct-inp');
            todRatio += parseFloat(pctInp.value) || 0;
        }
    });
    return todRatio;
}


// ═══════════════════════════════════════
//  MAIN CALCULATION
// ═══════════════════════════════════════
function calculateAllActual() {
    if (_inCalc) return;
    _inCalc = true;
    try {
        const bType = document.getElementById('c-buildingType').value;
        const typeLabel = (bType === 'office') ? '辦公室' : '住宅';
        const typeName = (bType === 'office') ? '辦公' : '住宅';
        
        const kpiRevenueLabel = document.getElementById('m-kpi-revenue-label');
        if (kpiRevenueLabel) kpiRevenueLabel.innerText = typeName + '銷售收益';
        const kpiResAreaLabel = document.getElementById('m-kpi-res-area-label');
        if (kpiResAreaLabel) kpiResAreaLabel.innerText = typeName + '銷坪';
        
        const resRevenueLabel = document.getElementById('r-resRevenue-label');
        if (resRevenueLabel) resRevenueLabel.innerText = typeLabel;
        
        const btnApplyMarket = document.getElementById('btn-applyMarketPrice');
        if (btnApplyMarket) btnApplyMarket.innerText = '⬆ 套用' + typeName + '均價至推案單價';
        
        const btnApplyManual = document.getElementById('btn-applyManualMarketPrice');
        if (btnApplyManual) btnApplyManual.innerText = '⬆ 套用' + typeName + '均價至推案單價';

        // 同步「周週行情查詢」的住宅/辦公價格至「推案單價」並鎖定
        const priceId = (bType === 'office') ? 'mq-m-off' : 'mq-m-res';
        const sourcePrice = parseFloat(document.getElementById(priceId).value) || 0;
        const avgPriceEl = document.getElementById('avgPrice');
        if (avgPriceEl) {
            avgPriceEl.value = sourcePrice;
        }

        // ── Land params ──
        const landArea       = parseFloat(document.getElementById('landArea').value) || 0;
    const far            = parseFloat(document.getElementById('floorAreaRatio').value) || 0;
    const bonusR         = getFarTotal('bonus');
    const transferR      = getFarTotal('transfer');
    let saleFactor       = parseFloat(document.getElementById('saleFactor').value) || 1.65;
    const avgPrice       = parseFloat(document.getElementById('avgPrice').value) || 0;
    const adminRate      = parseFloat(document.getElementById('adminRate').value) || 0;
    const advisorRate    = parseFloat(document.getElementById('advisorRate').value) || 0;
    const trustRate      = parseFloat(document.getElementById('trustRate').value) || 0;
    const salesRate      = parseFloat(document.getElementById('salesRate').value) || 0;
    const taxRate        = parseFloat(document.getElementById('taxRate').value) || 0;
    const costPerFloor   = parseFloat(document.getElementById('constructionCost').value) || 0;
    const splitRatioVal = parseFloat(document.getElementById('splitRatio').value);
    const landlordR      = isNaN(splitRatioVal) ? 60 : splitRatioVal;
    const transferLandlordRatioVal = parseFloat(document.getElementById('transferLandlordRatio').value);
    const tLandlordR     = isNaN(transferLandlordRatioVal) ? 10 : transferLandlordRatioVal;
    const tBuilderR      = 100 - tLandlordR;
    document.getElementById('transferBuilderRatio').value = tBuilderR;

    const transferCost   = calculateTransferCost();

    // ── TOD Cost ──
    const todRatio = getTodRatioFromTransferList();
    const todValParam = parseFloat(document.getElementById('todValuationParam').value) || 0;
    const refAnnVal = parseFloat(document.getElementById('refAnnouncementValue').value) || 0;
    const weightPct = parseFloat(document.getElementById('cashWeight').value) || 0;

    let projectBuilderRatio = 1.0;
    if (S.mode === 'joint') {
        projectBuilderRatio = (100 - landlordR) / 100;
    } else if (S.mode === 'mixed') {
        const purchaseR = (parseFloat(document.getElementById('mixedPurchaseRatio').value) || 0) / 100;
        const jointR = 1 - purchaseR;
        const builderBaseR = (100 - landlordR) / 100;
        projectBuilderRatio = purchaseR + jointR * builderBaseR;
    }

    const todCost = (landArea * 3.3058) * (todRatio / 100) * refAnnVal * (weightPct / 100) * projectBuilderRatio * todValParam;

    // ── Financing ──
    // Sync building loan years to construction months (directly linked: buildLoanYears = c-constMonths / 12)
    const constM         = parseFloat(document.getElementById('c-constMonths').value)    || 0;
    const buildLoanYearsEl = document.getElementById('buildLoanYears');
    if (buildLoanYearsEl) {
        buildLoanYearsEl.value = (constM / 12).toFixed(1);
    }

    const landLoanR      = parseFloat(document.getElementById('landLoanRatio').value)    || 0;
    const landLoanY      = parseFloat(document.getElementById('landLoanYears').value)    || 0;
    const landLoanI      = parseFloat(document.getElementById('landLoanInterest').value) || 0;
    const buildLoanR     = parseFloat(document.getElementById('buildLoanRatio').value)   || 0;
    const buildLoanY     = parseFloat(document.getElementById('buildLoanYears').value)   || 0;
    const buildLoanI     = parseFloat(document.getElementById('buildLoanInterest').value)|| 0;

    // ── Market params ──
    const soldRatioPctRaw = parseFloat(document.getElementById('m-soldRatio').value);
    const soldRatioPct   = isNaN(soldRatioPctRaw) ? 90 : soldRatioPctRaw;
    const parkingPriceRaw = parseFloat(document.getElementById('m-parkingPrice').value);
    const parkingPrice   = isNaN(parkingPriceRaw) ? 150 : parkingPriceRaw;
    const basementFloors = parseInt(document.getElementById('basementFloors').value) || 0;

    // ── Area calculations ──
    const baseFloorArea  = landArea * (far / 100);
    const bonusArea      = baseFloorArea * (bonusR / 100);
    const transferArea   = baseFloorArea * (transferR / 100);
    
    // 總容積樓地版面積 (坪)
    const totalFARFloorArea = baseFloorArea + bonusArea + transferArea;
    
    // ── 細項規劃計算 ──
    const bcr = parseFloat(document.getElementById('buildingCoverageRatio').value) || 0;
    const bcrRate = bcr / 100;
    const maxFootprint = landArea * bcrRate;
    
    // 1. 店舖面積手動/公式判定
    const shopManual = document.getElementById('shopAreaManualToggle').checked;
    let shopArea = 0;
    if (shopManual) {
        const shopInput = document.getElementById('shopAreaDisplay');
        shopArea = parseFloat(shopInput.value) || 0;
        if (shopArea > maxFootprint) {
            shopArea = maxFootprint;
            shopInput.value = shopArea.toFixed(1);
        }
    } else {
        shopArea = (landArea * bcrRate) / 1.4;
        document.getElementById('shopAreaDisplay').value = shopArea.toFixed(1) + ' 坪';
    }

    // 2. 規劃棟數讀取與標準層面積手動/公式判定與拉桿範圍控制
    const buildingCount = parseInt(document.getElementById('buildingCountSelector').value) || 1;
    const stdManual = document.getElementById('stdFloorManualToggle').checked;
    
    // 依據規劃棟數分攤標準層面積
    const rawStdFloorArea = landArea * (bcrRate - 0.08) / buildingCount;
    
    // 3. 動態設定拉桿最大與最小值屬性 (單棟標準層)
    const minStd = 5;
    const maxStd = (maxFootprint / buildingCount) > minStd ? (maxFootprint / buildingCount) : 100;
    const slider = document.getElementById('stdFloorSlider');
    slider.min = minStd;
    slider.max = maxStd;
    document.getElementById('stdFloorSliderMinText').innerText = minStd;
    document.getElementById('stdFloorSliderMaxText').innerText = Math.round(maxStd);

    // 動態更新標準層面積標籤
    const stdLabel = document.getElementById('stdFloorAreaLabel');
    if (stdLabel) {
        if (buildingCount > 1) {
            stdLabel.innerText = `標準層面積 (單棟坪)`;
        } else {
            stdLabel.innerText = `標準層面積 (坪)`;
        }
    }

    let stdFloorArea = rawStdFloorArea;
    let isSplitApplied = false;

    if (stdManual) {
        stdFloorArea = parseFloat(slider.value) || rawStdFloorArea;
        if (stdFloorArea < minStd) stdFloorArea = minStd;
        if (stdFloorArea > maxStd) {
            stdFloorArea = maxStd;
            slider.value = stdFloorArea;
        }
        document.getElementById('stdFloorSliderVal').innerText = stdFloorArea.toFixed(1) + ' 坪';
        document.getElementById('stdFloorAreaDisplay').value = stdFloorArea.toFixed(1) + ' 坪' + (buildingCount > 1 ? ` (總 ${ (stdFloorArea * buildingCount).toFixed(1) } 坪)` : '');
    } else {
        const stdFloorMode = document.getElementById('stdFloorModeSelector').value;
        if (stdFloorMode === 'double' && rawStdFloorArea >= 200) {
            stdFloorArea = rawStdFloorArea / 2;
            isSplitApplied = true;
        }
        slider.value = stdFloorArea; // 同步公式數值至拉桿
        document.getElementById('stdFloorSliderVal').innerText = stdFloorArea.toFixed(1) + ' 坪';
        document.getElementById('stdFloorAreaDisplay').value = stdFloorArea.toFixed(1) + ' 坪' + (isSplitApplied ? ' (折半)' : '') + (buildingCount > 1 ? ` (總 ${ (stdFloorArea * buildingCount).toFixed(1) } 坪)` : '');
    }

    // 4. 樓層數與剩餘容積評估 (考慮棟數)
    let residentialFloors = 0;
    let totalFloorsEval = 0;
    let remainingFAR = 0;
    if (stdFloorArea > 0) {
        residentialFloors = Math.floor((totalFARFloorArea - shopArea) / (stdFloorArea * buildingCount));
        if (residentialFloors < 0) residentialFloors = 0;
        totalFloorsEval = residentialFloors + 1;
        remainingFAR = totalFARFloorArea - shopArea - (stdFloorArea * buildingCount * residentialFloors);
    }

    document.getElementById('floorCountAssessmentDisplay').innerText = totalFloorsEval > 0 ? `${totalFloorsEval} 層 (店面 1層 + ${typeLabel} ${residentialFloors}層)${buildingCount > 1 ? ` [${buildingCount}棟]` : ''}` : '0 層';
    document.getElementById('remainingFarDisplay').innerText = (remainingFAR > 0 ? remainingFAR.toFixed(1) : '0.0') + ' 坪';

    // ── 戶型規劃、預警與 Lobby/Balcony/High-Rise Auto-Linkage ──
    const currentSelectVal = S.unitLayouts.reduce((sum, item) => sum + item.count, 0);
    const totalUnitAreaSum = S.unitLayouts.reduce((sum, item) => sum + (item.area * item.count), 0);

    // 標準層面積預警 (單棟比對)
    const unitAreaWarningEl = document.getElementById('unitAreaWarning');
    if (unitAreaWarningEl) {
        if (totalUnitAreaSum > stdFloorArea) {
            const diff = (totalUnitAreaSum - stdFloorArea).toFixed(1);
            unitAreaWarningEl.className = 'text-xs font-bold text-rose-400 animate-pulse';
            unitAreaWarningEl.innerText = `⚠️ 已超出標準層：${diff} 坪`;
        } else {
            const diff = (stdFloorArea - totalUnitAreaSum).toFixed(1);
            unitAreaWarningEl.className = 'text-xs font-bold text-emerald-400';
            unitAreaWarningEl.innerText = `(剩餘未分配：${diff} 坪)`;
        }
    }

    // Lobby & Balcony lock logic
    const balconyRatioEl = document.getElementById('balconyRatio');
    const lobbyRatioEl = document.getElementById('lobbyRatio');
    if (balconyRatioEl && lobbyRatioEl) {
        if (currentSelectVal >= 8) {
            balconyRatioEl.value = 5;
            balconyRatioEl.readOnly = true;
            balconyRatioEl.style.opacity = '0.6';
            balconyRatioEl.style.pointerEvents = 'none';
            
            lobbyRatioEl.value = 10;
            lobbyRatioEl.readOnly = true;
            lobbyRatioEl.style.opacity = '0.6';
            lobbyRatioEl.style.pointerEvents = 'none';
        } else {
            if (balconyRatioEl.readOnly) {
                balconyRatioEl.value = 10;
                lobbyRatioEl.value = 5;
            }
            balconyRatioEl.readOnly = false;
            balconyRatioEl.style.opacity = '';
            balconyRatioEl.style.pointerEvents = '';
            
            lobbyRatioEl.readOnly = false;
            lobbyRatioEl.style.opacity = '';
            lobbyRatioEl.style.pointerEvents = '';
        }
    }

    // High-rise status based on totalFloorsEval (>= 16 floors is high-rise in Taiwan)
    const highRiseTypeEl = document.getElementById('highRiseType');
    const excavationRateEl = document.getElementById('excavationRate');
    if (highRiseTypeEl && excavationRateEl) {
        if (totalFloorsEval >= 16) {
            // ── 高層：鎖定開挖率 = (1 + 法定建蔽率%) / 2
            highRiseTypeEl.value = '高層';
            const lockedExcavationRate = (100 + bcr) / 2;
            excavationRateEl.value = lockedExcavationRate.toFixed(1);
            excavationRateEl.readOnly = true;
            excavationRateEl.style.opacity = '0.6';
            excavationRateEl.style.pointerEvents = 'none';
            excavationRateEl.removeAttribute('data-manual-lock');
        } else {
            // ── 非高層：依使用分區自動給預設值（手動改過則不覆寫）
            highRiseTypeEl.value = '非高層';
            excavationRateEl.readOnly = false;
            excavationRateEl.style.opacity = '';
            excavationRateEl.style.pointerEvents = '';

            // 若未被使用者手動鎖定，才自動填入預設值
            if (!excavationRateEl.getAttribute('data-manual-lock')) {
                const zone = S.cadastralZone || '';
                // 商業區（任何種類商業區）→ 90%，其餘 → 80%
                const isCommercial = zone.includes('商業區');
                const autoRate = isCommercial ? 90 : 80;
                excavationRateEl.value = autoRate;
            }
        }
    }

    // Read excavationRate and balconyRatio after auto-linkages
    const excavationRate = parseFloat(excavationRateEl.value) || 0;
    const balconyRatio = parseFloat(balconyRatioEl.value) || 0;

    // --- 銷坪與公設比自動連動平衡 ---
    const publicRatioEl = document.getElementById('publicRatio');
    let publicRatio = publicRatioEl ? (parseFloat(publicRatioEl.value) || 0) : 35;

    const saleLinkageToggle = document.getElementById('saleLinkageToggle');
    const modeFactor = document.getElementById('modeFactor');
    const useFactorMode = modeFactor ? modeFactor.checked : true;

    if (saleLinkageToggle && saleLinkageToggle.checked) {
        if (useFactorMode) {
            // 銷坪係數為基準 -> 計算公設比
            if (saleFactor > 0) {
                let pVal = 100 * (1 - (1 + balconyRatio / 100) / saleFactor);
                pVal = Math.max(0, Math.min(80, pVal));
                publicRatio = Math.round(pVal * 10) / 10;
                if (publicRatioEl) publicRatioEl.value = publicRatio.toFixed(1);
            }
        } else {
            // 公設比為基準 -> 計算銷坪係數
            if (publicRatio < 100 && publicRatio >= 0) {
                let fVal = (1 + balconyRatio / 100) / (1 - publicRatio / 100);
                fVal = Math.max(1.0, Math.min(3.0, fVal));
                saleFactor = Math.round(fVal * 100) / 100;
                document.getElementById('saleFactor').value = saleFactor.toFixed(2);
            }
        }
    }

    // 總樓地板面積 (坪)
    const totalFloorArea = totalFARFloorArea * 1.25 + (landArea * (bcr / 100)) * 0.15 * 3 + landArea * (excavationRate / 100) * basementFloors;

    // Sales area calculations
    const areaFromFactor = totalFARFloorArea * saleFactor;
    const areaFromPublic = (publicRatio >= 100 || publicRatio < 0) ? 0 : ((totalFARFloorArea * (1 + balconyRatio / 100)) / (1 - (publicRatio / 100)));

    const totalSaleArea  = useFactorMode ? areaFromFactor : areaFromPublic;
    const saleableArea   = totalSaleArea;
    
    const activeSaleFactor = totalFARFloorArea > 0 ? (totalSaleArea / totalFARFloorArea) : saleFactor;
    const baseSaleArea   = (baseFloorArea + bonusArea) * activeSaleFactor;
    const transferSaleArea = transferArea * activeSaleFactor;

    // Calculate total units
    const shopUnits = shopArea > 0 ? 1 : 0;
    const totalUnits = currentSelectVal * residentialFloors * buildingCount + shopUnits;
    const summaryTextEl = document.getElementById('unitLayoutsSummaryText');
    if (summaryTextEl) {
        summaryTextEl.innerText = '(' + currentSelectVal + '戶 / ' + totalUnits + '戶)';
    }

    // 車位數計算
    const statutoryParkingCount = Math.max(0, Math.ceil((totalFARFloorArea * 3.3058 - 500) / 150));
    const parkingMode = document.getElementById('parkingModeSelector').value;
    let selfParkingCount = 0;
    if (parkingMode === 'all') {
        selfParkingCount = Math.max(0, Math.ceil((totalFloorArea - totalSaleArea) / 12 - statutoryParkingCount));
    }
    const baseParkingCount = statutoryParkingCount + selfParkingCount;

    // 機械車位計算
    const mechanicalSelectEl = document.getElementById('mechanicalParkingSelect');
    const useMechanical = mechanicalSelectEl ? mechanicalSelectEl.value === 'enabled' : false;
    let mechanicalCount = 0;
    if (useMechanical && totalUnits > baseParkingCount) {
        mechanicalCount = totalUnits - baseParkingCount;
    }

    const parkingCount = baseParkingCount + mechanicalCount;
    const planeParkingCount = statutoryParkingCount + selfParkingCount;
    const totalParkingRev = planeParkingCount * parkingPrice + mechanicalCount * (parkingPrice * 0.6);
    let parkingRev = 0;
    
    document.getElementById('displayStatutoryParking').value = statutoryParkingCount;
    
    const displaySelfParkingEl = document.getElementById('displaySelfParking');
    const selfParkingLabelEl = document.getElementById('selfParkingLabel');
    if (mechanicalCount > 0) {
        if (displaySelfParkingEl) displaySelfParkingEl.value = selfParkingCount + ' (+' + mechanicalCount + '機)';
        if (selfParkingLabelEl) selfParkingLabelEl.innerText = '增設(平+機)';
    } else {
        if (displaySelfParkingEl) displaySelfParkingEl.value = selfParkingCount;
        if (selfParkingLabelEl) selfParkingLabelEl.innerText = '增設';
    }
    document.getElementById('m-parkingCount').value = parkingCount;

    // 戶車比顯示
    const carHouseholdRatio = totalUnits > 0 ? (parkingCount / totalUnits) : 0;
    const householdCarRatioDisplay = document.getElementById('householdCarRatioDisplay');
    if (householdCarRatioDisplay) {
        householdCarRatioDisplay.innerText = carHouseholdRatio.toFixed(2) + ' 輛/戶';
    }

    // Sync totalFloorsEval to c-floors if manual mode is OFF
    const floorsManual = document.getElementById('floorsManualToggle')?.checked;
    if (!floorsManual) {
        const cFloorsSlider = document.getElementById('c-floors');
        if (cFloorsSlider) {
            const clampedFloors = Math.max(1, Math.min(50, totalFloorsEval || 1));
            cFloorsSlider.value = clampedFloors;
        }
    }



    // ── Construction cost (using floor area) ──
    const totalConstructionCost = totalFloorArea * costPerFloor;

    // Display
    document.getElementById('bonusAreaText').innerText      = bonusArea.toFixed(1) + ' 坪';
    document.getElementById('transferAreaText').innerText   = transferArea.toFixed(1) + ' 坪';
    document.getElementById('totalFARFloorAreaDisplay').value = totalFARFloorArea.toLocaleString(undefined, {maximumFractionDigits:1}) + ' 坪';
    document.getElementById('totalFloorAreaDisplay').value  = totalFloorArea.toLocaleString(undefined, {maximumFractionDigits:1}) + ' 坪';

    // Update Land-to-Volume Ratio (土容比)
    const landSalesRatio = landArea > 0 ? (totalSaleArea / landArea) : 0;
    const landSalesRatioEl = document.getElementById('landSalesRatio');
    if (landSalesRatioEl) {
        landSalesRatioEl.value = landSalesRatio.toFixed(2);
    }

    const saleFactorEl = document.getElementById('saleFactor');

    // Update total sale area display next to sales factor
    const totalSaleAreaDisplayEl = document.getElementById('totalSaleAreaDisplay');
    if (totalSaleAreaDisplayEl) {
        totalSaleAreaDisplayEl.innerText = areaFromFactor.toFixed(1) + ' 坪';
    }

    // Update derived sale area display from public area ratio
    const derivedSaleAreaDisplayEl = document.getElementById('derivedSaleAreaDisplay');
    if (derivedSaleAreaDisplayEl) {
        derivedSaleAreaDisplayEl.innerText = areaFromPublic.toFixed(1) + ' 坪';
    }

    // Dynamically apply active/inactive styles and dimming
    if (useFactorMode) {
        if (totalSaleAreaDisplayEl) {
            totalSaleAreaDisplayEl.className = 'text-emerald-400 font-mono font-black';
        }
        if (derivedSaleAreaDisplayEl) {
            derivedSaleAreaDisplayEl.className = 'text-slate-500 font-mono font-medium';
        }
        if (saleFactorEl) saleFactorEl.classList.remove('opacity-60');
        if (publicRatioEl) publicRatioEl.classList.add('opacity-60');
    } else {
        if (totalSaleAreaDisplayEl) {
            totalSaleAreaDisplayEl.className = 'text-slate-500 font-mono font-medium';
        }
        if (derivedSaleAreaDisplayEl) {
            derivedSaleAreaDisplayEl.className = 'text-emerald-400 font-mono font-black';
        }
        if (saleFactorEl) saleFactorEl.classList.add('opacity-60');
        if (publicRatioEl) publicRatioEl.classList.remove('opacity-60');
    }

    // Update FAR transfer cash-in-lieu and TOD cost displays
    const estimatedCashInLieuTotalEl = document.getElementById('estimatedCashInLieuTotal');
    const estimatedTodTotalEl = document.getElementById('estimatedTodTotal');
    const transferCostPerSaleAreaEl = document.getElementById('transferCostPerSaleArea');
    if (estimatedCashInLieuTotalEl) {
        estimatedCashInLieuTotalEl.innerText = Math.round(transferCost).toLocaleString() + ' 萬';
    }
    if (estimatedTodTotalEl) {
        estimatedTodTotalEl.innerText = Math.round(todCost).toLocaleString() + ' 萬';
    }
    if (transferCostPerSaleAreaEl) {
        const transferCostUnit = totalSaleArea > 0 ? ((transferCost + todCost) / totalSaleArea) : 0;
        transferCostPerSaleAreaEl.innerText = transferCostUnit.toFixed(1) + ' 萬/坪';
    }

    // Sync to matrix tab
    document.getElementById('c-totalGFA').innerText = totalFloorArea.toFixed(0);

    // Sync to market tab
    const mAvgPriceEl = document.getElementById('m-avgPrice');
    if (mAvgPriceEl) mAvgPriceEl.innerText = avgPrice.toFixed(1);
    document.getElementById('m-parkingCountDisplay').value = parkingCount;
    const mqParkCountSpan = document.getElementById('mq-m-park-count-span');
    if (mqParkCountSpan) mqParkCountSpan.innerText = '共 ' + parkingCount + ' 輛';

    // ── Mode-specific calculation ──
    const customCostSum = S.customCosts.reduce((a, b) => a + b.amount, 0);
    const customRevenueSum = S.customRevenues.reduce((a, b) => a + b.amount, 0);

    const rawRet = document.getElementById('mq-m-ret').value;
    let retPrice = (rawRet === '' || isNaN(parseFloat(rawRet))) ? avgPrice * 1.5 : parseFloat(rawRet);

    // shopArea is already defined in this scope
    const shopSaleArea = shopArea * saleFactor;
    const resBaseSaleArea = Math.max(0, baseSaleArea - shopSaleArea);

    let builderResSaleArea = 0;
    let builderShopSaleArea = 0;
    let resRevenue = 0;
    let shopRevenue = 0;
    let builderRevenueRaw = 0;
    let builderRevenue  = 0;
    let totalCostRaw    = 0;
    let totalCost       = 0;
    let totalInterest   = 0;
    let totalLandCost   = 0;
    let adminCost       = 0;
    let baseLandCost    = 0;
    let landInterest    = 0;

    if (S.mode === 'joint') {
        const builderBaseR    = (100 - landlordR) / 100;
        parkingRev = totalParkingRev * builderBaseR;
        builderResSaleArea = resBaseSaleArea * builderBaseR + transferSaleArea * (tBuilderR / 100);
        builderShopSaleArea = shopSaleArea * builderBaseR;
        
        const soldRate        = soldRatioPct / 100;
        
        resRevenue = builderResSaleArea * avgPrice * soldRate;
        shopRevenue = builderShopSaleArea * retPrice * soldRate;
        builderRevenueRaw = resRevenue + shopRevenue + parkingRev;
        adminCost      = builderRevenueRaw * (adminRate / 100);
        
        const buildInterest = totalConstructionCost * (buildLoanR/100) * (buildLoanI/100) * buildLoanY;
        totalInterest  = buildInterest;
        totalLandCost  = transferCost + todCost;
        totalCostRaw   = totalLandCost + totalConstructionCost + adminCost + totalInterest;

        builderRevenue = builderRevenueRaw + customRevenueSum;
        totalCost      = totalCostRaw + customCostSum;

    } else if (S.mode === 'purchase') {
        const landPurchasePrice = parseFloat(document.getElementById('landPurchasePrice').value) || 0;
        baseLandCost    = landArea * landPurchasePrice;
        const soldRate  = soldRatioPct / 100;
        
        parkingRev = totalParkingRev;
        builderResSaleArea = resBaseSaleArea + transferSaleArea;
        builderShopSaleArea = shopSaleArea;
        
        resRevenue = builderResSaleArea * avgPrice * soldRate;
        shopRevenue = builderShopSaleArea * retPrice * soldRate;
        builderRevenueRaw = resRevenue + shopRevenue + parkingRev;
        adminCost       = builderRevenueRaw * (adminRate / 100);

        landInterest        = baseLandCost * (landLoanR/100) * (landLoanI/100) * landLoanY;
        const buildInterest = totalConstructionCost * (buildLoanR/100) * (buildLoanI/100) * buildLoanY;
        totalInterest = landInterest + buildInterest;
        totalLandCost = baseLandCost + transferCost + todCost;
        totalCostRaw  = totalLandCost + totalConstructionCost + adminCost + totalInterest;

        builderRevenue = builderRevenueRaw + customRevenueSum;
        totalCost      = totalCostRaw + customCostSum;

    } else { // mixed
        const mixedPrice= parseFloat(document.getElementById('mixedPurchasePrice').value) || 0;
        const mixedArea = parseFloat(document.getElementById('mixedPurchaseArea').value)  || 0;
        const mixedR    = (parseFloat(document.getElementById('mixedPurchaseRatio').value) || 0) / 100;

        baseLandCost    = mixedArea * mixedPrice;
        const purchaseR = mixedR;
        const jointR    = 1 - mixedR;
        const builderBaseR = (100 - landlordR) / 100;
        const soldRate  = soldRatioPct / 100;
        const f_base = purchaseR + jointR * builderBaseR;
        parkingRev = totalParkingRev * f_base;
        builderResSaleArea = resBaseSaleArea * f_base + transferSaleArea * (tBuilderR / 100);
        builderShopSaleArea = shopSaleArea * f_base;

        resRevenue = builderResSaleArea * avgPrice * soldRate;
        shopRevenue = builderShopSaleArea * retPrice * soldRate;
        builderRevenueRaw = resRevenue + shopRevenue + parkingRev;

        adminCost = builderRevenueRaw * (adminRate / 100);
        landInterest        = baseLandCost * (landLoanR/100) * (landLoanI/100) * landLoanY;
        const buildInterest = totalConstructionCost * (buildLoanR/100) * (buildLoanI/100) * buildLoanY;
        totalInterest = landInterest + buildInterest;
        totalLandCost = baseLandCost + transferCost + todCost;
        totalCostRaw  = totalLandCost + totalConstructionCost + adminCost + totalInterest;

        builderRevenue = builderRevenueRaw + customRevenueSum;
        totalCost      = totalCostRaw + customCostSum;
    }

    // Calculate new advisor, trust and sales costs
    const landLoanAmt = baseLandCost * (landLoanR / 100);
    const buildLoanAmt = totalConstructionCost * (buildLoanR / 100);
    const advisorCost = totalConstructionCost * (advisorRate / 100);
    const trustCost = (landLoanAmt + buildLoanAmt) * (trustRate / 100);
    const salesCost = builderRevenueRaw * (salesRate / 100);

    totalCostRaw += advisorCost + trustCost + salesCost;
    totalCost = totalCostRaw + customCostSum;

    // Update financing card text outputs (handles all modes)
    document.getElementById('totalLandCostText').innerText = Math.round(totalLandCost).toLocaleString() + ' 萬';
    document.getElementById('totalInterestText').innerText = Math.round(totalInterest).toLocaleString() + ' 萬';

    const netProfit = builderRevenue - totalCost;
    const roi       = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
    const grossMargin = builderRevenue > 0 ? (netProfit / builderRevenue) * 100 : 0;

    // 計算建方分得的可銷售面積總和 (用於 BEP 損益平衡計算與銷售展示)
    const builderSaleableArea = builderResSaleArea + builderShopSaleArea;

    // BEP: 建方總成本 = 建方銷坪 * 銷售率 * BEP單價 + 車位收益
    const bepDenom   = builderSaleableArea * (soldRatioPct / 100);
    const bepPrice   = bepDenom > 0 ? (totalCost - parkingRev) / bepDenom : 0;

    // Save (此處 saleableArea 改存為建方持有的銷坪，使整個結果頁面以建方財務評估為主體)
    S.currentResult = {
        landArea, totalFloorArea, totalSaleArea, saleableArea: builderSaleableArea,
        totalLandCost, totalConstructionCost, adminCost, totalInterest, totalCost,
        builderRevenue, parkingRev, resRevenue, shopRevenue, netProfit, roi, grossMargin, bepPrice,
        avgPrice, soldRatioPct, parkingCount, parkingPrice, costPerFloor,
        basementFloors, excavationRate, customCostSum, customRevenueSum, baseLandCost,
        advisorCost, trustCost, salesCost, advisorRate, trustRate, salesRate, taxRate
    };

    if (S.isSearching) return;

    // 更新市場頁籤的可銷售坪數顯示 (此處為建方銷坪，與 KPI 卡片完全一致)
    const mSaleableAreaInput = document.getElementById('m-saleableArea');
    if (mSaleableAreaInput) mSaleableAreaInput.value = builderSaleableArea.toFixed(0) + ' 坪';
    const mKpiSaleAreaSpan = document.getElementById('m-kpi-saleArea');
    if (mKpiSaleAreaSpan) mKpiSaleAreaSpan.innerText = builderSaleableArea.toFixed(0);

    // ── Update Header ──
    document.getElementById('hdr-profit').innerText = Math.round(netProfit).toLocaleString();
    const roiPill = document.getElementById('hdr-roi-pill');
    document.getElementById('hdr-roi').innerText = roi.toFixed(1) + '%';
    if (roi >= 20)      roiPill.className = 'pill bg-emerald-900/50 text-emerald-300 border border-emerald-800/40';
    else if (roi >= 10) roiPill.className = 'pill bg-amber-900/50 text-amber-300 border border-amber-800/40';
    else                roiPill.className = 'pill bg-rose-900/50 text-rose-300 border border-rose-800/40';

    // ── Update Market tab ──
    updateMarketTab(bepPrice, avgPrice, totalCost, builderSaleableArea, soldRatioPct, parkingRev, resRevenue, shopRevenue, builderResSaleArea, builderShopSaleArea, parkingCount, parkingPrice, costPerFloor);

    // ── Update Result tab ──
    updateResultTab(totalLandCost, totalConstructionCost, adminCost, totalInterest, totalCost,
                    resRevenue, shopRevenue, parkingRev, netProfit, roi, grossMargin, bepPrice, soldRatioPct);

        // ── Update AI location display ──
        const aiLocDisp = document.getElementById('ai-locationDisplay');
        if (aiLocDisp) aiLocDisp.value = document.getElementById('location').value || '';
        updateMQLocation();
    } finally {
        _inCalc = false;
    }

    calcMatrix();
    syncAppliedButtonsState();
}

function onBepBarSliderInput(val) {
    document.getElementById('m-soldRatio').value = val;
    const valEl = document.getElementById('m-bepSliderVal');
    if (valEl) valEl.innerText = val + '%';
    calculateAll();
}

function syncCostListAdminRate(val) {
    const adminRateEl = document.getElementById('adminRate');
    if (adminRateEl) {
        adminRateEl.value = val;
        calculateAll();
    }
}

function syncCostListAdvisorRate(val) {
    const advisorRateEl = document.getElementById('advisorRate');
    if (advisorRateEl) {
        advisorRateEl.value = val;
        calculateAll();
    }
}

function syncCostListTrustRate(val) {
    const trustRateEl = document.getElementById('trustRate');
    if (trustRateEl) {
        trustRateEl.value = val;
        calculateAll();
    }
}

function syncCostListSalesRate(val) {
    const salesRateEl = document.getElementById('salesRate');
    if (salesRateEl) {
        salesRateEl.value = val;
        calculateAll();
    }
}

function syncKpiListTaxRate(val) {
    const taxRateEl = document.getElementById('taxRate');
    if (taxRateEl) {
        taxRateEl.value = val;
        calculateAll();
    }
}

function optimizeStdFloorArea() {
    // 1. 讀取規劃棟數
    const buildingCount = parseInt(document.getElementById('buildingCountSelector').value) || 1;

    // 啟用標準層手動微調，但不呼叫 toggleStdFloorManual 以避免重複 calculateAll
    document.getElementById('stdFloorManualToggle').checked = true;
    const container = document.getElementById('stdFloorSliderContainer');
    const modeSelect = document.getElementById('stdFloorModeSelector');
    if (container) container.classList.remove('hidden');
    if (modeSelect) modeSelect.disabled = true;

    const landArea = parseFloat(document.getElementById('landArea').value) || 0;
    const bcr = parseFloat(document.getElementById('buildingCoverageRatio').value) || 0;
    const bcrRate = bcr / 100;
    const maxFootprint = landArea * bcrRate;
    
    // 單棟標準層最小值設定：若基地大於 200 坪，為防止不合常理的鉛筆樓，限制單棟最小面積為 maxFootprint / (D * 3.5) 或 20 坪以上！
    let minStd = 5;
    if (landArea >= 200) {
        minStd = Math.max(20, Math.floor(maxFootprint / (buildingCount * 3.5)));
    }
    
    const maxStd = (maxFootprint / buildingCount) > minStd ? (maxFootprint / buildingCount) : 100;
    
    const far = parseFloat(document.getElementById('floorAreaRatio').value) || 0;
    const bonusR = getFarTotal('bonus');
    const transferR = getFarTotal('transfer');
    const baseFloorArea = landArea * (far / 100);
    const bonusArea = baseFloorArea * (bonusR / 100);
    const transferArea = baseFloorArea * (transferR / 100);
    const totalFARFloorArea = baseFloorArea + bonusArea + transferArea;
    const T = Math.round(totalFARFloorArea * 10) / 10;

    const shopManual = document.getElementById('shopAreaManualToggle').checked;

    // 預設單棟標準層與店面面積
    const defaultStdArea = landArea * (bcrRate - 0.08) / buildingCount;
    const defaultShopArea = maxFootprint / 1.4;

    // 取得當前設定作為參考目標
    let currentStdArea = parseFloat(document.getElementById('stdFloorSlider').value) || defaultStdArea;
    if (currentStdArea < minStd) currentStdArea = minStd;
    if (currentStdArea > maxStd) currentStdArea = maxStd;

    let bestStdFloorArea = currentStdArea;
    let bestShopArea = defaultShopArea;
    let bestScore = Infinity;

    if (shopManual) {
        // --- 情況 A：店面面積固定（手動輸入） ---
        const shopArea = parseFloat(document.getElementById('shopAreaDisplay').value) || 0;
        const targetGFA = T - shopArea;
        
        if (targetGFA <= 0) {
            alert('剩餘可分配容積不足，無法進行最佳化！');
            return;
        }

        // 搜尋標準層面積 A (以 0.1 坪為步長)
        const startStd = Math.ceil(minStd * 10);
        const endStd = Math.floor(maxStd * 10);
        for (let val = startStd; val <= endStd; val++) {
            const A = val / 10;
            const N = Math.floor(targetGFA / (A * buildingCount));
            if (N <= 0) continue;
            
            const rem = targetGFA - N * A * buildingCount;
            const cleanRem = Math.round(rem * 10) / 10;
            if (cleanRem < 0) continue;

            // 優先最小化剩餘容積，次之最小化與當前標準層面積的偏差
            const score = cleanRem * 10000 + 1.0 * Math.abs(A - currentStdArea);

            if (score < bestScore) {
                bestScore = score;
                bestStdFloorArea = A;
            }
        }
        bestShopArea = shopArea;
    } else {
        // --- 情況 B：店面與標準層均可動態調配 (自動平衡蹺蹺板) ---
        document.getElementById('shopAreaManualToggle').checked = true;
        const shopInput = document.getElementById('shopAreaDisplay');
        if (shopInput) {
            shopInput.readOnly = false;
            shopInput.placeholder = '請輸入坪數';
        }

        // 估計合理的住宅樓層數 N_target
        const targetGFA = T - defaultShopArea;
        const N_target = Math.round(targetGFA / (defaultStdArea * buildingCount)) || 1;
        
        // 搜尋樓層數 N 範圍（目標樓層數上下 4 層）
        const minN = Math.max(1, N_target - 4);
        const maxN = N_target + 4;

        for (let N = minN; N <= maxN; N++) {
            // 在容積限制內尋找可行的單棟標準層面積區間
            const minStdForN = Math.max(minStd, (T - maxFootprint) / (N * buildingCount));
            const maxStdForN = Math.min(maxStd, T / (N * buildingCount));
            
            const startVal = Math.ceil(minStdForN * 10);
            const endVal = Math.floor(maxStdForN * 10);
            
            for (let val = startVal; val <= endVal; val++) {
                const stdArea = val / 10;
                const shopArea = Math.round((T - N * stdArea * buildingCount) * 10) / 10;
                
                if (shopArea < 0 || shopArea > maxFootprint) continue;
                
                const rem = T - shopArea - N * stdArea * buildingCount;
                const cleanRem = Math.round(rem * 10) / 10;
                
                // 計分函數
                const score = Math.abs(cleanRem) * 10000 + 
                              1.0 * Math.abs(stdArea - currentStdArea) + 
                              0.5 * Math.abs(shopArea - defaultShopArea);
                              
                if (score < bestScore) {
                    bestScore = score;
                    bestStdFloorArea = stdArea;
                    bestShopArea = shopArea;
                }
            }
        }
    }

    // 將最佳化數值套用至 UI 控制項
    const slider = document.getElementById('stdFloorSlider');
    if (slider) {
        slider.min = minStd;
        slider.max = maxStd;
        slider.value = bestStdFloorArea;
    }
    document.getElementById('stdFloorSliderMinText').innerText = minStd;
    document.getElementById('stdFloorSliderMaxText').innerText = Math.round(maxStd);

    document.getElementById('stdFloorSliderVal').innerText = bestStdFloorArea.toFixed(1) + ' 坪';
    document.getElementById('stdFloorAreaDisplay').value = bestStdFloorArea.toFixed(1) + ' 坪' + (buildingCount > 1 ? ` (總 ${ (bestStdFloorArea * buildingCount).toFixed(1) } 坪)` : '');
    document.getElementById('shopAreaDisplay').value = bestShopArea.toFixed(1);

    calculateAll();
}

function updateFarSummary(type) {
    const list = document.getElementById(type + '-items-list');
    const summaryEl = document.getElementById(type + 'ItemsSummary');
    const body = document.getElementById(type + '-panel-body');
    if (!list || !summaryEl || !body) return;

    if (!body.classList.contains('hidden')) {
        summaryEl.innerText = '';
        return;
    }

    const selectedNames = [];
    list.querySelectorAll('.far-item').forEach(item => {
        const pctInp = item.querySelector('.far-pct-inp');
        const pct = parseFloat(pctInp.value) || 0;
        if (pct > 0) {
            const sel = item.querySelector('.far-sel');
            let name = '';
            if (sel && sel.value === '其它（手動填入）') {
                const customInp = item.querySelector('.far-custom-inp');
                name = customInp ? customInp.value.trim() : '';
                if (!name) name = '自訂';
            } else if (sel) {
                name = sel.value;
            }

            // Shorten names
            if (name === '都更獎勵') name = '都更';
            else if (name === '防災型都更') name = '防災型';
            else if (name === '智慧建築標章') name = '智慧建築';
            else if (name === '綠建築標章') name = '綠建築';
            else if (name === '能效標章') name = '能效';
            else if (name === '耐震標章') name = '耐震';
            else if (name === '無障礙標章') name = '無障礙';
            else if (name === '規模/時程') name = '規模時程';
            else if (name === '危老獎勵') name = '危老';
            else if (name === '開放空間') name = '開放空間';
            else if (name === 'TOD增額') name = 'TOD';

            selectedNames.push(name);
        }
    });

    summaryEl.innerText = selectedNames.length > 0 ? '：(' + selectedNames.join('+') + ')' : '';
}

function updateFarTotal(type) {
    try {

    const tot = getFarTotal(type);
    document.getElementById(type + 'TotalPct').innerText = tot;
    updateFarSummary(type);
    calculateAll();
    syncAppliedButtonsState();

    } catch (err) {
        alert('updateFarTotal error: ' + err.message + '\nStack: ' + err.stack);
        console.error(err);
    }
}

function getFarTotal(type) {
    const list = document.getElementById(type + '-items-list');
    if (!list) return 0;
    let tot = 0;
    list.querySelectorAll('.far-pct-inp').forEach(inp => { tot += parseFloat(inp.value) || 0; });
    return tot;
}

function calculateTransferCost() {
    const list = document.getElementById('transfer-items-list');
    if (!list) return 0;
    
    const landArea = parseFloat(document.getElementById('landArea').value) || 0;
    const refAnnVal = parseFloat(document.getElementById('refAnnouncementValue').value) || 0;
    const weightPct = parseFloat(document.getElementById('cashWeight').value) || 0;
    
    let totalCost = 0;
    
    list.querySelectorAll('.far-item').forEach(item => {
        const pctInp = item.querySelector('.far-pct-inp');
        const pct = parseFloat(pctInp.value) || 0;
        if (pct <= 0) return;
        
        // Formula: refAnnVal * 3.3058 * landArea * (pct / 100) * (weightPct / 100)
        const cost = refAnnVal * 3.3058 * landArea * (pct / 100) * (weightPct / 100);
        totalCost += cost;
    });
    
    return totalCost;
}


// 市場建議售價交叉分析計算
function calculateCrossAnalysis() {
    const strategy = document.getElementById('cross-strategy').value;
    
    // 設定權重
    let lvrWeight = 0.5;
    let askWeight = 0.5;
    if (strategy === 'conservative') {
        lvrWeight = 0.7;
        askWeight = 0.3;
    } else if (strategy === 'aggressive') {
        lvrWeight = 0.3;
        askWeight = 0.7;
    }

    // 住宅
    const resLvr = parseFloat(document.getElementById('cross-res-lvr').value) || 0;
    const resAsk = parseFloat(document.getElementById('cross-res-ask').value) || 0;
    const resRec = resLvr * lvrWeight + resAsk * askWeight;
    document.getElementById('cross-res-rec').innerText = resRec.toFixed(1);

    // 辦公
    const offLvr = parseFloat(document.getElementById('cross-off-lvr').value) || 0;
    const offAsk = parseFloat(document.getElementById('cross-off-ask').value) || 0;
    const offRec = offLvr * lvrWeight + offAsk * askWeight;
    document.getElementById('cross-off-rec').innerText = offRec.toFixed(1);

    // 店面
    const retLvr = parseFloat(document.getElementById('cross-ret-lvr').value) || 0;
    const retAsk = parseFloat(document.getElementById('cross-ret-ask').value) || 0;
    const retRec = retLvr * lvrWeight + retAsk * askWeight;
    document.getElementById('cross-ret-rec').innerText = retRec.toFixed(1);

    // 車位
    const parkLvr = parseFloat(document.getElementById('cross-park-lvr').value) || 0;
    const parkAsk = parseFloat(document.getElementById('cross-park-ask').value) || 0;
    const parkRec = Math.round(parkLvr * lvrWeight + parkAsk * askWeight);
    document.getElementById('cross-park-rec').innerText = parkRec;
}


// 計算個案換算單價
function calculateCasePrice(type) {
    if (type === 'res') {
        const area = parseFloat(document.getElementById('case-res-area').value) || 0;
        const total = parseFloat(document.getElementById('case-res-total').value) || 0;
        const price = area > 0 ? (total / area) : 0;
        document.getElementById('case-res-price').innerText = price.toFixed(1);
    } else if (type === 'ret') {
        const area = parseFloat(document.getElementById('case-ret-area').value) || 0;
        const total = parseFloat(document.getElementById('case-ret-total').value) || 0;
        const price = area > 0 ? (total / area) : 0;
        document.getElementById('case-ret-price').innerText = price.toFixed(1);
    } else if (type === 'park') {
        const count = parseFloat(document.getElementById('case-park-count').value) || 0;
        const total = parseFloat(document.getElementById('case-park-total').value) || 0;
        const price = count > 0 ? (total / count) : 0;
        document.getElementById('case-park-price').innerText = Math.round(price);
    }
}

function syncAppliedButtonsState() {
    if (_inCalc) return;
    _inCalc = true;
    try {

    // 取得當前主頁面中所有的 far-sel 與 far-custom-inp 值
    const activeBonuses = [...document.querySelectorAll('#bonus-items-list .far-item')].map(item => {
        const sel = item.querySelector('.far-sel');
        const customInp = item.querySelector('.far-custom-inp');
        return {
            value: sel ? sel.value : '',
            custom: (sel && sel.value === '其它（手動填入）' && customInp) ? customInp.value : ''
        };
    });
    const activeTransfers = [...document.querySelectorAll('#transfer-items-list .far-item')].map(item => {
        const sel = item.querySelector('.far-sel');
        const customInp = item.querySelector('.far-custom-inp');
        return {
            value: sel ? sel.value : '',
            custom: (sel && sel.value === '其它（手動填入）' && customInp) ? customInp.value : ''
        };
    });
    
    // 掃描所有的 .reg-apply-btn
    document.querySelectorAll('.reg-apply-btn').forEach(btn => {
        const row = btn.closest('[data-bonus-name]');
        if (!row) return;
        const bonusName = row.dataset.bonusName;
        const mapped = REG_FAR_KEY_MAP[bonusName] || {};
        const farKey = row.dataset.farKey || mapped.key || '其它（手動填入）';
        const type = mapped.type || row.dataset.type || 'bonus';
        const customName = mapped.customName || bonusName;
        
        // 檢查此按鈕對應的法規是否在 active 列表中
        const list = type === 'bonus' ? activeBonuses : activeTransfers;
        let isApplied = false;
        if (farKey === '其它（手動填入）') {
            isApplied = list.some(item => item.value === '其它（手動填入）' && item.custom === customName);
        } else {
            isApplied = list.some(item => item.value === farKey);
        }
        
        if (isApplied) {
            btn.textContent = '✓ 已套用';
            btn.classList.add('applied');
        } else {
            btn.textContent = '＋套用';
            btn.classList.remove('applied');
        }
    });

    } catch (err) {
        alert('syncAppliedButtonsState error: ' + err.message + '\nStack: ' + err.stack);
        console.error(err);
    } finally {
        _inCalc = false;
    }
}

function recalculateProportions() {
    const totalArea = S.cadastral.reduce((sum, r) => sum + (parseFloat(r.area) || 0), 0);
    S.cadastral.forEach(r => {
        if (totalArea > 0 && r.area) {
            r.proportion = parseFloat(((parseFloat(r.area) || 0) / totalArea * 100).toFixed(1));
        } else {
            r.proportion = 0;
        }
    });
}

function applyCadastralProportions() {
    recalculateProportions();
    try {
        localStorage.setItem('s_cadastral', JSON.stringify(S.cadastral));
    } catch(e){}
    renderCadastralRows();
    updateCadastralSummary();
}


function splitStandardFloorArea(A) {
    A = Math.round(A * 10) / 10;
    
    // 1. 若面積極小，只規劃 1 戶或 2 戶
    if (A <= 40) {
        return [{ area: A, count: 1 }];
    }
    if (A <= 60) {
        return [{ area: Math.round((A / 2) * 10) / 10, count: 2 }];
    }
    if (A <= 90) {
        // 2 戶邊間 + 1 戶中間
        const mid = 24;
        const corner = Math.round(((A - mid) / 2) * 10) / 10;
        if (corner >= 20) {
            return [{ area: corner, count: 2 }, { area: mid, count: 1 }];
        } else {
            return [{ area: Math.round((A / 3) * 10) / 10, count: 3 }];
        }
    }
    if (A <= 130) {
        // 4 戶邊間
        return [{ area: Math.round((A / 4) * 10) / 10, count: 4 }];
    }
    
    // 2. A > 130 坪，採 4 戶邊間 + M 戶中間配置，總戶數限制在 12 戶以內
    let bestM = 0;
    let bestC = A / 4;
    let minDiff = Infinity;
    
    // 搜尋中間戶數量 M (總戶數 4 + M 不超過 12 戶，所以 M 範圍為 1..8)
    for (let M = 1; M <= 8; M++) {
        const C = (A - M * 24) / 4;
        if (C >= 25 && C <= 45) {
            // 邊間越靠近 35 坪 (三房) 越好
            const diff = Math.abs(C - 35);
            if (diff < minDiff) {
                minDiff = diff;
                bestM = M;
                bestC = C;
            }
        }
    }
    
    // 如果沒有完美的配置，使用極限分攤
    if (bestM === 0) {
        bestM = 8;
        bestC = (A - 8 * 24) / 4;
    }
    
    const finalC = Math.round(bestC * 10) / 10;
    return [
        { area: finalC, count: 4 },
        { area: 24, count: bestM }
    ];
}


function autoPlanDetailedPlanning() {
    // 1. 估計合理規劃棟數，避免無限堆高 (超過 28 層防護)
    const landArea = parseFloat(document.getElementById('landArea').value) || 0;
    const bcr = parseFloat(document.getElementById('buildingCoverageRatio').value) || 0;
    const bcrRate = bcr / 100;
    const maxFootprint = landArea * bcrRate;
    
    const far = parseFloat(document.getElementById('floorAreaRatio').value) || 0;
    const bonusR = getFarTotal('bonus');
    const transferR = getFarTotal('transfer');
    const baseFloorArea = landArea * (far / 100);
    const bonusArea = baseFloorArea * (bonusR / 100);
    const transferArea = baseFloorArea * (transferR / 100);
    const totalFARFloorArea = baseFloorArea + bonusArea + transferArea;
    
    // 預設單棟合理標準層面積 (例如最大 footprint 的 70%)
    const defaultStdAreaSingle = landArea * (bcrRate - 0.08); 
    
    // 預估單棟總高度 (若為 1 棟)
    const estFloors = Math.ceil(totalFARFloorArea / defaultStdAreaSingle);
    
    let bestBuildingCount = 1;
    let didAutoSplit = false;
    if (estFloors > 28) {
        // 使用 24 層為安全水位門檻，以確保拆分後高度低於 28 層，且最多拆分到 4 棟
        bestBuildingCount = Math.min(4, Math.ceil(estFloors / 24));
        didAutoSplit = true;
    }
    
    // 同步更新 UI 選擇器
    const bcSelector = document.getElementById('buildingCountSelector');
    if (bcSelector) {
        bcSelector.value = bestBuildingCount.toString();
    }
    
    // 2. 執行剩餘容積最佳化，消化完剩餘容積
    optimizeStdFloorArea();
    
    // 3. 獲取優化後的標準層面積
    const slider = document.getElementById('stdFloorSlider');
    const A = slider ? parseFloat(slider.value) : 30;
    
    // 4. 自動適配單棟戶型 (邊間/中間戶型智慧配比，且單層不超過 12 戶)
    S.unitLayouts = splitStandardFloorArea(A);
    
    // 5. 存入本地暫存並更新渲染
    localStorage.setItem('s_unitLayouts', JSON.stringify(S.unitLayouts));
    renderUnitLayouts();
    
    // 6. 展開戶型區塊方便使用者檢視，並執行全面重算
    S.unitLayoutsExpanded = true;
    localStorage.setItem('s_unitLayoutsExpanded', 'true');
    const body = document.getElementById('unit-layouts-panel-body');
    if (body) body.classList.remove('hidden');
    const icon = document.getElementById('unit-layouts-toggle-icon');
    if (icon) icon.innerText = '－';
    
    calculateAll(true);
    
    // 7. 彈出成功提示
    let alertMsg = `🪄 AI 一鍵規劃完成！\n\n`;
    if (didAutoSplit) {
        alertMsg += `⚠️ 偵測到本案法定容積率極高，若採單棟規劃樓層將高達 ${estFloors} 層。\n已自動為您拆分為【 ${bestBuildingCount} 棟 】起造。\n\n`;
    }
    
    const layoutDesc = S.unitLayouts.map(item => `${item.count} 戶 × ${item.area.toFixed(1)} 坪`).join(' + ');
    const totalAllocated = S.unitLayouts.reduce((sum, item) => sum + item.area * item.count, 0).toFixed(1);
    
    alertMsg += `已為您規劃每棟標準層為 ${A.toFixed(1)} 坪，並依市場主流產品配比自動配置單棟戶型：\n👉 ${layoutDesc}（合計 ${totalAllocated} 坪）\n\n規劃已自動限制單層不超過 12 戶，且邊間戶（30~45坪）與中間戶（24坪）比例合理，剩餘容積已降至最低。`;
    
    alert(alertMsg);
}


// ═══════════════════════════════════════
//  DEBOUNCED WRAPPERS (效能優化防抖與演算法同步機制)
// ═══════════════════════════════════════
let calculateAllTimeout = null;
function calculateAll(sync = false) {
    if (sync || _inCalc) {
        calculateAllActual();
    } else {
        clearTimeout(calculateAllTimeout);
        calculateAllTimeout = setTimeout(() => {
            calculateAllActual();
        }, 200);
    }
}

let calcMatrixTimeout = null;
function calcMatrix(sync = false) {
    if (sync || _inCalc) {
        calcMatrixActual();
    } else {
        clearTimeout(calcMatrixTimeout);
        calcMatrixTimeout = setTimeout(() => {
            calcMatrixActual();
        }, 200);
    }
}

// ═══════════════════════════════════════
//  銷坪與公設連動平衡輔助函數
// ═══════════════════════════════════════
function selectSaleMode(mode) {
    const modeFactor = document.getElementById('modeFactor');
    const modePublicRatio = document.getElementById('modePublicRatio');
    if (mode === 'factor') {
        if (modeFactor) modeFactor.checked = true;
        if (modePublicRatio) modePublicRatio.checked = false;
    } else {
        if (modeFactor) modeFactor.checked = false;
        if (modePublicRatio) modePublicRatio.checked = true;
    }
}

function toggleSaleLinkage() {
    calculateAll();
}

// 註冊至全域
window.selectSaleMode = selectSaleMode;
window.toggleSaleLinkage = toggleSaleLinkage;
