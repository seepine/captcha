# @seepine/captcha

[![codecov][codecov-img]][codecov-href]
[![npm version][npm-version-img]][npm-version-href]
[![npm downloads][npm-downloads-img]][npm-downloads-href]
[![License][license-img]][license-href]

生成验证码图片的 TypeScript 库，参考自 [wenlng/go-captcha](https://github.com/wenlng/go-captcha)。

包含：

- 滑动验证码（`basic` / `drag` 两种模式）
- 点击验证码（`text` / `shape` 两种模式）
- 旋转验证码

前端：

- Vue: http://gocaptcha.wencodes.com/package/vue/
- React: http://gocaptcha.wencodes.com/package/react/

## 安装

```sh
npm i @seepine/captcha
```

## 滑动验证码

```ts
import { generateSlideCaptcha, validateSlideCaptcha } from '@seepine/captcha'
import {
  bg1,
  tile1Mask,
  tile1Shadow,
  tile1Overlay,
} from '@seepine/captcha/assets'

const { masterImage, tileImage, block } = await generateSlideCaptcha({
  resources: {
    backgrounds: [bg1],
    graphImages: [
      {
        maskImage: tile1Mask, // 白色 = 保留，黑色 = 透明
        shadowImage: tile1Shadow, // 拼图在主图里的阴影
        overlayImage: tile1Overlay, // 拼图本身
      },
    ],
  },
  // 可选：mode: 'basic'（默认）/ 'drag'
  // 可选：options: { imageSize, rangeGraphAnglePos, rangeDeadZoneDirections, ... }
})

// 直接传给前端
const masterB64 = `data:image/jpeg;base64,${masterImage.toString('base64')}`
const tileB64 = `data:image/png;base64,${tileImage.toString('base64')}`

// 用户拖完后：上报 dragOffset；服务端用 block.dx / block.dy 做容差校验
function check(block: Block, dragX: number, dragY: number): boolean {
  return validateSlideCaptcha(block, dragX, dragY, {
    padding: 5, // 容差（px），默认 5
    offset: { x: 0, y: 0 }, // 坐标偏移（可选），应对前端 CSS 缩放
  })
}
```

签名：`generateSlideCaptcha(init?: SlideCaptchaInit): Promise<SlideCaptchaData>`、`validateSlideCaptcha(block, targetX, targetY, options?)`。

`drag` 模式下拼图会被拖到另一个"死区"，`options.rangeDeadZoneDirections` 限定落点方向，`rangeGraphAnglePos` 启用旋转：

```ts
await generateSlideCaptcha({
  mode: 'drag',
  resources: {
    backgrounds: [bg1],
    graphImages: [
      {
        maskImage: tile1Mask,
        shadowImage: tile1Shadow,
        overlayImage: tile1Overlay,
      },
    ],
  },
  options: {
    rangeDeadZoneDirections: ['right'],
    rangeGraphAnglePos: [{ min: -25, max: 25 }],
  },
})
```

## 点击验证码

点击模式分两种。`text` 模式从字符池里抽取若干字符作为"按顺序点击"的提示；`shape` 模式从形状池里抽取若干形状渲染成轮廓。

```ts
import {
  generateClickCaptcha,
  registerFont,
  validateClickCaptcha,
} from '@seepine/captcha'
import {
  bg1,
  dejavuSansFontData,
  dejavuSansFontFamily,
} from '@seepine/captcha/assets'

// 字体族名 + 字体数据都打包在 @seepine/captcha/assets，可按需选用
// dejavuSansFontFamily / wqyFontFamily（后者为 CJK，需 GPL 兼容场景）。
// registerFont 接受 base64 字符串或 Buffer / Uint8Array；同名字体重复注册会被忽略。
registerFont(dejavuSansFontFamily, dejavuSansFontData)

const { masterImage, thumbImage, dots } = await generateClickCaptcha({
  mode: 'text',
  resources: {
    backgrounds: [bg1],
    chars: ['A', 'B', 'C', 'D'],
    fonts: [dejavuSansFontFamily],
  },
  // 可选：options: { rangeLen, rangeVerifyLen, rangeColors, rangeThumbColors, displayShadow, ... }
})

const userClicks: Array<{ x: number; y: number }>
validateClickCaptcha(dots, userClicks, {
  padding: 5,
  offset: { x: 0, y: 0 },
})
```

shape 模式提供形状池（每个形状 `name` + `maskImage`，可选 `shadowImage` / `overlayImage`）：

```ts
import {
  bg1,
  tile1Mask,
  tile1Shadow,
  tile1Overlay,
  tile2Mask,
} from '@seepine/captcha/assets'

await generateClickCaptcha({
  mode: 'shape',
  resources: {
    backgrounds: [bg1],
    shapes: [
      {
        name: 'square',
        maskImage: tile1Mask,
        shadowImage: tile1Shadow,
        overlayImage: tile1Overlay,
      },
      { name: 'triangle', maskImage: tile2Mask },
      // ...
    ],
  },
})
```

## 旋转验证码

```ts
import { generateRotateCaptcha, validateRotateCaptcha } from '@seepine/captcha'
import { bg1 } from '@seepine/captcha/assets'

const { masterImage, thumbImage, block } = await generateRotateCaptcha({
  resources: { images: [bg1] },
  // 可选：options: { imageSquareSize, rangeThumbImageSquareSize, rangeAnglePos, ... }
})

// 验证
validateRotateCaptcha(block, userAngle, 5)
```

## 数据结构

### SlideCaptcha

```ts
interface SlideCaptchaData {
  masterImage: Buffer // JPEG，背景图（含挖空后的阴影）
  tileImage: Buffer // PNG，拼图本体
  block: Block
}

interface Block {
  x: number
  y: number
  width: number
  height: number
  angle: number
  dx: number // 校验目标 X
  dy: number // 校验目标 Y
}
```

### ClickCaptcha

```ts
interface ClickCaptchaData {
  masterImage: Buffer // JPEG
  thumbImage: Buffer // PNG
  dots: ClickDot[] // 按顺序点击的字符/形状
}

interface ClickDot {
  x: number
  y: number
  width: number
  height: number
  value: string // 字符或形状 name
  color: string
  color2: string
}
```

### RotateCaptcha

```ts
interface RotateCaptchaData {
  masterImage: Buffer // PNG
  thumbImage: Buffer // PNG（已旋转到正确角度的小图）
  block: RotateBlock
}

interface RotateBlock {
  x: number
  y: number
  width: number
  height: number
  angle: number // 旋转目标角度
}
```

## 开发

```sh
pnpm tsc        # 类型检查
pnpm test       # 运行测试
pnpm coverage   # v8 覆盖率
pnpm build      # 产物 + 内置素材拷贝到 dist
pnpm format     # prettier
```

## License

MIT © [seepine](https://github.com/seepine/)

[codecov-img]: https://codecov.io/gh/seepine/captcha/graph/badge.svg
[codecov-href]: https://codecov.io/gh/seepine/captcha
[npm-version-img]: https://img.shields.io/npm/v/@seepine/captcha
[npm-version-href]: https://www.npmjs.com/package/@seepine/captcha
[npm-downloads-img]: https://img.shields.io/npm/dm/@seepine/captcha
[npm-downloads-href]: https://npmjs.com/package/@seepine/captcha
[license-img]: https://img.shields.io/github/license/seepine/captcha.svg
[license-href]: https://github.com/seepine/captcha/blob/main/LICENSE
