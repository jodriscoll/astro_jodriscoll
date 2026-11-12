import numpy as np, cv2, json, sys
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt
from skimage import measure

LEVELS = int(sys.argv[1]); BLUR = float(sys.argv[2]); DEPTH = float(sys.argv[3])
src = np.array(Image.open('/mnt/user-data/uploads/b35a58e7-image.png').convert('RGBA')).astype(np.float32)/255
H0, W0 = src.shape[:2]; S = 600 / W0; W, H = int(W0*S), int(H0*S)
img = cv2.resize(src, (W, H), interpolation=cv2.INTER_AREA)
mask = img[...,3] > 0.5
lum = 0.299*img[...,0] + 0.587*img[...,1] + 0.114*img[...,2]
g = (np.where(mask, lum, 1.0)*255).astype(np.uint8)
g = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8)).apply(g).astype(np.float32)/255
tone = gaussian_filter(g, BLUR)
tone = np.where(mask, tone, 1.0)

dist = distance_transform_edt(mask)
z = gaussian_filter(np.sqrt(np.clip(dist/np.percentile(dist[mask],99),0,1))*mask, 3)
def proj(x, y):
    zz = z[min(max(int(y),0),H-1), min(max(int(x),0),W-1)] * DEPTH
    return x - zz*0.15, y - zz*0.45

lines = []
lo, hi = np.percentile(tone[mask], [3, 97])
for i, lv in enumerate(np.linspace(lo, hi, LEVELS)):
    for c in measure.find_contours(tone, lv):
        if len(c) < 40: continue
        ys, xs = c[:,0], c[:,1]
        inside = mask[np.clip(ys.astype(int),0,H-1), np.clip(xs.astype(int),0,W-1)]
        if inside.mean() < 0.9: continue
        ap = cv2.approxPolyDP(np.array(c[:, ::-1], np.float32).reshape(-1,1,2), 0.7, False).reshape(-1,2)
        if len(ap) < 4: continue
        # fade toward the shoulders: skip small loops below the chin
        cy = ys.mean()
        if cy > 0.80*H and len(c) < 160: continue
        lines.append((i, 'M' + 'L'.join(f'{proj(x,y)[0]:.0f} {proj(x,y)[1]:.0f}' if False else f'{proj(x,y)[0]:.1f} {proj(x,y)[1]:.1f}' for x, y in ap), round(float(cy/H),3)))

cs, _ = cv2.findContours((mask*255).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
outline = ['M' + 'L'.join(f'{proj(*map(float,p[0]))[0]:.1f} {proj(*map(float,p[0]))[1]:.1f}' for p in c[::3]) + 'Z' for c in cs if cv2.arcLength(c, True) > 200]

# faint mesh underneath
mesh = []
for r in range(34):
    y = (r+0.5)*H/36; seg=[]
    for x in np.arange(0, W, 3):
        if mask[int(y), int(x)]: seg.append(proj(x, y))
        elif seg:
            if len(seg)>2: mesh.append('M'+'L'.join(f'{a:.1f} {b:.1f}' for a,b in seg))
            seg=[]
    if len(seg)>2: mesh.append('M'+'L'.join(f'{a:.1f} {b:.1f}' for a,b in seg))
for c in range(24):
    x = (c+0.5)*W/26; seg=[]
    for y in np.arange(0, H, 3):
        if mask[int(y), int(x)]: seg.append(proj(x, y))
        elif seg:
            if len(seg)>2: mesh.append('M'+'L'.join(f'{a:.1f} {b:.1f}' for a,b in seg))
            seg=[]
    if len(seg)>2: mesh.append('M'+'L'.join(f'{a:.1f} {b:.1f}' for a,b in seg))

json.dump({'w':W,'h':H,'lines':lines,'outline':outline,'mesh':mesh}, open('portrait4.json','w'))
N = LEVELS
body = ''.join(f'<path d="{d}" stroke="#2a2a2a" stroke-width=".6" fill="none"/>' for d in mesh)
body += ''.join(f'<path d="{d}" stroke="#fff" stroke-opacity="{(0.25 + 0.75*(1 - i/(N-1))**1.3) * (1 if cy < 0.72 else max(0.15, 1-(cy-0.72)*4)):.2f}" stroke-width=".8" fill="none"/>' for i, d, cy in lines)
body += ''.join(f'<path d="{d}" stroke="#aaa" stroke-width="1" fill="none"/>' for d in outline)
open('p4.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -40 {W+20} {H+50}" width="900">{body}</svg>')
print(len(lines), sum(len(l[1]) for l in lines)//1024, 'KB')
