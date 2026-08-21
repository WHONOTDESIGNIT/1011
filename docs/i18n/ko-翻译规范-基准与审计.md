# 韩语（ko）翻译规范基准文档 — iShine IPL 官网

> 调研日期：2026-08-18 · 调研方法：真实浏览器（headless Edge CDP）抓取韩国本地页面 + Google KR listing
> 数据文件：`.wx-bridge/plans/ko_ref/*.json`
> 对应语言包：`messages/ko.json`（当前 5422 叶子，修复后结构对齐 en）

---

## 1. 调研基准来源（按方法论优先级）

| 优先级 | 来源 | 抓取文件 | 说明 |
|---|---|---|---|
| 1 | Philips 韩国官网（philips.co.kr） | `philips_kr_ipl.json`、`philips_kr_sc1996.json` | Lumea IPL 官方韩语页，术语权威 |
| 1 | Braun 韩国官网（braun.kr） | `braun_kr_silk5.json` | 실크 엑스퍼트 Pro 5 官方韩语页 |
| 2 | Google KR listing（google.co.kr） | `google_ko_ipl2.json`、`google_ko_ipl_listing.json` | "가정용 IPL 제모기 추천" 等韩语搜索 |
| 3 | 다나와（danawa.com，韩国比价/评测站） | `danawa_ko_ipl.json` | 韩国最大 IT 比价站产品命名 |
| 4 | 롯데ON（lotteon.com，韩国零售商） | `lotte_ko_ipl.json` | JS 渲染未抓到产品名，仅作参考 |

**未采用**：G마켓（gmarket.co.kr，中国卖家多）、AliExpress/Amazon/Temu/SHEIN（方法论黑名单）。

---

## 2. 韩语核心术语基准（权威：Philips KR + Braun KR 官网）

### 2.1 产品名/类别术语

| 英文（en.json） | 韩语基准 | 来源 | ko.json 现状 | 处理 |
|---|---|---|---|---|
| IPL hair removal device | **IPL 제모기** | Google KR 主流搜索词 | IPL 제모기（产品语境） | ✅ 保留，统一使用 |
| （分类：医疗设备语境） | **IPL 제모 의료기기** | Braun KR：*"IPL 제모 의료기기"* | 无 | 韩国将 IPL 归为 의료기기（医疗器械），涉及 FDA/식약처 语境可用 |
| home-use IPL device | **가정용 IPL 기기** | Philips KR / Braun KR | 가정용 IPL 기기 | ✅ 保留 |
| Lumea IPL 系列 | **Lumea IPL 제모 시스템** | Philips KR：*"Lumea IPL 제모 시스템"* | 无（不涉及具体品牌名） | 参考 |
| Braun Silk Expert Pro 5 | **브라운 실크 엑스퍼트 Pro 5 IPL 제모 의료기기** | Braun KR | 不涉及 | 参考 |

### 2.2 部件/技术术语（Philips KR SC1996 官方页为权威）

| 英文 | 韩语基准（官方） | 来源原文 | ko.json 现状 | 处理 |
|---|---|---|---|---|
| flash / flashes | **섬광** | Philips KR：*"100,000회 이상의 섬광"*（10万+次闪光） | 플래시（56处，音译） | 🔧 **플래시 → 섬광**（Philips 官方用词） |
| flash count | **섬광 횟수 / 섬광 수** | Philips：*"수명 주기 내 100,000회 이상의 섬광"* | 플래시 수 | 🔧 同上 |
| lamp (cartridge) | **램프 (카트리지)** | Philips KR：*"램프"* | 램프 | ✅ 保留 |
| xenon flash lamp tube | **제논 섬광 램프 튜브** | Philips/Braun 通用 | 제논 플래시 램프 튜브 | 🔧 跟随 섬광 |
| light (IPL 光线) | **IPL 광선** | Philips KR：*"부드러운 IPL 광선"* | IPL 광선 | ✅ 保留 |
| light intensity | **광선 강도 / 빛의 세기** | Philips：*"5가지 광선 강도 설정"*；Braun：*"빛의 세기"* | 광선 강도 | ✅ 保留 |
| hair root | **모근** | Philips：*"모근에 광선을 가해줍니다"* | 모근 | ✅ 保留 |
| skin tone | **피부톤**（无空格） | Braun：*"피부톤을 감지하여"*、*"당신의 피부톤에 맞는"* | 피부 톤（26处，带空格） | 🔧 **피부 톤 → 피부톤** |
| body hair | **체모** | Philips：*"체모 재성장을 억제"*、Braun：*"체모의 멜라닌"* | 체모 | ✅ 保留 |
| hair regrowth | **체모 재성장** | Philips：*"체모 재성장을 억제하는"* | 체모 재성장 | ✅ 保留 |
| semi-permanent | **반영구** | Braun：*"반영구 제모"* | 无（en 中也无此词） | 如出现用 반영구 |
| painless | **무통증 / 거의 무통증** | Braun/Gmarket：*"무통증 제모기"* | 무통증 | ✅ 保留 |
| treatment head/window | **조사창**（Braun）；**치료 창** | Braun：*"부위에 맞게 사용하는 다양한 조사창"* | 치료 창 | ✅ 保留（可参考 조사창） |
| glide | **글라이딩** | Braun：*"0.5초 미만 간격으로 글라이딩"* | 글라이드 | ⚠️ 统一 글라이딩（名词/动词形态按句意） |
| pulse | **펄스** | 韩国技术用语通用 | 펄스 | ✅ 保留 |
| FDA approved | **FDA 승인** | Braun：*"FDA 승인"* | FDA 승인 | ✅ 保留 |
| MFDS / 식약처 | **식약처 허가** | Braun：*"식약처 허가"* | 不涉及 | 参考 |
| cordless | **무선** | 通用 | 무선 | ✅ 保留 |
| energy level | **에너지 레벨 / 에너지 강도** | 通用 | 에너지 레벨 | ✅ 保留 |
| at-home | **가정용** | Philips/Braun：*"집에서도"*、*"가정용"* | 가정용 | ✅ 保留 |

### 2.3 校正结论（本轮必须修正）

1. **플래시 → 섬광**（约 56 处）：Philips 韩国官网对 flash/flashes 的官方用词是 **섬광**（闪光）。韩语中 플래시 是日式/音译残留，官方产品页用 섬광。涉及：플래시 수명/횟수/수/광원/램프/모드/발화 等。
2. **피부 톤 → 피부톤**（26 处）：Braun/Philips 官网均无空格（피부톤）。韩语固有拼写。
3. **글라이드 → 글라이딩**：Braun 官网用 글라이딩（名词形）。动词句保留 글라이드（动词形）。

---

## 3. 语言风格规范（B2B 制造商网站）

### 3.1 句式与礼貌体
- 全站使用 **합니다/입니다 正式体**（B2B 专业语气），与 Philips/Braun 官网一致。
- 称呼客户：**고객/고객님**；描述性句子省略主语（韩语习惯）。
- 避免 "당신" 直译 you（韩语 B2B 中不自然，多用主语省略或 "고객님"）。现有 11 处 "당신" 待复核。
- 专有名词（iShine、Costco、RoseSkinCo、KU2、Lumi、Venus、Alpha、Euno、Hestia、Themis、Emerald、Wooden）保留英文原样。

### 3.2 标点与格式
- 韩语用 **·**（가운뎃점）连接并列项（如 "몸과 얼굴" 用 "·" 可接受，但逗号也常见）；保持 en 结构。
- 数字后接单位不加空格：*"100,000회"*、*"15분"*。
- 百分号：*"70% 이소프로필 알코올"*（数字+%+空格+韩文）。
- 温度：*"10°C"* 保留。
- **不翻译**：IPL、OEM、ODM、FDA、CE、MFDS/MDSAP、MOQ、B2B、FWHM、UV、LED、AI、SKU、ISO 认证编号。
- **HTML 标签保留**：`<b>`、`<br>` 等，翻译 `<b>` 内部文本。

### 3.3 术语一致性铁律
- IPL hair removal device → **IPL 제모기**（产品语境）/ **IPL 제모 의료기기**（医疗器械/认证语境）
- device（泛指）→ **기기**；handset → **핸드셋**（韩国通用）；unit → **기기/유닛**
- 제모 = hair removal；체모 = body hair（**不可混用**：제모 是动作/领域，체모 是毛发本身）
- 禁止：탈모（脱发，完全不同的词！）、레이저 제모기 仅限消费者搜索语境
- at-home → **가정용**（不用 "집에서 사용하는" 长句）

---

## 4. 已发现的机翻痕迹（子代理复核重点）

1. **당신** 直译过多（11 处）——韩语 B2B 中不自然。
2. **플래시** 音译残留（56 处）——官方用 섬광。
3. **피부 톤** 空格错误（26 处）——官方 피부톤。
4. 部分长句英文语序残留（韩语谓词置尾），需子代理逐条打磨。
5. `develo*` 部分保留英文（29+14+2 处）——与 en 相同值属品牌/专有名词，保留合理；其余需确认是否应翻译。

---

## 5. 复核流程

1. 术语机械修正（本次已完成）：플래시→섬광、피부 톤→피부톤、글라이드→글라이딩（名词语境）。
2. 生成 EN-KO 对照对（排除 [TODO]），按顶层 key 分组为 8 组。
3. 8 个子代理逐条复核：修正机翻痕迹、统一术语、调整韩语语序、处理 당신。
4. 合并（merge_ko_fixes.py，逻辑同 merge_tr_fixes2.py）。
5. 结构验证：ko 叶子 = en 叶子（5422），0 缺失 0 多余，JSON 合法。
6. `astro build` 验证 + 抽样检查 /ko/ 页面。
