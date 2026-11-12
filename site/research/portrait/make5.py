import numpy as np, cv2, json, base64
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt

src = np.array(Image.open('/mnt/user-data/uploads/b35a58e7-image.png').convert('RGBA')).astype(np.float32)/255
H0, W0 = src.shape[:2]
ROWS, COLS = 112, 96
S = 420 / W0; W, H = int(W0*S), int(H0*S)
img = cv2.resize(src, (W, H), interpolation=cv2.INTER_AREA)
mask = img[...,3] > 0.5
lum = 0.299*img[...,0] + 0.587*img[...,1] + 0.114*img[...,2]
g = (np.where(mask, lum, 0.5)*255).astype(np.uint8)
g = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(6,6)).apply(g).astype(np.float32)/255
yy, xx = np.mgrid[0:H, 0:W]
P = lambda v: v*S
# depth: rounded head + shading detail + nose + sockets
dist = distance_transform_edt(mask)
dome = np.sqrt(np.clip(dist/np.percentile(dist[mask], 99.5), 0, 1))
shade = gaussian_filter(g, 4)
def blob(cx, cy, rx, ry): return np.exp(-(((xx-P(cx))/P(rx))**2 + ((yy-P(cy))/P(ry))**2))
nose = blob(1060, 1170, 80, 200)*0.2 + blob(1070, 1260, 110, 60)*0.08
sockets = blob(870, 945, 150, 80) + blob(1350, 935, 150, 80)
mouth = blob(1110, 1500, 230, 70)*0.12
chin = blob(1100, 1700, 260, 120)*0.15
depth = gaussian_filter((0.62*dome + 0.12*shade + nose - 0.16*sockets + mouth + chin) * mask, 2)
depth = depth / depth[mask].max()

# sample grid inside the bounding box of the mask
ys, xs = np.where(mask); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
lo, hi = np.percentile(lum[mask], [2, 98])
bright = gaussian_filter(np.clip((lum - lo)/(hi - lo), 0, 1), 0.9)
pts = np.zeros((ROWS, COLS, 3), np.uint8)   # z, brightness, inside
for r in range(ROWS):
    y = y0 + (r+0.5)*(y1-y0)/ROWS
    for c in range(COLS):
        x = x0 + (c+0.5)*(x1-x0)/COLS
        yi, xi = int(y), int(x)
        if mask[yi, xi]:
            pts[r, c] = (int(depth[yi, xi]*255), int(np.clip(bright[yi, xi], 0, 1)*255), 1)
aspect = (y1-y0)/(x1-x0)
blob_b64 = base64.b64encode(pts.tobytes()).decode()
json.dump({'rows': ROWS, 'cols': COLS, 'aspect': round(float(aspect),4), 'data': blob_b64}, open('head.json','w'))
print(len(blob_b64)//1024, 'KB', aspect)

# preview at a few angles, same maths as the browser
def render(yaw, pitch, fn):
    SZ = 900; im = Image.new('RGB', (SZ, int(SZ*1.1)), 'black'); d = ImageDraw.Draw(im, 'RGBA')
    cy_, sy_ = np.cos(yaw), np.sin(yaw); cp, sp = np.cos(pitch), np.sin(pitch)
    for r in range(ROWS):
        prev = None
        for c in range(COLS):
            z, b, ins = pts[r, c]
            if not ins: prev = None; continue
            X = (c+0.5)/COLS - 0.5; Y = ((r+0.5)/ROWS - 0.5)*aspect; Z = z/255*0.42
            x1_ = X*cy_ + Z*sy_; z1 = -X*sy_ + Z*cy_
            y1_ = Y*cp - z1*sp
            px, py = SZ/2 + x1_*SZ*0.78, im.height/2 + y1_*SZ*0.78
            if prev:
                a = int(18 + 237*(b/255)**1.8)
                d.line([prev, (px, py)], fill=(255,255,255,a), width=1)
            prev = (px, py)
    im.save(fn)
for name, yv, pv in [('front', 0, 0.05), ('left', -0.45, 0.1), ('right', 0.45, -0.05)]:
    render(yv, pv, f'h_{name}.png')
