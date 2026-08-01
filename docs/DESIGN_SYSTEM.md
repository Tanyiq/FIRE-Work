# FIRE Work Design System · beta 1.0

Design Token 定义在 `miniprogram/styles/design-tokens.wxss`，由 `app.wxss` 全局引入。

## 设计原则

- 成长感：绿色代表长期积累，金色用于里程碑和年度回顾。
- 克制：一个页面只保留一个主要操作，危险操作使用低饱和红色。
- 一致：卡片、按钮、空状态和标题只使用语义 Token，不为单页创造近似色或近似尺寸。
- 可读：正文最小使用 `--font-caption`，辅助文字与背景保持清晰对比。

## Token 分组

- `--color-*`：背景、表面、正文、品牌、强调、危险和边框。
- `--space-*`：8、16、24、32、48rpx 五档间距。
- `--radius-*`：16、24、28rpx 和胶囊圆角。
- `--font-*`：20、24、28、32、52rpx 五档字号。
- `--shadow-card`：普通卡片阴影。
- `--motion-*`：180ms 操作反馈、420ms 成长动效。

页面可使用主题渐变，但基础颜色、间距、圆角、字号和动效时长应优先引用 Token。
