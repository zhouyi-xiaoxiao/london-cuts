# 部署到 GitHub Pages（现场演示用公开 URL）

现有 `pitch-deck/` 就是一个可直接部署的静态网站 —— 把它推到 GitHub，开启 Pages，就能得到一个 `https://<用户名>.github.io/londoncuts-pitch/slides/pitch.html` 的公开链接，现场演示直接用浏览器打开，不用带电脑起本地服务器。

## 方案：保留原设计系统，不要换 reveal.js

有人会建议用 reveal.js 或 Slidev 重写。**不要这么做** —— 那意味着把 `deck-stage.js` 里的键盘导航、`@media print` PDF 导出、三种 Mode 的 atlas markers、roundel 品牌标记**整套重新实现一遍**。现有 `pitch.html` 纯静态 + CDN 加载 React/Babel，GitHub Pages 直接就能跑，零改动。

---

## 步骤（整套 ~5 分钟）

### 前置
- 已装 `gh` CLI（没装的话：`brew install gh`）
- 已登录：`gh auth login`

### 1. 初始化 git 仓库

```bash
cd "/Users/ae23069/Library/CloudStorage/OneDrive-UniversityofBristol/Desktop/london-cuts-EVERYTHING/pitch-deck"

git init -b main
git add -A
git commit -m "London Cuts pitch deck — 7 slides, Three Modes"
```

### 2. 建 GitHub 仓库并推上去

```bash
gh repo create londoncuts-pitch --public --source=. --push
```

（想私仓就改 `--public` 为 `--private` —— 但私仓开 Pages 需要 GitHub Pro；免费账户建议用 public。）

### 3. 开启 GitHub Pages

```bash
# 用 main 分支根目录作为 Pages 源
gh api -X POST "/repos/$(gh api user --jq .login)/londoncuts-pitch/pages" \
  -f "source[branch]=main" \
  -f "source[path]=/"
```

（或者在浏览器里：打开仓库 → Settings → Pages → Source 选 `main` + `/ (root)` → Save。）

### 4. 等 30 秒，然后访问

```bash
# 拿到 URL
echo "https://$(gh api user --jq .login).github.io/londoncuts-pitch/slides/pitch.html"
```

把这个链接收藏到浏览器，演示时直接打开即可。

---

## 后续更新

改任何 JSX 或图片后：

```bash
cd pitch-deck
git add -A
git commit -m "update slides"
git push
```

Pages 通常 30 秒内自动重新发布。

---

## 演示时的操作

- **← / →** 或 **空格** 翻页
- **Esc** 退出缩放
- **Cmd + P** 在浏览器里直接 Save as PDF（用 `@media print` 规则，一页一 slide，和 `London-Cuts-Pitch.pdf` 等价）

---

## 离线备用方案

万一现场网不行 / GitHub Pages 挂了：
1. **本地版**：双击项目根目录的 `START-LIVE-DEMO.command`，自动起本地服务器 + 浏览器
2. **PDF 版**：直接打开 `London-Cuts-Pitch.pdf` 用 Preview / Adobe 全屏演示

三层保障：GitHub Pages（首选）→ 本地 server → PDF。

---

## 可选增强：加自定义域名

如果有自己的域名 `londoncuts.studio`：

```bash
# 在 pitch-deck/ 下建 CNAME 文件
echo "londoncuts.studio" > CNAME
git add CNAME && git commit -m "custom domain" && git push
```

然后在域名 DNS 处加 CNAME 记录指向 `<用户名>.github.io`。GitHub Pages 会自动签 HTTPS 证书。

---

## 注意事项

- **React / Babel 是 CDN 加载的**（unpkg.com）。现场如果访问 unpkg 有问题，备方案是把这些 JS 下载下来 commit 到仓库。但 unpkg 挂的概率极低，正常别折腾。
- **字体用 Google Fonts CDN**（见 `deck.css` 第 1 行）。同理 —— 挂的概率低。真要稳保的话可以用 [Fontsource](https://fontsource.org) 把字体打进仓库，但会把仓库体积加大几倍。
- **Pages 用 gh-pages 也行**：如果不想用 main 分支，可以 `gh api -X POST .../pages -f "source[branch]=gh-pages"` 然后 `git subtree push` 推子目录。main-as-root 最简单，推荐。
