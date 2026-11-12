import numpy as np, cv2, json, sys
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt

DEPTH = float(sys.argv[1]) if len(sys.argv) > 1 else 70   # px of relief
PITCH, YAW = 0.55, 0.18                                      # view from slightly above and right
ROWS, COLS = int(sys.argv[2]) if len(sys.argv) > 2 else 46, int(sys.argv[3]) if len(sys.argv) > 3 else 32

src = np.array(Image.open('/mnt/user-data/uploads/b35a58e7-image.png').convert('RGBA')).astype(np.float32)/255
H0, W0 = src.shape[:2]; S = 520 / W0; W, H = int(W0*S), int(H0*S)
img = cv2.resize(src, (W, H), interpolation=cv2.INTER_AREA)
mask = img[...,3] > 0.5
lum = 0.299*img[...,0] + 0.587*img[...,1] + 0.114*img[...,2]
dist = distance_transform_edt(mask)
dome = np.sqrt(np.clip(dist / np.percentile(dist[mask], 99), 0, 1))
light = gaussian_filter(np.where(mask, lum, 0), 9)
light = (light - light[mask].min()) / (light[mask].max() - light[mask].min() + 1e-6)
# the nose stands out: a soft ridge down the middle of the face
yy, xx = np.mgrid[0:H, 0:W]
nose = np.exp(-(((xx - 1090*S)/(70*S))**2 + ((yy - 1180*S)/(170*S))**2)) * 0.35
z = gaussian_filter((0.7*dome + 0.3*light + nose) * mask, 2.5)

def proj(x, y):
    zz = z[min(max(int(round(y)),0),H-1), min(max(int(round(x)),0),W-1)] * DEPTH
    return x - zz*YAW, y - zz*PITCH

def inside(x, y):
    return mask[min(int(y),H-1), min(int(x),W-1)]

def runs(pts):
    segs, cur = [], []
    for x, y in pts:
        if inside(x, y): cur.append(proj(x, y))
        elif cur:
            if len(cur) > 2: segs.append(cur)
            cur = []
    if len(cur) > 2: segs.append(cur)
    return segs

def path(seg, close=False, step=1):
    seg = seg[::step] + ([seg[-1]] if step > 1 and (len(seg)-1) % step else [])
    return 'M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in seg) + ('Z' if close else '')

horiz = [path(s, step=3) for r in range(ROWS) for s in runs([(x, (r+0.5)*H/ROWS) for x in np.arange(0, W, 1)])]
vert = [path(s, step=3) for c in range(COLS) for s in runs([((c+0.5)*W/COLS, y) for y in np.arange(0, H, 1)])]

cs, _ = cv2.findContours((mask*255).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
outline = []
for c in cs:
    if cv2.arcLength(c, True) < 200: continue
    pts = [(float(p[0][0]), float(p[0][1])) for p in c[::2]]
    outline.append(path([proj(*p) for p in pts], close=True, step=2))

def spline(points, n=40, closed=False):
    P = [(x*S, y*S) for x, y in points]
    if closed: P = [P[-1]] + P + [P[0], P[1]]
    else: P = [P[0]] + P + [P[-1]]
    out = []
    for i in range(1, len(P)-2):
        p0, p1, p2, p3 = map(np.array, P[i-1:i+3])
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t*t, t*t*t
            out.append(tuple(0.5*((2*p1) + (-p0+p2)*t + (2*p0-5*p1+4*p2-p3)*t2 + (-p0+3*p1-3*p2+p3)*t3)))
    if not closed: out.append(P[-2])
    return [proj(*p) for p in out]

def circle(cx, cy, r, n=48):
    return [proj((cx + r*np.cos(a))*S, (cy + r*np.sin(a))*S) for a in np.linspace(0, 2*np.pi, n)]

F = {
  'brows': [
    [(665,872),(720,838),(800,818),(890,820),(960,842),(1000,862)],
    [(1180,855),(1240,828),(1320,812),(1400,815),(1455,838)],
  ],
  'lids': [
    [(735,965),(790,930),(870,914),(940,930),(992,972)],
    [(740,968),(800,988),(870,994),(940,988),(990,975)],
    [(1222,958),(1280,925),(1350,908),(1410,920),(1452,952)],
    [(1230,968),(1290,982),(1355,988),(1415,978),(1448,958)],
  ],
  'irises': [(868,948,44),(1356,934,42)],
  'nose': [
    [(1020,1060),(1006,1140),(990,1200),(970,1240)],
    [(1185,1150),(1205,1205),(1222,1232)],
    [(968,1225),(962,1262),(985,1295),(1030,1305),(1065,1298)],
    [(1150,1298),(1185,1300),(1220,1290),(1232,1262),(1222,1232)],
    [(1065,1298),(1100,1312),(1150,1298)],
  ],
  'mouth': [
    [(882,1488),(960,1470),(1040,1462),(1100,1470),(1160,1460),(1260,1468),(1340,1490)],
    [(882,1490),(980,1499),(1100,1505),(1220,1499),(1340,1490)],
    [(940,1522),(1020,1575),(1120,1592),(1220,1572),(1298,1522)],
  ],
}
features = []
hair = (lum < 0.33) & mask & (yy < 900*S)
hair = cv2.morphologyEx((hair*255).astype(np.uint8), cv2.MORPH_OPEN, np.ones((5,5),np.uint8))
hair = cv2.morphologyEx(hair, cv2.MORPH_CLOSE, np.ones((9,9),np.uint8))
hc, _ = cv2.findContours(hair, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
if hc:
    c = max(hc, key=cv2.contourArea)
    pts = [(float(p[0][0]), float(p[0][1])) for p in c]
    # keep only the lower edge of the hair (the hairline), not where it meets the silhouette
    keep = [p for p in pts if mask[min(int(p[1])+3,H-1), int(p[0])] and not (lum[min(int(p[1])+4,H-1), int(p[0])] < 0.33)]
    edge = cv2.distanceTransform((mask*255).astype(np.uint8), cv2.DIST_L2, 3)
    keep = [p for p in keep if edge[int(p[1]), int(p[0])] > 8]
    run, runs_ = [], []
    for a, b in zip(keep, keep[1:]):
        run.append(a)
        if abs(a[0]-b[0]) + abs(a[1]-b[1]) > 4:
            if len(run) > 20: runs_.append(run)
            run = []
    if len(run) > 20: runs_.append(run)
    for r in runs_:
        sm = cv2.GaussianBlur(np.array(r, np.float32).reshape(-1,1,2), (1, 0), 0) if False else r
        features.append({'k': 'hair', 'd': path([proj(*p) for p in sm[::3]])})
for key in ('brows', 'lids', 'nose', 'mouth'):
    for pts in F[key]:
        features.append({'k': key, 'd': path(spline(pts), step=2)})
for cx, cy, r in F['irises']:
    features.append({'k': 'iris', 'd': path(circle(cx, cy, r), close=True)})
    features.append({'k': 'pupil', 'd': path(circle(cx, cy, r*0.38, 24), close=True)})

allpts = [tuple(map(float, m.split(' '))) for p in horiz+vert+outline for m in p.replace('M','L').replace('Z','').split('L') if m]
xs, ys = [p[0] for p in allpts], [p[1] for p in allpts]
vb = [min(xs)-4, min(ys)-4, max(xs)-min(xs)+8, max(ys)-min(ys)+8]
json.dump({'viewBox': ' '.join(f'{v:.0f}' for v in vb), 'horiz': horiz, 'vert': vert, 'outline': outline, 'features': features}, open('portrait.json','w'))

body = ''.join(f'<path d="{p}" stroke="#333" stroke-width=".7" fill="none"/>' for p in vert)
body += ''.join(f'<path d="{p}" stroke="#666" stroke-width=".8" fill="none"/>' for p in horiz)
body += ''.join(f'<path d="{p}" stroke="#bbb" stroke-width="1.1" fill="none"/>' for p in outline)
body += ''.join(f'<path d="{f["d"]}" stroke="#fff" stroke-opacity="{0.55 if f["k"] in ("hair","pupil") else 0.9}" stroke-width="{1.2 if f["k"] in ("brows","mouth") else 0.9}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' for f in features)
open('p.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(map(str,vb))}" width="1000">{body}</svg>')
import os; print(vb, os.path.getsize('portrait.json')//1024, 'KB')
