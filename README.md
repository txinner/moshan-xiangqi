# 墨山棋院

中国风单页象棋人机对战。包含五档棋力、执红执黑、悔棋、提示、翻转、重开、认输、自动保存、棋谱导出与音效。

## 本地运行

需要 Node.js 20 或更高版本。

```sh
npm install
npm run build
```

Windows：构建后双击 **启动游戏.cmd**，自动启动本地服务并打开默认浏览器。游戏期间保留启动窗口，关闭窗口即可停止服务。

其他系统，或需要手动启动时：

```sh
node local-server.mjs --no-open
```

在浏览器打开终端显示的本地地址。引擎资源已包含在仓库中，本地运行不需要再下载网络文件。请通过本地服务运行，直接双击 index.html 无法使用后台计算功能。

## 开发与检查

```sh
npm run dev
npm test
npm run build
node tests/startup-build.mjs
```

静态发布目录为 dist。部署时使用 HTTPS 和 COOP/COEP 响应头；public/_headers 提供配置，亦包含兼容静态主机的隔离服务脚本。

## 项目范围

棋盘与规则分别使用 xiangqiground 和 xiangqiops；对弈使用 Pikafish WASM。主菜单脚本、样式内联，字体使用系统字体。棋力网络约 51 MB，按托管限制分为七片，需配套保留。

采用休闲对局规则：困毙判负、三次重复判和、六十回合无吃子判和；未实现正式比赛的长将长捉仲裁。

## 许可与来源

网页代码：GPL-3.0-or-later，见 [LICENSE](LICENSE)。依赖声明见 [public/licenses/SOURCES.md](public/licenses/SOURCES.md)，引擎源码版本、构建材料及许可见 [public/engine/README.md](public/engine/README.md)。NNUE 网络另附非商业使用限制，详见 [NNUE-License.md](public/engine/NNUE-License.md)。人物插画由 AI 生成。
