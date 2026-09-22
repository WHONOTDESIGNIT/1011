/**
 * 产品详情页「肤色与毛发适配性」文案（按语种）。
 *
 * 位置：`src/pages/products/[slug].astro`，规格区与「关键特性」之间。
 * 为什么独立成文件而不写进 messages/*.json：
 *   ① 22 个 messages 文件是 0.5–2.9 MB 大文件、格式不统一（en 用 CRLF、其余用 LF），
 *      脚本整份重写会产生无法人工复核的 diff；② 本组文案是「一组同构短句 + 固定结构」，
 *      集中一处更好审核；③ 批次 B 正在并发改 messages/*.json，避免争用。
 *
 * 口径来源（老板 2026-09-21 全站口径统一指示）：
 *   - 肤色：**I–IV ✅ 适用；V ⚠️ 仅最低档位 + 先斑贴测试；VI ❌ 不适用**。
 *     （2026-09-21 前本站同时跑着 4 套互相冲突的口径：本文件与 messages/en.json 写 I–V，
 *       llms.txt 写 I–IV 且 Eirene/Euno 写 I–III，iplForBrands.compare.limitBody 还改推 diode laser。
 *       现已全站收敛到上表，llms.txt / messages / 博文同口径。）
 *   - 毛发：**除浅金色（light blonde）、红色、浅灰色外**均适用。
 *   - 表述借鉴 Philips 的科普式讲法：先说结论，再用一句话讲机理（黑色素吸光转热）。
 */

export type SuitabilityCopy = {
  heading: string;
  intro: string;
  skinTitle: string;
  skinBody: string;
  hairTitle: string;
  hairBody: string;
  note: string;
  imageAlt: string;
};

export const SKIN_HAIR_SUITABILITY: Record<string, SuitabilityCopy> = {
  en: {
    heading: 'Skin and hair suitability',
    intro: 'Two things decide whether IPL is right for you: your skin tone and your natural hair colour.',
    skinTitle: 'Skin tone: Fitzpatrick I–IV',
    skinBody:
      'Suitable for skin tones from very fair through olive and light brown — Fitzpatrick types I to IV. Type V (brown skin) is suitable only at the lowest energy levels and after a patch test. Type VI (deeply pigmented skin) is not suitable: the light cannot be delivered at a safe, effective dose, so we do not recommend IPL for that skin tone.',
    hairTitle: 'Hair colour: all natural colours except light blonde, red and light grey',
    hairBody:
      'IPL works because the melanin in your hair absorbs the light and converts it into heat at the root. Dark blonde, brown and black hair contain enough melanin to be treated effectively. Light blonde, red and light grey hair contain too little, so results are poor.',
    note: 'Patch-test a small area 24 hours before your first full treatment, and follow the manual for your model. Individual results vary.',
    imageAlt:
      'IPL suitability chart: Fitzpatrick skin tones I to IV are suitable, type V is suitable at lower energy levels with a patch test, and type VI is not; dark blonde, brown and black hair are suitable, while light blonde, red and light grey hair are not.',
  },
  ar: {
    heading: 'ملاءمة الجلد والشعر',
    intro: 'هناك أمران يحددان ما إذا كان IPL مناسبًا لك: لون بشرتك ولون شعرك الطبيعي.',
    skinTitle: 'لون البشرة: Fitzpatrick I–IV',
    skinBody:
      'مناسب لدرجات البشرة من الفاتحة جدًا إلى الزيتونية والبنية الفاتحة — أنواع Fitzpatrick من I إلى IV. النوع V (البشرة البنية) مناسب فقط في أدنى مستويات الطاقة وبعد اختبار على منطقة صغيرة. غير مناسب للنوع VI من Fitzpatrick (البشرة شديدة التصبغ): لا يمكن إيصال الضوء بجرعة آمنة وفعّالة، لذلك لا نوصي باستخدام IPL لهذه الدرجة من البشرة.',
    hairTitle: 'لون الشعر: جميع الألوان الطبيعية باستثناء الأشقر الفاتح والأحمر والرمادي الفاتح',
    hairBody:
      'يعمل IPL لأن الميلانين في شعرك يمتص الضوء ويحوّله إلى حرارة عند الجذر. الشعر الأشقر الداكن والبني والأسود يحتوي على ميلانين كافٍ لعلاجه بفعالية. أما الشعر الأشقر الفاتح والأحمر والرمادي الفاتح فيحتوي على كمية قليلة جدًا، لذا تكون النتائج ضعيفة.',
    note: 'جرّب على منطقة صغيرة 24 ساعة قبل أول جلسة كاملة، واتبع دليل جهازك. تختلف النتائج من شخص لآخر.',
    imageAlt:
      'مخطط ملاءمة IPL: درجات بشرة Fitzpatrick من I إلى IV مناسبة، والنوع V مناسب في مستويات طاقة أقل مع اختبار على منطقة صغيرة، والنوع VI غير مناسب؛ الشعر الأشقر الداكن والبني والأسود مناسب، بينما الشعر الأشقر الفاتح والأحمر والرمادي الفاتح غير مناسب.',
  },
  cs: {
    heading: 'Vhodnost pro pleť a vlasy',
    intro: 'O tom, zda je IPL pro vás vhodná, rozhodují dvě věci: tón vaší pleti a přirozená barva vlasů.',
    skinTitle: 'Tón pleti: Fitzpatrick I–IV',
    skinBody:
      'Vhodné pro tóny pleti od velmi světlé po olivovou a světle hnědou — typy Fitzpatrick I až IV. Typ V (hnědá pleť) je vhodný pouze při nejnižších úrovních energie a po zkoušce na malé oblasti. Nevhodné pro typ Fitzpatrick VI (výrazně pigmentovaná pleť): světlo nelze dodat v bezpečné a účinné dávce, proto IPL pro tento tón pleti nedoporučujeme.',
    hairTitle: 'Barva vlasů: všechny přirozené barvy kromě světlé blond, zrzavé a světle šedé',
    hairBody:
      'IPL funguje díky tomu, že melanin ve vlasech pohlcuje světlo a přeměňuje je na teplo u kořínku. Tmavě blond, hnědé a černé vlasy obsahují dost melaninu, aby mohly být účinně ošetřeny. Světle blond, zrzavé a světle šedé vlasy ho obsahují příliš málo, a proto jsou výsledky slabé.',
    note: '24 hodin před prvním plným ošetřením proveďte zkoušku na malé oblasti a řiďte se manuálem ke svému modelu. Výsledky se u každého liší.',
    imageAlt:
      'Tabulka vhodnosti IPL: tóny pleti Fitzpatrick I až IV jsou vhodné, typ V je vhodný při nižších úrovních energie a po zkoušce na malé oblasti a typ VI nikoli; tmavě blond, hnědé a černé vlasy jsou vhodné, zatímco světle blond, zrzavé a světle šedé vlasy vhodné nejsou.',
  },
  de: {
    heading: 'Eignung für Haut und Haare',
    intro: 'Zwei Dinge entscheiden darüber, ob IPL für Sie geeignet ist: Ihr Hautton und Ihre natürliche Haarfarbe.',
    skinTitle: 'Hautton: Fitzpatrick I–IV',
    skinBody:
      'Geeignet für Hauttöne von sehr hell bis oliv und hellbraun — Fitzpatrick-Typ I bis IV. Typ V (braune Haut) ist nur bei den niedrigsten Energiestufen und nach einem Test an einer kleinen Stelle geeignet. Nicht geeignet für Fitzpatrick-Typ VI (stark pigmentierte Haut): Das Licht lässt sich nicht in einer sicheren, wirksamen Dosis abgeben, daher empfehlen wir IPL für diesen Hautton nicht.',
    hairTitle: 'Haarfarbe: alle natürlichen Farben außer hellblond, rot und hellgrau',
    hairBody:
      'IPL wirkt, weil das Melanin in Ihrem Haar das Licht aufnimmt und es an der Wurzel in Wärme umwandelt. Dunkelblondes, braunes und schwarzes Haar enthält genug Melanin, um wirksam behandelt zu werden. Hellblondes, rotes und hellgraues Haar enthält zu wenig, daher sind die Ergebnisse schlecht.',
    note: 'Testen Sie 24 Stunden vor Ihrer ersten vollständigen Behandlung eine kleine Stelle und befolgen Sie die Anleitung für Ihr Modell. Die Ergebnisse sind individuell unterschiedlich.',
    imageAlt:
      'IPL-Eignungstabelle: Fitzpatrick-Hauttöne I bis IV sind geeignet, Typ V ist bei niedrigeren Energiestufen und nach einem Test an einer kleinen Stelle geeignet, Typ VI nicht; dunkelblondes, braunes und schwarzes Haar ist geeignet, hellblondes, rotes und hellgraues Haar dagegen nicht.',
  },
  el: {
    heading: 'Καταλληλότητα για δέρμα και τρίχες',
    intro: 'Δύο πράγματα καθορίζουν αν το IPL είναι κατάλληλο για εσάς: ο τόνος του δέρματός σας και το φυσικό χρώμα των τριχών σας.',
    skinTitle: 'Τόνος δέρματος: Fitzpatrick I–IV',
    skinBody:
      'Κατάλληλο για τόνους δέρματος από πολύ ανοιχτό έως ελιά και ανοιχτό καφέ — τύποι Fitzpatrick I έως IV. Ο τύπος V (καφέ δέρμα) είναι κατάλληλος μόνο στα χαμηλότερα επίπεδα ενέργειας και μετά από δοκιμή σε μικρή περιοχή. Δεν είναι κατάλληλο για τον τύπο Fitzpatrick VI (έντονα μελαγχρωματισμένο δέρμα): το φως δεν μπορεί να εφαρμοστεί σε ασφαλή και αποτελεσματική δόση, επομένως δεν συνιστούμε IPL για αυτόν τον τόνο δέρματος.',
    hairTitle: 'Χρώμα τρίχας: όλα τα φυσικά χρώματα εκτός από το ανοιχτό ξανθό, το κόκκινο και το ανοιχτό γκρι',
    hairBody:
      'Το IPL λειτουργεί επειδή η μελανίνη στις τρίχες σας απορροφά το φως και το μετατρέπει σε θερμότητα στη ρίζα. Οι τρίχες σε σκούρο ξανθό, καφέ και μαύρο χρώμα περιέχουν αρκετή μελανίνη για να αντιμετωπιστούν αποτελεσματικά. Οι τρίχες σε ανοιχτό ξανθό, κόκκινο και ανοιχτό γκρι χρώμα περιέχουν πολύ λίγη, επομένως τα αποτελέσματα είναι φτωχά.',
    note: 'Κάντε δοκιμή σε μια μικρή περιοχή 24 ώρες πριν από την πρώτη πλήρη συνεδρία και ακολουθήστε το εγχειρίδιο του μοντέλου σας. Τα αποτελέσματα διαφέρουν από άτομο σε άτομο.',
    imageAlt:
      'Πίνακας καταλληλότητας IPL: οι τόνοι δέρματος Fitzpatrick I έως IV είναι κατάλληλοι, ο τύπος V είναι κατάλληλος στα χαμηλότερα επίπεδα ενέργειας και μετά από δοκιμή σε μικρή περιοχή και ο τύπος VI δεν είναι· οι τρίχες σε σκούρο ξανθό, καφέ και μαύρο χρώμα είναι κατάλληλες, ενώ οι τρίχες σε ανοιχτό ξανθό, κόκκινο και ανοιχτό γκρι χρώμα δεν είναι.',
  },
  es: {
    heading: 'Idoneidad para la piel y el vello',
    intro: 'Dos cosas determinan si el IPL es adecuado para usted: el tono de su piel y el color natural de su vello.',
    skinTitle: 'Tono de piel: Fitzpatrick I–IV',
    skinBody:
      'Adecuado para tonos de piel desde muy claro hasta aceitunado y moreno claro — tipos Fitzpatrick I a IV. El tipo V (piel morena) es adecuado solo en los niveles de energía más bajos y tras una prueba en una zona pequeña. No es adecuado para el tipo Fitzpatrick VI (piel muy pigmentada): la luz no puede aplicarse en una dosis segura y eficaz, por lo que no recomendamos el IPL para ese tono de piel.',
    hairTitle: 'Color del vello: todos los colores naturales excepto rubio claro, pelirrojo y gris claro',
    hairBody:
      'El IPL funciona porque la melanina del vello absorbe la luz y la convierte en calor en la raíz. El vello rubio oscuro, castaño y negro contiene melanina suficiente para tratarse con eficacia. El vello rubio claro, pelirrojo y gris claro contiene muy poca, por lo que los resultados son pobres.',
    note: 'Haga una prueba en una zona pequeña 24 horas antes de su primer tratamiento completo y siga el manual de su modelo. Los resultados varían de una persona a otra.',
    imageAlt:
      'Tabla de idoneidad del IPL: los tonos de piel Fitzpatrick I a IV son adecuados, el tipo V es adecuado en los niveles de energía más bajos y tras una prueba en una zona pequeña, y el tipo VI no lo es; el vello rubio oscuro, castaño y negro es adecuado, mientras que el rubio claro, pelirrojo y gris claro no lo son.',
  },
  fa: {
    heading: 'مناسب بودن برای پوست و مو',
    intro: 'دو چیز تعیین می‌کند که آیا IPL برای شما مناسب است: رنگ پوست و رنگ طبیعی موی شما.',
    skinTitle: 'رنگ پوست: Fitzpatrick I–IV',
    skinBody:
      'برای رنگ‌های پوست از بسیار روشن تا زیتونی و قهوه‌ای روشن مناسب است — انواع Fitzpatrick از I تا IV. نوع V (پوست قهوه‌ای) تنها در پایین‌ترین سطوح انرژی و پس از تست روی ناحیه‌ای کوچک مناسب است. برای نوع VI (پوست با پیگمانتاسیون شدید) مناسب نیست: نور نمی‌تواند با دوز ایمن و مؤثر اعمال شود، بنابراین IPL را برای این رنگ پوست توصیه نمی‌کنیم.',
    hairTitle: 'رنگ مو: همه رنگ‌های طبیعی به‌جز بلوند روشن، قرمز و خاکستری روشن',
    hairBody:
      'IPL کار می‌کند چون ملانین موجود در موی شما نور را جذب و آن را در ریشه به گرما تبدیل می‌کند. موی بلوند تیره، قهوه‌ای و مشکی ملانین کافی برای درمان مؤثر دارد. موی بلوند روشن، قرمز و خاکستری روشن ملانین بسیار کمی دارد، بنابراین نتایج ضعیف است.',
    note: '24 ساعت پیش از نخستین جلسه کامل، روی ناحیه‌ای کوچک تست کنید و دستورالعمل دستگاه خود را دنبال کنید. نتایج در افراد مختلف متفاوت است.',
    imageAlt:
      'نمودار مناسب بودن IPL: رنگ‌های پوست Fitzpatrick از I تا IV مناسب هستند، نوع V در سطوح انرژی پایین‌تر و پس از تست روی ناحیه‌ای کوچک مناسب است و نوع VI مناسب نیست؛ موی بلوند تیره، قهوه‌ای و مشکی مناسب است، در حالی که موی بلوند روشن، قرمز و خاکستری روشن مناسب نیست.',
  },
  fr: {
    heading: "Compatibilité avec la peau et les poils",
    intro: "Deux éléments déterminent si l’IPL vous convient : le ton de votre peau et la couleur naturelle de vos poils.",
    skinTitle: "Ton de peau : Fitzpatrick I–IV",
    skinBody:
      "Convient aux tons de peau allant de très clair à olive et brun clair — types Fitzpatrick I à IV. Le type V (peau brune) ne convient qu’aux niveaux d’énergie les plus bas et après un test sur une petite zone. Ne convient pas au type Fitzpatrick VI (peau fortement pigmentée) : la lumière ne peut pas être délivrée à une dose sûre et efficace, c’est pourquoi nous ne recommandons pas l’IPL pour ce ton de peau.",
    hairTitle: "Couleur des poils : toutes les couleurs naturelles sauf blond clair, roux et gris clair",
    hairBody:
      "L’IPL fonctionne parce que la mélanine de vos poils absorbe la lumière et la transforme en chaleur à la racine. Les poils blond foncé, bruns et noirs contiennent assez de mélanine pour être traités efficacement. Les poils blond clair, roux et gris clair en contiennent trop peu, d’où des résultats médiocres.",
    note: "Testez une petite zone 24 heures avant votre première séance complète et suivez le manuel de votre modèle. Les résultats varient d’une personne à l’autre.",
    imageAlt:
      "Tableau de compatibilité IPL : les tons de peau Fitzpatrick I à IV conviennent, le type V convient aux niveaux d’énergie les plus bas et après un test sur une petite zone, et le type VI non ; les poils blond foncé, bruns et noirs conviennent, tandis que les poils blond clair, roux et gris clair ne conviennent pas.",
  },
  he: {
    heading: 'התאמה לעור ולשיער',
    intro: 'שני דברים קובעים אם IPL מתאים לך: גוון העור שלך וצבע השיער הטבעי שלך.',
    skinTitle: 'גוון עור: Fitzpatrick I–IV',
    skinBody:
      'מתאים לגווני עור מבהיר מאוד ועד זית וחום בהיר — סוגי Fitzpatrick I עד IV. סוג V (עור חום) מתאים רק ברמות האנרגיה הנמוכות ביותר ואחרי בדיקה על אזור קטן. לא מתאים לסוג Fitzpatrick VI (עור בעל פיגמנטציה עמוקה): לא ניתן להעביר את האור במינון בטוח ואפקטיבי, ולכן איננו ממליצים על IPL לגוון עור זה.',
    hairTitle: 'צבע שיער: כל הצבעים הטבעיים למעט בלונד בהיר, אדום ואפור בהיר',
    hairBody:
      'IPL פועל משום שהמלנין בשיער שלך סופג את האור והופך אותו לחום בשורש. שיער בלונד כהה, חום ושחור מכיל מספיק מלנין כדי לטפל בו ביעילות. שיער בלונד בהיר, אדום ואפור בהיר מכיל מעט מדי, ולכן התוצאות חלשות.',
    note: 'בצעו בדיקה על אזור קטן 24 שעות לפני הטיפול המלא הראשון, ופעלו לפי המדריך של הדגם שלכם. התוצאות משתנות מאדם לאדם.',
    imageAlt:
      'טבלת התאמה ל-IPL: גווני עור Fitzpatrick I עד IV מתאימים, סוג V מתאים ברמות אנרגיה נמוכות יותר ואחרי בדיקה על אזור קטן, וסוג VI אינו מתאים; שיער בלונד כהה, חום ושחור מתאים, ואילו בלונד בהיר, אדום ואפור בהיר אינם מתאימים.',
  },
  id: {
    heading: 'Kesesuaian untuk kulit dan rambut',
    intro: 'Ada dua hal yang menentukan apakah IPL cocok untuk Anda: warna kulit dan warna rambut alami Anda.',
    skinTitle: 'Warna kulit: Fitzpatrick I–IV',
    skinBody:
      'Cocok untuk warna kulit dari sangat terang hingga zaitun dan cokelat muda — tipe Fitzpatrick I sampai IV. Tipe V (kulit cokelat) hanya cocok pada tingkat energi terendah dan setelah uji coba pada area kecil. Tidak cocok untuk tipe Fitzpatrick VI (kulit sangat berpigmen): cahaya tidak dapat diberikan dalam dosis yang aman dan efektif, sehingga kami tidak menyarankan IPL untuk warna kulit tersebut.',
    hairTitle: 'Warna rambut: semua warna alami kecuali pirang terang, merah, dan abu-abu terang',
    hairBody:
      'IPL bekerja karena melanin pada rambut Anda menyerap cahaya dan mengubahnya menjadi panas di akar. Rambut pirang gelap, cokelat, dan hitam mengandung cukup melanin untuk ditangani secara efektif. Rambut pirang terang, merah, dan abu-abu terang mengandung terlalu sedikit, sehingga hasilnya kurang baik.',
    note: 'Uji coba pada area kecil 24 jam sebelum perawatan penuh pertama Anda, dan ikuti panduan untuk model Anda. Hasil dapat berbeda pada setiap orang.',
    imageAlt:
      'Bagan kesesuaian IPL: warna kulit Fitzpatrick I sampai IV cocok, tipe V cocok pada tingkat energi yang lebih rendah dan setelah uji coba pada area kecil, dan tipe VI tidak; rambut pirang gelap, cokelat, dan hitam cocok, sedangkan pirang terang, merah, dan abu-abu terang tidak cocok.',
  },
  it: {
    heading: "Idoneità per pelle e peli",
    intro: "Due fattori determinano se l’IPL è adatto a te: il tono della tua pelle e il colore naturale dei tuoi peli.",
    skinTitle: "Tono della pelle: Fitzpatrick I–IV",
    skinBody:
      "Adatto ai toni di pelle dal molto chiaro all’olivastro e al marrone chiaro — tipi Fitzpatrick da I a IV. Il tipo V (pelle marrone) è adatto solo ai livelli di energia più bassi e dopo un test su una piccola area. Non adatto al tipo Fitzpatrick VI (pelle molto pigmentata): la luce non può essere erogata a una dose sicura ed efficace, per questo non consigliamo l’IPL per quel tono di pelle.",
    hairTitle: "Colore dei peli: tutti i colori naturali tranne biondo chiaro, rosso e grigio chiaro",
    hairBody:
      "L’IPL funziona perché la melanina nei peli assorbe la luce e la trasforma in calore alla radice. I peli biondo scuro, castani e neri contengono melanina sufficiente per essere trattati efficacemente. I peli biondo chiaro, rossi e grigio chiaro ne contengono troppo poca, quindi i risultati sono scarsi.",
    note: "Fai un test su una piccola area 24 ore prima del primo trattamento completo e segui il manuale del tuo modello. I risultati variano da persona a persona.",
    imageAlt:
      "Tabella di idoneità IPL: i toni di pelle Fitzpatrick da I a IV sono adatti, il tipo V è adatto ai livelli di energia più bassi e dopo un test su una piccola area, e il tipo VI no; i peli biondo scuro, castani e neri sono adatti, mentre i biondo chiaro, rossi e grigio chiaro non lo sono.",
  },
  ja: {
    heading: '肌と毛の適合性',
    intro: 'IPL があなたに適しているかどうかは、2 つの要素で決まります。肌のトーンと、自然な毛の色です。',
    skinTitle: '肌のトーン：Fitzpatrick I–IV',
    skinBody:
      'とても明るい肌からオリーブ色、明るい褐色の肌まで、Fitzpatrick タイプ I から IV まで対応しています。Fitzpatrick タイプ V（褐色の肌）は、最も低いエネルギー段階で、パッチテストを行った場合にのみ対応しています。Fitzpatrick タイプ VI（色素が非常に濃い肌）には適していません。安全で効果的な出力で光を照射できないため、この肌のトーンには IPL をおすすめしません。',
    hairTitle: '毛の色：明るいブロンド、赤、明るいグレーを除くすべての自然な色',
    hairBody:
      'IPL が効果を発揮するのは、毛の中のメラニンが光を吸収し、毛根で熱に変えるからです。濃いブロンド、茶色、黒の毛はメラニンを十分に含むため、効果的に施術できます。明るいブロンド、赤、明るいグレーの毛はメラニンが少なすぎるため、十分な結果が得られません。',
    note: '初めての本施術の 24 時間前に小さな範囲でパッチテストを行い、お使いのモデルの取扱説明書に従ってください。効果には個人差があります。',
    imageAlt:
      'IPL 適合表：Fitzpatrick の肌トーン I から IV は適合、タイプ V は低いエネルギー段階でパッチテストを行えば適合、タイプ VI は非適合です。濃いブロンド、茶色、黒の毛は適合し、明るいブロンド、赤、明るいグレーの毛は適合しません。',
  },
  ko: {
    heading: '피부와 털 적합성',
    intro: 'IPL이 나에게 맞는지는 두 가지로 결정됩니다. 피부 톤과 자연스러운 털 색입니다.',
    skinTitle: '피부 톤: Fitzpatrick I–IV',
    skinBody:
      '아주 밝은 피부부터 올리브색과 밝은 갈색 피부까지 적합합니다 — Fitzpatrick I형에서 IV형까지. Fitzpatrick V형(갈색 피부)은 가장 낮은 에너지 단계에서 패치 테스트를 거친 경우에만 적합합니다. Fitzpatrick VI형(색소가 매우 진한 피부)에는 적합하지 않습니다. 안전하고 효과적인 용량으로 빛을 조사할 수 없으므로 이 피부 톤에는 IPL을 권장하지 않습니다.',
    hairTitle: '털 색: 밝은 금발, 붉은색, 밝은 회색을 제외한 모든 자연 색',
    hairBody:
      'IPL은 털 속 멜라닌이 빛을 흡수해 모근에서 열로 바꾸기 때문에 작동합니다. 어두운 금발, 갈색, 검은색 털은 멜라닌이 충분해 효과적으로 시술할 수 있습니다. 밝은 금발, 붉은색, 밝은 회색 털은 멜라닌이 너무 적어 결과가 좋지 않습니다.',
    note: '첫 전체 시술 24시간 전에 작은 부위에 패치 테스트를 하고, 사용 중인 모델의 설명서를 따르세요. 결과는 개인차가 있습니다.',
    imageAlt:
      'IPL 적합성 표: Fitzpatrick 피부 톤 I에서 IV는 적합하고, V형은 낮은 에너지 단계에서 패치 테스트를 하면 적합하며, VI형은 적합하지 않습니다. 어두운 금발, 갈색, 검은색 털은 적합하며, 밝은 금발, 붉은색, 밝은 회색 털은 적합하지 않습니다.',
  },
  nl: {
    heading: 'Geschiktheid voor huid en haar',
    intro: 'Twee dingen bepalen of IPL bij u past: uw huidtint en uw natuurlijke haarkleur.',
    skinTitle: 'Huidtint: Fitzpatrick I–IV',
    skinBody:
      'Geschikt voor huidtinten van zeer licht tot olijf en lichtbruin — Fitzpatrick-type I tot en met IV. Type V (bruine huid) is alleen geschikt bij de laagste energieniveaus en na een test op een klein stukje huid. Niet geschikt voor Fitzpatrick-type VI (sterk gepigmenteerde huid): het licht kan niet in een veilige, effectieve dosis worden afgegeven, daarom raden wij IPL voor die huidtint niet aan.',
    hairTitle: 'Haarkleur: alle natuurlijke kleuren behalve lichtblond, rood en lichtgrijs',
    hairBody:
      'IPL werkt doordat het melanine in uw haar het licht opneemt en het bij de wortel omzet in warmte. Donkerblond, bruin en zwart haar bevat genoeg melanine om effectief te worden behandeld. Lichtblond, rood en lichtgrijs haar bevat te weinig, waardoor de resultaten matig zijn.',
    note: 'Test 24 uur voor uw eerste volledige behandeling een klein stukje huid en volg de handleiding van uw model. De resultaten verschillen per persoon.',
    imageAlt:
      'IPL-geschiktheidstabel: Fitzpatrick-huidtinten I tot en met IV zijn geschikt, type V is geschikt bij lagere energieniveaus en na een test op een klein stukje huid, en type VI niet; donkerblond, bruin en zwart haar is geschikt, terwijl lichtblond, rood en lichtgrijs haar dat niet is.',
  },
  pl: {
    heading: 'Odpowiedniość dla skóry i włosów',
    intro: 'O tym, czy IPL jest dla Ciebie odpowiedni, decydują dwie rzeczy: odcień Twojej skóry i naturalny kolor włosów.',
    skinTitle: 'Odcień skóry: Fitzpatrick I–IV',
    skinBody:
      'Odpowiedni dla odcieni skóry od bardzo jasnej do oliwkowej i jasnobrązowej — typy Fitzpatrick od I do IV. Typ V (brązowa skóra) jest odpowiedni tylko przy najniższych poziomach energii i po wykonaniu próby na niewielkim obszarze. Nieodpowiedni dla typu Fitzpatrick VI (skóra silnie pigmentowana): światła nie można dostarczyć w bezpiecznej i skutecznej dawce, dlatego nie zalecamy IPL dla tego odcienia skóry.',
    hairTitle: 'Kolor włosów: wszystkie naturalne kolory poza jasnym blondem, rudym i jasnoszarym',
    hairBody:
      'IPL działa, ponieważ melanina we włosach pochłania światło i zamienia je w ciepło u nasady. Ciemnoblond, brązowe i czarne włosy zawierają wystarczającą ilość melaniny, aby zabieg był skuteczny. Jasnoblond, rude i jasnoszare włosy zawierają jej zbyt mało, dlatego efekty są słabe.',
    note: '24 godziny przed pierwszym pełnym zabiegiem wykonaj próbę na niewielkim obszarze i postępuj zgodnie z instrukcją obsługi swojego modelu. Wyniki różnią się u poszczególnych osób.',
    imageAlt:
      'Tabela odpowiedniości IPL: odcienie skóry Fitzpatrick od I do IV są odpowiednie, typ V jest odpowiedni przy niższych poziomach energii i po próbie na niewielkim obszarze, a typ VI nie; ciemnoblond, brązowe i czarne włosy są odpowiednie, natomiast jasnoblond, rude i jasnoszare nie są.',
  },
  'pt-BR': {
    heading: 'Adequação para pele e pelos',
    intro: 'Duas coisas determinam se o IPL é adequado para você: o tom da sua pele e a cor natural dos seus pelos.',
    skinTitle: 'Tom de pele: Fitzpatrick I–IV',
    skinBody:
      'Adequado para tons de pele do muito claro ao oliváceo e moreno claro — tipos Fitzpatrick I a IV. O tipo V (pele morena) é adequado apenas nos níveis de energia mais baixos e após um teste em uma pequena área. Não é adequado para o tipo Fitzpatrick VI (pele muito pigmentada): a luz não pode ser aplicada em uma dose segura e eficaz, por isso não recomendamos o IPL para esse tom de pele.',
    hairTitle: 'Cor dos pelos: todas as cores naturais exceto loiro claro, ruivo e cinza claro',
    hairBody:
      'O IPL funciona porque a melanina dos seus pelos absorve a luz e a transforma em calor na raiz. Pelos loiro escuro, castanhos e pretos contêm melanina suficiente para serem tratados com eficácia. Pelos loiro claro, ruivos e cinza claro contêm pouca melanina, por isso os resultados são fracos.',
    note: 'Faça um teste em uma pequena área 24 horas antes do primeiro tratamento completo e siga o manual do seu modelo. Os resultados variam de pessoa para pessoa.',
    imageAlt:
      'Tabela de adequação do IPL: os tons de pele Fitzpatrick I a IV são adequados, o tipo V é adequado nos níveis de energia mais baixos e após um teste em uma pequena área, e o tipo VI não; pelos loiro escuro, castanhos e pretos são adequados, enquanto loiro claro, ruivos e cinza claro não são.',
  },
  'pt-PT': {
    heading: 'Adequação para pele e pelos',
    intro: 'Duas coisas determinam se o IPL é adequado para si: o tom da sua pele e a cor natural dos seus pelos.',
    skinTitle: 'Tom de pele: Fitzpatrick I–IV',
    skinBody:
      'Adequado para tons de pele do muito claro ao oliváceo e moreno claro — tipos Fitzpatrick I a IV. O tipo V (pele morena) é adequado apenas nos níveis de energia mais baixos e após um teste numa pequena área. Não é adequado para o tipo Fitzpatrick VI (pele muito pigmentada): a luz não pode ser aplicada numa dose segura e eficaz, por isso não recomendamos o IPL para esse tom de pele.',
    hairTitle: 'Cor dos pelos: todas as cores naturais exceto loiro claro, ruivo e cinzento claro',
    hairBody:
      'O IPL funciona porque a melanina dos seus pelos absorve a luz e transforma-a em calor na raiz. Pelos loiro escuro, castanhos e pretos contêm melanina suficiente para serem tratados com eficácia. Pelos loiro claro, ruivos e cinzento claro contêm pouca melanina, por isso os resultados são fracos.',
    note: 'Faça um teste numa pequena área 24 horas antes do primeiro tratamento completo e siga o manual do seu modelo. Os resultados variam de pessoa para pessoa.',
    imageAlt:
      'Tabela de adequação do IPL: os tons de pele Fitzpatrick I a IV são adequados, o tipo V é adequado nos níveis de energia mais baixos e após um teste numa pequena área, e o tipo VI não; pelos loiro escuro, castanhos e pretos são adequados, enquanto loiro claro, ruivos e cinzento claro não são.',
  },
  ro: {
    heading: 'Potrivirea pentru piele și păr',
    intro: 'Două lucruri decid dacă IPL este potrivit pentru tine: tonul pielii și culoarea naturală a părului.',
    skinTitle: 'Tonul pielii: Fitzpatrick I–IV',
    skinBody:
      'Potrivit pentru tonuri de piele de la foarte deschis la oliv și brun deschis — tipurile Fitzpatrick I până la IV. Tipul V (piele brună) este potrivit doar la cele mai scăzute niveluri de energie și după un test pe o zonă mică. Nu este potrivit pentru tipul Fitzpatrick VI (piele puternic pigmentată): lumina nu poate fi aplicată într-o doză sigură și eficientă, așa că nu recomandăm IPL pentru acest ton de piele.',
    hairTitle: 'Culoarea părului: toate culorile naturale, în afară de blond deschis, roșcat și gri deschis',
    hairBody:
      'IPL funcționează pentru că melanina din păr absoarbe lumina și o transformă în căldură la rădăcină. Părul blond închis, brun și negru conține suficientă melanină pentru a fi tratat eficient. Părul blond deschis, roșcat și gri deschis conține prea puțină, așa că rezultatele sunt slabe.',
    note: 'Testează o zonă mică 24 de ore înainte de prima ședință completă și urmează manualul modelului tău. Rezultatele variază de la o persoană la alta.',
    imageAlt:
      'Tabel de potrivire IPL: tonurile de piele Fitzpatrick I până la IV sunt potrivite, tipul V este potrivit la niveluri de energie mai scăzute și după un test pe o zonă mică, iar tipul VI nu; părul blond închis, brun și negru este potrivit, în timp ce părul blond deschis, roșcat și gri deschis nu este.',
  },
  ru: {
    heading: 'Пригодность для кожи и волос',
    intro: 'Подходит ли вам IPL, определяют две вещи: тон вашей кожи и естественный цвет волос.',
    skinTitle: 'Тон кожи: Fitzpatrick I–IV',
    skinBody:
      'Подходит для тонов кожи от очень светлого до оливкового и светло-коричневого — типы Fitzpatrick с I по IV. Тип V (коричневая кожа) подходит только при самых низких уровнях энергии и после теста на небольшом участке. Не подходит для типа Fitzpatrick VI (сильно пигментированная кожа): свет невозможно подать в безопасной и эффективной дозе, поэтому мы не рекомендуем IPL для такого тона кожи.',
    hairTitle: 'Цвет волос: все естественные цвета, кроме светлого блонда, рыжего и светло-серого',
    hairBody:
      'IPL работает потому, что меланин в волосах поглощает свет и превращает его в тепло у корня. Волосы тёмного блонда, коричневые и чёрные содержат достаточно меланина, чтобы обработка была эффективной. Волосы светлого блонда, рыжие и светло-серые содержат его слишком мало, поэтому результат слабый.',
    note: 'За 24 часа до первой полной процедуры сделайте тест на небольшом участке и следуйте инструкции для вашей модели. Результаты у всех разные.',
    imageAlt:
      'Таблица пригодности IPL: тоны кожи Fitzpatrick с I по IV подходят, тип V подходит при более низких уровнях энергии и после теста на небольшом участке, а тип VI — нет; волосы тёмного блонда, коричневые и чёрные подходят, а светлого блонда, рыжие и светло-серые — нет.',
  },
  th: {
    heading: 'ความเหมาะสมสำหรับผิวและขน',
    intro: 'มีสองสิ่งตัดสินว่า IPL เหมาะกับคุณหรือไม่ คือสีผิวและสีขนตามธรรมชาติของคุณ',
    skinTitle: 'สีผิว: Fitzpatrick I–IV',
    skinBody:
      'เหมาะกับสีผิวตั้งแต่สีอ่อนมากจนถึงสีมะกอกและสีน้ำตาลอ่อน — Fitzpatrick ประเภท I ถึง IV ประเภท V (ผิวสีน้ำตาล) เหมาะสมเฉพาะที่ระดับพลังงานต่ำสุดและหลังจากทดสอบกับพื้นที่เล็ก ๆ แล้ว ไม่เหมาะกับ Fitzpatrick ประเภท VI (ผิวที่มีเม็ดสีเข้มมาก) เนื่องจากไม่สามารถยิงแสงในปริมาณที่ปลอดภัยและได้ผล จึงไม่แนะนำให้ใช้ IPL กับสีผิวประเภทนี้',
    hairTitle: 'สีขน: ทุกสีตามธรรมชาติ ยกเว้นสีบลอนด์อ่อน สีแดง และสีเทาอ่อน',
    hairBody:
      'IPL ทำงานได้เพราะเมลานินในเส้นขนดูดซับแสงและเปลี่ยนเป็นความร้อนที่รากขน ขนสีบลอนด์เข้ม สีน้ำตาล และสีดำมีเมลานินเพียงพอที่จะรักษาได้อย่างมีประสิทธิภาพ ส่วนขนสีบลอนด์อ่อน สีแดง และสีเทาอ่อนมีเมลานินน้อยเกินไป ผลลัพธ์จึงไม่ดี',
    note: 'ทดสอบกับพื้นที่เล็ก ๆ 24 ชั่วโมงก่อนการรักษาเต็มรูปแบบครั้งแรก และปฏิบัติตามคู่มือของรุ่นที่คุณใช้ ผลลัพธ์แตกต่างกันในแต่ละคน',
    imageAlt:
      'ตารางความเหมาะสมของ IPL: สีผิว Fitzpatrick I ถึง IV เหมาะสม ประเภท V เหมาะสมที่ระดับพลังงานต่ำลงและหลังจากทดสอบกับพื้นที่เล็ก ๆ แล้ว ส่วนประเภท VI ไม่เหมาะสม ขนสีบลอนด์เข้ม สีน้ำตาล และสีดำเหมาะสม ขณะที่ขนสีบลอนด์อ่อน สีแดง และสีเทาอ่อนไม่เหมาะสม',
  },
  tr: {
    heading: 'Cilt ve tüy uygunluğu',
    intro: "IPL'in size uygun olup olmadığını iki şey belirler: cilt tonunuz ve doğal tüy renginiz.",
    skinTitle: 'Cilt tonu: Fitzpatrick I–IV',
    skinBody:
      'Çok açık ten ile zeytin ve açık kahverengi arasındaki cilt tonları için uygundur — Fitzpatrick tip I ile IV arası. Tip V (kahverengi cilt) yalnızca en düşük enerji seviyelerinde ve küçük bir bölgede test yapıldıktan sonra uygundur. Fitzpatrick tip VI (yoğun pigmentli cilt) için uygun değildir: ışık güvenli ve etkili bir dozda verilemediği için bu cilt tonu için IPL önermiyoruz.',
    hairTitle: 'Tüy rengi: açık sarı, kızıl ve açık gri hariç tüm doğal renkler',
    hairBody:
      'IPL, tüylerinizdeki melanin ışığı emip kökte ısıya dönüştürdüğü için çalışır. Koyu sarı, kahverengi ve siyah tüyler etkili tedavi için yeterli melanin içerir. Açık sarı, kızıl ve açık gri tüyler ise çok az melanin içerdiğinden sonuçlar zayıf olur.',
    note: 'İlk tam uygulamadan 24 saat önce küçük bir bölgede test yapın ve modelinizin kılavuzunu izleyin. Sonuçlar kişiden kişiye değişir.',
    imageAlt:
      'IPL uygunluk tablosu: Fitzpatrick cilt tonları I ile IV uygundur, tip V daha düşük enerji seviyelerinde ve küçük bir bölgede test yapıldıktan sonra uygundur, tip VI uygun değildir; koyu sarı, kahverengi ve siyah tüyler uygundur, açık sarı, kızıl ve açık gri tüyler ise uygun değildir.',
  },
  vi: {
    heading: 'Mức độ phù hợp với da và lông',
    intro: 'Hai yếu tố quyết định IPL có phù hợp với bạn hay không: tông màu da và màu lông tự nhiên của bạn.',
    skinTitle: 'Tông màu da: Fitzpatrick I–IV',
    skinBody:
      'Phù hợp với các tông da từ rất sáng đến ô liu và nâu nhạt — các tuýp Fitzpatrick từ I đến IV. Tuýp V (da nâu) chỉ phù hợp ở mức năng lượng thấp nhất và sau khi thử nghiệm trên một vùng da nhỏ. Không phù hợp với tuýp Fitzpatrick VI (da có sắc tố đậm): ánh sáng không thể được chiếu ở liều an toàn và hiệu quả, vì vậy chúng tôi không khuyến nghị dùng IPL cho tông da này.',
    hairTitle: 'Màu lông: mọi màu tự nhiên ngoại trừ vàng nhạt, đỏ và xám nhạt',
    hairBody:
      'IPL hoạt động được vì melanin trong lông hấp thụ ánh sáng và chuyển thành nhiệt tại chân lông. Lông vàng đậm, nâu và đen chứa đủ melanin để điều trị hiệu quả. Lông vàng nhạt, đỏ và xám nhạt chứa quá ít melanin nên kết quả kém.',
    note: 'Thử nghiệm trên một vùng da nhỏ 24 giờ trước lần điều trị đầy đủ đầu tiên và làm theo hướng dẫn sử dụng của model máy bạn đang dùng. Kết quả có thể khác nhau ở mỗi người.',
    imageAlt:
      'Bảng mức độ phù hợp của IPL: các tông da Fitzpatrick từ I đến IV phù hợp, tuýp V phù hợp ở mức năng lượng thấp hơn và sau khi thử nghiệm trên một vùng da nhỏ, và tuýp VI không phù hợp; lông vàng đậm, nâu và đen phù hợp, trong khi lông vàng nhạt, đỏ và xám nhạt không phù hợp.',
  },
};

/** locale 归一化：'es-ES'→es 之类的 code 与 URL path 形态都要能命中 */
export function getSuitability(locale: string | undefined): SuitabilityCopy {
  const base = SKIN_HAIR_SUITABILITY.en;
  if (!locale) return base;
  const candidates = [locale, locale.toLowerCase(), locale.split('-')[0], locale.replace(/-/g, '')];
  for (const c of candidates) {
    if (c && SKIN_HAIR_SUITABILITY[c]) return SKIN_HAIR_SUITABILITY[c];
  }
  return base;
}
