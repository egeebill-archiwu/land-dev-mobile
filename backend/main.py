# -*- coding: utf-8 -*-
import os
import tempfile
import subprocess
import requests
import json
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jinja2 import Environment, FileSystemLoader

app = FastAPI(title="MOBILE PRO AI Slide SaaS Render Backend")

# Enable CORS for local file scheme and development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProjectMetadata(BaseModel):
    Address: str
    Development_Mode: str
    Engine_Version: str

class LandMetrics(BaseModel):
    Total_Land_Area_Ping: float
    Zoning_Type: str
    Base_FAR_Pct: float
    Actual_FAR_Pct: float
    Road_Width_Meters: float
    Bonus_FAR_Pct: float
    Transfer_FAR_Pct: float

class ExecutionGantt(BaseModel):
    Total_Months: float
    Stage1_Months: str
    Stage2_Months: str
    Stage3_Months: str
    Stage4_Months: str

class FinancialHUD(BaseModel):
    Net_Profit_亿: float
    ROI_Pct: float
    BEP_Price_萬坪: float
    Market_Price_萬坪: float
    Safety_Margin_萬坪: float
    CAPEX_Build_亿: float
    CAPEX_Land_Acquire_亿: float
    CAPEX_Mgt_Interest_亿: float

class BriefPayload(BaseModel):
    Project_Metadata: ProjectMetadata
    Land_Metrics: LandMetrics
    Execution_Gantt: ExecutionGantt
    Financial_HUD: FinancialHUD
    Gemini_API_Key: str = None
    Theme: str = "dark" # "dark" or "light"
    Map_Image: str = ""
    Volume_Image: str = ""
    Street_Image: str = ""
    Facade_Type: str = ""

def get_chrome_executable():
    paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"rC:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium-browser",
        "/usr/bin/chromium"
    ]
    for p in paths:
        if os.path.exists(p):
            return p
            
    import shutil
    for cmd in ["google-chrome", "google-chrome-stable", "chromium-browser", "chromium", "chrome"]:
        path = shutil.which(cmd)
        if path:
            return path
            
    return None

def fetch_ai_insights(payload: BriefPayload, api_key: str) -> dict:
    if not api_key:
        return {
            "page2_title": f"預期財務效益：本案預估淨利 {payload.Financial_HUD.Net_Profit_亿:.2f} 億元，開發效益顯著",
            "page12_risk_comment": "營造與工程安全：鄰捷運旁開挖（150m）列為A級管制，建議引進微震動安全監測，連續壁施作須同步地盤改良灌漿以防地盤沉陷。",
            "page13_risk_comment": "銷售去化風險：蛋黃區稀缺角地具價格支撐力，建方分配比率建議維持在合理安全水位，首批預售去化目標設定為60%以利工程資金回收。"
        }
    
    prompt = f"""
你是一位專業的房地產土地開發與財務精算專家。
請根據以下土地開發案件數據的 JSON 資料包，為我們的15頁簡報生成以下專業短評與標題（全部使用繁體中文）：
1. 簡報第二頁（AI 效益診斷）的 Action Title 主標題（一個簡潔有力、點出獲利亮點的標題，例如：預期財務效益：本案預估淨利 {payload.Financial_HUD.Net_Profit_亿:.2f} 億元，開發效益顯著）。
2. 簡報第十二頁（營建工程與地質安全風險）的 AI 顧問風險防禦與應對建議（30-50字，點出捷運禁限建、地下開挖與連續壁擋土之專業防護）。
3. 簡報第十三頁（產品定位與市場去化風險）的 AI 顧問風險防禦與應對建議（30-50字，點出首推去化率、預售抗波動、價格支撐與合建分配安全防禦）。

開發案數據 JSON：
{payload.model_dump_json()}

請嚴格僅返回如下格式的 JSON 字串，不要包含任何 Markdown 格式標記（如 ```json 標記）或額外文字：
{{
  "page2_title": "...",
  "page12_risk_comment": "...",
  "page13_risk_comment": "..."
}}
"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        res = requests.post(url, json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }, timeout=10)
        
        if res.status_code == 200:
            data = res.json()
            text = data['candidates'][0]['content']['parts'][0]['text']
            insights = json.loads(text.strip())
            return {
                "page2_title": insights.get("page2_title", "").strip(),
                "page12_risk_comment": insights.get("page12_risk_comment", "").strip(),
                "page13_risk_comment": insights.get("page13_risk_comment", "").strip()
            }
    except Exception as e:
        print(f"Error fetching AI insights: {e}")
        
    # Default fallback on exception
    return {
        "page2_title": f"預期財務效益：本案預估淨利 {payload.Financial_HUD.Net_Profit_亿:.2f} 億元，開發效益顯著",
        "page12_risk_comment": "營造與工程安全：鄰捷運旁開挖（150m）列為A級管制，建議引進微震動安全監測，連續壁施作須同步地盤改良灌漿以防地盤沉陷。",
        "page13_risk_comment": "銷售去化風險：蛋黃區稀缺角地具價格支撐力，建方分配比率建議維持在合理安全水位，首批預售去化目標設定為60%以利工程資金回收。"
    }

@app.post("/api/generate-pdf")
async def generate_pdf(payload: BriefPayload):
    # Force Joint Mode Business Logic Lock-Dead:
    # If mode is Joint Development (合建分售), builder's land acquisition cost must be strictly 0.0
    if payload.Project_Metadata.Development_Mode == "合建分售":
        payload.Financial_HUD.CAPEX_Land_Acquire_亿 = 0.0

    # Determine API key
    api_key = payload.Gemini_API_Key or os.environ.get("GEMINI_API_KEY")
    
    # 1. Fetch AI insights from Vertex AI / Gemini API
    ai_insights = fetch_ai_insights(payload, api_key)
    
    # 2. Render templates using Jinja2
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")
    env = Environment(loader=FileSystemLoader(templates_dir))
    template = env.get_template("slides.html")
    
    # Parse ratios for CAPEX doughnut chart representation
    total_capex = payload.Financial_HUD.CAPEX_Build_亿 + payload.Financial_HUD.CAPEX_Land_Acquire_亿 + payload.Financial_HUD.CAPEX_Mgt_Interest_亿
    if total_capex > 0:
        pct_build = (payload.Financial_HUD.CAPEX_Build_亿 / total_capex) * 100
        pct_land = (payload.Financial_HUD.CAPEX_Land_Acquire_亿 / total_capex) * 100
        pct_mgt = (payload.Financial_HUD.CAPEX_Mgt_Interest_亿 / total_capex) * 100
    else:
        pct_build, pct_land, pct_mgt = 60.0, 0.0, 40.0
        
    html_content = template.render(
        data=payload,
        ai=ai_insights,
        pct_build=round(pct_build, 1),
        pct_land=round(pct_land, 1),
        pct_mgt=round(pct_mgt, 1)
    )
    
    # 3. Save to temp HTML and compile to PDF using Chrome Headless
    chrome_path = get_chrome_executable()
    if not chrome_path:
        raise HTTPException(status_code=500, detail="chrome.exe not found on the server. Please ensure Chrome is installed.")
        
    fd_html, temp_html_path = tempfile.mkstemp(suffix=".html", dir=os.getcwd())
    fd_pdf, temp_pdf_path = tempfile.mkstemp(suffix=".pdf", dir=os.getcwd())
    
    try:
        with os.fdopen(fd_html, 'w', encoding='utf-8') as f:
            f.write(html_content)
        os.close(fd_pdf)
        
        # Call Chrome headless to print to PDF
        cmd = [
            chrome_path,
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--print-to-pdf-no-header",
            "--no-margins",
            f"--print-to-pdf={temp_pdf_path}",
            temp_html_path
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        # Read the generated PDF
        with open(temp_pdf_path, 'rb') as f:
            pdf_bytes = f.read()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF via Chrome: {str(e)}")
    finally:
        # Clean up temp files
        try:
            if os.path.exists(temp_html_path):
                os.remove(temp_html_path)
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)
        except Exception:
            pass
            
    # Return PDF stream to client
    import io
    pdf_stream = io.BytesIO(pdf_bytes)
    
    # Content-Disposition specifies filename
    filename = f"{payload.Project_Metadata.Address}_AI全案診斷簡報.pdf"
    import urllib.parse
    encoded_filename = urllib.parse.quote(filename)
    
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
    }
    
    return StreamingResponse(pdf_stream, media_type="application/pdf", headers=headers)
