/**
 * 一次性脚本：把「第三方出货前抽检」服务的文案块写入 22 个 messages/*.json。
 *
 * 做法：不动 JSON.stringify 全量重排（会造成整文件 diff），
 * 只在 aboutPages.qualityControl 的最后一个 key（fda510kDatabase）之后定点插入，
 * 其余字节原样保留。插入后 JSON.parse 校验。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MSG_DIR = join(process.cwd(), 'messages');

const T = {
  en: {
    title: 'Third-Party Pre-Shipment Inspection',
    intro: "You don't have to take our word for it. Your own inspector can verify the goods at our factory before they leave China.",
    priceValue: 'CNY 2,000',
    priceNote: 'Flat fee per inspection — the same whether your order runs a few hundred units or 1,000–5,000.',
    howTitle: 'How it works',
    howBody: 'Name the inspection company you want to use — Intertek, or any agency you already work with. We book their team to attend our factory and carry out the pre-shipment sampling.',
    itemsTitle: 'What they check',
    itemsNote: "You define the scope. If you don't specify, the baseline is:",
    items: ['Quantity', 'Appearance', 'Weight', 'Internal components', 'Charger', 'Energy output', 'Flash count'],
    billingTitle: 'Transparent billing',
    billingBody: 'We show you the inspection company\u2019s invoice. If the real bill comes in below what you paid, the difference is refunded.',
  },
  tr: {
    title: 'Üçüncü Taraf Sevkiyat Öncesi Denetimi',
    intro: 'Ürünler için bize güvenmek zorunda değilsiniz. Kendi denetçiniz, ürünler Çin\u2019den çıkmadan önce fabrikamızda doğrulayabilir.',
    priceValue: 'CNY 2.000',
    priceNote: 'Denetim başına sabit ücret — siparişiniz birkaç yüz adet de olsa 1.000–5.000 adet de olsa aynı.',
    howTitle: 'Nasıl işliyor',
    howBody: 'Kullanmak istediğiniz denetim şirketini söyleyin — Intertek ya da hâlihazırda çalıştığınız herhangi bir kuruluş. Ekibini fabrikamıza getirip sevkiyat öncesi numune denetimini yapmalarını biz ayarlıyoruz.',
    itemsTitle: 'Neler kontrol edilir',
    itemsNote: 'Kapsamı siz belirlersiniz. Belirtmezseniz temel kontrol listesi şudur:',
    items: ['Adet', 'Görünüm', 'Ağırlık', 'İç bileşenler', 'Şarj cihazı', 'Enerji çıkışı', 'Flaş sayısı'],
    billingTitle: 'Şeffaf faturalandırma',
    billingBody: 'Denetim şirketinin faturasını size gösteriyoruz. Gerçek fatura ödediğiniz tutarın altında kalırsa, fark iade edilir.',
  },
  ro: {
    title: 'Inspecție de pre-expediere de către terți',
    intro: 'Nu trebuie să ne credeți pe cuvânt. Propriul dumneavoastră inspector poate verifica produsele în fabrica noastră înainte de a pleca din China.',
    priceValue: '2.000 CNY',
    priceNote: 'Tarif fix pe inspecție — același indiferent dacă comanda este de câteva sute de bucăți sau de 1.000–5.000.',
    howTitle: 'Cum funcționează',
    howBody: 'Spuneți-ne ce companie de inspecție doriți — Intertek sau orice agenție cu care lucrați deja. Programăm echipa lor să vină în fabrica noastră și să facă prelevarea de pre-expediere.',
    itemsTitle: 'Ce se verifică',
    itemsNote: 'Dumneavoastră stabiliți domeniul. Dacă nu specificați, lista de bază este:',
    items: ['Cantitate', 'Aspect', 'Greutate', 'Componente interne', 'Încărcător', 'Putere de ieșire', 'Număr de flash-uri'],
    billingTitle: 'Facturare transparentă',
    billingBody: 'Vă arătăm factura companiei de inspecție. Dacă factura reală este mai mică decât suma plătită, diferența se returnează.',
  },
  ar: {
    title: 'تفتيش ما قبل الشحن من طرف ثالث',
    intro: 'لا حاجة لأن تأخذ كلامنا على الثقة. يمكن لمفتشك الخاص أن يتحقق من البضاعة في مصنعنا قبل مغادرتها الصين.',
    priceValue: '2,000 يوان صيني',
    priceNote: 'رسم ثابت لكل عملية تفتيش — سواء كان طلبك مئات الوحدات أو 1,000–5,000 وحدة.',
    howTitle: 'كيف تعمل الخدمة',
    howBody: 'حدّد شركة التفتيش التي تريدها — Intertek أو أي جهة تتعامل معها بالفعل. نتولى حجز فريقهم لزيارة مصنعنا وتنفيذ الفحص قبل الشحن.',
    itemsTitle: 'ما الذي يتم فحصه',
    itemsNote: 'تحدد أنت نطاق الفحص. وإن لم تحدد، فالقائمة الأساسية هي:',
    items: ['الكمية', 'المظهر', 'الوزن', 'المكونات الداخلية', 'الشاحن', 'طاقة الخرج', 'عدد ومضات الضوء'],
    billingTitle: 'فاتورة شفافة',
    billingBody: 'نعرض عليك فاتورة شركة التفتيش. وإذا جاءت الفاتورة الفعلية أقل من المبلغ المدفوع، يُرد الفارق.',
  },
  es: {
    title: 'Inspección previa al envío por terceros',
    intro: 'No tiene que fiarse de nuestra palabra. Su propio inspector puede verificar la mercancía en nuestra fábrica antes de que salga de China.',
    priceValue: '2000 CNY',
    priceNote: 'Tarifa fija por inspección: la misma tanto si su pedido es de unos cientos de unidades como de 1000 a 5000.',
    howTitle: 'Cómo funciona',
    howBody: 'Indíquenos qué empresa de inspección quiere usar — Intertek o cualquier agencia con la que ya trabaje. Nosotros contratamos a su equipo para que acuda a nuestra fábrica y realice el muestreo previo al envío.',
    itemsTitle: 'Qué se revisa',
    itemsNote: 'Usted define el alcance. Si no lo especifica, la base es:',
    items: ['Cantidad', 'Aspecto', 'Peso', 'Componentes internos', 'Cargador', 'Potencia de salida', 'Número de destellos'],
    billingTitle: 'Facturación transparente',
    billingBody: 'Le mostramos la factura de la empresa de inspección. Si la factura real es inferior a lo que pagó, le devolvemos la diferencia.',
  },
  fr: {
    title: 'Inspection avant expédition par un tiers',
    intro: "Vous n'êtes pas obligé de nous croire sur parole. Votre propre inspecteur peut vérifier la marchandise dans notre usine avant qu'elle ne quitte la Chine.",
    priceValue: '2 000 CNY',
    priceNote: 'Forfait par inspection — identique que votre commande porte sur quelques centaines d\u2019unités ou sur 1 000 à 5 000.',
    howTitle: 'Comment ça marche',
    howBody: "Indiquez-nous la société d'inspection que vous souhaitez — Intertek ou tout autre organisme avec lequel vous travaillez déjà. Nous convoquons son équipe dans notre usine pour réaliser le contrôle avant expédition.",
    itemsTitle: 'Ce qui est contrôlé',
    itemsNote: "C'est vous qui définissez le périmètre. Si vous ne précisez rien, la base est la suivante :",
    items: ['Quantité', 'Aspect', 'Poids', 'Composants internes', 'Chargeur', 'Puissance de sortie', 'Nombre de flashs'],
    billingTitle: 'Facturation transparente',
    billingBody: "Nous vous montrons la facture de la société d'inspection. Si la facture réelle est inférieure à ce que vous avez payé, la différence vous est remboursée.",
  },
  ru: {
    title: 'Независимая предотгрузочная инспекция',
    intro: 'Вам не нужно верить нам на слово. Ваш собственный инспектор может проверить товар на нашей фабрике до того, как он покинет Китай.',
    priceValue: '2 000 юаней',
    priceNote: 'Фиксированная стоимость за инспекцию — одна и та же и для нескольких сотен изделий, и для 1 000–5 000.',
    howTitle: 'Как это работает',
    howBody: 'Назовите инспекционную компанию, которой вы доверяете, — Intertek или любое агентство, с которым вы уже работаете. Мы организуем приезд их команды на нашу фабрику и проведение предотгрузочной выборки.',
    itemsTitle: 'Что проверяют',
    itemsNote: 'Объём проверки определяете вы. Если требований нет, базовый перечень такой:',
    items: ['Количество', 'Внешний вид', 'Вес', 'Внутренние компоненты', 'Зарядное устройство', 'Выходная мощность', 'Количество вспышек'],
    billingTitle: 'Прозрачные расчёты',
    billingBody: 'Мы показываем вам счёт инспекционной компании. Если фактический счёт окажется меньше уплаченной суммы, разница возвращается.',
  },
  he: {
    title: 'בדיקת טרום־משלוח על ידי צד שלישי',
    intro: 'אין צורך לסמוך על המילה שלנו. הבודק שלכם יכול לאמת את הסחורה במפעל שלנו לפני שהיא יוצאת מסין.',
    priceValue: '2,000 יואן',
    priceNote: 'תעריף קבוע לבדיקה — זהה בין אם ההזמנה היא כמה מאות יחידות ובין אם 1,000–5,000.',
    howTitle: 'איך זה עובד',
    howBody: 'ציינו באיזו חברת בדיקה תרצו להשתמש — Intertek או כל סוכנות שאתם כבר עובדים איתה. אנחנו מזמינים את הצוות שלהם למפעל שלנו ומקיימים את הדגימה לפני המשלוח.',
    itemsTitle: 'מה נבדק',
    itemsNote: 'אתם קובעים את היקף הבדיקה. אם לא תפרטו, רשימת הבסיס היא:',
    items: ['כמות', 'מראה חיצוני', 'משקל', 'רכיבים פנימיים', 'מטען', 'הספק יציאה', 'מספר הבזקים'],
    billingTitle: 'חיוב שקוף',
    billingBody: 'אנחנו מציגים לכם את החשבונית של חברת הבדיקה. אם החשבונית בפועל נמוכה מהסכום ששילמתם, ההפרש מוחזר.',
  },
  fa: {
    title: 'بازرسی پیش از حمل توسط شخص ثالث',
    intro: 'لازم نیست حرف ما را بپذیرید. بازرس خودتان می‌تواند کالا را پیش از خروج از چین در کارخانه ما بررسی کند.',
    priceValue: '۲٬۰۰۰ یوان',
    priceNote: 'هزینه ثابت برای هر بازرسی — چه سفارش چند صد دستگاه باشد و چه ۱٬۰۰۰ تا ۵٬۰۰۰ دستگاه.',
    howTitle: 'چطور کار می‌کند',
    howBody: 'نام شرکت بازرسی مورد نظرتان را بگویید — Intertek یا هر شرکتی که از قبل با آن کار می‌کنید. ما تیم آن‌ها را برای نمونه‌گیری پیش از حمل به کارخانه‌مان دعوت می‌کنیم.',
    itemsTitle: 'چه مواردی بررسی می‌شود',
    itemsNote: 'دامنه بررسی را شما تعیین می‌کنید. اگر مشخص نکنید، فهرست پایه این است:',
    items: ['تعداد', 'ظاهر', 'وزن', 'قطعات داخلی', 'شارژر', 'توان خروجی', 'تعداد فلاش'],
    billingTitle: 'صورت‌حساب شفاف',
    billingBody: 'صورت‌حساب شرکت بازرسی را به شما نشان می‌دهیم. اگر مبلغ واقعی کمتر از آنچه پرداخت کرده‌اید باشد، مابه‌التفاوت بازگردانده می‌شود.',
  },
  el: {
    title: 'Έλεγχος πριν από την αποστολή από τρίτο μέρος',
    intro: 'Δεν χρειάζεται να μας πιστέψετε. Ο δικός σας επιθεωρητής μπορεί να επαληθεύσει τα προϊόντα στο εργοστάσιό μας πριν φύγουν από την Κίνα.',
    priceValue: '2.000 CNY',
    priceNote: 'Σταθερή χρέωση ανά έλεγχο — ίδια είτε η παραγγελία είναι μερικές εκατοντάδες τεμάχια είτε 1.000–5.000.',
    howTitle: 'Πώς λειτουργεί',
    howBody: 'Πείτε μας ποια εταιρεία ελέγχου θέλετε — Intertek ή οποιονδήποτε φορέα με τον οποίο συνεργάζεστε ήδη. Κλείνουμε την ομάδα της να έρθει στο εργοστάσιό μας και να κάνει τη δειγματοληψία πριν από την αποστολή.',
    itemsTitle: 'Τι ελέγχεται',
    itemsNote: 'Εσείς ορίζετε το εύρος. Αν δεν το προσδιορίσετε, η βασική λίστα είναι:',
    items: ['Ποσότητα', 'Εμφάνιση', 'Βάρος', 'Εσωτερικά εξαρτήματα', 'Φορτιστής', 'Ισχύς εξόδου', 'Αριθμός αναλαμπών'],
    billingTitle: 'Διαφανής τιμολόγηση',
    billingBody: 'Σας δείχνουμε το τιμολόγιο της εταιρείας ελέγχου. Αν το πραγματικό ποσό είναι μικρότερο από αυτό που πληρώσατε, η διαφορά επιστρέφεται.',
  },
  'pt-BR': {
    title: 'Inspeção pré-embarque por terceiros',
    intro: 'Você não precisa acreditar na nossa palavra. O seu próprio inspetor pode verificar a mercadoria na nossa fábrica antes de ela sair da China.',
    priceValue: 'CNY 2.000',
    priceNote: 'Taxa fixa por inspeção — a mesma se o pedido for de algumas centenas de unidades ou de 1.000 a 5.000.',
    howTitle: 'Como funciona',
    howBody: 'Diga qual empresa de inspeção você quer usar — a Intertek ou qualquer agência com a qual já trabalhe. Nós agendamos a equipe dela para vir à nossa fábrica e fazer a amostragem pré-embarque.',
    itemsTitle: 'O que é verificado',
    itemsNote: 'Você define o escopo. Se não especificar, a base é:',
    items: ['Quantidade', 'Aparência', 'Peso', 'Componentes internos', 'Carregador', 'Potência de saída', 'Número de flashes'],
    billingTitle: 'Cobrança transparente',
    billingBody: 'Mostramos a fatura da empresa de inspeção. Se a fatura real ficar abaixo do que você pagou, a diferença é devolvida.',
  },
  'pt-PT': {
    title: 'Inspeção pré-embarque por terceiros',
    intro: 'Não tem de acreditar na nossa palavra. O seu próprio inspetor pode verificar a mercadoria na nossa fábrica antes de sair da China.',
    priceValue: '2 000 CNY',
    priceNote: 'Taxa fixa por inspeção — a mesma quer a encomenda seja de algumas centenas de unidades ou de 1 000 a 5 000.',
    howTitle: 'Como funciona',
    howBody: 'Diga-nos que empresa de inspeção quer usar — a Intertek ou qualquer agência com quem já trabalhe. Nós agendamos a equipa dela para vir à nossa fábrica e fazer a amostragem pré-embarque.',
    itemsTitle: 'O que é verificado',
    itemsNote: 'É você que define o âmbito. Se não especificar, a base é:',
    items: ['Quantidade', 'Aparência', 'Peso', 'Componentes internos', 'Carregador', 'Potência de saída', 'Número de flashes'],
    billingTitle: 'Faturação transparente',
    billingBody: 'Mostramos-lhe a fatura da empresa de inspeção. Se a fatura real for inferior ao que pagou, a diferença é devolvida.',
  },
  nl: {
    title: 'Inspectie vóór verzending door derden',
    intro: 'U hoeft ons niet op ons woord te geloven. Uw eigen inspecteur kan de goederen in onze fabriek controleren voordat ze China verlaten.',
    priceValue: 'CNY 2.000',
    priceNote: 'Vast tarief per inspectie — hetzelfde of uw order nu een paar honderd stuks is of 1.000–5.000.',
    howTitle: 'Hoe het werkt',
    howBody: 'Geef aan welk inspectiebedrijf u wilt gebruiken — Intertek of een bureau waarmee u al samenwerkt. Wij plannen hun team in om naar onze fabriek te komen en de steekproef vóór verzending uit te voeren.',
    itemsTitle: 'Wat er wordt gecontroleerd',
    itemsNote: 'U bepaalt de scope. Als u niets opgeeft, is dit de basis:',
    items: ['Aantal', 'Uiterlijk', 'Gewicht', 'Interne componenten', 'Oplader', 'Uitgangsvermogen', 'Aantal flitsen'],
    billingTitle: 'Transparante facturering',
    billingBody: 'We laten u de factuur van het inspectiebedrijf zien. Als de werkelijke factuur lager uitvalt dan wat u betaalde, wordt het verschil terugbetaald.',
  },
  id: {
    title: 'Inspeksi Pra-Pengiriman oleh Pihak Ketiga',
    intro: 'Anda tidak perlu percaya begitu saja pada kami. Inspektur Anda sendiri dapat memverifikasi barang di pabrik kami sebelum meninggalkan Tiongkok.',
    priceValue: 'CNY 2.000',
    priceNote: 'Biaya tetap per inspeksi — sama saja apakah pesanan Anda beberapa ratus unit atau 1.000–5.000 unit.',
    howTitle: 'Cara kerjanya',
    howBody: 'Sebutkan perusahaan inspeksi yang ingin Anda gunakan — Intertek atau lembaga mana pun yang sudah Anda pakai. Kami menjadwalkan tim mereka datang ke pabrik kami dan melakukan pengambilan sampel pra-pengiriman.',
    itemsTitle: 'Apa yang diperiksa',
    itemsNote: 'Anda yang menentukan cakupannya. Jika tidak menentukan, daftar dasarnya adalah:',
    items: ['Jumlah', 'Tampilan', 'Berat', 'Komponen internal', 'Charger', 'Daya keluaran', 'Jumlah flash'],
    billingTitle: 'Penagihan transparan',
    billingBody: 'Kami menunjukkan tagihan dari perusahaan inspeksi. Jika tagihan sebenarnya lebih rendah dari yang Anda bayarkan, selisihnya dikembalikan.',
  },
  th: {
    title: 'การตรวจสอบก่อนจัดส่งโดยบุคคลที่สาม',
    intro: 'คุณไม่จำเป็นต้องเชื่อคำพูดของเรา ผู้ตรวจสอบของคุณเองสามารถตรวจสอบสินค้าที่โรงงานของเราก่อนออกจากจีน',
    priceValue: '2,000 หยวน',
    priceNote: 'ค่าบริการคงที่ต่อการตรวจหนึ่งครั้ง — เท่ากันไม่ว่าคำสั่งซื้อจะไม่กี่ร้อยเครื่องหรือ 1,000–5,000 เครื่อง',
    howTitle: 'ขั้นตอนการทำงาน',
    howBody: 'แจ้งบริษัทตรวจสอบที่คุณต้องการ — Intertek หรือหน่วยงานใดก็ตามที่คุณใช้อยู่ เราจะนัดทีมของพวกเขาให้มาที่โรงงานของเราและดำเนินการสุ่มตรวจก่อนจัดส่ง',
    itemsTitle: 'สิ่งที่ตรวจสอบ',
    itemsNote: 'คุณเป็นผู้กำหนดขอบเขต หากไม่ระบุ รายการพื้นฐานคือ:',
    items: ['จำนวน', 'รูปลักษณ์ภายนอก', 'น้ำหนัก', 'ชิ้นส่วนภายใน', 'อะแดปเตอร์ชาร์จ', 'พลังงานที่ปล่อยออก', 'จำนวนครั้งในการยิงแสง'],
    billingTitle: 'เรียกเก็บเงินอย่างโปร่งใส',
    billingBody: 'เราแสดงใบแจ้งหนี้ของบริษัทตรวจสอบให้คุณดู หากยอดจริงต่ำกว่าที่คุณชำระไว้ ส่วนต่างจะคืนให้',
  },
  pl: {
    title: 'Kontrola przedwysyłkowa przez stronę trzecią',
    intro: 'Nie musisz wierzyć nam na słowo. Twój własny inspektor może zweryfikować towar w naszej fabryce, zanim opuści Chiny.',
    priceValue: '2000 CNY',
    priceNote: 'Stała opłata za kontrolę — taka sama przy zamówieniu na kilkaset sztuk i na 1000–5000.',
    howTitle: 'Jak to działa',
    howBody: 'Wskaż firmę kontrolującą, której chcesz użyć — Intertek lub dowolną agencję, z którą już współpracujesz. Organizujemy przyjazd jej zespołu do naszej fabryki i przeprowadzenie pobierania próbek przed wysyłką.',
    itemsTitle: 'Co jest sprawdzane',
    itemsNote: 'Zakres ustalasz Ty. Jeśli go nie określisz, podstawowa lista to:',
    items: ['Ilość', 'Wygląd', 'Waga', 'Komponenty wewnętrzne', 'Ładowarka', 'Moc wyjściowa', 'Liczba błysków'],
    billingTitle: 'Przejrzyste rozliczenia',
    billingBody: 'Pokazujemy fakturę firmy kontrolującej. Jeśli rzeczywista faktura jest niższa niż zapłacona kwota, różnica jest zwracana.',
  },
  ja: {
    title: '第三者による出荷前検品',
    intro: '当社の言葉をそのまま信じる必要はありません。お客様の検品担当者が、中国から出荷される前に当社工場で製品を確認できます。',
    priceValue: '2,000元（CNY）',
    priceNote: '検品1回あたりの定額料金 — ご発注が数百台でも1,000〜5,000台でも同額です。',
    howTitle: 'ご利用の流れ',
    howBody: 'ご希望の検品会社（Intertek など、すでにお取引のある機関でも可）をお知らせください。当社がそのチームの工場立会いを手配し、出荷前の抜き取り検品を実施します。',
    itemsTitle: '検品項目',
    itemsNote: '検査範囲はお客様が指定できます。ご指定がない場合の基本項目は次のとおりです。',
    items: ['数量', '外観', '重量', '内部部品', '充電器', '出力エネルギー', '照射回数'],
    billingTitle: '透明な請求',
    billingBody: '検品会社の請求書をそのまま開示します。実際の請求額がお支払い額を下回った場合は、差額を返金します。',
  },
  ko: {
    title: '제3자 출하 전 검사',
    intro: '저희 말만 믿으실 필요는 없습니다. 고객님의 검사 담당자가 제품이 중국을 떠나기 전에 저희 공장에서 직접 확인할 수 있습니다.',
    priceValue: 'CNY 2,000',
    priceNote: '검사 1회당 정액 — 발주 수량이 수백 대든 1,000~5,000대든 동일합니다.',
    howTitle: '진행 방식',
    howBody: '원하시는 검사 업체를 알려주세요 — Intertek 또는 이미 거래 중인 기관이면 어디든 가능합니다. 저희가 해당 업체 팀의 공장 방문을 주선하고 출하 전 샘플링 검사를 진행합니다.',
    itemsTitle: '검사 항목',
    itemsNote: '검사 범위는 고객님이 정하시면 됩니다. 따로 지정하지 않으시면 기본 항목은 다음과 같습니다.',
    items: ['수량', '외관', '무게', '내부 부품', '충전기', '출력 에너지', '조사 횟수'],
    billingTitle: '투명한 청구',
    billingBody: '검사 업체의 청구서를 그대로 보여드립니다. 실제 청구 금액이 결제하신 금액보다 낮으면 차액을 환불해 드립니다.',
  },
  cs: {
    title: 'Inspekce před odesláním třetí stranou',
    intro: 'Nemusíte nám věřit na slovo. Váš vlastní inspektor může zboží ověřit v naší továrně, než opustí Čínu.',
    priceValue: '2 000 CNY',
    priceNote: 'Pevný poplatek za inspekci — stejný pro objednávku v řádu stovek kusů i pro 1 000–5 000 kusů.',
    howTitle: 'Jak to funguje',
    howBody: 'Řekněte nám, kterou inspekční společnost chcete použít — Intertek nebo jakoukoli agenturu, se kterou již spolupracujete. Zařídíme, aby její tým přijel do naší továrny a provedl odběr vzorků před odesláním.',
    itemsTitle: 'Co se kontroluje',
    itemsNote: 'Rozsah určujete vy. Pokud jej nespecifikujete, základní seznam je:',
    items: ['Množství', 'Vzhled', 'Hmotnost', 'Vnitřní komponenty', 'Nabíječka', 'Výstupní výkon', 'Počet záblesků'],
    billingTitle: 'Transparentní vyúčtování',
    billingBody: 'Ukážeme vám fakturu inspekční společnosti. Pokud je skutečná faktura nižší než částka, kterou jste zaplatili, rozdíl vám vrátíme.',
  },
  vi: {
    title: 'Giám định trước khi xuất hàng bởi bên thứ ba',
    intro: 'Quý khách không cần tin vào lời chúng tôi. Đơn vị giám định của quý khách có thể kiểm tra hàng tại nhà máy của chúng tôi trước khi hàng rời Trung Quốc.',
    priceValue: '2.000 CNY',
    priceNote: 'Phí cố định cho mỗi lần giám định — giống nhau dù đơn hàng vài trăm chiếc hay 1.000–5.000 chiếc.',
    howTitle: 'Cách thức thực hiện',
    howBody: 'Quý khách cho biết công ty giám định muốn sử dụng — Intertek hoặc bất kỳ tổ chức nào quý khách đang hợp tác. Chúng tôi sắp xếp để đội ngũ của họ đến nhà máy và thực hiện lấy mẫu trước khi xuất hàng.',
    itemsTitle: 'Các hạng mục kiểm tra',
    itemsNote: 'Phạm vi do quý khách quyết định. Nếu không yêu cầu cụ thể, danh mục cơ bản gồm:',
    items: ['Số lượng', 'Ngoại quan', 'Trọng lượng', 'Linh kiện bên trong', 'Bộ sạc', 'Năng lượng đầu ra', 'Số lần phát xung'],
    billingTitle: 'Thanh toán minh bạch',
    billingBody: 'Chúng tôi cho quý khách xem hóa đơn của công ty giám định. Nếu hóa đơn thực tế thấp hơn số tiền đã trả, phần chênh lệch sẽ được hoàn lại.',
  },
  de: {
    title: 'Vorversandinspektion durch Dritte',
    intro: 'Sie müssen uns nicht aufs Wort glauben. Ihr eigener Prüfer kann die Ware in unserem Werk kontrollieren, bevor sie China verlässt.',
    priceValue: '2.000 CNY',
    priceNote: 'Pauschalgebühr pro Inspektion — gleich, ob Ihre Bestellung ein paar hundert Stück oder 1.000–5.000 Stück umfasst.',
    howTitle: 'So läuft es ab',
    howBody: 'Nennen Sie uns das Inspektionsunternehmen Ihrer Wahl — Intertek oder eine Agentur, mit der Sie bereits arbeiten. Wir holen deren Team in unser Werk und lassen die Stichprobenprüfung vor dem Versand durchführen.',
    itemsTitle: 'Was geprüft wird',
    itemsNote: 'Den Umfang bestimmen Sie. Wenn Sie nichts vorgeben, gilt diese Basis:',
    items: ['Menge', 'Aussehen', 'Gewicht', 'Interne Bauteile', 'Ladegerät', 'Ausgangsleistung', 'Blitzanzahl'],
    billingTitle: 'Transparente Abrechnung',
    billingBody: 'Wir zeigen Ihnen die Rechnung des Inspektionsunternehmens. Fällt die tatsächliche Rechnung niedriger aus als der gezahlte Betrag, wird die Differenz erstattet.',
  },
  it: {
    title: 'Ispezione pre-spedizione da parte terza',
    intro: 'Non deve crederci sulla parola. Il suo ispettore può verificare la merce nel nostro stabilimento prima che lasci la Cina.',
    priceValue: '2.000 CNY',
    priceNote: 'Tariffa fissa per ispezione — identica sia che l\u2019ordine sia di qualche centinaio di pezzi sia di 1.000–5.000.',
    howTitle: 'Come funziona',
    howBody: 'Indichi la società di ispezione che vuole utilizzare — Intertek o qualsiasi agenzia con cui lavora già. Organizziamo la visita del suo team nel nostro stabilimento e il campionamento prima della spedizione.',
    itemsTitle: 'Cosa viene controllato',
    itemsNote: 'Il perimetro lo definisce lei. Se non indica nulla, la base è:',
    items: ['Quantità', 'Aspetto', 'Peso', 'Componenti interni', 'Caricatore', 'Potenza in uscita', 'Numero di lampi'],
    billingTitle: 'Fatturazione trasparente',
    billingBody: 'Le mostriamo la fattura della società di ispezione. Se la fattura reale è inferiore a quanto pagato, la differenza viene rimborsata.',
  },
};

const IND6 = '      ';
const IND8 = '        ';
const IND10 = '          ';

function blockFor(d) {
  const lines = [];
  lines.push(`${IND6}"inspection": {`);
  lines.push(`${IND8}"title": ${JSON.stringify(d.title)},`);
  lines.push(`${IND8}"intro": ${JSON.stringify(d.intro)},`);
  lines.push(`${IND8}"priceValue": ${JSON.stringify(d.priceValue)},`);
  lines.push(`${IND8}"priceNote": ${JSON.stringify(d.priceNote)},`);
  lines.push(`${IND8}"howTitle": ${JSON.stringify(d.howTitle)},`);
  lines.push(`${IND8}"howBody": ${JSON.stringify(d.howBody)},`);
  lines.push(`${IND8}"itemsTitle": ${JSON.stringify(d.itemsTitle)},`);
  lines.push(`${IND8}"itemsNote": ${JSON.stringify(d.itemsNote)},`);
  lines.push(`${IND8}"items": {`);
  d.items.forEach((v, i) => {
    const comma = i === d.items.length - 1 ? '' : ',';
    lines.push(`${IND10}"${i}": ${JSON.stringify(v)}${comma}`);
  });
  lines.push(`${IND8}},`);
  lines.push(`${IND8}"billingTitle": ${JSON.stringify(d.billingTitle)},`);
  lines.push(`${IND8}"billingBody": ${JSON.stringify(d.billingBody)}`);
  lines.push(`${IND6}}`);
  return lines;
}

let ok = 0;
for (const [loc, dict] of Object.entries(T)) {
  const file = join(MSG_DIR, `${loc}.json`);
  const src = readFileSync(file, 'utf8');
  if (src.includes('"inspection": {') && src.includes('aboutPages')) {
    if (/"qualityControl"[\s\S]{0,20000}?"inspection": \{/.test(src)) {
      throw new Error(`${loc}: inspection 块已存在，拒绝重复插入`);
    }
  }
  const lines = src.split('\n');
  const idx = lines.findIndex((l) => /^\s*"fda510kDatabase":/.test(l));
  if (idx === -1) throw new Error(`${loc}: 未找到锚点 fda510kDatabase`);

  let anchor = lines[idx].replace(/\s+$/, '');
  if (!anchor.endsWith(',')) anchor += ',';
  lines[idx] = anchor;
  lines.splice(idx + 1, 0, ...blockFor(dict));

  const out = lines.join('\n');
  // 校验：JSON 可解析 + 新 key 到位 + aboutPages 未受影响
  const parsed = JSON.parse(out);
  const qc = parsed?.aboutPages?.qualityControl;
  if (!qc) throw new Error(`${loc}: aboutPages.qualityControl 丢失`);
  if (qc.fda510kDatabase === undefined) throw new Error(`${loc}: 原有 key 丢失`);
  if (typeof qc.inspection?.items?.['6'] !== 'string') throw new Error(`${loc}: 新 key 不完整`);

  writeFileSync(file, out);
  ok++;
  console.log(`  ✓ ${loc.padEnd(6)} ${qc.inspection.title}`);
}
console.log(`\n完成：${ok} 个语种已写入 inspection 文案块。`);
