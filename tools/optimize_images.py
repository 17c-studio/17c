#!/usr/bin/env python3
"""Create local image variants with macOS sips; original files are preserved."""
from pathlib import Path
import json
import subprocess
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'optimized'
OUT.mkdir(parents=True, exist_ok=True)
IMAGES = {
    '17c-cover.png': [768, 1536],
    # Keep mariel-mat.jpeg original: sips conversion produced black output.
    'laptop-computer.png': [768, 1600],
    **{name: [600, 1200] for name in ['ghc-after.png', 'dare-to-hope-admissions-after.png',
       'basketball-after.png', 'haworth-after.png', 'font-playground-index.png',
       'anchor-index.png', 'ghc-events.png', 'degree-program-cropped.png']}
}
def dimensions(path):
    result = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)], text=True)
    data = dict(line.strip().split(': ', 1) for line in result.splitlines()[1:] if ': ' in line)
    return int(data['pixelWidth']), int(data['pixelHeight'])
report = []
for name, widths in IMAGES.items():
    source = ROOT / name
    variants = []
    for width in widths:
        target = OUT / f'{source.stem}-{width}.jpg'
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
                        '--resampleWidth', str(width), str(source), '--out', str(target)], check=True, stdout=subprocess.DEVNULL)
        w, h = dimensions(target)
        variants.append({'path': str(target.relative_to(ROOT)), 'width': w, 'height': h, 'bytes': target.stat().st_size})
    report.append({'source': name, 'originalBytes': source.stat().st_size, 'variants': variants})
for width in [112, 224]:
    subprocess.run(['sips', '--resampleWidth', str(width), str(ROOT / '17c-clear-logo.png'), '--out', str(OUT / f'17c-logo-{width}.png')], check=True, stdout=subprocess.DEVNULL)
(OUT / 'image-sizes.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'originalBytes': sum(r['originalBytes'] for r in report), 'largeVariantBytes': sum(r['variants'][-1]['bytes'] for r in report)}, indent=2))
