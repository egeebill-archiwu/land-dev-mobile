import http.server
import socketserver
import json
import os

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/log_error':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            err = json.loads(post_data.decode('utf-8'))
            
            # 將報錯寫入檔案
            with open("browser_errors.txt", "a", encoding="utf-8") as f:
                f.write(json.dumps(err, indent=2, ensure_ascii=False) + "\n\n")
                
            print("\n[BROWSER ERROR]")
            print(f"Message: {err.get('message')}")
            print(f"Line: {err.get('lineno')}:{err.get('colno')}")
            print(f"Source: {err.get('source')}")
            print(f"Stack:\n{err.get('stack') or err.get('message')}\n")
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"OK")
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        if self.path.startswith('/api/search'):
            from urllib.parse import urlparse, parse_qs
            import urllib.request
            import urllib.parse
            import re
            
            parsed_url = urlparse(self.path)
            params = parse_qs(parsed_url.query)
            q = params.get('q', [''])[0]
            
            if not q:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b"[]")
                return
                
            try:
                # 百度圖片 JSON API：不封鎖本機 IP、免金鑰且速度極快
                baidu_q = q.replace(" OR ", " ")
                url = f"https://image.baidu.com/search/acjson?tn=resultjson_com&ipn=rj&fp=result&word={urllib.parse.quote(baidu_q)}&queryWord={urllib.parse.quote(baidu_q)}&pn=0&rn=40"
                
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/plain, */*; q=0.01',
                    'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': 'https://image.baidu.com/'
                }
                
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as response:
                    content = response.read().decode('utf-8', errors='ignore')
                
                try:
                    data = json.loads(content)
                    img_list = data.get("data", [])
                except Exception:
                    img_list = []
                
                results = []
                for img in img_list:
                    murl = img.get("middleURL")
                    turl = img.get("thumbURL")
                    title = img.get("fromPageTitleEnc") or img.get("fromPageTitle") or "建築立面參考素材"
                    source = img.get("fromURL") or "https://image.baidu.com"
                    
                    if murl:
                        # 清除可能夾雜的 HTML 強調標籤 (如 <strong>)
                        clean_title = re.sub(r'<[^>]+>', '', title)
                        results.append({
                            "title": clean_title,
                            "thumb": turl or murl,
                            "url": murl,
                            "source": source
                        })
                
                response_data = json.dumps(results, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_data)
                
            except Exception as e:
                print(f"後端搜尋代理出錯: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            # 預設行為：繼續提供靜態網頁檔案
            super().do_GET()

PORT = 8989
# 關閉 Socket 佔用
socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("127.0.0.1", PORT), MyHandler) as httpd:
        print(f"伺服器已啟動：http://127.0.0.1:{PORT}")
        httpd.serve_forever()
except Exception as e:
    print(f"啟動失敗: {e}")
