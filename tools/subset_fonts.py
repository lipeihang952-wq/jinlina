"""把网站实际用到的字符从原始字体里抽出来，生成本地 woff2 子集。"""
import pathlib, sys, time
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

site = pathlib.Path(sys.argv[1]); src = pathlib.Path(sys.argv[2]); out = site / 'assets/fonts'
out.mkdir(parents=True, exist_ok=True)
text = ''.join((site / f).read_text(encoding='utf-8') for f in ['index.html', 'assets/js/data.js', 'assets/js/main.js'])
extra = '“”‘’—–…·、。，；：？！（）《》〈〉「」『』【】％＋－×÷℃→←↑↗★✦　' + '0123456789'
cjk = {ch for ch in text if ord(ch) > 0x2000} | set(extra)
ascii_ = {chr(c) for c in range(0x20, 0x7f)}
serif_text = ''.join(sorted(cjk | ascii_))
print('unique non-ASCII chars:', len(cjk))

def opts():
    o = subset.Options()
    o.flavor = 'woff2'; o.layout_features = ['*']; o.name_IDs = ['*']; o.name_languages = ['*']
    o.hinting = False; o.notdef_outline = True; o.drop_tables += ['DSIG']
    return o

def make(srcfile, outname, chars, wght=None):
    t = time.time()
    f = TTFont(src / srcfile)
    s = subset.Subsetter(opts()); s.populate(text=chars); s.subset(f)
    if wght is not None:
        f = instancer.instantiateVariableFont(f, {'wght': wght})
    f.flavor = 'woff2'; f.save(out / outname)
    print(f'{outname:24s} {(out / outname).stat().st_size / 1024:7.1f} KB  ({time.time() - t:.1f}s)')

make('NotoSerifSC[wght].ttf', 'serif-900.woff2', serif_text, 900)
make('NotoSerifSC[wght].ttf', 'serif-500.woff2', serif_text, 500)
make('MaShanZheng-Regular.ttf', 'brush.woff2', '金丽娜你 ')
latin = ''.join(sorted(ascii_)) + '·—–’“”•→'
make('InstrumentSerif-Regular.ttf', 'instrument.woff2', latin)
make('InstrumentSerif-Italic.ttf', 'instrument-italic.woff2', latin)
