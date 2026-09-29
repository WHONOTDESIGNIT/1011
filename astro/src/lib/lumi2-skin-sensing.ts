/**
 * Lumi 2 产品页「肤色感应 + IGBT 快速闪光」技术区块（按语种）。
 *
 * 位置：`src/pages/products/[slug].astro`，「关键特性」与 DDP 运费区块之间，仅 slug === 'lumi-2' 渲染。
 * 为什么独立成文件而不写进 messages/*.json：与 skin-hair-suitability.ts 同一理由——
 *   ① 22 个 messages 文件是 0.5–2.9 MB 的大文件、格式不统一（en 用 CRLF、其余 LF），
 *      脚本整份重写会产生无法人工复核的 diff；② 本组文案是「同构短句 + 固定表格结构」，
 *      集中一处便于审核；③ 避免与并发改 messages/*.json 的批次争用。
 *
 * 口径来源（老板 2026-09-22 口述 + 站内既有已发布口径）：
 *   - 五档状态：空气（不接触皮肤）不工作；黑色 = Fitzpatrick VI 不工作；
 *     其余可处理肤色对应 3 个能量档位（低/中/高）。
 *   - IGBT 快速闪光：电容组必须在两次闪光之间快速回充，能量档位才能在闪与闪之间切换。
 *   - 为什么只用 3 档：档位切得越细，边界越多；肤色读数会随皮肤血流变化而漂移，
 *     越细的档位越容易被一次正常波动推过边界而误判。
 *   - 传感原理（与站内博文 15 一致）：LED 发光 + 感光芯片收反射光，属自身光源的反射式测量，
 *     不受环境光影响；红光 + 红外双波长按比值判定。
 *   - ⚠️ 未写「浅肤色↔哪一档」的方向映射：老板口述「由浅到深 = 低中高」与站内已发布口径
 *     （messages / 博文 15：Type V 限制在最低能量档）方向相反，属安全相关表述，
 *     待确认后再补一句话，避免公开页发布互相矛盾的安全说明。
 */

/**
 * 补充组：传感机理细节 + 行业基线 + 「稳定优先」结论。
 *
 * 2026-09-22 老板补充口径：感光芯片 + 复合光源；设备接触皮肤后光源才开始发射；
 * 光经导光柱照射皮肤后返回，不同肤色反射回的光能量不同；感光芯片按返回能量判定肤色，
 * 不同肤色分配到不同闪光能量；各公司按经验值与设计要求做不同分配；
 * 行业基本要求 = 黑色 + 空气 + 3–5 级肤色识别（黑色与空气不得闪光、不分配能量）；
 * 肤色识别不是分级越多越好，而是越稳定越好。
 *
 * 为什么单独成组而不并进上面 22 个 locale 对象：并进去需要重写 22 个大对象（含 RTL 文案），
 * diff 无法人工复核；分成两组后 getLumi2Technology() 仍返回同一个合并对象，调用方无感。
 */
export type Lumi2SensingDetail = {
  mechanismTitle: string;
  mechanismBody: string;
  baselineTitle: string;
  baselineBody: string;
  baselinePoints: string[];
  stabilityNote: string;
};

export type Lumi2IgbtDetail = {
  /** 为什么肤色识别必须靠 IGBT 控制（按放电时间调能量） */
  igbtControlBody: string;
  /** 器件选型：不绑单一型号，多型号兼容设计 */
  igbtSourcingTitle: string;
  igbtSourcingBody: string;
};

export type Lumi2TechnologyCopy = Lumi2CoreCopy & Lumi2SensingDetail & Lumi2IgbtDetail;

export type Lumi2CoreCopy = {
  kicker: string;
  heading: string;
  intro: string;
  igbtTitle: string;
  igbtBody: string;
  levelsTitle: string;
  levelsIntro: string;
  levelsTableHead: [string, string];
  /** 5 行：状态 → 设备反应（前两行不工作，后三行为 3 个能量档位） */
  levelRows: { state: string; response: string }[];
  levelsNote: string;
  whyTitle: string;
  whyBody: string[];
  refsTitle: string;
  refsNote: string;
  guideLabel: string;
};

/** 参考文献（引用格式保持原文语言，各语种共用；链接均已逐条核验可达） */
export const LUMI2_REFERENCES: { label: string; url: string; internal?: boolean }[] = [
  {
    label:
      'Fitzpatrick TB. The validity and practicality of sun-reactive skin types I through VI. Archives of Dermatology, 1988;124(6):869–871.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/3377516/',
  },
  {
    label:
      'Ly BCK, Dyer EB, Feig JL, Chien AL, Del Bino S. Cutaneous colorimetry: a reliable technique for objective skin colour measurement. Journal of Investigative Dermatology, 2020;140(1):3–12.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31864431/',
  },
  {
    label:
      'Stamatas GN, Zmudzka BZ, Kollias N, Beer JZ. Non-invasive measurements of skin pigmentation in situ. Pigment Cell Research, 2004;17(6):618–626.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/15541019/',
  },
  {
    label: 'iShine: how skin tone detection works',
    url: '/blog/15-skin-tone-detection-ipl-safety-guide',
    internal: true,
  },
];

export const LUMI2_TECHNOLOGY: Record<string, Lumi2CoreCopy> = {
  en: {
    kicker: 'Skin sensing',
    heading: 'How Lumi 2 reads your skin — and keeps up with it',
    intro:
      'Lumi 2 measures your skin before every flash and sets its own energy level from that reading. Two pieces of hardware make it work: a reflectance sensor that reads the skin, and an IGBT switch that refills the capacitor fast enough for the device to act on what the sensor found.',
    igbtTitle: 'IGBT fast flashing: keeping the capacitor ready',
    igbtBody:
      'An IPL pulse is a capacitor discharge. The capacitor bank has to be refilled before the next pulse, and refilled fast enough that the device can change energy level between one flash and the next. Lumi 2 uses an IGBT (insulated-gate bipolar transistor) as the main switch in that circuit: it combines the low conduction losses of a bipolar transistor with the fast, voltage-controlled switching of a MOSFET, which is why pulsed-power designs use it. In practice the bank stays charged, the next pulse is ready immediately, and the energy level can follow the sensor instead of being fixed for the whole session.',
    levelsTitle: 'Five states before a flash, three of them usable',
    levelsIntro: 'The sensor resolves five states. Two of them never fire.',
    levelsTableHead: ['Sensor state', 'What Lumi 2 does'],
    levelRows: [
      { state: 'No skin contact ("air")', response: 'No flash. The window has to sit flat on the skin.' },
      { state: 'Very dark skin — Fitzpatrick VI', response: 'No flash. Locked out, with an alert.' },
      { state: 'Treatable skin tone — level 1', response: 'Flashes at the lowest of three energy levels.' },
      { state: 'Treatable skin tone — level 2', response: 'Flashes at the middle energy level.' },
      { state: 'Treatable skin tone — level 3', response: 'Flashes at the highest of the three levels.' },
    ],
    levelsNote:
      'The level is assigned from the reading, not chosen by the user. The darkest state stays locked out whatever the setting.',
    whyTitle: 'Why three energy levels, and not five',
    whyBody: [
      'Skin tone sensing here is a reflectance measurement: a light source illuminates the skin and a photosensor reads how much light comes back, so the reading depends on the device’s own emitter rather than on the light in the room. Melanin and blood both sit in that reading, and the amount of light returned shifts as blood flow in the skin shifts. Energy steps that sit close together are easier to cross: a smaller drift is enough to move a reading past a boundary and into the wrong step.',
      'Cutting the treatable range into more than three levels does not add precision the user can act on. It adds boundaries at which the device can misread a normal skin. Three levels keep the gaps wide enough that ordinary variation — a warm room, exertion, emotional state, alcohol — stays inside its step instead of spilling into the next one.',
    ],
    refsTitle: 'References',
    refsNote:
      'Primary sources for skin typing and for how skin colour is measured, plus our own guide to skin tone sensing.',
    guideLabel: 'How skin tone detection works',
  },
  ar: {
    kicker: 'استشعار البشرة',
    heading: 'كيف يقرأ Lumi 2 بشرتك — وكيف يواكبها',
    intro:
      'يقيس Lumi 2 بشرتك قبل كل ومضة ويحدّد مستوى الطاقة بنفسه وفقًا لتلك القراءة. قطعتان من العتاد تجعلان ذلك ممكنًا: مستشعر انعكاس يقرأ البشرة، ومفتاح IGBT يعيد شحن المكثّف بسرعة تكفي ليتصرف الجهاز وفق ما وجده المستشعر.',
    igbtTitle: 'الوميض السريع بتقنية IGBT: إبقاء المكثّف جاهزًا',
    igbtBody:
      'نبضة IPL هي تفريغ لمكثّف. يجب إعادة شحن مجموعة المكثّفات قبل النبضة التالية، وبسرعة تكفي لتغيير مستوى الطاقة بين ومضة وأخرى. يستخدم Lumi 2 ترانزستور IGBT (ثنائي القطب ذو البوابة المعزولة) كمفتاح رئيسي في تلك الدائرة: فهو يجمع بين خسائر التوصيل المنخفضة في الترانزستور ثنائي القطب والتبديل السريع المُتحكَّم بالجهد في MOSFET، ولهذا تستخدمه تصاميم القدرة النبضية. عمليًا تبقى المجموعة مشحونة، وتكون النبضة التالية جاهزة فورًا، ويستطيع مستوى الطاقة أن يتبع المستشعر بدل أن يبقى ثابتًا طوال الجلسة.',
    levelsTitle: 'خمس حالات قبل الومضة، ثلاث منها قابلة للاستخدام',
    levelsIntro: 'يميّز المستشعر خمس حالات، اثنتان منها لا تُطلق ومضة أبدًا.',
    levelsTableHead: ['حالة المستشعر', 'ما يفعله Lumi 2'],
    levelRows: [
      { state: 'لا تلامس مع البشرة («هواء»)', response: 'لا ومضة. يجب أن تستقر النافذة مسطحة على البشرة.' },
      { state: 'بشرة داكنة جدًا — Fitzpatrick VI', response: 'لا ومضة. مقفلة، مع تنبيه.' },
      { state: 'لون بشرة قابل للعلاج — المستوى 1', response: 'ومضة عند أدنى مستويات الطاقة الثلاثة.' },
      { state: 'لون بشرة قابل للعلاج — المستوى 2', response: 'ومضة عند المستوى الأوسط.' },
      { state: 'لون بشرة قابل للعلاج — المستوى 3', response: 'ومضة عند أعلى المستويات الثلاثة.' },
    ],
    levelsNote:
      'يُسنَد المستوى بحسب القراءة، لا باختيار المستخدم. أما الحالة الأكثر داكنة فتبقى مقفلة أيًا كان الإعداد.',
    whyTitle: 'لماذا ثلاثة مستويات للطاقة وليس خمسة',
    whyBody: [
      'استشعار لون البشرة هنا قياس انعكاس: مصدر ضوء يضيء البشرة ومستشعر ضوئي يقرأ كمية الضوء العائدة، لذا تعتمد القراءة على باعث الجهاز نفسه لا على إضاءة الغرفة. ويشترك في هذه القراءة كل من الميلانين والدم، وتتغيّر كمية الضوء العائدة بتغيّر تدفق الدم في البشرة. والمستويات المتقاربة أسهل في تجاوز حدودها: يكفي انحراف أصغر لينتقل القياس إلى مستوى خاطئ.',
      'وتقسيم النطاق القابل للعلاج إلى أكثر من ثلاثة مستويات لا يضيف دقة يستفيد منها المستخدم، بل يضيف حدودًا يمكن أن يخطئ الجهاز عندها في تصنيف بشرة طبيعية. المستويات الثلاثة تُبقي الفواصل واسعة بما يكفي ليبقى التغيّر العادي — غرفة دافئة، مجهود، حالة انفعالية، كحول — داخل مستواه بدل أن يتسرّب إلى المستوى المجاور.',
    ],
    refsTitle: 'المراجع',
    refsNote: 'مصادر أساسية لتصنيف البشرة ولقياس لونها، إضافة إلى دليلنا الخاص باستشعار لون البشرة.',
    guideLabel: 'كيف يعمل كشف لون البشرة',
  },
  cs: {
    kicker: 'Snímání pleti',
    heading: 'Jak Lumi 2 čte vaši pleť — a jak s ní drží krok',
    intro:
      'Lumi 2 měří vaši pleť před každým zábleskem a sám z tohoto měření nastaví energetickou úroveň. Umožňují to dvě součásti: odrazový senzor, který pleť čte, a spínač IGBT, který dost rychle dobíjí kondenzátor, aby zařízení mohlo na zjištění senzoru zareagovat.',
    igbtTitle: 'Rychlé blikání s IGBT: kondenzátor zůstává připravený',
    igbtBody:
      'Puls IPL je vybití kondenzátoru. Baterie kondenzátorů se musí dobít před dalším pulsem, a to dost rychle na to, aby zařízení stihlo změnit energetickou úroveň mezi jedním a druhým zábleskem. Lumi 2 používá jako hlavní spínač v tomto obvodu IGBT (bipolární tranzistor s izolovaným hradlem): spojuje nízké ztráty bipolárního tranzistoru s rychlým spínáním řízeným napětím, jaké má MOSFET, a proto se v pulzních výkonových obvodech používá. V praxi tak zůstává baterie nabitá, další puls je k dispozici okamžitě a energetická úroveň může sledovat senzor, místo aby byla pevná na celou seanci.',
    levelsTitle: 'Pět stavů před zábleskem, tři použitelné',
    levelsIntro: 'Senzor rozlišuje pět stavů. Dva z nich nikdy nevystřelí.',
    levelsTableHead: ['Stav senzoru', 'Co Lumi 2 udělá'],
    levelRows: [
      { state: 'Bez kontaktu s pletí („vzduch“)', response: 'Žádný záblesk. Okénko musí ležet naplocho na pleti.' },
      { state: 'Velmi tmavá pleť — Fitzpatrick VI', response: 'Žádný záblesk. Uzamčeno, s upozorněním.' },
      { state: 'Léčitelný tón pleti — úroveň 1', response: 'Záblesk na nejnižší ze tří energetických úrovní.' },
      { state: 'Léčitelný tón pleti — úroveň 2', response: 'Záblesk na střední energetické úrovni.' },
      { state: 'Léčitelný tón pleti — úroveň 3', response: 'Záblesk na nejvyšší ze tří úrovní.' },
    ],
    levelsNote:
      'Úroveň se přiřazuje z měření, ne podle volby uživatele. Nejtmavší stav zůstává uzamčen bez ohledu na nastavení.',
    whyTitle: 'Proč tři energetické úrovně, a ne pět',
    whyBody: [
      'Snímání tónu pleti je zde odrazové měření: zdroj světla osvětlí pleť a fotosenzor čte, kolik světla se vrátí, takže měření závisí na vlastním zářiči zařízení, nikoli na světle v místnosti. V tomto měření jsou zastoupeny melanin i krev a množství vráceného světla se mění s průtokem krve v kůži. Energetické stupně blízko sebe se snáze překročí: menší odchylka stačí k tomu, aby se měření posunulo za hranici a do nesprávného stupně.',
      'Rozdělení léčitelného rozsahu na více než tři úrovně nepřidává přesnost, kterou by uživatel využil. Přidává hranice, na kterých zařízení může špatně přečíst normální pleť. Tři úrovně udržují rozestupy tak široké, že běžné výkyvy — teplá místnost, fyzická námaha, emoční stav, alkohol — zůstanou ve svém stupni, místo aby přetekly do sousedního.',
    ],
    refsTitle: 'Zdroje',
    refsNote:
      'Základní zdroje k typologii pleti a k měření barvy pleti plus náš vlastní průvodce snímáním tónu pleti.',
    guideLabel: 'Jak funguje detekce tónu pleti',
  },
  de: {
    kicker: 'Hauterkennung',
    heading: 'Wie Lumi 2 Ihre Haut liest — und mit ihr Schritt hält',
    intro:
      'Lumi 2 misst Ihre Haut vor jedem Blitz und legt die Energiestufe selbst anhand dieser Messung fest. Zwei Bauteile machen das möglich: ein Reflexionssensor, der die Haut liest, und ein IGBT-Schalter, der den Kondensator schnell genug nachlädt, damit das Gerät auf das Messergebnis reagieren kann.',
    igbtTitle: 'Schnelles Blitzen mit IGBT: der Kondensator bleibt bereit',
    igbtBody:
      'Ein IPL-Impuls ist die Entladung eines Kondensators. Die Kondensatorbank muss vor dem nächsten Impuls wieder gefüllt werden — und zwar schnell genug, dass das Gerät die Energiestufe zwischen zwei Blitzen wechseln kann. Lumi 2 nutzt einen IGBT (Bipolartransistor mit isolierter Gate-Elektrode) als Hauptschalter in diesem Kreis: Er verbindet die niedrigen Durchlassverluste eines Bipolartransistors mit dem schnellen, spannungsgesteuerten Schalten eines MOSFET, weshalb Pulsleistungs-Schaltungen ihn einsetzen. In der Praxis bleibt die Bank geladen, der nächste Impuls steht sofort bereit, und die Energiestufe kann dem Sensor folgen, statt für die ganze Sitzung festzuliegen.',
    levelsTitle: 'Fünf Zustände vor dem Blitz, drei davon nutzbar',
    levelsIntro: 'Der Sensor unterscheidet fünf Zustände. Zwei davon blitzen nie.',
    levelsTableHead: ['Sensorzustand', 'Was Lumi 2 tut'],
    levelRows: [
      { state: 'Kein Hautkontakt („Luft“)', response: 'Kein Blitz. Das Fenster muss flach auf der Haut liegen.' },
      { state: 'Sehr dunkle Haut — Fitzpatrick VI', response: 'Kein Blitz. Gesperrt, mit Hinweis.' },
      { state: 'Behandelbarer Hautton — Stufe 1', response: 'Blitz auf der niedrigsten der drei Energiestufen.' },
      { state: 'Behandelbarer Hautton — Stufe 2', response: 'Blitz auf der mittleren Energiestufe.' },
      { state: 'Behandelbarer Hautton — Stufe 3', response: 'Blitz auf der höchsten der drei Stufen.' },
    ],
    levelsNote:
      'Die Stufe wird aus der Messung zugewiesen, nicht vom Nutzer gewählt. Der dunkelste Zustand bleibt unabhängig von der Einstellung gesperrt.',
    whyTitle: 'Warum drei Energiestufen und nicht fünf',
    whyBody: [
      'Die Hauttonerkennung ist hier eine Reflexionsmessung: Eine Lichtquelle beleuchtet die Haut, ein Fotosensor liest, wie viel Licht zurückkommt. Die Messung hängt deshalb vom eigenen Emitter des Geräts ab und nicht vom Licht im Raum. In dieser Messung stecken Melanin und Blut zugleich, und die zurückkommende Lichtmenge verschiebt sich mit der Durchblutung der Haut. Dicht beieinanderliegende Energiestufen werden leichter überschritten: Eine kleinere Abweichung genügt, um eine Messung über eine Grenze in die falsche Stufe zu schieben.',
      'Den behandelbaren Bereich in mehr als drei Stufen zu teilen, bringt keine Genauigkeit, die der Nutzer nutzen könnte. Es bringt Grenzen, an denen das Gerät normale Haut falsch einordnen kann. Drei Stufen halten die Abstände weit genug, dass gewöhnliche Schwankungen — ein warmer Raum, körperliche Anstrengung, emotionaler Zustand, Alkohol — in ihrer Stufe bleiben, statt in die nächste zu rutschen.',
    ],
    refsTitle: 'Quellen',
    refsNote:
      'Grundlagenquellen zur Hauttypisierung und zur Messung der Hautfarbe sowie unser eigener Leitfaden zur Hauttonerkennung.',
    guideLabel: 'Wie die Hauttonerkennung funktioniert',
  },
  el: {
    kicker: 'Ανίχνευση δέρματος',
    heading: 'Πώς το Lumi 2 διαβάζει το δέρμα σας — και συμβαδίζει μαζί του',
    intro:
      'Το Lumi 2 μετρά το δέρμα σας πριν από κάθε λάμψη και ορίζει μόνο του το επίπεδο ενέργειας με βάση αυτή τη μέτρηση. Δύο εξαρτήματα το κάνουν εφικτό: ένας αισθητήρας ανάκλασης που διαβάζει το δέρμα και ένας διακόπτης IGBT που επαναφορτίζει τον πυκνωτή αρκετά γρήγορα ώστε η συσκευή να αντιδρά σε ό,τι εντόπισε ο αισθητήρας.',
    igbtTitle: 'Γρήγορη λάμψη με IGBT: ο πυκνωτής μένει έτοιμος',
    igbtBody:
      'Ένας παλμός IPL είναι εκφόρτιση πυκνωτή. Η συστοιχία πυκνωτών πρέπει να ξαναγεμίσει πριν από τον επόμενο παλμό, και μάλιστα αρκετά γρήγορα ώστε η συσκευή να αλλάζει επίπεδο ενέργειας από τη μια λάμψη στην επόμενη. Το Lumi 2 χρησιμοποιεί ένα IGBT (διπολικό τρανζίστορ μονωμένης πύλης) ως κύριο διακόπτη σε αυτό το κύκλωμα: συνδυάζει τις χαμηλές απώλειες αγωγιμότητας του διπολικού τρανζίστορ με τη γρήγορη, ελεγχόμενη από τάση μεταγωγή του MOSFET, γι’ αυτό το χρησιμοποιούν τα κυκλώματα παλμικής ισχύος. Στην πράξη η συστοιχία μένει φορτισμένη, ο επόμενος παλμός είναι άμεσα διαθέσιμος και το επίπεδο ενέργειας μπορεί να ακολουθεί τον αισθητήρα αντί να μένει σταθερό για όλη τη συνεδρία.',
    levelsTitle: 'Πέντε καταστάσεις πριν από τη λάμψη, οι τρεις αξιοποιήσιμες',
    levelsIntro: 'Ο αισθητήρας διακρίνει πέντε καταστάσεις. Οι δύο δεν εκπέμπουν ποτέ λάμψη.',
    levelsTableHead: ['Κατάσταση αισθητήρα', 'Τι κάνει το Lumi 2'],
    levelRows: [
      { state: 'Χωρίς επαφή με το δέρμα («αέρας»)', response: 'Καμία λάμψη. Το παράθυρο πρέπει να εφάπτεται επίπεδα στο δέρμα.' },
      { state: 'Πολύ σκούρο δέρμα — Fitzpatrick VI', response: 'Καμία λάμψη. Κλειδωμένο, με ειδοποίηση.' },
      { state: 'Θεραπεύσιμος τόνος δέρματος — επίπεδο 1', response: 'Λάμψη στο χαμηλότερο από τα τρία επίπεδα ενέργειας.' },
      { state: 'Θεραπεύσιμος τόνος δέρματος — επίπεδο 2', response: 'Λάμψη στο μεσαίο επίπεδο ενέργειας.' },
      { state: 'Θεραπεύσιμος τόνος δέρματος — επίπεδο 3', response: 'Λάμψη στο υψηλότερο από τα τρία επίπεδα.' },
    ],
    levelsNote:
      'Το επίπεδο αποδίδεται από τη μέτρηση και δεν το επιλέγει ο χρήστης. Η πιο σκούρα κατάσταση παραμένει κλειδωμένη όποια κι αν είναι η ρύθμιση.',
    whyTitle: 'Γιατί τρία επίπεδα ενέργειας και όχι πέντε',
    whyBody: [
      'Η ανίχνευση τόνου δέρματος εδώ είναι μέτρηση ανάκλασης: μια πηγή φωτός φωτίζει το δέρμα και ένας φωτοαισθητήρας διαβάζει πόσο φως επιστρέφει, οπότε η μέτρηση εξαρτάται από τον πομπό της ίδιας της συσκευής και όχι από το φως του χώρου. Στη μέτρηση συμμετέχουν και η μελανίνη και το αίμα, και η ποσότητα του φωτός που επιστρέφει μεταβάλλεται μαζί με τη ροή αίματος στο δέρμα. Τα κοντινά μεταξύ τους επίπεδα ενέργειας ξεπερνιούνται πιο εύκολα: μια μικρότερη μετατόπιση αρκεί για να περάσει η μέτρηση ένα όριο και να πέσει σε λάθος επίπεδο.',
      'Ο διαχωρισμός του θεραπεύσιμου εύρους σε περισσότερα από τρία επίπεδα δεν προσθέτει ακρίβεια που μπορεί να αξιοποιήσει ο χρήστης. Προσθέτει όρια στα οποία η συσκευή μπορεί να διαβάσει λανθασμένα ένα φυσιολογικό δέρμα. Τα τρία επίπεδα κρατούν τις αποστάσεις αρκετά πλατιές ώστε οι συνηθισμένες διακυμάνσεις — ζεστός χώρος, σωματική προσπάθεια, συναισθηματική κατάσταση, αλκοόλ — να μένουν στο επίπεδό τους αντί να περνούν στο επόμενο.',
    ],
    refsTitle: 'Πηγές',
    refsNote:
      'Βασικές πηγές για την τυπολογία δέρματος και τη μέτρηση του χρώματός του, μαζί με τον δικό μας οδηγό για την ανίχνευση τόνου δέρματος.',
    guideLabel: 'Πώς λειτουργεί η ανίχνευση τόνου δέρματος',
  },
  es: {
    kicker: 'Detección de piel',
    heading: 'Cómo el Lumi 2 lee tu piel y se adapta a ella',
    intro:
      'El Lumi 2 mide tu piel antes de cada destello y fija su propio nivel de energía a partir de esa lectura. Dos componentes lo hacen posible: un sensor de reflectancia que lee la piel y un interruptor IGBT que recarga el condensador con la rapidez suficiente para que el dispositivo actúe según lo que ha medido el sensor.',
    igbtTitle: 'Destello rápido con IGBT: el condensador siempre listo',
    igbtBody:
      'Un pulso IPL es la descarga de un condensador. La batería de condensadores debe recargarse antes del siguiente pulso, y hacerlo con la rapidez suficiente para que el dispositivo cambie de nivel de energía entre un destello y el siguiente. El Lumi 2 utiliza un IGBT (transistor bipolar de puerta aislada) como interruptor principal de ese circuito: combina las bajas pérdidas de conducción de un transistor bipolar con la conmutación rápida controlada por tensión de un MOSFET, y por eso lo emplean los diseños de potencia pulsada. En la práctica, la batería permanece cargada, el siguiente pulso está disponible de inmediato y el nivel de energía puede seguir al sensor en lugar de quedar fijo para toda la sesión.',
    levelsTitle: 'Cinco estados antes del destello, tres utilizables',
    levelsIntro: 'El sensor distingue cinco estados. Dos de ellos nunca disparan.',
    levelsTableHead: ['Estado del sensor', 'Qué hace el Lumi 2'],
    levelRows: [
      { state: 'Sin contacto con la piel («aire»)', response: 'Sin destello. La ventana debe apoyarse plana sobre la piel.' },
      { state: 'Piel muy oscura — Fitzpatrick VI', response: 'Sin destello. Bloqueado, con aviso.' },
      { state: 'Tono de piel tratable — nivel 1', response: 'Destello en el más bajo de los tres niveles de energía.' },
      { state: 'Tono de piel tratable — nivel 2', response: 'Destello en el nivel de energía medio.' },
      { state: 'Tono de piel tratable — nivel 3', response: 'Destello en el más alto de los tres niveles.' },
    ],
    levelsNote:
      'El nivel se asigna a partir de la lectura, no lo elige el usuario. El estado más oscuro permanece bloqueado sea cual sea el ajuste.',
    whyTitle: 'Por qué tres niveles de energía y no cinco',
    whyBody: [
      'La detección del tono de piel es aquí una medición de reflectancia: una fuente de luz ilumina la piel y un fotosensor lee cuánta luz vuelve, de modo que la lectura depende del propio emisor del dispositivo y no de la luz de la habitación. En esa lectura intervienen tanto la melanina como la sangre, y la cantidad de luz devuelta cambia con el flujo sanguíneo de la piel. Los escalones de energía muy próximos se cruzan con más facilidad: basta una deriva menor para que una lectura pase una frontera y caiga en el escalón equivocado.',
      'Dividir el rango tratable en más de tres niveles no añade precisión que el usuario pueda aprovechar. Añade fronteras en las que el dispositivo puede clasificar mal una piel normal. Tres niveles mantienen los intervalos lo bastante amplios para que las variaciones habituales —una habitación cálida, el esfuerzo, el estado emocional, el alcohol— se queden dentro de su escalón en lugar de pasar al siguiente.',
    ],
    refsTitle: 'Referencias',
    refsNote:
      'Fuentes primarias sobre la tipología de piel y sobre cómo se mide el color de la piel, además de nuestra propia guía sobre la detección del tono de piel.',
    guideLabel: 'Cómo funciona la detección del tono de piel',
  },
  fa: {
    kicker: 'حسگری پوست',
    heading: 'Lumi 2 چگونه پوست شما را می‌خواند — و همراه آن پیش می‌رود',
    intro:
      'Lumi 2 پیش از هر فلاش پوست شما را اندازه می‌گیرد و سطح انرژی را خودش بر پایه همان خوانش تعیین می‌کند. دو قطعه این کار را ممکن می‌کند: یک حسگر بازتابی که پوست را می‌خواند، و یک کلید IGBT که خازن را به‌قدری سریع پر می‌کند که دستگاه بتواند بر پایه یافته حسگر عمل کند.',
    igbtTitle: 'فلاش سریع با IGBT: آماده نگه داشتن خازن',
    igbtBody:
      'هر پالس IPL تخلیه یک خازن است. بانک خازنی باید پیش از پالس بعدی دوباره پر شود، و آن‌قدر سریع پر شود که دستگاه بتواند سطح انرژی را بین یک فلاش و فلاش بعدی تغییر دهد. Lumi 2 از یک IGBT (ترانزیستور دوقطبی با گیت عایق‌دار) به‌عنوان کلید اصلی آن مدار استفاده می‌کند: این قطعه تلفات هدایت پایین ترانزیستور دوقطبی را با کلیدزنی سریع و ولتاژمحور MOSFET ترکیب می‌کند و به همین دلیل در طراحی‌های توان پالسی به کار می‌رود. در عمل بانک پر می‌ماند، پالس بعدی بی‌درنگ آماده است و سطح انرژی می‌تواند از حسگر پیروی کند، نه اینکه برای کل جلسه ثابت بماند.',
    levelsTitle: 'پنج حالت پیش از فلاش، سه حالت قابل استفاده',
    levelsIntro: 'حسگر پنج حالت را تشخیص می‌دهد. دو حالت هرگز فلاش نمی‌زنند.',
    levelsTableHead: ['حالت حسگر', 'کاری که Lumi 2 می‌کند'],
    levelRows: [
      { state: 'بدون تماس با پوست («هوا»)', response: 'بدون فلاش. پنجره باید صاف روی پوست بنشیند.' },
      { state: 'پوست بسیار تیره — Fitzpatrick VI', response: 'بدون فلاش. قفل‌شده، همراه با هشدار.' },
      { state: 'رنگ پوست قابل درمان — سطح ۱', response: 'فلاش در پایین‌ترین سطح از سه سطح انرژی.' },
      { state: 'رنگ پوست قابل درمان — سطح ۲', response: 'فلاش در سطح انرژی میانی.' },
      { state: 'رنگ پوست قابل درمان — سطح ۳', response: 'فلاش در بالاترین سطح از سه سطح.' },
    ],
    levelsNote:
      'سطح بر پایه خوانش تعیین می‌شود، نه با انتخاب کاربر. تیره‌ترین حالت هر تنظیمی که باشد قفل می‌ماند.',
    whyTitle: 'چرا سه سطح انرژی و نه پنج',
    whyBody: [
      'حسگری رنگ پوست در اینجا یک اندازه‌گیری بازتابی است: یک منبع نور پوست را روشن می‌کند و یک حسگر نوری می‌خواند چه مقدار نور بازمی‌گردد؛ پس خوانش به تابنده خودِ دستگاه وابسته است، نه به نور اتاق. هم ملانین و هم خون در این خوانش سهم دارند و مقدار نور بازگشتی با جریان خون پوست جابه‌جا می‌شود. پله‌های انرژی که به هم نزدیک‌اند راحت‌تر رد می‌شوند: جابه‌جایی کوچک‌تری کافی است تا خوانش از یک مرز بگذرد و در پله نادرست بیفتد.',
      'تقسیم بازه قابل درمان به بیش از سه سطح، دقتی که کاربر بتواند از آن استفاده کند اضافه نمی‌کند. مرزهایی اضافه می‌کند که دستگاه ممکن است پوستی طبیعی را در آن‌ها اشتباه بخواند. سه سطح فاصله‌ها را به‌قدری باز نگه می‌دارد که تغییرات معمولی — اتاق گرم، فعالیت بدنی، حالت احساسی، الکل — در همان پله بماند و به پله بعدی نریزد.',
    ],
    refsTitle: 'منابع',
    refsNote:
      'منابع اصلی درباره گونه‌شناسی پوست و شیوه اندازه‌گیری رنگ پوست، به‌همراه راهنمای خود ما درباره حسگری رنگ پوست.',
    guideLabel: 'چگونه تشخیص رنگ پوست کار می‌کند',
  },
  fr: {
    kicker: 'Détection de la peau',
    heading: 'Comment le Lumi 2 lit votre peau — et s’y adapte',
    intro:
      'Le Lumi 2 mesure votre peau avant chaque flash et fixe lui-même son niveau d’énergie à partir de cette mesure. Deux composants le permettent : un capteur de réflectance qui lit la peau, et un interrupteur IGBT qui recharge le condensateur assez vite pour que l’appareil agisse selon ce que le capteur a relevé.',
    igbtTitle: 'Flash rapide à IGBT : le condensateur toujours prêt',
    igbtBody:
      'Une impulsion IPL est la décharge d’un condensateur. La batterie de condensateurs doit être rechargée avant l’impulsion suivante, et assez vite pour que l’appareil change de niveau d’énergie entre deux flashs. Le Lumi 2 utilise un IGBT (transistor bipolaire à grille isolée) comme interrupteur principal de ce circuit : il associe les faibles pertes en conduction d’un transistor bipolaire à la commutation rapide commandée en tension d’un MOSFET, ce qui explique son usage dans les circuits de puissance pulsée. En pratique, la batterie reste chargée, l’impulsion suivante est disponible immédiatement, et le niveau d’énergie peut suivre le capteur au lieu de rester figé pour toute la séance.',
    levelsTitle: 'Cinq états avant le flash, trois utilisables',
    levelsIntro: 'Le capteur distingue cinq états. Deux d’entre eux ne déclenchent jamais de flash.',
    levelsTableHead: ['État du capteur', 'Ce que fait le Lumi 2'],
    levelRows: [
      { state: 'Aucun contact avec la peau (« air »)', response: 'Pas de flash. La fenêtre doit reposer à plat sur la peau.' },
      { state: 'Peau très foncée — Fitzpatrick VI', response: 'Pas de flash. Verrouillé, avec alerte.' },
      { state: 'Teint traitable — niveau 1', response: 'Flash au plus bas des trois niveaux d’énergie.' },
      { state: 'Teint traitable — niveau 2', response: 'Flash au niveau d’énergie intermédiaire.' },
      { state: 'Teint traitable — niveau 3', response: 'Flash au plus haut des trois niveaux.' },
    ],
    levelsNote:
      'Le niveau est attribué d’après la mesure, il n’est pas choisi par l’utilisateur. L’état le plus foncé reste verrouillé quel que soit le réglage.',
    whyTitle: 'Pourquoi trois niveaux d’énergie et non cinq',
    whyBody: [
      'La détection du teint est ici une mesure de réflectance : une source lumineuse éclaire la peau et un photodétecteur lit la quantité de lumière qui revient. La mesure dépend donc de l’émetteur de l’appareil et non de la lumière ambiante. La mélanine et le sang entrent tous deux dans cette mesure, et la quantité de lumière renvoyée varie avec le débit sanguin cutané. Des paliers d’énergie proches les uns des autres se franchissent plus facilement : une dérive plus faible suffit à faire passer une mesure de l’autre côté d’une frontière, dans le mauvais palier.',
      'Découper la plage traitable en plus de trois niveaux n’apporte pas de précision exploitable par l’utilisateur. Cela ajoute des frontières où l’appareil peut mal interpréter une peau normale. Trois niveaux gardent des écarts assez larges pour que les variations ordinaires — pièce chaude, effort, état émotionnel, alcool — restent dans leur palier au lieu de déborder sur le suivant.',
    ],
    refsTitle: 'Références',
    refsNote:
      'Sources primaires sur la typologie cutanée et sur la mesure de la couleur de la peau, ainsi que notre propre guide sur la détection du teint.',
    guideLabel: 'Comment fonctionne la détection du teint',
  },
  he: {
    kicker: 'חישת עור',
    heading: 'איך Lumi 2 קורא את העור שלך — ואיך הוא מתעדכן איתו',
    intro:
      'Lumi 2 מודד את העור לפני כל הבזק וקובע בעצמו את רמת האנרגיה לפי המדידה הזו. שני רכיבים מאפשרים זאת: חיישן החזרה שקורא את העור, ומפסק IGBT שממלא מחדש את הקבל מהר מספיק כדי שהמכשיר יפעל לפי מה שהחיישן מצא.',
    igbtTitle: 'הבזק מהיר עם IGBT: הקבל נשאר מוכן',
    igbtBody:
      'פעימת IPL היא פריקה של קבל. מערך הקבלים חייב להתמלא מחדש לפני הפעימה הבאה, ומהר מספיק כדי שהמכשיר יוכל להחליף רמת אנרגיה בין הבזק להבזק. Lumi 2 משתמש ב-IGBT (טרנזיסטור דו-קוטבי עם שער מבודד) כמפסק הראשי במעגל הזה: הוא משלב הפסדי הולכה נמוכים של טרנזיסטור דו-קוטבי עם מיתוג מהיר הנשלט במתח של MOSFET, וזו הסיבה שמעגלי הספק פועם משתמשים בו. בפועל המערך נשאר טעון, הפעימה הבאה זמינה מיד, ורמת האנרגיה יכולה לעקוב אחרי החיישן במקום להיות קבועה לכל הסשן.',
    levelsTitle: 'חמישה מצבים לפני ההבזק, שלושה מהם שמישים',
    levelsIntro: 'החיישן מבדיל בין חמישה מצבים. שניים מהם לא יורים הבזק לעולם.',
    levelsTableHead: ['מצב החיישן', 'מה Lumi 2 עושה'],
    levelRows: [
      { state: 'אין מגע עם העור (״אוויר״)', response: 'אין הבזק. החלון חייב לשבת שטוח על העור.' },
      { state: 'עור כהה מאוד — Fitzpatrick VI', response: 'אין הבזק. נעול, עם התראה.' },
      { state: 'גוון עור ניתן לטיפול — רמה 1', response: 'הבזק ברמה הנמוכה מבין שלוש רמות האנרגיה.' },
      { state: 'גוון עור ניתן לטיפול — רמה 2', response: 'הבזק ברמת האנרגיה האמצעית.' },
      { state: 'גוון עור ניתן לטיפול — רמה 3', response: 'הבזק ברמה הגבוהה מבין השלוש.' },
    ],
    levelsNote:
      'הרמה נקבעת לפי המדידה ולא לפי בחירת המשתמש. המצב הכהה ביותר נשאר נעול בכל הגדרה.',
    whyTitle: 'למה שלוש רמות אנרגיה ולא חמש',
    whyBody: [
      'חישת גוון עור כאן היא מדידת החזרה: מקור אור מאיר את העור וחיישן אופטי קורא כמה אור חוזר, כך שהמדידה תלויה בפולט של המכשיר עצמו ולא בתאורה בחדר. גם מלנין וגם דם משתתפים במדידה הזו, וכמות האור החוזרת משתנה עם זרימת הדם בעור. מדרגות אנרגיה סמוכות זו לזו נחצות בקלות רבה יותר: סחיפה קטנה יותר מספיקה כדי להעביר מדידה מעבר לגבול ולתוך המדרגה הלא נכונה.',
      'חלוקת הטווח הניתן לטיפול ליותר משלוש רמות לא מוסיפה דיוק שהמשתמש יכול לנצל. היא מוסיפה גבולות שבהם המכשיר עלול לקרוא עור תקין בטעות. שלוש רמות שומרות על מרווחים רחבים מספיק כדי שתנודות רגילות — חדר חם, מאמץ גופני, מצב רגשי, אלכוהול — יישארו במדרגה שלהן ולא יישפכו לזו שלצידה.',
    ],
    refsTitle: 'מקורות',
    refsNote: 'מקורות ראשוניים לסיווג עור ולמדידת צבע עור, וכן המדריך שלנו לחישת גוון עור.',
    guideLabel: 'איך עובד זיהוי גוון העור',
  },
  id: {
    kicker: 'Penginderaan kulit',
    heading: 'Cara Lumi 2 membaca kulit Anda — dan mengikutinya',
    intro:
      'Lumi 2 mengukur kulit Anda sebelum setiap kilatan dan menetapkan sendiri tingkat energinya dari pembacaan itu. Dua komponen membuatnya bekerja: sensor reflektansi yang membaca kulit, dan sakelar IGBT yang mengisi ulang kapasitor cukup cepat sehingga perangkat dapat bertindak atas hasil pembacaan sensor.',
    igbtTitle: 'Kilatan cepat IGBT: kapasitor tetap siap',
    igbtBody:
      'Satu pulsa IPL adalah pelepasan muatan kapasitor. Bank kapasitor harus diisi ulang sebelum pulsa berikutnya, dan cukup cepat sehingga perangkat dapat mengganti tingkat energi dari satu kilatan ke kilatan berikutnya. Lumi 2 memakai IGBT (transistor bipolar gerbang terisolasi) sebagai sakelar utama pada rangkaian itu: komponen ini menggabungkan rugi konduksi rendah milik transistor bipolar dengan pensakelaran cepat terkendali tegangan milik MOSFET, itulah sebabnya rangkaian daya pulsa memakainya. Praktisnya bank tetap terisi, pulsa berikutnya langsung siap, dan tingkat energi dapat mengikuti sensor alih-alih tetap untuk seluruh sesi.',
    levelsTitle: 'Lima keadaan sebelum kilatan, tiga di antaranya dapat dipakai',
    levelsIntro: 'Sensor membedakan lima keadaan. Dua di antaranya tidak pernah menyala.',
    levelsTableHead: ['Keadaan sensor', 'Yang dilakukan Lumi 2'],
    levelRows: [
      { state: 'Tidak ada kontak dengan kulit ("udara")', response: 'Tidak menyala. Jendela harus menempel rata di kulit.' },
      { state: 'Kulit sangat gelap — Fitzpatrick VI', response: 'Tidak menyala. Terkunci, dengan peringatan.' },
      { state: 'Warna kulit yang dapat ditangani — tingkat 1', response: 'Menyala pada tingkat energi terendah dari tiga tingkat.' },
      { state: 'Warna kulit yang dapat ditangani — tingkat 2', response: 'Menyala pada tingkat energi menengah.' },
      { state: 'Warna kulit yang dapat ditangani — tingkat 3', response: 'Menyala pada tingkat tertinggi dari ketiganya.' },
    ],
    levelsNote:
      'Tingkat ditetapkan dari pembacaan, bukan dipilih pengguna. Keadaan tergelap tetap terkunci berapa pun pengaturannya.',
    whyTitle: 'Mengapa tiga tingkat energi, bukan lima',
    whyBody: [
      'Penginderaan warna kulit di sini adalah pengukuran reflektansi: sumber cahaya menerangi kulit dan fotosensor membaca berapa banyak cahaya yang kembali, sehingga pembacaan bergantung pada pemancar perangkat itu sendiri dan bukan pada cahaya ruangan. Melanin dan darah sama-sama masuk ke dalam pembacaan ini, dan jumlah cahaya yang dipantulkan bergeser mengikuti aliran darah di kulit. Tingkat energi yang berdekatan lebih mudah terlewati: pergeseran yang lebih kecil sudah cukup untuk membawa pembacaan melewati batas dan masuk ke tingkat yang salah.',
      'Memotong rentang yang dapat ditangani menjadi lebih dari tiga tingkat tidak menambah ketelitian yang bisa dimanfaatkan pengguna. Yang bertambah adalah batas tempat perangkat bisa salah membaca kulit yang normal. Tiga tingkat menjaga jarak cukup lebar sehingga variasi biasa — ruangan hangat, aktivitas fisik, keadaan emosi, alkohol — tetap di tingkatnya dan tidak meluber ke tingkat sebelah.',
    ],
    refsTitle: 'Referensi',
    refsNote:
      'Sumber utama tentang klasifikasi kulit dan cara warna kulit diukur, ditambah panduan kami sendiri tentang penginderaan warna kulit.',
    guideLabel: 'Cara kerja deteksi warna kulit',
  },
  it: {
    kicker: 'Rilevamento della pelle',
    heading: 'Come Lumi 2 legge la tua pelle — e le sta dietro',
    intro:
      'Lumi 2 misura la pelle prima di ogni flash e imposta da sé il livello di energia in base a quella lettura. Due componenti lo rendono possibile: un sensore di riflettanza che legge la pelle e un interruttore IGBT che ricarica il condensatore abbastanza in fretta da permettere al dispositivo di agire su ciò che il sensore ha rilevato.',
    igbtTitle: 'Flash rapido con IGBT: il condensatore resta pronto',
    igbtBody:
      'Un impulso IPL è la scarica di un condensatore. Il banco di condensatori deve essere ricaricato prima dell’impulso successivo, e abbastanza in fretta da permettere al dispositivo di cambiare livello di energia tra un flash e il successivo. Lumi 2 usa un IGBT (transistor bipolare a gate isolato) come interruttore principale di quel circuito: unisce le basse perdite in conduzione di un transistor bipolare alla commutazione rapida controllata in tensione di un MOSFET, ed è per questo che i circuiti di potenza pulsata lo impiegano. In pratica il banco resta carico, l’impulso successivo è subito disponibile e il livello di energia può seguire il sensore invece di restare fisso per tutta la seduta.',
    levelsTitle: 'Cinque stati prima del flash, tre utilizzabili',
    levelsIntro: 'Il sensore distingue cinque stati. Due non fanno mai partire il flash.',
    levelsTableHead: ['Stato del sensore', 'Cosa fa Lumi 2'],
    levelRows: [
      { state: 'Nessun contatto con la pelle («aria»)', response: 'Nessun flash. La finestra deve appoggiarsi piatta sulla pelle.' },
      { state: 'Pelle molto scura — Fitzpatrick VI', response: 'Nessun flash. Bloccato, con avviso.' },
      { state: 'Tono di pelle trattabile — livello 1', response: 'Flash al più basso dei tre livelli di energia.' },
      { state: 'Tono di pelle trattabile — livello 2', response: 'Flash al livello di energia intermedio.' },
      { state: 'Tono di pelle trattabile — livello 3', response: 'Flash al più alto dei tre livelli.' },
    ],
    levelsNote:
      'Il livello viene assegnato dalla lettura, non scelto dall’utente. Lo stato più scuro resta bloccato qualunque sia l’impostazione.',
    whyTitle: 'Perché tre livelli di energia e non cinque',
    whyBody: [
      'Il rilevamento del tono della pelle qui è una misura di riflettanza: una sorgente luminosa illumina la pelle e un fotosensore legge quanta luce torna indietro, perciò la lettura dipende dall’emettitore del dispositivo stesso e non dalla luce della stanza. In quella lettura ci sono sia la melanina sia il sangue, e la quantità di luce restituita cambia con il flusso sanguigno cutaneo. Gradini di energia vicini tra loro si superano più facilmente: basta una deriva minore per portare una lettura oltre un confine e nel gradino sbagliato.',
      'Dividere l’intervallo trattabile in più di tre livelli non aggiunge precisione che l’utente possa sfruttare. Aggiunge confini sui quali il dispositivo può leggere male una pelle normale. Tre livelli mantengono scarti abbastanza ampi perché le variazioni ordinarie — stanza calda, sforzo, stato emotivo, alcol — restino nel proprio gradino invece di traboccare in quello accanto.',
    ],
    refsTitle: 'Fonti',
    refsNote:
      'Fonti primarie sulla classificazione della pelle e su come si misura il colore della pelle, più la nostra guida al rilevamento del tono cutaneo.',
    guideLabel: 'Come funziona il rilevamento del tono della pelle',
  },
  ja: {
    kicker: '肌センシング',
    heading: 'Lumi 2 が肌を読み取り、それに追従する仕組み',
    intro:
      'Lumi 2 はフラッシュのたびに肌を測定し、その読み取り値からエネルギー段階を自分で決めます。これを可能にする部品は2つです。肌を読む反射式センサーと、センサーの判定に即応できるようコンデンサーを素早く再充電する IGBT スイッチです。',
    igbtTitle: 'IGBT による高速フラッシュ：コンデンサーを常に準備状態に',
    igbtBody:
      'IPL のパルスはコンデンサーの放電です。コンデンサー群は次のパルスの前に再充電される必要があり、しかもフラッシュとフラッシュの間でエネルギー段階を切り替えられるだけの速さで充電されなければなりません。Lumi 2 はこの回路の主スイッチに IGBT（絶縁ゲート型バイポーラトランジスタ）を使っています。IGBT はバイポーラトランジスタの低い導通損失と、MOSFET の電圧制御による高速スイッチングを併せ持つため、パルスパワー回路で使われます。実際にはコンデンサー群は充電されたままになり、次のパルスは即座に使え、エネルギー段階はセッション中ずっと固定されるのではなくセンサーに追従できます。',
    levelsTitle: 'フラッシュ前の5つの状態、うち3つが使用可能',
    levelsIntro: 'センサーは5つの状態を判別します。うち2つは決して照射しません。',
    levelsTableHead: ['センサーの状態', 'Lumi 2 の動作'],
    levelRows: [
      { state: '肌に接触していない（「空気」）', response: '照射しません。照射口を肌に平らに当てる必要があります。' },
      { state: '非常に濃い肌 — Fitzpatrick VI', response: '照射しません。警告とともにロックされます。' },
      { state: '照射可能な肌トーン — レベル1', response: '3段階のうち最も低いエネルギーで照射します。' },
      { state: '照射可能な肌トーン — レベル2', response: '中間のエネルギー段階で照射します。' },
      { state: '照射可能な肌トーン — レベル3', response: '3段階のうち最も高いエネルギーで照射します。' },
    ],
    levelsNote:
      '段階は読み取り値から割り当てられ、ユーザーが選ぶものではありません。最も濃い状態は設定にかかわらずロックされたままです。',
    whyTitle: 'エネルギー段階が5段階ではなく3段階である理由',
    whyBody: [
      'ここでの肌トーン検出は反射測定です。光源が肌を照らし、フォトセンサーがどれだけ光が戻ってくるかを読み取るため、読み取り値は部屋の明るさではなく機器自身の発光素子に依存します。この読み取り値にはメラニンと血液の両方が関わり、返ってくる光の量は皮膚の血流によって変化します。互いに近いエネルギー段階はまたぎやすく、わずかな変動でも読み取り値が境界を越えて誤った段階に入ってしまいます。',
      '照射可能な範囲を3段階より細かく分けても、ユーザーが活かせる精度は増えません。増えるのは、機器が正常な肌を誤って読む境界の数です。3段階であれば間隔が十分に広く、暖かい部屋・運動・感情の状態・アルコールといった日常的な変動が、隣の段階へこぼれず自分の段階にとどまります。',
    ],
    refsTitle: '参考文献',
    refsNote: '肌の分類と肌色の測定方法に関する一次資料、および当社の肌トーン検出の解説記事です。',
    guideLabel: '肌トーン検出の仕組み',
  },
  ko: {
    kicker: '피부 감지',
    heading: 'Lumi 2가 피부를 읽고 그에 맞춰 움직이는 방식',
    intro:
      'Lumi 2는 플래시를 발사할 때마다 피부를 측정하고 그 판독값으로 에너지 단계를 스스로 정합니다. 이를 가능하게 하는 부품은 두 가지입니다. 피부를 읽는 반사형 센서와, 센서의 판단에 곧바로 대응할 수 있도록 커패시터를 빠르게 재충전하는 IGBT 스위치입니다.',
    igbtTitle: 'IGBT 고속 플래시: 커패시터를 항상 준비 상태로',
    igbtBody:
      'IPL 펄스는 커패시터의 방전입니다. 커패시터 뱅크는 다음 펄스 전에 다시 충전되어야 하며, 플래시와 플래시 사이에 에너지 단계를 바꿀 수 있을 만큼 빠르게 충전되어야 합니다. Lumi 2는 이 회로의 주 스위치로 IGBT(절연 게이트 양극성 트랜지스터)를 사용합니다. IGBT는 양극성 트랜지스터의 낮은 도통 손실과 MOSFET의 전압 제어 고속 스위칭을 함께 갖추고 있어 펄스 파워 회로에서 쓰입니다. 실제로는 뱅크가 충전된 상태로 유지되고, 다음 펄스가 즉시 준비되며, 에너지 단계는 세션 내내 고정되지 않고 센서를 따라갈 수 있습니다.',
    levelsTitle: '발사 전 다섯 가지 상태, 그중 셋은 사용 가능',
    levelsIntro: '센서는 다섯 가지 상태를 구분합니다. 그중 둘은 절대 발사하지 않습니다.',
    levelsTableHead: ['센서 상태', 'Lumi 2의 동작'],
    levelRows: [
      { state: '피부에 닿지 않음("공기")', response: '발사하지 않습니다. 창이 피부에 평평하게 닿아야 합니다.' },
      { state: '매우 어두운 피부 — Fitzpatrick VI', response: '발사하지 않습니다. 경고와 함께 잠깁니다.' },
      { state: '시술 가능한 피부 톤 — 1단계', response: '세 에너지 단계 중 가장 낮은 단계로 발사합니다.' },
      { state: '시술 가능한 피부 톤 — 2단계', response: '중간 에너지 단계로 발사합니다.' },
      { state: '시술 가능한 피부 톤 — 3단계', response: '세 단계 중 가장 높은 단계로 발사합니다.' },
    ],
    levelsNote:
      '단계는 판독값으로 정해지며 사용자가 고르는 것이 아닙니다. 가장 어두운 상태는 설정과 무관하게 잠긴 채로 남습니다.',
    whyTitle: '에너지 단계가 다섯이 아니라 셋인 이유',
    whyBody: [
      '여기서 피부 톤 감지는 반사 측정입니다. 광원이 피부를 비추고 포토센서가 되돌아오는 빛의 양을 읽으므로, 판독값은 방 안의 조명이 아니라 기기 자체의 발광부에 달려 있습니다. 이 판독값에는 멜라닌과 혈액이 함께 관여하고, 되돌아오는 빛의 양은 피부 혈류에 따라 달라집니다. 에너지 단계가 서로 가까우면 넘어가기 쉽습니다. 더 작은 변동만으로도 판독값이 경계를 넘어 잘못된 단계로 들어갑니다.',
      '시술 가능 범위를 세 단계보다 잘게 나누어도 사용자가 활용할 수 있는 정밀도는 늘지 않습니다. 늘어나는 것은 기기가 정상적인 피부를 잘못 읽을 수 있는 경계의 수입니다. 세 단계는 간격을 충분히 넓게 유지해, 따뜻한 방·운동·감정 상태·알코올 같은 일상적 변동이 옆 단계로 넘치지 않고 자기 단계에 머물게 합니다.',
    ],
    refsTitle: '참고 문헌',
    refsNote: '피부 분류와 피부색 측정 방법에 관한 1차 자료, 그리고 저희 피부 톤 감지 안내입니다.',
    guideLabel: '피부 톤 감지의 작동 원리',
  },
  nl: {
    kicker: 'Huidmeting',
    heading: 'Hoe Lumi 2 je huid leest — en bijhoudt',
    intro:
      'Lumi 2 meet je huid voor elke flits en stelt op basis van die meting zelf het energieniveau in. Twee onderdelen maken dat mogelijk: een reflectiesensor die de huid leest, en een IGBT-schakelaar die de condensator snel genoeg bijlaadt om op de meting te kunnen reageren.',
    igbtTitle: 'Snel flitsen met IGBT: de condensator blijft klaar',
    igbtBody:
      'Een IPL-puls is een ontlading van een condensator. De condensatorbank moet vóór de volgende puls weer gevuld zijn, en wel snel genoeg om tussen twee flitsen van energieniveau te wisselen. Lumi 2 gebruikt een IGBT (insulated-gate bipolar transistor) als hoofdschakelaar in dat circuit: hij combineert de lage geleidingsverliezen van een bipolaire transistor met het snelle, spanningsgestuurde schakelen van een MOSFET, en daarom gebruiken pulsvermogen-circuits hem. In de praktijk blijft de bank geladen, is de volgende puls direct beschikbaar en kan het energieniveau de sensor volgen in plaats van vast te liggen voor de hele sessie.',
    levelsTitle: 'Vijf toestanden voor een flits, drie bruikbaar',
    levelsIntro: 'De sensor onderscheidt vijf toestanden. Twee daarvan flitsen nooit.',
    levelsTableHead: ['Toestand van de sensor', 'Wat Lumi 2 doet'],
    levelRows: [
      { state: 'Geen huidcontact ("lucht")', response: 'Geen flits. Het venster moet plat op de huid liggen.' },
      { state: 'Zeer donkere huid — Fitzpatrick VI', response: 'Geen flits. Vergrendeld, met melding.' },
      { state: 'Behandelbare huidtint — niveau 1', response: 'Flits op het laagste van de drie energieniveaus.' },
      { state: 'Behandelbare huidtint — niveau 2', response: 'Flits op het middelste energieniveau.' },
      { state: 'Behandelbare huidtint — niveau 3', response: 'Flits op het hoogste van de drie niveaus.' },
    ],
    levelsNote:
      'Het niveau wordt uit de meting toegewezen, niet door de gebruiker gekozen. De donkerste toestand blijft vergrendeld, wat de instelling ook is.',
    whyTitle: 'Waarom drie energieniveaus en niet vijf',
    whyBody: [
      'Huidtintdetectie is hier een reflectiemeting: een lichtbron verlicht de huid en een fotosensor leest hoeveel licht er terugkomt. De meting hangt dus af van de eigen emitter van het apparaat en niet van het licht in de kamer. In die meting zitten zowel melanine als bloed, en de hoeveelheid teruggekaatst licht verschuift met de doorbloeding van de huid. Energiestappen die dicht bij elkaar liggen, worden makkelijker overschreden: een kleinere afwijking is al genoeg om een meting over een grens en in de verkeerde stap te duwen.',
      'Het behandelbare bereik in meer dan drie niveaus opdelen levert geen precisie op waar de gebruiker iets aan heeft. Het levert grenzen op waar het apparaat een normale huid verkeerd kan lezen. Drie niveaus houden de afstanden ruim genoeg dat gewone schommelingen — een warme kamer, inspanning, gemoedstoestand, alcohol — binnen hun eigen stap blijven in plaats van door te lekken naar de volgende.',
    ],
    refsTitle: 'Bronnen',
    refsNote:
      'Primaire bronnen over huidtypering en over het meten van huidkleur, plus onze eigen gids over huidtintdetectie.',
    guideLabel: 'Hoe huidtintdetectie werkt',
  },
  pl: {
    kicker: 'Wykrywanie skóry',
    heading: 'Jak Lumi 2 odczytuje Twoją skórę — i nadąża za nią',
    intro:
      'Lumi 2 mierzy skórę przed każdym błyskiem i sam ustala poziom energii na podstawie tego odczytu. Umożliwiają to dwa elementy: czujnik odbiciowy, który odczytuje skórę, oraz przełącznik IGBT, który doładowuje kondensator wystarczająco szybko, aby urządzenie mogło zadziałać zgodnie z tym, co wykrył czujnik.',
    igbtTitle: 'Szybkie błyskanie z IGBT: kondensator pozostaje gotowy',
    igbtBody:
      'Impuls IPL to rozładowanie kondensatora. Bateria kondensatorów musi zostać napełniona przed kolejnym impulsem — i to na tyle szybko, aby urządzenie mogło zmienić poziom energii między jednym błyskiem a następnym. Lumi 2 używa IGBT (tranzystora bipolarnego z izolowaną bramką) jako głównego przełącznika w tym obwodzie: łączy niskie straty przewodzenia tranzystora bipolarnego z szybkim, sterowanym napięciem przełączaniem MOSFET, dlatego stosują go układy impulsowe dużej mocy. W praktyce bateria pozostaje naładowana, kolejny impuls jest dostępny natychmiast, a poziom energii może podążać za czujnikiem, zamiast być stały przez całą sesję.',
    levelsTitle: 'Pięć stanów przed błyskiem, trzy użyteczne',
    levelsIntro: 'Czujnik rozróżnia pięć stanów. Dwa z nich nigdy nie błysną.',
    levelsTableHead: ['Stan czujnika', 'Co robi Lumi 2'],
    levelRows: [
      { state: 'Brak kontaktu ze skórą („powietrze”)', response: 'Brak błysku. Okienko musi płasko przylegać do skóry.' },
      { state: 'Bardzo ciemna skóra — Fitzpatrick VI', response: 'Brak błysku. Zablokowane, z ostrzeżeniem.' },
      { state: 'Odcień kwalifikujący się do zabiegu — poziom 1', response: 'Błysk na najniższym z trzech poziomów energii.' },
      { state: 'Odcień kwalifikujący się do zabiegu — poziom 2', response: 'Błysk na średnim poziomie energii.' },
      { state: 'Odcień kwalifikujący się do zabiegu — poziom 3', response: 'Błysk na najwyższym z trzech poziomów.' },
    ],
    levelsNote:
      'Poziom jest przypisywany na podstawie odczytu, a nie wybierany przez użytkownika. Najciemniejszy stan pozostaje zablokowany niezależnie od ustawienia.',
    whyTitle: 'Dlaczego trzy poziomy energii, a nie pięć',
    whyBody: [
      'Wykrywanie odcienia skóry jest tu pomiarem odbiciowym: źródło światła oświetla skórę, a fotoczujnik odczytuje, ile światła wraca. Pomiar zależy więc od emitera samego urządzenia, a nie od światła w pomieszczeniu. W tym pomiarze obecna jest i melanina, i krew, a ilość odbitego światła zmienia się wraz z przepływem krwi w skórze. Stopnie energii leżące blisko siebie łatwiej przekroczyć: mniejsze odchylenie wystarczy, by pomiar przesunął się za granicę i trafił do niewłaściwego stopnia.',
      'Podział zakresu kwalifikującego się do zabiegu na więcej niż trzy poziomy nie dodaje dokładności, z której użytkownik mógłby skorzystać. Dodaje granice, na których urządzenie może błędnie odczytać normalną skórę. Trzy poziomy zachowują odstępy dość szerokie, by zwykłe wahania — ciepłe pomieszczenie, wysiłek, stan emocjonalny, alkohol — zostawały w swoim stopniu, zamiast przelewać się do następnego.',
    ],
    refsTitle: 'Źródła',
    refsNote:
      'Źródła podstawowe dotyczące typologii skóry i pomiaru jej koloru oraz nasz własny przewodnik po wykrywaniu odcienia skóry.',
    guideLabel: 'Jak działa wykrywanie odcienia skóry',
  },
  'pt-BR': {
    kicker: 'Sensor de pele',
    heading: 'Como o Lumi 2 lê a sua pele — e acompanha essa leitura',
    intro:
      'O Lumi 2 mede a sua pele antes de cada flash e define sozinho o nível de energia a partir dessa leitura. Dois componentes tornam isso possível: um sensor de reflectância que lê a pele e um interruptor IGBT que recarrega o capacitor rápido o suficiente para o aparelho agir conforme o que o sensor encontrou.',
    igbtTitle: 'Flash rápido com IGBT: o capacitor sempre pronto',
    igbtBody:
      'Um pulso de IPL é a descarga de um capacitor. O banco de capacitores precisa ser recarregado antes do próximo pulso, e rápido o suficiente para o aparelho trocar de nível de energia entre um flash e o seguinte. O Lumi 2 usa um IGBT (transistor bipolar de porta isolada) como interruptor principal desse circuito: ele combina as baixas perdas de condução de um transistor bipolar com a comutação rápida controlada por tensão de um MOSFET, e é por isso que circuitos de potência pulsada o utilizam. Na prática, o banco permanece carregado, o próximo pulso fica disponível na hora, e o nível de energia pode seguir o sensor em vez de ficar fixo durante toda a sessão.',
    levelsTitle: 'Cinco estados antes do flash, três utilizáveis',
    levelsIntro: 'O sensor distingue cinco estados. Dois deles nunca disparam.',
    levelsTableHead: ['Estado do sensor', 'O que o Lumi 2 faz'],
    levelRows: [
      { state: 'Sem contato com a pele ("ar")', response: 'Nenhum flash. A janela precisa ficar plana sobre a pele.' },
      { state: 'Pele muito escura — Fitzpatrick VI', response: 'Nenhum flash. Bloqueado, com aviso.' },
      { state: 'Tom de pele tratável — nível 1', response: 'Flash no mais baixo dos três níveis de energia.' },
      { state: 'Tom de pele tratável — nível 2', response: 'Flash no nível de energia intermediário.' },
      { state: 'Tom de pele tratável — nível 3', response: 'Flash no mais alto dos três níveis.' },
    ],
    levelsNote:
      'O nível é atribuído a partir da leitura, não escolhido pelo usuário. O estado mais escuro permanece bloqueado seja qual for o ajuste.',
    whyTitle: 'Por que três níveis de energia e não cinco',
    whyBody: [
      'A detecção de tom de pele aqui é uma medição de reflectância: uma fonte de luz ilumina a pele e um fotossensor lê quanta luz volta, de modo que a leitura depende do próprio emissor do aparelho e não da luz do ambiente. Melanina e sangue participam dessa leitura, e a quantidade de luz devolvida muda conforme o fluxo sanguíneo na pele. Degraus de energia próximos entre si são ultrapassados com mais facilidade: um desvio menor já basta para levar uma leitura além de um limite e para o degrau errado.',
      'Dividir a faixa tratável em mais de três níveis não acrescenta precisão que o usuário possa aproveitar. Acrescenta limites nos quais o aparelho pode ler mal uma pele normal. Três níveis mantêm as distâncias largas o bastante para que variações comuns — ambiente quente, esforço físico, estado emocional, álcool — fiquem no próprio degrau em vez de vazar para o seguinte.',
    ],
    refsTitle: 'Referências',
    refsNote:
      'Fontes primárias sobre classificação de pele e sobre como a cor da pele é medida, além do nosso próprio guia sobre sensores de tom de pele.',
    guideLabel: 'Como funciona a detecção de tom de pele',
  },
  'pt-PT': {
    kicker: 'Sensor de pele',
    heading: 'Como o Lumi 2 lê a sua pele — e acompanha essa leitura',
    intro:
      'O Lumi 2 mede a sua pele antes de cada flash e define sozinho o nível de energia a partir dessa leitura. Dois componentes tornam isso possível: um sensor de reflectância que lê a pele e um interruptor IGBT que recarrega o condensador com rapidez suficiente para o aparelho agir conforme o que o sensor detetou.',
    igbtTitle: 'Flash rápido com IGBT: o condensador sempre pronto',
    igbtBody:
      'Um impulso de IPL é a descarga de um condensador. O banco de condensadores tem de ser recarregado antes do impulso seguinte, e com rapidez suficiente para o aparelho trocar de nível de energia entre um flash e o seguinte. O Lumi 2 usa um IGBT (transístor bipolar de porta isolada) como interruptor principal desse circuito: combina as baixas perdas de condução de um transístor bipolar com a comutação rápida controlada por tensão de um MOSFET, e é por isso que os circuitos de potência pulsada o utilizam. Na prática, o banco mantém-se carregado, o impulso seguinte fica disponível de imediato, e o nível de energia pode seguir o sensor em vez de ficar fixo durante toda a sessão.',
    levelsTitle: 'Cinco estados antes do flash, três utilizáveis',
    levelsIntro: 'O sensor distingue cinco estados. Dois deles nunca disparam.',
    levelsTableHead: ['Estado do sensor', 'O que o Lumi 2 faz'],
    levelRows: [
      { state: 'Sem contacto com a pele («ar»)', response: 'Nenhum flash. A janela tem de ficar plana sobre a pele.' },
      { state: 'Pele muito escura — Fitzpatrick VI', response: 'Nenhum flash. Bloqueado, com aviso.' },
      { state: 'Tom de pele tratável — nível 1', response: 'Flash no mais baixo dos três níveis de energia.' },
      { state: 'Tom de pele tratável — nível 2', response: 'Flash no nível de energia intermédio.' },
      { state: 'Tom de pele tratável — nível 3', response: 'Flash no mais alto dos três níveis.' },
    ],
    levelsNote:
      'O nível é atribuído a partir da leitura, não é escolhido pelo utilizador. O estado mais escuro permanece bloqueado seja qual for a regulação.',
    whyTitle: 'Porque é que são três níveis de energia e não cinco',
    whyBody: [
      'A deteção de tom de pele é aqui uma medição de reflectância: uma fonte de luz ilumina a pele e um fotossensor lê quanta luz regressa, pelo que a leitura depende do próprio emissor do aparelho e não da luz da sala. Tanto a melanina como o sangue participam nessa leitura, e a quantidade de luz devolvida muda com o fluxo sanguíneo na pele. Degraus de energia próximos uns dos outros são ultrapassados com mais facilidade: um desvio menor basta para levar uma leitura para lá de um limite e para o degrau errado.',
      'Dividir a gama tratável em mais de três níveis não acrescenta precisão que o utilizador possa aproveitar. Acrescenta limites nos quais o aparelho pode ler mal uma pele normal. Três níveis mantêm as distâncias suficientemente largas para que variações comuns — sala quente, esforço físico, estado emocional, álcool — fiquem no próprio degrau em vez de transbordarem para o seguinte.',
    ],
    refsTitle: 'Referências',
    refsNote:
      'Fontes primárias sobre classificação de pele e sobre como a cor da pele é medida, além do nosso próprio guia sobre sensores de tom de pele.',
    guideLabel: 'Como funciona a deteção de tom de pele',
  },
  ro: {
    kicker: 'Detectarea pielii',
    heading: 'Cum citește Lumi 2 pielea ta — și cum ține pasul cu ea',
    intro:
      'Lumi 2 măsoară pielea înainte de fiecare fulger și își stabilește singur nivelul de energie pe baza acelei citiri. Două componente fac asta posibil: un senzor de reflexie care citește pielea și un întrerupător IGBT care încarcă condensatorul suficient de repede încât aparatul să acționeze conform celor măsurate.',
    igbtTitle: 'Fulgerare rapidă cu IGBT: condensatorul rămâne pregătit',
    igbtBody:
      'Un impuls IPL este descărcarea unui condensator. Bateria de condensatoare trebuie reîncărcată înainte de următorul impuls și suficient de repede încât aparatul să poată schimba nivelul de energie între două fulgerări. Lumi 2 folosește un IGBT (tranzistor bipolar cu poartă izolată) ca întrerupător principal în acel circuit: combină pierderile mici de conducție ale unui tranzistor bipolar cu comutarea rapidă comandată în tensiune a unui MOSFET, motiv pentru care circuitele de putere pulsatorie îl folosesc. În practică, bateria rămâne încărcată, următorul impuls este disponibil imediat, iar nivelul de energie poate urma senzorul în loc să rămână fix pe toată ședința.',
    levelsTitle: 'Cinci stări înainte de fulger, trei utilizabile',
    levelsIntro: 'Senzorul distinge cinci stări. Două dintre ele nu fulgeră niciodată.',
    levelsTableHead: ['Starea senzorului', 'Ce face Lumi 2'],
    levelRows: [
      { state: 'Fără contact cu pielea („aer”)', response: 'Fără fulger. Fereastra trebuie să stea plat pe piele.' },
      { state: 'Piele foarte închisă — Fitzpatrick VI', response: 'Fără fulger. Blocat, cu alertă.' },
      { state: 'Ton de piele tratabil — nivelul 1', response: 'Fulger la cel mai scăzut dintre cele trei niveluri de energie.' },
      { state: 'Ton de piele tratabil — nivelul 2', response: 'Fulger la nivelul mediu de energie.' },
      { state: 'Ton de piele tratabil — nivelul 3', response: 'Fulger la cel mai înalt dintre cele trei niveluri.' },
    ],
    levelsNote:
      'Nivelul este atribuit pe baza citirii, nu ales de utilizator. Cea mai închisă stare rămâne blocată indiferent de setare.',
    whyTitle: 'De ce trei niveluri de energie și nu cinci',
    whyBody: [
      'Detectarea tonului pielii este aici o măsurătoare de reflexie: o sursă de lumină iluminează pielea, iar un fotosenzor citește câtă lumină se întoarce, astfel încât citirea depinde de emițătorul aparatului, nu de lumina din cameră. În acea citire intră atât melanina, cât și sângele, iar cantitatea de lumină returnată se modifică odată cu fluxul sanguin din piele. Treptele de energie apropiate sunt depășite mai ușor: o abatere mai mică este suficientă pentru ca o citire să treacă de o limită și să ajungă în treapta greșită.',
      'Împărțirea intervalului tratabil în mai mult de trei niveluri nu adaugă precizie de care utilizatorul să beneficieze. Adaugă limite la care aparatul poate citi greșit o piele normală. Trei niveluri păstrează intervale destul de largi încât variațiile obișnuite — o cameră caldă, efort, stare emoțională, alcool — să rămână în treapta lor în loc să se reverse în cea vecină.',
    ],
    refsTitle: 'Surse',
    refsNote:
      'Surse primare despre tipologia pielii și despre măsurarea culorii pielii, plus ghidul nostru despre detectarea tonului pielii.',
    guideLabel: 'Cum funcționează detectarea tonului pielii',
  },
  ru: {
    kicker: 'Определение кожи',
    heading: 'Как Lumi 2 считывает вашу кожу — и успевает за ней',
    intro:
      'Lumi 2 измеряет кожу перед каждой вспышкой и сам задаёт уровень энергии по этому измерению. Это обеспечивают два компонента: отражательный датчик, который считывает кожу, и ключ IGBT, который достаточно быстро заряжает конденсатор, чтобы устройство успевало реагировать на результат измерения.',
    igbtTitle: 'Быстрые вспышки с IGBT: конденсатор остаётся готовым',
    igbtBody:
      'Импульс IPL — это разряд конденсатора. Батарею конденсаторов нужно зарядить заново до следующего импульса, и достаточно быстро, чтобы устройство успевало менять уровень энергии между вспышками. Lumi 2 использует IGBT (биполярный транзистор с изолированным затвором) как основной ключ в этой цепи: он сочетает низкие потери проводимости биполярного транзистора с быстрым переключением под управлением напряжением, как у MOSFET, поэтому его и применяют в импульсных силовых схемах. На практике батарея остаётся заряженной, следующий импульс готов сразу, а уровень энергии может следовать за датчиком, а не оставаться неизменным на всю процедуру.',
    levelsTitle: 'Пять состояний перед вспышкой, три из них рабочие',
    levelsIntro: 'Датчик различает пять состояний. Два из них никогда не дают вспышку.',
    levelsTableHead: ['Состояние датчика', 'Что делает Lumi 2'],
    levelRows: [
      { state: 'Нет контакта с кожей («воздух»)', response: 'Вспышки нет. Окно должно лежать на коже плоско.' },
      { state: 'Очень тёмная кожа — Fitzpatrick VI', response: 'Вспышки нет. Заблокировано, с предупреждением.' },
      { state: 'Обрабатываемый тон кожи — уровень 1', response: 'Вспышка на самом низком из трёх уровней энергии.' },
      { state: 'Обрабатываемый тон кожи — уровень 2', response: 'Вспышка на среднем уровне энергии.' },
      { state: 'Обрабатываемый тон кожи — уровень 3', response: 'Вспышка на самом высоком из трёх уровней.' },
    ],
    levelsNote:
      'Уровень назначается по измерению, а не выбирается пользователем. Самое тёмное состояние остаётся заблокированным при любой настройке.',
    whyTitle: 'Почему три уровня энергии, а не пять',
    whyBody: [
      'Определение тона кожи здесь — отражательное измерение: источник света освещает кожу, а фотодатчик считывает, сколько света вернулось, поэтому измерение зависит от собственного излучателя устройства, а не от света в комнате. В этом измерении участвуют и меланин, и кровь, а количество отражённого света меняется вместе с кровотоком в коже. Близко расположенные ступени энергии легче перескочить: меньшего отклонения достаточно, чтобы измерение ушло за границу и попало в неверную ступень.',
      'Деление обрабатываемого диапазона более чем на три уровня не добавляет точности, которой пользователь мог бы воспользоваться. Оно добавляет границы, на которых устройство может неверно прочитать нормальную кожу. Три уровня оставляют промежутки достаточно широкими, чтобы обычные колебания — тёплая комната, физическая нагрузка, эмоциональное состояние, алкоголь — оставались внутри своей ступени, а не перетекали в соседнюю.',
    ],
    refsTitle: 'Источники',
    refsNote:
      'Первоисточники по типологии кожи и по измерению её цвета, а также наше собственное руководство по определению тона кожи.',
    guideLabel: 'Как работает определение тона кожи',
  },
  th: {
    kicker: 'การตรวจจับผิว',
    heading: 'Lumi 2 อ่านผิวของคุณอย่างไร — และปรับตามได้อย่างไร',
    intro:
      'Lumi 2 วัดผิวของคุณก่อนทุกครั้งที่ยิงแสง และกำหนดระดับพลังงานเองจากค่าที่อ่านได้ ฮาร์ดแวร์สองชิ้นทำให้เรื่องนี้เป็นไปได้ คือเซ็นเซอร์สะท้อนแสงที่อ่านผิว และสวิตช์ IGBT ที่ชาร์จตัวเก็บประจุกลับคืนเร็วพอให้อุปกรณ์ตอบสนองต่อสิ่งที่เซ็นเซอร์ตรวจพบ',
    igbtTitle: 'การยิงแสงเร็วด้วย IGBT: ทำให้ตัวเก็บประจุพร้อมเสมอ',
    igbtBody:
      'พัลส์ IPL คือการคายประจุของตัวเก็บประจุ แบงก์ตัวเก็บประจุต้องถูกชาร์จกลับก่อนพัลส์ถัดไป และต้องเร็วพอที่อุปกรณ์จะเปลี่ยนระดับพลังงานระหว่างการยิงแสงครั้งหนึ่งกับครั้งถัดไปได้ Lumi 2 ใช้ IGBT (ทรานซิสเตอร์สองขั้วแบบเกตหุ้มฉนวน) เป็นสวิตช์หลักในวงจรนั้น เพราะรวมการสูญเสียขณะนำไฟฟ้าต่ำของทรานซิสเตอร์สองขั้วเข้ากับการสลับที่เร็วและควบคุมด้วยแรงดันของ MOSFET จึงถูกใช้ในวงจรกำลังแบบพัลส์ ในทางปฏิบัติแบงก์ยังคงมีประจุอยู่ พัลส์ถัดไปพร้อมทันที และระดับพลังงานสามารถตามเซ็นเซอร์ได้แทนที่จะตรึงไว้ทั้งเซสชัน',
    levelsTitle: 'ห้าสถานะก่อนยิงแสง ใช้ได้จริงสามสถานะ',
    levelsIntro: 'เซ็นเซอร์แยกได้ห้าสถานะ สองสถานะไม่ยิงแสงเลย',
    levelsTableHead: ['สถานะเซ็นเซอร์', 'สิ่งที่ Lumi 2 ทำ'],
    levelRows: [
      { state: 'ไม่สัมผัสผิว ("อากาศ")', response: 'ไม่ยิงแสง หน้าต่างต้องแนบราบกับผิว' },
      { state: 'ผิวเข้มมาก — Fitzpatrick VI', response: 'ไม่ยิงแสง ถูกล็อก พร้อมแจ้งเตือน' },
      { state: 'โทนผิวที่รักษาได้ — ระดับ 1', response: 'ยิงแสงที่ระดับพลังงานต่ำสุดในสามระดับ' },
      { state: 'โทนผิวที่รักษาได้ — ระดับ 2', response: 'ยิงแสงที่ระดับพลังงานกลาง' },
      { state: 'โทนผิวที่รักษาได้ — ระดับ 3', response: 'ยิงแสงที่ระดับสูงสุดในสามระดับ' },
    ],
    levelsNote:
      'ระดับถูกกำหนดจากค่าที่อ่านได้ ไม่ใช่จากการเลือกของผู้ใช้ สถานะที่เข้มที่สุดจะถูกล็อกไว้ไม่ว่าจะตั้งค่าใด',
    whyTitle: 'ทำไมมีสามระดับพลังงาน ไม่ใช่ห้า',
    whyBody: [
      'การตรวจจับโทนผิวในที่นี้เป็นการวัดการสะท้อน แหล่งกำเนิดแสงส่องลงบนผิวและโฟโตเซ็นเซอร์อ่านว่ามีแสงสะท้อนกลับมาเท่าใด ค่าที่อ่านได้จึงขึ้นอยู่กับตัวส่งแสงของอุปกรณ์เอง ไม่ใช่แสงในห้อง ทั้งเมลานินและเลือดมีส่วนในค่านี้ และปริมาณแสงที่สะท้อนกลับเปลี่ยนไปตามการไหลเวียนของเลือดในผิว ระดับพลังงานที่ห่างกันน้อยเกินไปนั้นข้ามได้ง่ายกว่า ค่าเบี่ยงเบนที่น้อยกว่าก็เพียงพอที่จะทำให้ค่าที่อ่านได้ข้ามเส้นแบ่งและตกไปอยู่ผิดระดับ',
      'การแบ่งช่วงที่รักษาได้ออกเป็นมากกว่าสามระดับไม่ได้เพิ่มความละเอียดที่ผู้ใช้จะนำไปใช้ประโยชน์ได้จริง สิ่งที่เพิ่มมาคือเส้นแบ่งที่อุปกรณ์อาจอ่านผิวปกติผิดพลาด สามระดับทำให้ช่องห่างกว้างพอที่ความแปรผันตามปกติ — ห้องที่อบอุ่น ออกกำลังกาย ภาวะอารมณ์ แอลกอฮอล์ — จะอยู่ในระดับเดิมแทนที่จะล้นไปยังระดับถัดไป',
    ],
    refsTitle: 'เอกสารอ้างอิง',
    refsNote: 'แหล่งข้อมูลprimary เกี่ยวกับการจำแนกประเภทผิวและวิธีวัดสีผิว พร้อมคู่มือของเราเรื่องการตรวจจับโทนผิว',
    guideLabel: 'การตรวจจับโทนผิวทำงานอย่างไร',
  },
  tr: {
    kicker: 'Cilt algılama',
    heading: 'Lumi 2 cildinizi nasıl okur — ve ona nasıl ayak uydurur',
    intro:
      'Lumi 2 her flaştan önce cildinizi ölçer ve enerji seviyesini bu ölçüme göre kendi belirler. Bunu iki bileşen mümkün kılar: cildi okuyan bir yansıma sensörü ve sensörün bulduğuna göre cihazın hareket edebilmesi için kondansatörü yeterince hızlı dolduran bir IGBT anahtarı.',
    igbtTitle: 'IGBT ile hızlı flaş: kondansatör hazır kalır',
    igbtBody:
      'Bir IPL darbesi kondansatör deşarjıdır. Kondansatör bankı bir sonraki darbeden önce yeniden doldurulmalıdır ve bu, cihazın bir flaştan diğerine enerji seviyesini değiştirebilmesi için yeterince hızlı olmalıdır. Lumi 2 bu devrede ana anahtar olarak bir IGBT (yalıtılmış kapılı bipolar transistör) kullanır: bipolar transistörün düşük iletim kayıplarını MOSFET’in gerilimle denetlenen hızlı anahtarlamasıyla birleştirir; darbeli güç devrelerinin bunu kullanmasının nedeni budur. Pratikte bank dolu kalır, sonraki darbe hemen hazır olur ve enerji seviyesi tüm seans boyunca sabit kalmak yerine sensörü izleyebilir.',
    levelsTitle: 'Flaştan önce beş durum, üçü kullanılabilir',
    levelsIntro: 'Sensör beş durumu ayırt eder. İkisi hiç flaş atmaz.',
    levelsTableHead: ['Sensör durumu', 'Lumi 2 ne yapar'],
    levelRows: [
      { state: 'Ciltle temas yok ("hava")', response: 'Flaş yok. Pencere cilde düz biçimde oturmalıdır.' },
      { state: 'Çok koyu cilt — Fitzpatrick VI', response: 'Flaş yok. Kilitli, uyarıyla birlikte.' },
      { state: 'İşlem yapılabilir cilt tonu — seviye 1', response: 'Üç enerji seviyesinin en düşüğünde flaş.' },
      { state: 'İşlem yapılabilir cilt tonu — seviye 2', response: 'Orta enerji seviyesinde flaş.' },
      { state: 'İşlem yapılabilir cilt tonu — seviye 3', response: 'Üç seviyenin en yükseğinde flaş.' },
    ],
    levelsNote:
      'Seviye ölçüme göre atanır, kullanıcı tarafından seçilmez. En koyu durum ayardan bağımsız olarak kilitli kalır.',
    whyTitle: 'Neden beş değil üç enerji seviyesi',
    whyBody: [
      'Buradaki cilt tonu algılama bir yansıma ölçümüdür: bir ışık kaynağı cildi aydınlatır ve fotosensör geri dönen ışık miktarını okur; yani ölçüm odadaki ışığa değil cihazın kendi vericisine bağlıdır. Bu ölçümde hem melanin hem kan yer alır ve geri dönen ışık miktarı ciltteki kan akışıyla birlikte değişir. Birbirine yakın enerji kademeleri daha kolay aşılır: daha küçük bir sapma, ölçümün bir sınırı geçip yanlış kademeye düşmesine yeter.',
      'İşlem yapılabilir aralığı üçten fazla seviyeye bölmek, kullanıcının yararlanabileceği bir hassasiyet eklemez. Cihazın normal bir cildi yanlış okuyabileceği sınır sayısını ekler. Üç seviye, aralıkları yeterince geniş tutar; sıcak bir oda, efor, duygusal durum veya alkol gibi olağan değişimler komşu kademeye taşmak yerine kendi kademesinde kalır.',
    ],
    refsTitle: 'Kaynaklar',
    refsNote:
      'Cilt sınıflandırması ve cilt renginin ölçümü üzerine birincil kaynaklar ile kendi cilt tonu algılama rehberimiz.',
    guideLabel: 'Cilt tonu algılama nasıl çalışır',
  },
  vi: {
    kicker: 'Cảm biến da',
    heading: 'Cách Lumi 2 đọc làn da của bạn — và bám theo nó',
    intro:
      'Lumi 2 đo da trước mỗi lần phát xung và tự đặt mức năng lượng từ kết quả đo đó. Hai linh kiện làm được điều này: cảm biến phản xạ đọc da, và công tắc IGBT nạp lại tụ điện đủ nhanh để thiết bị hành động theo những gì cảm biến phát hiện.',
    igbtTitle: 'Phát xung nhanh bằng IGBT: tụ điện luôn sẵn sàng',
    igbtBody:
      'Một xung IPL là sự phóng điện của tụ điện. Bộ tụ phải được nạp lại trước xung kế tiếp, và nạp đủ nhanh để thiết bị đổi được mức năng lượng giữa hai lần phát xung. Lumi 2 dùng IGBT (transistor lưỡng cực có cổng cách ly) làm công tắc chính trong mạch đó: nó kết hợp tổn hao dẫn điện thấp của transistor lưỡng cực với khả năng đóng cắt nhanh điều khiển bằng điện áp của MOSFET, vì vậy các mạch công suất xung dùng nó. Trên thực tế bộ tụ luôn được nạp, xung kế tiếp sẵn sàng ngay, và mức năng lượng có thể bám theo cảm biến thay vì cố định suốt buổi.',
    levelsTitle: 'Năm trạng thái trước khi phát xung, ba trạng thái dùng được',
    levelsIntro: 'Cảm biến phân biệt năm trạng thái. Hai trong số đó không bao giờ phát xung.',
    levelsTableHead: ['Trạng thái cảm biến', 'Lumi 2 làm gì'],
    levelRows: [
      { state: 'Không tiếp xúc với da ("không khí")', response: 'Không phát xung. Cửa sổ phải áp phẳng lên da.' },
      { state: 'Da rất sẫm — Fitzpatrick VI', response: 'Không phát xung. Bị khóa, kèm cảnh báo.' },
      { state: 'Tông da có thể xử lý — mức 1', response: 'Phát xung ở mức năng lượng thấp nhất trong ba mức.' },
      { state: 'Tông da có thể xử lý — mức 2', response: 'Phát xung ở mức năng lượng trung bình.' },
      { state: 'Tông da có thể xử lý — mức 3', response: 'Phát xung ở mức cao nhất trong ba mức.' },
    ],
    levelsNote:
      'Mức được gán từ kết quả đo, không do người dùng chọn. Trạng thái sẫm nhất vẫn bị khóa bất kể cài đặt nào.',
    whyTitle: 'Vì sao là ba mức năng lượng, không phải năm',
    whyBody: [
      'Cảm biến tông màu da ở đây là phép đo phản xạ: một nguồn sáng chiếu vào da và cảm biến quang đọc lượng ánh sáng phản hồi, nên kết quả đo phụ thuộc vào bộ phát của chính thiết bị chứ không phải ánh sáng trong phòng. Cả melanin lẫn máu đều tham gia vào kết quả đo này, và lượng ánh sáng phản hồi thay đổi theo lưu lượng máu ở da. Các mức năng lượng nằm sát nhau thì dễ bị vượt qua hơn: chỉ cần một sai lệch nhỏ hơn là đủ để kết quả đo vượt qua ranh giới và rơi vào mức sai.',
      'Chia dải có thể xử lý thành nhiều hơn ba mức không thêm độ chính xác mà người dùng tận dụng được. Nó thêm những ranh giới mà ở đó thiết bị có thể đọc sai một làn da bình thường. Ba mức giữ khoảng cách đủ rộng để những dao động thường gặp — phòng ấm, vận động, trạng thái cảm xúc, rượu bia — nằm trong mức của mình thay vì tràn sang mức bên cạnh.',
    ],
    refsTitle: 'Tài liệu tham khảo',
    refsNote:
      'Các nguồn gốc về phân loại da và cách đo màu da, cùng hướng dẫn của chúng tôi về cảm biến tông màu da.',
    guideLabel: 'Cách hoạt động của cảm biến tông màu da',
  },
};

export const LUMI2_SENSING_DETAIL: Record<string, Lumi2SensingDetail> = {
  en: {
    mechanismTitle: 'How the sensor reads your skin',
    mechanismBody:
      'The sensing head pairs a photosensor chip with a composite light source. The emitter does not run all the time: it starts once the device confirms contact with the skin. The light travels down a light guide to the skin and part of it comes back. Different skin tones send different amounts of energy back, and the photosensor chip decides the tone from the energy it receives. That decision sets the flash energy — each skin tone is allocated its own level.',
    baselineTitle: 'What the industry treats as the baseline',
    baselineBody:
      'Skin tone recognition today works to a common baseline: no contact (air), black, and three to five skin tone levels. How a given tone is translated into flash energy is not standardised — every manufacturer sets that mapping from its own experience and design requirements, which is why two devices can behave differently on the same skin.',
    baselinePoints: [
      'No contact (air) and black: no flash — no energy is allocated at all.',
      'Three to five skin tone levels: each one is allocated its own flash energy.',
      'The tone-to-energy mapping is set per manufacturer, from experience and design limits.',
    ],
    stabilityNote:
      'Skin tone recognition is not about how many levels you split the range into. It is about how stable the reading is — a sensor that holds its decision is worth more than one that offers more steps.',
  },
  ar: {
    mechanismTitle: 'كيف يقرأ المستشعر بشرتك',
    mechanismBody:
      'تجمع رأس الاستشعار بين شريحة استشعار ضوئي ومصدر ضوء مركّب. لا يعمل الباعث طوال الوقت: يبدأ بعد أن يتأكد الجهاز من ملامسة البشرة. ينتقل الضوء عبر دليل ضوئي إلى البشرة ويعود جزء منه. وألوان البشرة المختلفة تُعيد كميات مختلفة من الطاقة، وتحدّد شريحة الاستشعار اللون من الطاقة الواصلة إليها. وهذا القرار يحدّد طاقة الوميض — لكل لون بشرة مستواه الخاص.',
    baselineTitle: 'ما تعتبره الصناعة حدًا أدنى أساسيًا',
    baselineBody:
      'يعمل استشعار لون البشرة اليوم وفق حد أساسي مشترك: عدم التلامس (الهواء)، والأسود، وثلاث إلى خمس درجات لألوان البشرة. أما كيفية ترجمة اللون إلى طاقة وميض فليست موحّدة — كل شركة تضع هذا الربط وفق خبرتها ومتطلبات تصميمها، ولهذا قد يتصرف جهازان بشكل مختلف على البشرة نفسها.',
    baselinePoints: [
      'عدم التلامس (الهواء) والأسود: لا وميض — لا تُخصص أي طاقة.',
      'ثلاث إلى خمس درجات لألوان البشرة: كل درجة تُخصص لها طاقة وميض خاصة.',
      'ربط اللون بالطاقة تحدّده كل شركة وفق خبرتها وحدود تصميمها.',
    ],
    stabilityNote:
      'استشعار لون البشرة ليس مسألة عدد الدرجات التي تقسّم إليها المدى، بل مدى استقرار القراءة — فمستشعر يثبت على قراره أنفع من مستشعر يعرض خطوات أكثر.',
  },
  cs: {
    mechanismTitle: 'Jak senzor čte vaši pleť',
    mechanismBody:
      'Snímací hlava spojuje čip fotosenzoru s kompozitním světelným zdrojem. Zářič neběží pořád: spustí se, jakmile zařízení potvrdí kontakt s pletí. Světlo prochází světlovodem na pleť a část se ho vrací. Různé tóny pleti vracejí různé množství energie a čip fotosenzoru z přijaté energie určí tón. To rozhodne o energii záblesku — každý tón pleti má přiřazenou vlastní úroveň.',
    baselineTitle: 'Co průmysl považuje za základní minimum',
    baselineBody:
      'Snímání tónu pleti dnes pracuje se společným základem: bez kontaktu (vzduch), černá a tři až pět úrovní tónu pleti. Jak se daný tón převádí na energii záblesku, sjednoceno není — mapování si každý výrobce nastavuje podle svých zkušeností a konstrukčních požadavků, a proto se dva přístroje mohou na stejné pleti chovat odlišně.',
    baselinePoints: [
      'Bez kontaktu (vzduch) a černá: žádný záblesk — energie se nepřiřazuje vůbec.',
      'Tři až pět úrovní tónu pleti: každé je přiřazena vlastní energie záblesku.',
      'Mapování tónu na energii si určuje každý výrobce podle zkušeností a konstrukčních limitů.',
    ],
    stabilityNote:
      'U snímání tónu pleti nejde o to, na kolik úrovní rozsah rozdělíte, ale o to, jak stabilní je měření — senzor, který si stojí za svým rozhodnutím, má větší cenu než senzor s více stupni.',
  },
  de: {
    mechanismTitle: 'Wie der Sensor Ihre Haut liest',
    mechanismBody:
      'Der Sensorkopf verbindet einen Fotosensor-Chip mit einer zusammengesetzten Lichtquelle. Der Emitter läuft nicht ständig: Er startet, sobald das Gerät Hautkontakt bestätigt. Das Licht läuft über einen Lichtleiter zur Haut, ein Teil kommt zurück. Verschiedene Hauttöne senden unterschiedlich viel Energie zurück, und der Fotosensor-Chip bestimmt den Ton aus der empfangenen Energie. Diese Entscheidung legt die Blitzenergie fest — jeder Hautton bekommt seine eigene Stufe.',
    baselineTitle: 'Was die Branche als Grundstandard ansieht',
    baselineBody:
      'Die Hauttonerkennung arbeitet heute mit einem gemeinsamen Grundstandard: kein Kontakt (Luft), Schwarz und drei bis fünf Hauttonstufen. Wie ein Ton in Blitzenergie übersetzt wird, ist nicht genormt — diese Zuordnung legt jeder Hersteller nach eigener Erfahrung und Konstruktionsvorgabe fest, weshalb sich zwei Geräte bei gleicher Haut unterschiedlich verhalten können.',
    baselinePoints: [
      'Kein Kontakt (Luft) und Schwarz: kein Blitz — es wird überhaupt keine Energie zugeteilt.',
      'Drei bis fünf Hauttonstufen: jeder wird eine eigene Blitzenergie zugeteilt.',
      'Die Zuordnung Ton → Energie legt jeder Hersteller nach Erfahrung und Konstruktionsgrenzen fest.',
    ],
    stabilityNote:
      'Bei der Hauttonerkennung geht es nicht darum, in wie viele Stufen man den Bereich teilt, sondern darum, wie stabil die Messung ist — ein Sensor, der bei seiner Entscheidung bleibt, ist mehr wert als einer mit mehr Stufen.',
  },
  el: {
    mechanismTitle: 'Πώς ο αισθητήρας διαβάζει το δέρμα σας',
    mechanismBody:
      'Η κεφαλή ανίχνευσης συνδυάζει ένα τσιπ φωτοαισθητήρα με μια σύνθετη πηγή φωτός. Ο πομπός δεν λειτουργεί συνεχώς: ξεκινά μόλις η συσκευή επιβεβαιώσει επαφή με το δέρμα. Το φως διανύει έναν οδηγό φωτός προς το δέρμα και μέρος του επιστρέφει. Διαφορετικοί τόνοι δέρματος επιστρέφουν διαφορετικά ποσά ενέργειας, και το τσιπ φωτοαισθητήρα κρίνει τον τόνο από την ενέργεια που δέχεται. Η κρίση αυτή ορίζει την ενέργεια της λάμψης — κάθε τόνος δέρματος παίρνει το δικό του επίπεδο.',
    baselineTitle: 'Τι θεωρεί η βιομηχανία ως βασική απαίτηση',
    baselineBody:
      'Η ανίχνευση τόνου δέρματος σήμερα δουλεύει με μια κοινή βάση: χωρίς επαφή (αέρας), μαύρο, και τρία έως πέντε επίπεδα τόνου δέρματος. Το πώς μεταφράζεται ένας τόνος σε ενέργεια λάμψης δεν είναι τυποποιημένο — κάθε κατασκευαστής ορίζει αυτή την αντιστοίχιση με βάση την εμπειρία και τις απαιτήσεις σχεδιασμού του, γι’ αυτό δύο συσκευές μπορούν να συμπεριφέρονται διαφορετικά στο ίδιο δέρμα.',
    baselinePoints: [
      'Χωρίς επαφή (αέρας) και μαύρο: καμία λάμψη — δεν διατίθεται καθόλου ενέργεια.',
      'Τρία έως πέντε επίπεδα τόνου δέρματος: καθένα παίρνει τη δική του ενέργεια λάμψης.',
      'Την αντιστοίχιση τόνου → ενέργειας την ορίζει κάθε κατασκευαστής, από εμπειρία και σχεδιαστικά όρια.',
    ],
    stabilityNote:
      'Στην ανίχνευση τόνου δέρματος δεν μετρά σε πόσα επίπεδα κόβεις το εύρος, αλλά πόσο σταθερή είναι η μέτρηση — ένας αισθητήρας που μένει στην απόφασή του αξίζει περισσότερο από έναν με περισσότερα σκαλοπάτια.',
  },
  es: {
    mechanismTitle: 'Cómo el sensor lee tu piel',
    mechanismBody:
      'El cabezal de detección combina un chip fotosensor con una fuente de luz compuesta. El emisor no está encendido todo el tiempo: arranca cuando el dispositivo confirma el contacto con la piel. La luz recorre una guía de luz hasta la piel y parte vuelve. Distintos tonos de piel devuelven distintas cantidades de energía, y el chip fotosensor decide el tono a partir de la energía que recibe. Esa decisión fija la energía del destello: cada tono de piel recibe su propio nivel.',
    baselineTitle: 'Qué considera la industria como mínimo básico',
    baselineBody:
      'La detección del tono de piel trabaja hoy con una base común: sin contacto (aire), negro y entre tres y cinco niveles de tono. Cómo se traduce un tono en energía de destello no está normalizado: cada fabricante fija esa correspondencia según su experiencia y sus requisitos de diseño, y por eso dos dispositivos pueden comportarse distinto en la misma piel.',
    baselinePoints: [
      'Sin contacto (aire) y negro: sin destello — no se asigna energía alguna.',
      'Entre tres y cinco niveles de tono: cada uno recibe su propia energía de destello.',
      'La correspondencia tono → energía la fija cada fabricante, según experiencia y límites de diseño.',
    ],
    stabilityNote:
      'En el tono de piel no importa en cuántos niveles dividas el rango, sino lo estable que sea la lectura: un sensor que sostiene su decisión vale más que uno con más escalones.',
  },
  fa: {
    mechanismTitle: 'حسگر چگونه پوست شما را می‌خواند',
    mechanismBody:
      'سرِ حسگر یک تراشه حسگر نوری را با یک منبع نور ترکیبی همراه می‌کند. تابنده همیشه روشن نیست: وقتی دستگاه تماس با پوست را تأیید کند آغاز به کار می‌کند. نور از یک راهنمای نور به پوست می‌رسد و بخشی از آن بازمی‌گردد. رنگ‌های مختلف پوست مقدارهای متفاوتی انرژی بازمی‌گردانند و تراشه حسگر نوری از انرژی دریافتی، رنگ را تعیین می‌کند. همین تصمیم انرژی فلاش را مشخص می‌کند — هر رنگ پوست سطح خودش را می‌گیرد.',
    baselineTitle: 'آنچه صنعت به‌عنوان حد پایه در نظر می‌گیرد',
    baselineBody:
      'حسگری رنگ پوست امروز بر یک پایه مشترک کار می‌کند: بدون تماس (هوا)، مشکی، و سه تا پنج سطح رنگ پوست. اما اینکه هر رنگ به چه انرژی فلاشی ترجمه شود استاندارد نیست — هر سازنده این نگاشت را بر پایه تجربه و الزامات طراحی خود تعیین می‌کند، و به همین دلیل دو دستگاه می‌توانند روی یک پوست رفتار متفاوتی داشته باشند.',
    baselinePoints: [
      'بدون تماس (هوا) و مشکی: بدون فلاش — هیچ انرژی تخصیص نمی‌یابد.',
      'سه تا پنج سطح رنگ پوست: به هر سطح انرژی فلاش خودش تخصیص می‌یابد.',
      'نگاشت رنگ به انرژی را هر سازنده بر پایه تجربه و محدودیت‌های طراحی تعیین می‌کند.',
    ],
    stabilityNote:
      'در حسگری رنگ پوست، مهم این نیست که بازه را به چند سطح تقسیم کنید؛ مهم این است که خوانش چقدر پایدار باشد — حسگری که بر تصمیم خود می‌ماند از حسگری با پله‌های بیشتر ارزشمندتر است.',
  },
  fr: {
    mechanismTitle: 'Comment le capteur lit votre peau',
    mechanismBody:
      'La tête de détection associe une puce photodétecteur à une source lumineuse composite. L’émetteur ne fonctionne pas en continu : il démarre dès que l’appareil confirme le contact avec la peau. La lumière passe par un guide de lumière jusqu’à la peau, et une partie revient. Des teints différents renvoient des quantités d’énergie différentes, et la puce photodétecteur détermine le teint à partir de l’énergie reçue. Cette décision fixe l’énergie du flash : chaque teint reçoit son propre niveau.',
    baselineTitle: 'Ce que l’industrie considère comme le minimum de base',
    baselineBody:
      'La détection du teint fonctionne aujourd’hui sur une base commune : absence de contact (air), noir, et trois à cinq niveaux de teint. La façon de traduire un teint en énergie de flash n’est pas normalisée — chaque fabricant fixe cette correspondance selon son expérience et ses contraintes de conception, ce qui explique que deux appareils puissent réagir différemment sur la même peau.',
    baselinePoints: [
      'Absence de contact (air) et noir : pas de flash — aucune énergie n’est attribuée.',
      'Trois à cinq niveaux de teint : chacun reçoit sa propre énergie de flash.',
      'La correspondance teint → énergie est propre à chaque fabricant, selon son expérience et ses limites de conception.',
    ],
    stabilityNote:
      'En détection du teint, l’important n’est pas le nombre de niveaux dans lequel on découpe la plage, mais la stabilité de la mesure : un capteur qui tient sa décision vaut mieux qu’un capteur qui offre plus de paliers.',
  },
  he: {
    mechanismTitle: 'איך החיישן קורא את העור שלך',
    mechanismBody:
      'ראש החישה משלב שבב חיישן אופטי עם מקור אור מורכב. הפולט אינו פועל כל הזמן: הוא מתחיל לאחר שהמכשיר מאשר מגע עם העור. האור עובר במוביל אור אל העור וחלקו חוזר. גווני עור שונים מחזירים כמויות אנרגיה שונות, ושבב החיישן האופטי קובע את הגוון לפי האנרגיה שמתקבלת. ההחלטה הזו קובעת את אנרגיית ההבזק — לכל גוון עור מוקצית הרמה שלו.',
    baselineTitle: 'מה שהתעשייה מחשיבה כבסיס מינימלי',
    baselineBody:
      'חישת גוון עור עובדת היום לפי בסיס משותף: בלי מגע (אוויר), שחור, ושלוש עד חמש רמות גוון עור. הדרך שבה גוון מתורגם לאנרגיית הבזק אינה מתוקננת — כל יצרן קובע את המיפוי הזה לפי הניסיון ודרישות התכנון שלו, ולכן שני מכשירים יכולים להתנהג אחרת על אותו עור.',
    baselinePoints: [
      'בלי מגע (אוויר) ושחור: אין הבזק — לא מוקצית אנרגיה כלל.',
      'שלוש עד חמש רמות גוון עור: לכל אחת מוקצית אנרגיית הבזק משלה.',
      'מיפוי הגוון לאנרגיה נקבע על ידי כל יצרן, לפי ניסיון ומגבלות תכנון.',
    ],
    stabilityNote:
      'בחישת גוון עור לא החשוב הוא לכמה רמות מחלקים את הטווח, אלא עד כמה המדידה יציבה — חיישן שעומד בהחלטתו שווה יותר מחיישן עם יותר מדרגות.',
  },
  id: {
    mechanismTitle: 'Cara sensor membaca kulit Anda',
    mechanismBody:
      'Kepala sensor memadukan cip fotosensor dengan sumber cahaya gabungan. Pemancarnya tidak menyala terus-menerus: ia mulai setelah perangkat memastikan ada kontak dengan kulit. Cahaya melewati pemandu cahaya ke kulit dan sebagian kembali. Warna kulit yang berbeda mengembalikan jumlah energi yang berbeda, dan cip fotosensor menentukan warna kulit dari energi yang diterimanya. Keputusan itu menetapkan energi kilatan — setiap warna kulit mendapat tingkatnya sendiri.',
    baselineTitle: 'Apa yang dianggap industri sebagai dasar minimal',
    baselineBody:
      'Penginderaan warna kulit hari ini bekerja pada dasar yang sama: tanpa kontak (udara), hitam, dan tiga sampai lima tingkat warna kulit. Bagaimana suatu warna diterjemahkan menjadi energi kilatan tidak distandarkan — setiap produsen menetapkan pemetaan itu dari pengalaman dan persyaratan desainnya sendiri, dan karena itu dua perangkat bisa berperilaku berbeda pada kulit yang sama.',
    baselinePoints: [
      'Tanpa kontak (udara) dan hitam: tidak menyala — tidak ada energi yang dialokasikan.',
      'Tiga sampai lima tingkat warna kulit: masing-masing mendapat energi kilatan sendiri.',
      'Pemetaan warna ke energi ditetapkan tiap produsen, dari pengalaman dan batas desainnya.',
    ],
    stabilityNote:
      'Pada penginderaan warna kulit, yang penting bukan seberapa banyak tingkat pembagian rentangnya, melainkan seberapa stabil pembacaannya — sensor yang teguh pada keputusannya lebih bernilai daripada sensor dengan lebih banyak tingkat.',
  },
  it: {
    mechanismTitle: 'Come il sensore legge la tua pelle',
    mechanismBody:
      'La testina di rilevamento unisce un chip fotosensore a una sorgente luminosa composita. L’emettitore non resta sempre acceso: parte quando il dispositivo conferma il contatto con la pelle. La luce percorre una guida di luce fino alla pelle e una parte torna indietro. Tonalità diverse restituiscono quantità di energia diverse, e il chip fotosensore stabilisce il tono dall’energia che riceve. Questa decisione fissa l’energia del flash: ogni tonalità riceve il proprio livello.',
    baselineTitle: 'Cosa l’industria considera il minimo di base',
    baselineBody:
      'Il rilevamento del tono cutaneo oggi lavora su una base comune: assenza di contatto (aria), nero e da tre a cinque livelli di tonalità. Come un tono venga tradotto in energia di flash non è standardizzato — ogni produttore fissa quella corrispondenza in base alla propria esperienza e ai requisiti di progetto, ed è per questo che due dispositivi possono comportarsi diversamente sulla stessa pelle.',
    baselinePoints: [
      'Assenza di contatto (aria) e nero: nessun flash — non viene assegnata alcuna energia.',
      'Da tre a cinque livelli di tonalità: a ciascuno è assegnata la propria energia di flash.',
      'La corrispondenza tono → energia è stabilita da ogni produttore, per esperienza e limiti di progetto.',
    ],
    stabilityNote:
      'Nel rilevamento del tono cutaneo non conta in quanti livelli si divide l’intervallo, ma quanto è stabile la misura: un sensore che resta fermo sulla sua decisione vale più di uno con più gradini.',
  },
  ja: {
    mechanismTitle: 'センサーが肌を読み取る仕組み',
    mechanismBody:
      'センサーヘッドはフォトセンサー素子と複合光源を組み合わせています。発光部は常時点灯ではなく、機器が肌への接触を確認してから発光を開始します。光は導光柱を通って肌に届き、その一部が戻ってきます。肌トーンによって戻る光のエネルギー量が異なり、フォトセンサー素子が受け取ったエネルギーから肌トーンを判定します。この判定がフラッシュエネルギーを決め、肌トーンごとにそれぞれのレベルが割り当てられます。',
    baselineTitle: '業界が基本要件としているもの',
    baselineBody:
      '現在の肌トーン認識は共通の基本線で動いています。接触なし（空気）、黒、そして肌トーン3〜5段階です。ただし、あるトーンをどれだけのフラッシュエネルギーに変換するかは標準化されていません。各メーカーが自社の経験値と設計要件に基づいて対応表を決めるため、同じ肌でも機器によって挙動が異なることがあります。',
    baselinePoints: [
      '接触なし（空気）と黒：照射しません — エネルギーは一切割り当てられません。',
      '肌トーン3〜5段階：それぞれに固有のフラッシュエネルギーが割り当てられます。',
      'トーンとエネルギーの対応はメーカーごとに、経験値と設計上の制約から決められます。',
    ],
    stabilityNote:
      '肌トーン認識で重要なのは、範囲を何段階に分けるかではなく、読み取りがどれだけ安定しているかです。判断がぶれないセンサーは、段階が多いだけのセンサーより価値があります。',
  },
  ko: {
    mechanismTitle: '센서가 피부를 읽는 방식',
    mechanismBody:
      '센서 헤드는 포토센서 칩과 복합 광원을 함께 사용합니다. 발광부는 항상 켜져 있지 않고, 기기가 피부 접촉을 확인한 뒤에 발광을 시작합니다. 빛은 도광주를 지나 피부에 닿고 일부가 되돌아옵니다. 피부 톤마다 되돌아오는 에너지의 양이 다르고, 포토센서 칩은 받은 에너지로 피부 톤을 판정합니다. 이 판정이 플래시 에너지를 정하며, 피부 톤마다 각자의 단계가 배정됩니다.',
    baselineTitle: '업계가 기본 요건으로 보는 것',
    baselineBody:
      '오늘날 피부 톤 인식은 공통된 기본선 위에서 동작합니다. 접촉 없음(공기), 검정, 그리고 피부 톤 3~5단계입니다. 다만 어떤 톤을 얼마의 플래시 에너지로 옮기는지는 표준화되어 있지 않습니다. 각 제조사가 자체 경험치와 설계 요건으로 대응표를 정하기 때문에, 같은 피부에서도 기기마다 다르게 동작할 수 있습니다.',
    baselinePoints: [
      '접촉 없음(공기)과 검정: 발사하지 않습니다 — 에너지가 전혀 배정되지 않습니다.',
      '피부 톤 3~5단계: 각 단계에 고유한 플래시 에너지가 배정됩니다.',
      '톤과 에너지의 대응은 제조사마다 경험치와 설계 한계로 정합니다.',
    ],
    stabilityNote:
      '피부 톤 인식에서 중요한 것은 범위를 몇 단계로 나누는지가 아니라 판독이 얼마나 안정적인지입니다. 판단이 흔들리지 않는 센서가 단계만 많은 센서보다 값어치가 있습니다.',
  },
  nl: {
    mechanismTitle: 'Hoe de sensor je huid leest',
    mechanismBody:
      'De sensorkop combineert een fotosensorchip met een samengestelde lichtbron. De zender brandt niet continu: hij start zodra het apparaat huidcontact bevestigt. Het licht gaat via een lichtgeleider naar de huid en een deel komt terug. Verschillende huidtinten sturen verschillende hoeveelheden energie terug, en de fotosensorchip bepaalt de tint uit de energie die hij ontvangt. Die beslissing bepaalt de flitsenergie — elke huidtint krijgt zijn eigen niveau.',
    baselineTitle: 'Wat de branche als basisminimum beschouwt',
    baselineBody:
      'Huidtintdetectie werkt vandaag op een gemeenschappelijke basis: geen contact (lucht), zwart en drie tot vijf huidtintniveaus. Hoe een tint naar flitsenergie wordt vertaald, is niet gestandaardiseerd — elke fabrikant stelt die koppeling op basis van eigen ervaring en ontwerpeisen vast, waardoor twee apparaten zich op dezelfde huid anders kunnen gedragen.',
    baselinePoints: [
      'Geen contact (lucht) en zwart: geen flits — er wordt helemaal geen energie toegewezen.',
      'Drie tot vijf huidtintniveaus: elk krijgt zijn eigen flitsenergie.',
      'De koppeling tint → energie stelt elke fabrikant zelf vast, op basis van ervaring en ontwerpgrenzen.',
    ],
    stabilityNote:
      'Bij huidtintdetectie gaat het er niet om in hoeveel niveaus je het bereik opdeelt, maar hoe stabiel de meting is — een sensor die bij zijn besluit blijft is meer waard dan een met meer stappen.',
  },
  pl: {
    mechanismTitle: 'Jak czujnik odczytuje Twoją skórę',
    mechanismBody:
      'Głowica pomiarowa łączy chip fotoczujnika ze złożonym źródłem światła. Emiter nie pracuje bez przerwy: uruchamia się, gdy urządzenie potwierdzi kontakt ze skórą. Światło biegnie światłowodem do skóry, a jego część wraca. Różne odcienie skóry odsyłają różne ilości energii, a chip fotoczujnika rozpoznaje odcień na podstawie odebranej energii. Ta decyzja wyznacza energię błysku — każdy odcień dostaje własny poziom.',
    baselineTitle: 'Co branża uznaje za podstawowe minimum',
    baselineBody:
      'Wykrywanie odcienia skóry działa dziś według wspólnej podstawy: brak kontaktu (powietrze), czerń i od trzech do pięciu poziomów odcienia. Sposób przełożenia odcienia na energię błysku nie jest znormalizowany — mapowanie każdego producenta wynika z jego doświadczenia i wymagań konstrukcyjnych, dlatego dwa urządzenia mogą zachować się różnie na tej samej skórze.',
    baselinePoints: [
      'Brak kontaktu (powietrze) i czerń: brak błysku — nie przydziela się żadnej energii.',
      'Od trzech do pięciu poziomów odcienia: każdemu przydzielana jest własna energia błysku.',
      'Mapowanie odcień → energia ustala każdy producent, na podstawie doświadczenia i ograniczeń konstrukcyjnych.',
    ],
    stabilityNote:
      'W wykrywaniu odcienia skóry nie chodzi o to, na ile poziomów podzielisz zakres, ale o to, jak stabilny jest pomiar — czujnik, który trzyma się swojej decyzji, jest wart więcej niż taki z większą liczbą stopni.',
  },
  'pt-BR': {
    mechanismTitle: 'Como o sensor lê a sua pele',
    mechanismBody:
      'A cabeça de detecção combina um chip fotossensor com uma fonte de luz composta. O emissor não fica ligado o tempo todo: ele começa quando o aparelho confirma o contato com a pele. A luz percorre um guia de luz até a pele e parte volta. Tons de pele diferentes devolvem quantidades diferentes de energia, e o chip fotossensor decide o tom a partir da energia que recebe. Essa decisão define a energia do flash — cada tom de pele recebe o próprio nível.',
    baselineTitle: 'O que a indústria considera o mínimo básico',
    baselineBody:
      'A detecção de tom de pele hoje trabalha sobre uma base comum: sem contato (ar), preto e de três a cinco níveis de tom. Como um tom é traduzido em energia de flash não é padronizado — cada fabricante define esse mapeamento conforme a própria experiência e os requisitos de projeto, e por isso dois aparelhos podem se comportar de forma diferente na mesma pele.',
    baselinePoints: [
      'Sem contato (ar) e preto: nenhum flash — não se atribui energia alguma.',
      'De três a cinco níveis de tom: cada um recebe a própria energia de flash.',
      'O mapeamento tom → energia é definido por cada fabricante, conforme experiência e limites de projeto.',
    ],
    stabilityNote:
      'Na detecção de tom de pele não importa em quantos níveis você divide a faixa, mas sim o quão estável é a leitura — um sensor que sustenta a decisão vale mais do que um com mais degraus.',
  },
  'pt-PT': {
    mechanismTitle: 'Como o sensor lê a sua pele',
    mechanismBody:
      'A cabeça de deteção combina um chip fotossensor com uma fonte de luz composta. O emissor não fica ligado o tempo todo: começa quando o aparelho confirma o contacto com a pele. A luz percorre um guia de luz até à pele e parte regressa. Tons de pele diferentes devolvem quantidades diferentes de energia, e o chip fotossensor decide o tom a partir da energia que recebe. Essa decisão define a energia do flash — cada tom de pele recebe o seu próprio nível.',
    baselineTitle: 'O que a indústria considera o mínimo básico',
    baselineBody:
      'A deteção de tom de pele trabalha hoje sobre uma base comum: sem contacto (ar), preto e três a cinco níveis de tom. A forma como um tom é traduzido em energia de flash não está normalizada — cada fabricante define esse mapeamento segundo a sua experiência e os requisitos de projeto, e por isso dois aparelhos podem comportar-se de maneira diferente na mesma pele.',
    baselinePoints: [
      'Sem contacto (ar) e preto: nenhum flash — não é atribuída energia alguma.',
      'Três a cinco níveis de tom: cada um recebe a sua própria energia de flash.',
      'O mapeamento tom → energia é definido por cada fabricante, conforme experiência e limites de projeto.',
    ],
    stabilityNote:
      'Na deteção de tom de pele não importa em quantos níveis divide o intervalo, mas sim quão estável é a leitura — um sensor que mantém a sua decisão vale mais do que um com mais degraus.',
  },
  ro: {
    mechanismTitle: 'Cum citește senzorul pielea ta',
    mechanismBody:
      'Capul de detectare combină un cip fotosenzor cu o sursă de lumină compusă. Emițătorul nu funcționează continuu: pornește după ce aparatul confirmă contactul cu pielea. Lumina parcurge un ghid de lumină până la piele, iar o parte se întoarce. Tonuri diferite de piele întorc cantități diferite de energie, iar cipul fotosenzor decide tonul din energia primită. Această decizie stabilește energia fulgerului — fiecare ton de piele primește propriul nivel.',
    baselineTitle: 'Ce consideră industria drept minim de bază',
    baselineBody:
      'Detectarea tonului pielii lucrează astăzi pe o bază comună: fără contact (aer), negru și trei până la cinci niveluri de ton. Modul în care un ton este tradus în energie de fulger nu este standardizat — fiecare producător stabilește această corespondență după propria experiență și cerințele de proiectare, motiv pentru care două aparate se pot comporta diferit pe aceeași piele.',
    baselinePoints: [
      'Fără contact (aer) și negru: fără fulger — nu se atribuie nicio energie.',
      'Trei până la cinci niveluri de ton: fiecare primește propria energie de fulger.',
      'Corespondența ton → energie este stabilită de fiecare producător, după experiență și limite de proiectare.',
    ],
    stabilityNote:
      'La detectarea tonului pielii nu contează în câte niveluri împarți intervalul, ci cât de stabilă este măsurătoarea — un senzor care își ține decizia valorează mai mult decât unul cu mai multe trepte.',
  },
  ru: {
    mechanismTitle: 'Как датчик считывает вашу кожу',
    mechanismBody:
      'Измерительная головка объединяет чип фотодатчика и составной источник света. Излучатель не работает постоянно: он запускается после того, как устройство подтвердит контакт с кожей. Свет идёт по световоду к коже, и часть его возвращается. Разные тона кожи возвращают разное количество энергии, и чип фотодатчика определяет тон по полученной энергии. Это решение задаёт энергию вспышки — каждому тону кожи назначается свой уровень.',
    baselineTitle: 'Что отрасль считает базовым минимумом',
    baselineBody:
      'Определение тона кожи сегодня работает по общей базе: без контакта (воздух), чёрный и от трёх до пяти уровней тона. Как именно тон переводится в энергию вспышки, не стандартизировано — каждый производитель задаёт это соответствие исходя из своего опыта и требований конструкции, поэтому два устройства могут вести себя по-разному на одной и той же коже.',
    baselinePoints: [
      'Без контакта (воздух) и чёрный: вспышки нет — энергия не выделяется вообще.',
      'От трёх до пяти уровней тона: каждому назначается своя энергия вспышки.',
      'Соответствие «тон → энергия» задаёт каждый производитель, исходя из опыта и конструктивных ограничений.',
    ],
    stabilityNote:
      'В определении тона кожи важно не то, на сколько уровней разбит диапазон, а то, насколько стабильно измерение — датчик, который держит своё решение, ценнее датчика с большим числом ступеней.',
  },
  th: {
    mechanismTitle: 'เซ็นเซอร์อ่านผิวของคุณอย่างไร',
    mechanismBody:
      'หัววัดรวมชิปโฟโตเซ็นเซอร์เข้ากับแหล่งกำเนิดแสงแบบผสม ตัวส่งแสงไม่ได้เปิดตลอดเวลา แต่จะเริ่มทำงานเมื่ออุปกรณ์ยืนยันว่าสัมผัสผิวแล้ว แสงวิ่งผ่านตัวนำแสงไปยังผิวและส่วนหนึ่งสะท้อนกลับมา ผิวต่างโทนสะท้อนพลังงานกลับมาไม่เท่ากัน และชิปโฟโตเซ็นเซอร์ตัดสินโทนผิวจากพลังงานที่ได้รับ การตัดสินนี้กำหนดพลังงานในการยิงแสง โดยแต่ละโทนผิวได้ระดับของตัวเอง',
    baselineTitle: 'สิ่งที่อุตสาหกรรมถือเป็นพื้นฐานขั้นต่ำ',
    baselineBody:
      'การตรวจจับโทนผิวในปัจจุบันทำงานบนพื้นฐานร่วมกัน คือ ไม่สัมผัส (อากาศ) สีดำ และโทนผิว 3 ถึง 5 ระดับ แต่วิธีแปลโทนหนึ่งเป็นพลังงานยิงแสงนั้นยังไม่เป็นมาตรฐานเดียวกัน แต่ละผู้ผลิตกำหนดตารางนี้จากประสบการณ์และข้อกำหนดการออกแบบของตนเอง จึงเป็นเหตุให้อุปกรณ์สองเครื่องทำงานต่างกันบนผิวเดียวกันได้',
    baselinePoints: [
      'ไม่สัมผัส (อากาศ) และสีดำ: ไม่ยิงแสง — ไม่จัดสรรพลังงานใดเลย',
      'โทนผิว 3 ถึง 5 ระดับ: แต่ละระดับได้รับการจัดสรรพลังงานยิงแสงของตัวเอง',
      'การจับคู่โทนกับพลังงานเป็นของผู้ผลิตแต่ละราย กำหนดจากประสบการณ์และข้อจำกัดการออกแบบ',
    ],
    stabilityNote:
      'การตรวจจับโทนผิวไม่ได้อยู่ที่ว่าแบ่งช่วงเป็นกี่ระดับ แต่อยู่ที่ว่าการวัดนั้นเสถียรแค่ไหน เซ็นเซอร์ที่ยึดคำตัดสินของตัวเองได้มีค่ากว่าเซ็นเซอร์ที่มีขั้นมากกว่า',
  },
  tr: {
    mechanismTitle: 'Sensör cildinizi nasıl okur',
    mechanismBody:
      'Sensör başlığı bir fotosensör çipini bileşik bir ışık kaynağıyla birleştirir. Verici sürekli yanmaz: cihaz cilt temasını doğruladıktan sonra çalışmaya başlar. Işık bir ışık kılavuzundan cilde gider ve bir kısmı geri döner. Farklı cilt tonları farklı miktarda enerji geri gönderir ve fotosensör çipi aldığı enerjiden tonu belirler. Bu karar flaş enerjisini belirler — her cilt tonuna kendi seviyesi atanır.',
    baselineTitle: 'Sektörün temel asgari olarak kabul ettiği şey',
    baselineBody:
      'Cilt tonu algılama bugün ortak bir temel üzerinde çalışır: temas yok (hava), siyah ve üç ila beş cilt tonu seviyesi. Bir tonun flaş enerjisine nasıl çevrileceği standartlaştırılmamıştır — bu eşlemeyi her üretici kendi deneyimine ve tasarım gereksinimlerine göre belirler; bu yüzden iki cihaz aynı ciltte farklı davranabilir.',
    baselinePoints: [
      'Temas yok (hava) ve siyah: flaş yok — hiç enerji atanmaz.',
      'Üç ila beş cilt tonu seviyesi: her birine kendi flaş enerjisi atanır.',
      'Ton → enerji eşlemesini her üretici deneyimine ve tasarım sınırlarına göre belirler.',
    ],
    stabilityNote:
      'Cilt tonu algılamada önemli olan aralığı kaç seviyeye böldüğünüz değil, ölçümün ne kadar kararlı olduğudur — kararında duran bir sensör, daha çok kademesi olan bir sensörden daha değerlidir.',
  },
  vi: {
    mechanismTitle: 'Cảm biến đọc da của bạn như thế nào',
    mechanismBody:
      'Đầu cảm biến kết hợp một chip cảm biến quang với nguồn sáng tổ hợp. Bộ phát không chạy liên tục: nó khởi động sau khi thiết bị xác nhận đã tiếp xúc với da. Ánh sáng đi qua ống dẫn sáng tới da và một phần phản hồi trở lại. Các tông da khác nhau trả về lượng năng lượng khác nhau, và chip cảm biến quang xác định tông da từ năng lượng nhận được. Quyết định đó đặt ra năng lượng phát xung — mỗi tông da được gán một mức riêng.',
    baselineTitle: 'Điều mà ngành coi là mức cơ bản tối thiểu',
    baselineBody:
      'Cảm biến tông màu da hiện nay vận hành trên một nền chung: không tiếp xúc (không khí), màu đen, và ba đến năm mức tông da. Cách chuyển một tông thành năng lượng phát xung thì chưa được chuẩn hóa — mỗi nhà sản xuất đặt bảng ánh xạ này theo kinh nghiệm và yêu cầu thiết kế của mình, nên hai thiết bị có thể hành xử khác nhau trên cùng một làn da.',
    baselinePoints: [
      'Không tiếp xúc (không khí) và màu đen: không phát xung — không gán năng lượng nào.',
      'Ba đến năm mức tông da: mỗi mức được gán năng lượng phát xung riêng.',
      'Ánh xạ tông → năng lượng do từng nhà sản xuất đặt ra, theo kinh nghiệm và giới hạn thiết kế.',
    ],
    stabilityNote:
      'Với cảm biến tông màu da, điều quan trọng không phải là chia dải thành bao nhiêu mức, mà là phép đo ổn định đến đâu — một cảm biến giữ vững quyết định của mình có giá trị hơn một cảm biến có nhiều bậc hơn.',
  },
};

/**
 * IGBT 技术补充组（2026-09-22 老板补充）：带肤色识别的设备一般都用 IGBT 控制，
 * 因为肤色识别要求快速调整能量；IGBT 通过导通时间控制电容放电长短来决定闪光能量，
 * 所以能快速配合肤色识别。IGBT 一般不固定一个型号，市面同类可互相兼容；
 * 我们设计产品时为后续供货稳定与成本做多型号兼容设计。
 */
export const LUMI2_IGBT_DETAIL: Record<string, Lumi2IgbtDetail> = {
  en: {
    igbtControlBody:
      'Skin tone sensing is why the switch matters. The sensor decides the tone immediately before each flash, so the device has to change its energy on that timescale. An IGBT sets the flash energy by controlling how long the capacitor is allowed to discharge — a longer conduction time releases more energy, a shorter one releases less. Adjusting discharge time is fast, which is what lets the energy level follow the sensor from one flash to the next instead of being fixed before the session starts.',
    igbtSourcingTitle: 'One function, several part numbers',
    igbtSourcingBody:
      'An IGBT in this role is not tied to a single part number. Many equivalent devices on the market are mutually compatible for the same function, so a design does not have to depend on one supplier. We lay out our boards so that several compatible IGBTs can be fitted, which protects supply continuity and keeps the cost of the finished device under control. If your market later needs a different specification, the board does not have to be redesigned from scratch.',
  },
  ar: {
    igbtControlBody:
      'استشعار لون البشرة هو سبب أهمية هذا المفتاح. يحدّد المستشعر اللون قبل كل ومضة مباشرة، فيجب أن يغيّر الجهاز طاقته على هذا القدر من السرعة. ويضبط الـ IGBT طاقة الوميض عبر التحكم في مدة السماح للخازن بالتفريغ — زمن توصيل أطول يُطلق طاقة أكبر، وأقصر يُطلق أقل. وضبط زمن التفريغ سريع، وهذا ما يسمح لمستوى الطاقة بأن يتبع المستشعر من ومضة إلى التي تليها بدل أن يكون ثابتًا قبل بدء الجلسة.',
    igbtSourcingTitle: 'وظيفة واحدة، وأرقام قطع متعددة',
    igbtSourcingBody:
      'الـ IGBT في هذا الدور غير مرتبط برقم قطعة واحد. هناك في السوق قطع مكافئة كثيرة متوافقة مع بعضها لأداء الوظيفة نفسها، لذا لا يضطر التصميم إلى الاعتماد على مورّد واحد. نصمّم لوحاتنا بحيث يمكن تركيب عدة أنواع IGBT متوافقة، وهذا يحمي استمرارية التوريد ويُبقي تكلفة الجهاز النهائي تحت السيطرة. وإذا احتاج سوقك لاحقًا إلى مواصفة مختلفة، فلا يلزم إعادة تصميم اللوحة من الصفر.',
  },
  cs: {
    igbtControlBody:
      'Snímání tónu pleti je důvod, proč na tom spínači záleží. Senzor určí tón bezprostředně před každým zábleskem, takže zařízení musí měnit energii ve stejném časovém měřítku. IGBT nastavuje energii záblesku tím, jak dlouho dovolí kondenzátoru vybíjet — delší doba vedení uvolní více energie, kratší méně. Nastavení doby vybíjení je rychlé, a právě proto může energetická úroveň sledovat senzor od jednoho záblesku k dalšímu, místo aby byla pevná před začátkem seance.',
    igbtSourcingTitle: 'Jedna funkce, několik typů součástek',
    igbtSourcingBody:
      'IGBT v této roli není vázán na jediné číslo součástky. Na trhu je mnoho rovnocenných typů, které jsou pro tuto funkci vzájemně zaměnitelné, takže konstrukce nemusí záviset na jednom dodavateli. Naše desky navrhujeme tak, aby se dal osadit kterýkoli z několika kompatibilních IGBT — chrání to plynulost dodávek a drží cenu hotového zařízení pod kontrolou. Pokud váš trh později potřebuje jinou specifikaci, desku není nutné navrhovat znovu od začátku.',
  },
  de: {
    igbtControlBody:
      'Die Hauttonerkennung ist der Grund, warum dieser Schalter zählt. Der Sensor legt den Ton unmittelbar vor jedem Blitz fest, das Gerät muss seine Energie also in derselben Zeitskala ändern. Ein IGBT stellt die Blitzenergie ein, indem er steuert, wie lange sich der Kondensator entladen darf — eine längere Einschaltdauer setzt mehr Energie frei, eine kürzere weniger. Die Entladezeit lässt sich schnell verstellen, und genau das erlaubt es der Energiestufe, dem Sensor von Blitz zu Blitz zu folgen, statt vor der Sitzung festzuliegen.',
    igbtSourcingTitle: 'Eine Funktion, mehrere Typenbezeichnungen',
    igbtSourcingBody:
      'Ein IGBT in dieser Rolle ist nicht an eine einzige Typenbezeichnung gebunden. Auf dem Markt gibt es viele gleichwertige Bauteile, die für diese Funktion untereinander kompatibel sind, sodass eine Konstruktion nicht von einem Lieferanten abhängt. Wir legen unsere Platinen so aus, dass sich mehrere kompatible IGBTs bestücken lassen — das sichert die Versorgung und hält die Kosten des fertigen Geräts im Griff. Braucht Ihr Markt später eine andere Spezifikation, muss die Platine nicht von Grund auf neu entwickelt werden.',
  },
  el: {
    igbtControlBody:
      'Η ανίχνευση τόνου δέρματος είναι ο λόγος που αυτός ο διακόπτης μετράει. Ο αισθητήρας κρίνει τον τόνο ακριβώς πριν από κάθε λάμψη, άρα η συσκευή πρέπει να αλλάζει ενέργεια στην ίδια χρονική κλίμακα. Το IGBT ρυθμίζει την ενέργεια της λάμψης ελέγχοντας πόσο χρόνο επιτρέπεται στον πυκνωτή να εκφορτιστεί — μεγαλύτερος χρόνος αγωγής ελευθερώνει περισσότερη ενέργεια, μικρότερος λιγότερη. Η ρύθμιση του χρόνου εκφόρτισης είναι γρήγορη, και αυτό επιτρέπει στο επίπεδο ενέργειας να ακολουθεί τον αισθητήρα από λάμψη σε λάμψη αντί να είναι σταθερό πριν αρχίσει η συνεδρία.',
    igbtSourcingTitle: 'Μία λειτουργία, πολλοί κωδικοί εξαρτήματος',
    igbtSourcingBody:
      'Ένα IGBT σε αυτόν τον ρόλο δεν δεσμεύεται σε έναν μόνο κωδικό εξαρτήματος. Στην αγορά υπάρχουν πολλά ισοδύναμα εξαρτήματα που είναι μεταξύ τους συμβατά για την ίδια λειτουργία, ώστε μια σχεδίαση να μη εξαρτάται από έναν προμηθευτή. Σχεδιάζουμε τις πλακέτες μας ώστε να δέχονται πολλά συμβατά IGBT — αυτό προστατεύει τη συνέχεια εφοδιασμού και κρατά το κόστος της τελικής συσκευής υπό έλεγχο. Αν η αγορά σας χρειαστεί αργότερα άλλη προδιαγραφή, η πλακέτα δεν χρειάζεται να σχεδιαστεί από την αρχή.',
  },
  es: {
    igbtControlBody:
      'La detección del tono de piel es la razón por la que este interruptor importa. El sensor decide el tono justo antes de cada destello, así que el dispositivo tiene que cambiar su energía en esa misma escala de tiempo. Un IGBT fija la energía del destello controlando cuánto tiempo se permite descargar al condensador: un tiempo de conducción más largo libera más energía y uno más corto, menos. Ajustar el tiempo de descarga es rápido, y eso es lo que permite que el nivel de energía siga al sensor de un destello al siguiente en lugar de quedar fijado antes de empezar la sesión.',
    igbtSourcingTitle: 'Una función, varias referencias',
    igbtSourcingBody:
      'Un IGBT en este papel no está atado a una única referencia. En el mercado hay muchos componentes equivalentes que son compatibles entre sí para la misma función, así que un diseño no tiene que depender de un solo proveedor. Diseñamos nuestras placas para que admitan varios IGBT compatibles: eso protege la continuidad de suministro y mantiene bajo control el coste del equipo acabado. Si tu mercado necesita más adelante otra especificación, no hay que rediseñar la placa desde cero.',
  },
  fa: {
    igbtControlBody:
      'حسگری رنگ پوست دلیل اهمیت این کلید است. حسگر بلافاصله پیش از هر فلاش رنگ را تعیین می‌کند، پس دستگاه باید انرژی را در همان مقیاس زمانی تغییر دهد. IGBT انرژی فلاش را با کنترل مدت‌زمانی که خازن اجازه دارد تخلیه شود تنظیم می‌کند — زمان هدایت طولانی‌تر انرژی بیشتری آزاد می‌کند و کوتاه‌تر کمتر. تنظیم زمان تخلیه سریع است و همین اجازه می‌دهد سطح انرژی از یک فلاش به فلاش بعدی از حسگر پیروی کند، نه اینکه پیش از آغاز جلسه ثابت شده باشد.',
    igbtSourcingTitle: 'یک کار، چند شماره قطعه',
    igbtSourcingBody:
      'IGBT در این نقش به یک شماره قطعه واحد گره نخورده است. در بازار قطعات هم‌ارز بسیاری هست که برای همین کار با یکدیگر سازگارند، پس یک طراحی لازم نیست به یک تأمین‌کننده وابسته باشد. ما بردهایمان را طوری طراحی می‌کنیم که چند IGBT سازگار روی آن نصب شود؛ این کار پیوستگی تأمین را حفظ می‌کند و هزینه دستگاه نهایی را کنترل‌شده نگه می‌دارد. اگر بازار شما بعدها مشخصات دیگری بخواهد، لازم نیست برد از صفر بازطراحی شود.',
  },
  fr: {
    igbtControlBody:
      'La détection du teint est la raison d’être de ce commutateur. Le capteur décide du teint juste avant chaque flash, l’appareil doit donc changer d’énergie à cette échelle de temps. Un IGBT fixe l’énergie du flash en contrôlant la durée pendant laquelle le condensateur peut se décharger : une conduction plus longue libère plus d’énergie, une plus courte moins. Régler la durée de décharge est rapide, et c’est ce qui permet au niveau d’énergie de suivre le capteur d’un flash à l’autre au lieu d’être figé avant le début de la séance.',
    igbtSourcingTitle: 'Une fonction, plusieurs références',
    igbtSourcingBody:
      'Un IGBT à ce poste n’est pas lié à une référence unique. Le marché propose de nombreux composants équivalents, compatibles entre eux pour cette fonction, si bien qu’une conception ne dépend pas d’un seul fournisseur. Nous concevons nos cartes pour accueillir plusieurs IGBT compatibles : cela sécurise la continuité d’approvisionnement et garde le coût de l’appareil fini sous contrôle. Si votre marché exige plus tard une autre spécification, la carte n’a pas à être reconçue de zéro.',
  },
  he: {
    igbtControlBody:
      'חישת גוון העור היא הסיבה שהמפסק הזה חשוב. החיישן קובע את הגוון ממש לפני כל הבזק, כך שהמכשיר חייב לשנות אנרגיה באותו סדר גודל של זמן. IGBT קובע את אנרגיית ההבזק על ידי שליטה במשך הזמן שבו הקבל מורשה להתפרק — זמן הולכה ארוך יותר משחרר יותר אנרגיה, וקצר יותר פחות. כיוונון זמן הפריקה מהיר, וזה מה שמאפשר לרמת האנרגיה לעקוב אחרי החיישן מהבזק להבזק במקום להיות קבועה לפני תחילת הסשן.',
    igbtSourcingTitle: 'תפקיד אחד, כמה מק"טים',
    igbtSourcingBody:
      'IGBT בתפקיד הזה אינו כבול למק"ט אחד. בשוק יש רכיבים מקבילים רבים שתואמים זה לזה לאותו תפקיד, כך שתכנון אינו חייב להיות תלוי בספק אחד. אנחנו מתכננים את המעגלים כך שניתן להרכיב כמה סוגי IGBT תואמים; זה שומר על רציפות אספקה ומשאיר את עלות המכשיר המוגמר בשליטה. אם השוק שלך יזדקק בהמשך למפרט אחר, אין צורך לתכנן את המעגל מחדש מאפס.',
  },
  id: {
    igbtControlBody:
      'Penginderaan warna kulit adalah alasan sakelar ini penting. Sensor menentukan warna tepat sebelum setiap kilatan, jadi perangkat harus mengubah energinya dalam skala waktu yang sama. IGBT menetapkan energi kilatan dengan mengatur berapa lama kapasitor diizinkan melepaskan muatan — waktu konduksi lebih panjang melepaskan lebih banyak energi, yang lebih pendek lebih sedikit. Menyetel waktu pelepasan itu cepat, dan itulah yang membuat tingkat energi bisa mengikuti sensor dari satu kilatan ke kilatan berikutnya, bukan dipatok sebelum sesi dimulai.',
    igbtSourcingTitle: 'Satu fungsi, beberapa nomor komponen',
    igbtSourcingBody:
      'IGBT dalam peran ini tidak terikat pada satu nomor komponen. Di pasar ada banyak komponen setara yang saling kompatibel untuk fungsi yang sama, sehingga sebuah rancangan tidak harus bergantung pada satu pemasok. Kami merancang papan agar bisa dipasangi beberapa IGBT yang kompatibel — ini menjaga kelangsungan pasokan dan menahan biaya perangkat jadi. Jika pasar Anda nanti membutuhkan spesifikasi lain, papan tidak perlu dirancang ulang dari nol.',
  },
  it: {
    igbtControlBody:
      'Il rilevamento del tono cutaneo è il motivo per cui questo interruttore conta. Il sensore decide il tono subito prima di ogni flash, quindi il dispositivo deve cambiare energia su quella scala temporale. Un IGBT imposta l’energia del flash controllando per quanto tempo il condensatore può scaricarsi: un tempo di conduzione più lungo libera più energia, uno più breve meno. Regolare il tempo di scarica è rapido, ed è ciò che permette al livello di energia di seguire il sensore da un flash all’altro invece di restare fisso prima dell’inizio della seduta.',
    igbtSourcingTitle: 'Una funzione, più codici componente',
    igbtSourcingBody:
      'Un IGBT in questo ruolo non è legato a un unico codice componente. Sul mercato esistono molti componenti equivalenti, compatibili tra loro per la stessa funzione, così un progetto non deve dipendere da un solo fornitore. Progettiamo le nostre schede perché possano montare diversi IGBT compatibili: questo tutela la continuità di fornitura e tiene sotto controllo il costo del dispositivo finito. Se il vostro mercato in futuro richiede un’altra specifica, la scheda non va riprogettata da zero.',
  },
  ja: {
    igbtControlBody:
      '肌トーン検出があるからこそ、このスイッチが重要になります。センサーはフラッシュの直前にトーンを判定するため、機器は同じ時間スケールでエネルギーを変える必要があります。IGBT はコンデンサーを放電させる時間の長さを制御してフラッシュエネルギーを決めます。導通時間が長ければ放出されるエネルギーは多く、短ければ少なくなります。放電時間の調整は高速なので、セッション開始前に固定するのではなく、エネルギー段階をフラッシュごとにセンサーへ追従させられます。',
    igbtSourcingTitle: '一つの機能に複数の型番',
    igbtSourcingBody:
      'この役割の IGBT は特定の型番に縛られません。同じ機能に対して相互に互換できる同等品が市場に多数あり、設計が一社の供給に依存する必要はありません。当社は複数の互換 IGBT を実装できるよう基板を設計しており、これが供給の継続性を守り、完成品のコストを抑えます。将来あなたの市場で別の仕様が必要になっても、基板をゼロから設計し直す必要はありません。',
  },
  ko: {
    igbtControlBody:
      '피부 톤 감지가 있기 때문에 이 스위치가 중요합니다. 센서는 플래시 직전에 톤을 판정하므로, 기기는 같은 시간 규모로 에너지를 바꿔야 합니다. IGBT는 커패시터가 방전되도록 허용하는 시간을 제어해 플래시 에너지를 정합니다. 도통 시간이 길면 더 많은 에너지가 나오고, 짧으면 더 적게 나옵니다. 방전 시간 조정은 빠르기 때문에, 세션 시작 전에 고정하는 대신 에너지 단계를 플래시마다 센서에 맞춰 따라가게 할 수 있습니다.',
    igbtSourcingTitle: '하나의 기능, 여러 부품 번호',
    igbtSourcingBody:
      '이 역할의 IGBT는 특정 부품 번호에 묶이지 않습니다. 같은 기능에 대해 서로 호환되는 동등 부품이 시장에 많이 있어, 설계가 한 공급처에 의존할 필요가 없습니다. 저희는 여러 호환 IGBT를 실장할 수 있도록 기판을 설계하며, 이는 공급 연속성을 지키고 완제품 원가를 관리하는 방법입니다. 나중에 시장이 다른 사양을 요구해도 기판을 처음부터 다시 설계할 필요가 없습니다.',
  },
  nl: {
    igbtControlBody:
      'Huidtintdetectie is de reden dat deze schakelaar ertoe doet. De sensor bepaalt de tint vlak voor elke flits, dus het apparaat moet zijn energie op die tijdschaal kunnen veranderen. Een IGBT stelt de flitsenergie in door te bepalen hoe lang de condensator mag ontladen: een langere geleidingstijd geeft meer energie vrij, een kortere minder. Het instellen van de ontlaadtijd is snel, en dat is wat het energieniveau van flits tot flits de sensor laat volgen in plaats van vooraf vast te liggen.',
    igbtSourcingTitle: 'Eén functie, meerdere typenummers',
    igbtSourcingBody:
      'Een IGBT in deze rol zit niet vast aan één typenummer. Op de markt zijn veel gelijkwaardige onderdelen die voor deze functie onderling compatibel zijn, zodat een ontwerp niet van één leverancier afhankelijk hoeft te zijn. Wij ontwerpen onze printplaten zo dat er meerdere compatibele IGBT’s op passen — dat beschermt de leveringscontinuïteit en houdt de kostprijs van het eindapparaat in de hand. Vraagt uw markt later een andere specificatie, dan hoeft de printplaat niet vanaf nul opnieuw te worden ontworpen.',
  },
  pl: {
    igbtControlBody:
      'Wykrywanie odcienia skóry jest powodem, dla którego ten przełącznik ma znaczenie. Czujnik rozpoznaje odcień tuż przed każdym błyskiem, więc urządzenie musi zmieniać energię w tej samej skali czasu. IGBT ustala energię błysku, kontrolując, jak długo kondensator może się rozładowywać — dłuższy czas przewodzenia uwalnia więcej energii, krótszy mniej. Regulacja czasu rozładowania jest szybka i to właśnie pozwala poziomowi energii podążać za czujnikiem z błysku na błysk, zamiast być ustalonym przed rozpoczęciem sesji.',
    igbtSourcingTitle: 'Jedna funkcja, kilka oznaczeń części',
    igbtSourcingBody:
      'IGBT w tej roli nie jest przywiązany do jednego oznaczenia części. Na rynku jest wiele równoważnych elementów wzajemnie zgodnych dla tej samej funkcji, więc konstrukcja nie musi zależeć od jednego dostawcy. Projektujemy płytki tak, aby można było montować kilka zgodnych IGBT — chroni to ciągłość dostaw i pozwala utrzymać koszt gotowego urządzenia pod kontrolą. Jeśli Twój rynek będzie później wymagał innej specyfikacji, płytki nie trzeba projektować od zera.',
  },
  'pt-BR': {
    igbtControlBody:
      'A detecção de tom de pele é a razão de esse interruptor importar. O sensor decide o tom imediatamente antes de cada flash, então o aparelho precisa mudar de energia nessa mesma escala de tempo. O IGBT define a energia do flash controlando por quanto tempo o capacitor pode descarregar — um tempo de condução maior libera mais energia, um menor libera menos. Ajustar o tempo de descarga é rápido, e é isso que permite ao nível de energia seguir o sensor de um flash para o outro, em vez de ficar fixo antes de a sessão começar.',
    igbtSourcingTitle: 'Uma função, vários códigos de componente',
    igbtSourcingBody:
      'Um IGBT nessa função não está preso a um único código de componente. Há no mercado muitos componentes equivalentes, compatíveis entre si para a mesma função, de modo que um projeto não precisa depender de um único fornecedor. Projetamos nossas placas para receber vários IGBTs compatíveis — isso protege a continuidade de fornecimento e mantém o custo do aparelho pronto sob controle. Se o seu mercado exigir outra especificação mais adiante, a placa não precisa ser reprojetada do zero.',
  },
  'pt-PT': {
    igbtControlBody:
      'A deteção de tom de pele é a razão pela qual este interruptor importa. O sensor decide o tom imediatamente antes de cada flash, por isso o aparelho tem de mudar de energia nessa mesma escala de tempo. O IGBT define a energia do flash controlando durante quanto tempo o condensador pode descarregar — um tempo de condução maior liberta mais energia, um menor liberta menos. Ajustar o tempo de descarga é rápido, e é isso que permite ao nível de energia seguir o sensor de um flash para o outro, em vez de ficar fixo antes de a sessão começar.',
    igbtSourcingTitle: 'Uma função, vários códigos de componente',
    igbtSourcingBody:
      'Um IGBT nesta função não está preso a um único código de componente. Existem no mercado muitos componentes equivalentes, compatíveis entre si para a mesma função, pelo que um projeto não tem de depender de um único fornecedor. Projetamos as nossas placas para receber vários IGBT compatíveis — isso protege a continuidade de fornecimento e mantém o custo do aparelho final sob controlo. Se o seu mercado exigir outra especificação mais tarde, a placa não precisa de ser reprojetada de raiz.',
  },
  ro: {
    igbtControlBody:
      'Detectarea tonului pielii este motivul pentru care acest întrerupător contează. Senzorul decide tonul imediat înainte de fiecare fulger, așa că aparatul trebuie să își schimbe energia la aceeași scară de timp. Un IGBT stabilește energia fulgerului controlând cât timp are voie condensatorul să se descarce — un timp de conducție mai lung eliberează mai multă energie, unul mai scurt mai puțină. Reglarea timpului de descărcare este rapidă, iar asta permite nivelului de energie să urmeze senzorul de la un fulger la altul în loc să fie fixat înainte de începerea ședinței.',
    igbtSourcingTitle: 'O funcție, mai multe coduri de componentă',
    igbtSourcingBody:
      'Un IGBT în acest rol nu este legat de un singur cod de componentă. Pe piață există multe componente echivalente, compatibile între ele pentru aceeași funcție, așa că un proiect nu trebuie să depindă de un singur furnizor. Ne proiectăm plăcile astfel încât să accepte mai multe IGBT-uri compatibile — asta protejează continuitatea aprovizionării și ține sub control costul aparatului finit. Dacă piața dumneavoastră va cere mai târziu altă specificație, placa nu trebuie reproiectată de la zero.',
  },
  ru: {
    igbtControlBody:
      'Определение тона кожи — причина, по которой этот ключ важен. Датчик определяет тон непосредственно перед каждой вспышкой, поэтому устройство должно менять энергию в том же масштабе времени. IGBT задаёт энергию вспышки, управляя тем, как долго конденсатору разрешено разряжаться: более длительное время проводимости отдаёт больше энергии, более короткое — меньше. Регулировка времени разряда выполняется быстро, и именно это позволяет уровню энергии следовать за датчиком от вспышки к вспышке, а не фиксироваться до начала процедуры.',
    igbtSourcingTitle: 'Одна функция — несколько обозначений компонента',
    igbtSourcingBody:
      'IGBT в этой роли не привязан к единственному обозначению компонента. На рынке есть много равноценных компонентов, взаимозаменяемых для этой функции, поэтому конструкция не обязана зависеть от одного поставщика. Мы проектируем платы так, чтобы на них можно было установить несколько совместимых IGBT, — это защищает непрерывность поставок и держит под контролем себестоимость готового устройства. Если вашему рынку позже понадобится другая спецификация, плату не придётся проектировать заново.',
  },
  th: {
    igbtControlBody:
      'การตรวจจับโทนผิวคือเหตุผลที่สวิตช์นี้สำคัญ เซ็นเซอร์ตัดสินโทนก่อนการยิงแสงแต่ละครั้งทันที อุปกรณ์จึงต้องเปลี่ยนพลังงานในสเกลเวลาเดียวกัน IGBT กำหนดพลังงานยิงแสงด้วยการควบคุมระยะเวลาที่ตัวเก็บประจุได้รับอนุญาตให้คายประจุ ระยะเวลานำไฟฟ้าที่ยาวกว่าปล่อยพลังงานมากกว่า และที่สั้นกว่าปล่อยน้อยกว่า การปรับระยะเวลาคายประจุทำได้เร็ว จึงทำให้ระดับพลังงานตามเซ็นเซอร์ได้ในทุกครั้งที่ยิงแสง แทนที่จะถูกตรึงไว้ก่อนเริ่มเซสชัน',
    igbtSourcingTitle: 'หน้าที่เดียว หลายรหัสชิ้นส่วน',
    igbtSourcingBody:
      'IGBT ในบทบาทนี้ไม่ได้ผูกกับรหัสชิ้นส่วนเดียว ในตลาดมีชิ้นส่วนเทียบเท่าจำนวนมากที่ใช้แทนกันได้สำหรับหน้าที่เดียวกัน การออกแบบจึงไม่จำเป็นต้องพึ่งผู้ผลิตรายเดียว เราออกแบบแผงวงจรให้ติดตั้ง IGBT ที่เข้ากันได้หลายแบบ ซึ่งช่วยรักษาความต่อเนื่องของอุปทานและคุมต้นทุนของเครื่องสำเร็จรูปไว้ได้ หากตลาดของคุณต้องการสเปกอื่นในภายหลัง ก็ไม่ต้องออกแบบแผงวงจรใหม่ตั้งแต่ต้น',
  },
  tr: {
    igbtControlBody:
      'Cilt tonu algılama, bu anahtarın önemli olmasının nedenidir. Sensör tonu her flaştan hemen önce belirler, dolayısıyla cihazın enerjisini aynı zaman ölçeğinde değiştirmesi gerekir. Bir IGBT, kondansatörün ne kadar süre deşarj olmasına izin verildiğini kontrol ederek flaş enerjisini belirler: daha uzun iletim süresi daha fazla enerji açığa çıkarır, daha kısa süre daha az. Deşarj süresini ayarlamak hızlıdır ve enerji seviyesinin seans başlamadan sabitlenmesi yerine flaştan flaşa sensörü izlemesini sağlayan da budur.',
    igbtSourcingTitle: 'Tek işlev, birden çok parça numarası',
    igbtSourcingBody:
      'Bu roldeki bir IGBT tek bir parça numarasına bağlı değildir. Piyasada aynı işlev için birbiriyle uyumlu çok sayıda eşdeğer parça vardır; bu yüzden bir tasarım tek tedarikçiye bağlı kalmak zorunda değildir. Kartlarımızı birden fazla uyumlu IGBT takılabilecek şekilde tasarlıyoruz — bu, tedarik sürekliliğini korur ve bitmiş cihazın maliyetini kontrol altında tutar. Pazarınız ileride farklı bir şartname gerektirirse kartın sıfırdan yeniden tasarlanması gerekmez.',
  },
  vi: {
    igbtControlBody:
      'Cảm biến tông màu da là lý do công tắc này quan trọng. Cảm biến quyết định tông ngay trước mỗi lần phát xung, nên thiết bị phải thay đổi năng lượng trong cùng thang thời gian đó. IGBT đặt năng lượng phát xung bằng cách điều khiển tụ điện được phép phóng điện trong bao lâu — thời gian dẫn dài hơn giải phóng nhiều năng lượng hơn, ngắn hơn thì ít hơn. Việc điều chỉnh thời gian phóng điện diễn ra nhanh, và đó là điều cho phép mức năng lượng bám theo cảm biến qua từng lần phát xung thay vì cố định trước khi buổi bắt đầu.',
    igbtSourcingTitle: 'Một chức năng, nhiều mã linh kiện',
    igbtSourcingBody:
      'IGBT ở vai trò này không bị gắn với một mã linh kiện duy nhất. Trên thị trường có nhiều linh kiện tương đương, thay thế được cho nhau cho cùng chức năng, nên một thiết kế không buộc phải phụ thuộc vào một nhà cung cấp. Chúng tôi thiết kế bo mạch để lắp được nhiều loại IGBT tương thích — điều này bảo vệ tính liên tục của nguồn cung và giữ chi phí thiết bị thành phẩm trong tầm kiểm soát. Nếu sau này thị trường của bạn cần thông số khác, bo mạch không phải thiết kế lại từ đầu.',
  },
};

/** 按语种取一组内容，含大小写归一化与 en 兜底 */
function pickLocale<T>(map: Record<string, T>, locale: string | undefined, fallback: T): T {
  if (!locale) return fallback;
  const lower: Record<string, T> = {};
  for (const [k, v] of Object.entries(map)) lower[k.toLowerCase()] = v;
  const candidates = [locale, locale.toLowerCase(), locale.split('-')[0], locale.replace(/-/g, '')];
  for (const c of candidates) {
    if (c && map[c]) return map[c];
    if (c && lower[c.toLowerCase()]) return lower[c.toLowerCase()];
  }
  return fallback;
}

/** locale 归一化 + 三组内容合并：调用方只看到一个完整对象 */
export function getLumi2Technology(locale: string | undefined): Lumi2TechnologyCopy {
  return {
    ...pickLocale(LUMI2_TECHNOLOGY, locale, LUMI2_TECHNOLOGY.en),
    ...pickLocale(LUMI2_SENSING_DETAIL, locale, LUMI2_SENSING_DETAIL.en),
    ...pickLocale(LUMI2_IGBT_DETAIL, locale, LUMI2_IGBT_DETAIL.en),
  };
}
