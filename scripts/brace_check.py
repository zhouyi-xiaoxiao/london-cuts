import sys, os

def strip_and_count(src):
    out = []
    i = 0
    n = len(src)
    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i+1] == '/':
            j = src.find('\n', i)
            i = j if j >= 0 else n
            continue
        if c == '/' and i + 1 < n and src[i+1] == '*':
            j = src.find('*/', i + 2)
            i = j + 2 if j >= 0 else n
            continue
        if c in "'\"":
            q = c
            i += 1
            while i < n and src[i] != q:
                if src[i] == '\\' and i + 1 < n:
                    i += 2
                else:
                    i += 1
            i += 1
            continue
        if c == '`':
            i += 1
            while i < n:
                if src[i] == '\\' and i + 1 < n:
                    i += 2
                    continue
                if src[i] == '`':
                    i += 1
                    break
                if src[i] == '$' and i + 1 < n and src[i+1] == '{':
                    out.append('{')
                    i += 2
                    d = 1
                    while i < n and d > 0:
                        ch = src[i]
                        if ch == '{':
                            d += 1
                            out.append('{')
                            i += 1
                        elif ch == '}':
                            d -= 1
                            out.append('}')
                            i += 1
                        elif ch in "'\"":
                            q = ch
                            i += 1
                            while i < n and src[i] != q:
                                if src[i] == '\\' and i + 1 < n:
                                    i += 2
                                else:
                                    i += 1
                            i += 1
                        elif ch == '`':
                            i += 1
                            while i < n and src[i] != '`':
                                if src[i] == '\\' and i + 1 < n:
                                    i += 2
                                else:
                                    i += 1
                            i += 1
                        else:
                            i += 1
                    continue
                i += 1
            continue
        out.append(c)
        i += 1
    clean = ''.join(out)
    return (
        clean.count('{') - clean.count('}'),
        clean.count('(') - clean.count(')'),
        clean.count('[') - clean.count(']'),
    )

root = '/sessions/pensive-sharp-bell/mnt/outputs/london-cuts/src'
files = sorted(os.listdir(root))
bad = 0
for fn in files:
    if not fn.endswith('.jsx'):
        continue
    p = os.path.join(root, fn)
    src = open(p).read()
    b, pr, br = strip_and_count(src)
    tag = ' OK  ' if (b == 0 and pr == 0 and br == 0) else 'FAIL '
    if b or pr or br:
        bad += 1
    print(f'{tag}{fn}: braces{b:+d} parens{pr:+d} brackets{br:+d}')
print('---')
print(f'{bad} files with imbalance')
