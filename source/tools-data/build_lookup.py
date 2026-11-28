"""Build the compact 一键查 data file from LINZ NZ Addresses + MoE enrolment zones.

Output: JSON with
  roads:   [roadName, ...]
  suburbs: [suburb, ...]
  zones:   [{id, poly, name, type, eff}, ...]   (only zones touching Hamilton City addresses)
  combos:  [[zoneIdx, ...], ...]                 (distinct sets of zones an address falls in)
  a:       flat list per address: [numberText, roadIdx, suburbIdx, latE5, lngE5, comboIdx]
  clinics: {id: [lat, lng, how]}
"""
import json, sys, collections
import numpy as np
from pyogrio.raw import read
import shapely
from shapely import wkb
from pyproj import Transformer

LINZ = r'F:\Bo\data-downloads\x-linz\nz-addresses.shp'
MOE = r'F:\Bo\data-downloads\x-moe\ESmaster v02102026.TAB'
OUT = sys.argv[1]

meta, _, geom, f = read(LINZ, where="territoria='Hamilton City'",
                        columns=['territoria', 'address_id', 'full_addre', 'full_road_', 'suburb_loc', 'unit', 'address_nu'])
cols = {name: f[i] for i, name in enumerate(meta['fields'])}
pts = shapely.from_wkb(geom)
lng = shapely.get_x(pts); lat = shapely.get_y(pts)
n = len(lng)
print('addresses', n)

to_tm = Transformer.from_crs('EPSG:4167', 'EPSG:2193', always_xy=True)
x, y = to_tm.transform(lng, lat)

zmeta, _, zgeom, zf = read(MOE)
zc = {name: zf[i] for i, name in enumerate(zmeta['fields'])}
zpolys = shapely.from_wkb(zgeom)
xmin, xmax, ymin, ymax = x.min(), x.max(), y.min(), y.max()
cand = [i for i, g in enumerate(zpolys) if g is not None and shapely.intersects(g, shapely.box(xmin, ymin, xmax, ymax))]

membership = [[] for _ in range(n)]
zones = []
for i in cand:
    g = zpolys[i]
    shapely.prepare(g)
    inside = shapely.contains_xy(g, x, y)
    cnt = int(inside.sum())
    if cnt == 0:
        continue
    zi = len(zones)
    eff = zc['EffectiveDate'][i]
    zones.append({'school': int(zc['SchoolID'][i]), 'poly': int(zc['PolyID'][i]), 'name': str(zc['PolyName'][i]),
                  'type': str(zc['INSTTYPE'][i]), 'eff': None if str(eff) == 'NaT' else str(eff), 'count': cnt})
    for k in np.nonzero(inside)[0]:
        membership[k].append(zi)
print('zones touching Hamilton', len(zones))

roads, road_ix = [], {}
subs, sub_ix = [], {}
combos, combo_ix = [], {}
rows = []
for k in range(n):
    r = str(cols['full_road_'][k]); s = str(cols['suburb_loc'][k] or '')
    if r not in road_ix: road_ix[r] = len(roads); roads.append(r)
    if s not in sub_ix: sub_ix[s] = len(subs); subs.append(s)
    key = tuple(membership[k])
    if key not in combo_ix: combo_ix[key] = len(combos); combos.append(list(key))
    rows.append([str(cols['full_addre'][k]), road_ix[r], sub_ix[s], round(float(lat[k]) * 1e5), round(float(lng[k]) * 1e5), combo_ix[key]])
rows.sort(key=lambda r: (roads[r[1]], subs[r[2]], int(''.join(ch for ch in r[0].split('/')[-1] if ch.isdigit()) or 0), r[0]))

def find(number, road):
    hits = [i for i in range(n) if str(cols['full_addre'][i]) == number and str(cols['full_road_'][i]) == road]
    if not hits:  # only unit addresses exist (e.g. 1/26 ... 13/26): use their mean point
        hits = [i for i in range(n) if str(cols['full_addre'][i]).endswith('/' + number) and str(cols['full_road_'][i]) == road]
    return hits

clinics = {}
for cid, number, road in [('anglesea', '3', 'Thackeray Street'), ('terapa', '26', 'Bryant Road'), ('victoria', '173', 'Anglesea Street')]:
    h = find(number, road)
    print(cid, len(h))
    if h:
        clinics[cid] = [round(float(np.mean(lat[h])), 5), round(float(np.mean(lng[h])), 5), f'LINZ address {number} {road} ({len(h)} point(s))']
# Rototuna clinic: listed only as "cnr Horsham Downs Rd & Thomas Rd". Use the closest pair of
# address points on those two roads as the corner (approximate, ~100 m).
a = [i for i in range(n) if str(cols['full_road_'][i]) == 'Horsham Downs Road']
b = [i for i in range(n) if str(cols['full_road_'][i]) == 'Thomas Road']
if a and b:
    ax, ay = x[a], y[a]; bx, by = x[b], y[b]
    d = (ax[:, None] - bx[None, :]) ** 2 + (ay[:, None] - by[None, :]) ** 2
    ia, ib = np.unravel_index(np.argmin(d), d.shape)
    pa, pb = a[ia], b[ib]
    clinics['rototuna'] = [round(float((lat[pa] + lat[pb]) / 2), 5), round(float((lng[pa] + lng[pb]) / 2), 5),
                           f'corner estimate between {cols["full_addre"][pa]} Horsham Downs Road and {cols["full_addre"][pb]} Thomas Road, {np.sqrt(d[ia, ib]):.0f} m apart']
print(json.dumps(clinics, ensure_ascii=False, indent=1))
for z in zones:
    print(z)

out = {'version': 'LINZ NZ Addresses (downloaded 2026-11-28) + MoE ESmaster v02102026',
       'roads': roads, 'suburbs': subs, 'zones': zones, 'combos': combos, 'a': rows, 'clinics': clinics}
with open(OUT, 'w', encoding='utf-8') as fh:
    json.dump(out, fh, ensure_ascii=False, separators=(',', ':'))
print('written', OUT)


