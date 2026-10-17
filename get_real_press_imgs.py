import httpx
import re
from PIL import Image
import io
from pathlib import Path

MEDIA_DIR = Path(r"c:\Users\ADMIN\Desktop\storymxh\storage\media")

urls = [
    'https://dantri.com.vn/phap-luat/tiktoker-son-thuy-khue-bi-bat-20261016132120941.htm',
    'https://vietnamnet.vn/tiktoker-son-thuy-khue-bi-bat-2565442.html'
]

downloaded = []
for u in urls:
    try:
        r = httpx.get(u, headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=10.0)
        imgs = re.findall(r'<img[^>]+(?:data-src|src)=["\'](https?://[^"\']+\.(?:jpg|jpeg|png|webp))["\']', r.text, re.I)
        for im_url in imgs:
            if any(k in im_url.lower() for k in ["son-thuy-khue", "hung", "bat", "cand", "dantri", "vietnamnet"]) and not any(b in im_url.lower() for b in ["logo", "avatar", "icon", "banner"]):
                if im_url not in downloaded:
                    downloaded.append(im_url)
    except Exception as e:
        print("Error:", e)

print(f"Found {len(downloaded)} press images from DanTri & VietNamNet:")
for idx, im_url in enumerate(downloaded):
    print(f"- {im_url}")
    try:
        resp = httpx.get(im_url, headers={"User-Agent": "Mozilla/5.0"}, verify=False, timeout=10.0)
        if resp.status_code == 200:
            pim = Image.open(io.BytesIO(resp.content)).convert('RGB')
            out_p = MEDIA_DIR / f"press_verified_{idx+1}.jpg"
            pim.save(out_p, "JPEG", quality=95)
            print(f"  Saved {out_p.name} {pim.size}")
    except Exception as e:
        print(f"  Save error: {e}")
