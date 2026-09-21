#!/usr/bin/env python3
"""Generate per-provider hire manifests. Run from docs/hires/.

  python3 scripts/build-data.py
  python3 scripts/build-data.py --sync-models

The optional sync updates model suggestions from upstream. No website is generated.
"""
import json, os, re, sys, urllib.request

PROVIDERS = ['claude', 'antigravity', 'codex', 'cursor']
UPSTREAM_CONFIG = ('https://raw.githubusercontent.com/chaitanyagiri/munder-difflin/'
                   'main/src/renderer/src/store/config.ts')

# ── optional: sync models.json from upstream's hardcoded lists ──────────────
if '--sync-models' in sys.argv:
    src = urllib.request.urlopen(UPSTREAM_CONFIG, timeout=15).read().decode()
    def block(name):
        m = re.search(name + r'[^=]*=\s*\[(.*?)\];', src, re.S)
        return re.findall(r"id:\s*'([^']+)'", m.group(1)) if m else []
    models = json.load(open('models.json'))
    for prov, name in [('claude', 'AGENT_MODELS'), ('antigravity', 'ANTIGRAVITY_MODELS')]:
        ups = block(name)
        local_only = [m for m in models.get(prov, []) if m not in ups]
        models[prov] = ups + local_only
        print(f'{prov}: {len(ups)} upstream + {len(local_only)} local-only')
    import datetime
    models['updated'] = datetime.date.today().isoformat()
    with open('models.json', 'w') as out:
        json.dump(models, out, indent=2, ensure_ascii=False); out.write('\n')
    print('models.json synced from upstream config.ts')

# ── manifests → variants + manifests-data.js ────────────────────────────────
os.makedirs('manifests/variants', exist_ok=True)
idx = json.load(open('manifests/index.json'))
data = []
for f in idx:
    base = json.load(open(f'manifests/{f}'))
    base_provider = base.get('provider', 'claude')
    if base_provider == 'agy':
        base_provider = 'antigravity'
    slug = f.replace('.hire.json', '')
    variants = {}
    for p in PROVIDERS:
        v = dict(base)
        v['provider'] = p
        if p != base_provider:
            v.pop('model', None)
            v.pop('commandFlags', None)
        vfile = f'variants/{slug}.{p}.hire.json'
        with open(f'manifests/{vfile}', 'w') as out:
            json.dump(v, out, indent=2, ensure_ascii=False); out.write('\n')
        variants[p] = {'file': vfile, 'manifest': v}
    data.append({'file': f, 'manifest': base, 'baseProvider': base_provider, 'variants': variants})

print(f'{len(data)} roles × {len(PROVIDERS)} providers → manifests/variants/')
