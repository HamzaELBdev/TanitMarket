// Politique de confidentialité — FR / AR. Describes what the app actually
// does (Firebase Auth/Firestore/Storage/Messaging/Analytics, Resend e-mails,
// DeepSeek + Cloud Vision moderation, Meta page sharing, local storage).
// Keep it in sync when a data flow changes.
// Inline markup: **gras**, [libellé](/lien), {email} / {publisher} / {terms}.

export const PRIVACY = {
  fr: {
    title: 'Politique de confidentialité',
    short: 'Confidentialité',
    intro:
      "Cette politique explique quelles données personnelles TanitMarket collecte, pourquoi, avec qui elles sont partagées et comment exercer vos droits. Elle s'applique au site tanitmarket.com et à l'application web TanitMarket.",
    sections: [
      {
        id: 'responsable',
        title: 'Responsable du traitement',
        blocks: [
          'Vos données sont traitées par {publisher}, éditeur de TanitMarket, dans le respect de la loi organique n° 2004-63 du 27 juillet 2004 portant sur la protection des données à caractère personnel.',
          'Pour toute question : **{email}**',
        ],
      },
      {
        id: 'donnees',
        title: 'Données que nous collectons',
        blocks: [
          {
            list: [
              "**Compte** : nom, adresse e-mail, mot de passe (stocké sous forme chiffrée par notre prestataire d'authentification, jamais en clair), type de compte (Particulier / Boutique Pro). Avec Google : nom, e-mail et photo de profil transmis par Google.",
              "**Profil** : ville, numéro de téléphone et photo si vous les ajoutez, statut de vérification de l'e-mail et du téléphone, date d'inscription et de dernière connexion.",
              '**Annonces** : titre, description, photos, prix, catégorie, état et localisation du bien.',
              '**Messages** : contenu des conversations, offres et contre-offres de prix échangées avec les autres utilisateurs.',
              "**Données techniques** : jeton de notification si vous activez les notifications push, données de navigation et de mesure d'audience (pages vues, type d'appareil, identifiants techniques).",
              "**Stockage sur votre appareil** : langue choisie, liste de favoris et données de session nécessaires pour rester connecté.",
            ],
          },
          'Nous ne collectons aucune donnée bancaire : TanitMarket ne propose pas de paiement en ligne.',
        ],
      },
      {
        id: 'finalites',
        title: 'Pourquoi nous les utilisons',
        blocks: [
          {
            list: [
              'créer et sécuriser votre compte, vous connecter et vérifier votre e-mail ou votre téléphone ;',
              'publier vos annonces et les rendre visibles aux autres utilisateurs ;',
              'modérer les annonces pour protéger la communauté (détection des contenus interdits et des arnaques) ;',
              'permettre la messagerie et la négociation entre acheteurs et vendeurs ;',
              "vous envoyer des e-mails et notifications utiles (validation ou refus d'une annonce, nouveau message, codes de vérification) ;",
              'promouvoir les annonces approuvées sur les pages Facebook et Instagram de TanitMarket ;',
              "mesurer l'audience et améliorer le Service ;",
              'répondre à vos demandes et respecter nos obligations légales.',
            ],
          },
          'Ces traitements reposent sur votre consentement, exprimé lors de votre inscription et de vos choix dans le Service (par exemple l\'activation des notifications), et sur la nécessité de fournir le Service que vous utilisez.',
        ],
      },
      {
        id: 'visibilite',
        title: 'Ce qui est visible par les autres utilisateurs',
        blocks: [
          "Vos annonces publiées sont publiques. Votre profil vendeur affiche votre nom, votre ville et vos annonces. **Si vous ajoutez un numéro de téléphone, il peut être affiché sur vos annonces** pour permettre aux acheteurs de vous appeler ou de vous écrire sur WhatsApp. Votre adresse e-mail n'est pas affichée publiquement.",
          'Les messages ne sont visibles que par les participants à la conversation.',
        ],
      },
      {
        id: 'partage',
        title: 'Prestataires et partage des données',
        blocks: [
          "Nous ne vendons pas vos données. Elles ne sont partagées qu'avec les prestataires nécessaires au fonctionnement du Service, pour ce seul usage :",
          {
            list: [
              '**Google Firebase** (Google Cloud) : authentification, base de données, stockage des photos, notifications push, hébergement et mesure d\'audience (Google Analytics).',
              "**Google Cloud Vision** : analyse automatique des photos d'annonces pour détecter les contenus inappropriés.",
              '**DeepSeek** : analyse automatique du texte des annonces (titre, description, prix, catégorie, ville) pour la modération. Aucune donnée de compte ne lui est transmise.',
              '**Resend** : envoi des e-mails (codes de vérification et notifications).',
              "**Meta (Facebook, Instagram)** : publication des annonces approuvées sur les pages de TanitMarket (photo, titre, prix, ville, extrait de la description), sans votre nom ni vos coordonnées.",
            ],
          },
          "Nous pouvons aussi communiquer des données aux autorités lorsque la loi l'exige.",
        ],
      },
      {
        id: 'transferts',
        title: 'Transferts hors de Tunisie',
        blocks: [
          "Certains prestataires cités ci-dessus hébergent ou traitent les données sur des serveurs situés hors de Tunisie. Ces transferts sont limités à ce qui est nécessaire au Service. En utilisant TanitMarket, vous en êtes informé et y consentez.",
        ],
      },
      {
        id: 'conservation',
        title: 'Durée de conservation',
        blocks: [
          {
            list: [
              'Compte et profil : tant que votre compte est actif ; ils sont supprimés lorsque le compte est supprimé.',
              "Annonces : tant qu'elles sont en ligne ou jusqu'à la suppression de votre compte.",
              'Messages : pendant la durée de vie du compte. Après la suppression de votre compte, les messages déjà envoyés peuvent rester visibles pour votre interlocuteur.',
              "Données de mesure d'audience : selon les durées de conservation de Google Analytics.",
            ],
          },
          'Certaines données peuvent être conservées plus longtemps lorsque la loi l\'impose ou pour la gestion d\'un litige.',
        ],
      },
      {
        id: 'securite',
        title: 'Sécurité',
        blocks: [
          'Les échanges avec le Service sont chiffrés (HTTPS). Les mots de passe ne sont jamais stockés en clair. Des règles d\'accès limitent la lecture et la modification des données à leurs seuls titulaires et à l\'équipe habilitée. Aucun système n\'étant infaillible, nous vous invitons à utiliser un mot de passe unique et robuste.',
        ],
      },
      {
        id: 'droits',
        title: 'Vos droits',
        blocks: [
          'Conformément à la loi n° 2004-63, vous disposez des droits suivants sur vos données :',
          {
            list: [
              "**accès** : savoir quelles données nous détenons sur vous et en obtenir une copie ;",
              '**rectification** : corriger des données inexactes (la plupart sont modifiables directement depuis votre profil) ;',
              '**opposition** : vous opposer à un traitement pour un motif légitime, et retirer votre consentement aux notifications à tout moment ;',
              '**suppression** : demander la suppression de votre compte et de vos données.',
            ],
          },
          "Pour exercer ces droits, écrivez-nous à **{email}** depuis l'adresse e-mail de votre compte. Nous répondons dans les meilleurs délais.",
          "Vous pouvez également saisir l'Instance Nationale de Protection des Données Personnelles (INPDP) si vous estimez que vos droits ne sont pas respectés.",
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies et stockage local',
        blocks: [
          "TanitMarket utilise le stockage de votre navigateur pour vous garder connecté, mémoriser votre langue et vos favoris. La mesure d'audience (Google Analytics) utilise des identifiants techniques. Vous pouvez effacer ces données à tout moment dans les réglages de votre navigateur ; vous serez alors déconnecté et vos préférences seront réinitialisées.",
        ],
      },
      {
        id: 'mineurs',
        title: 'Mineurs',
        blocks: [
          "Le Service est destiné aux personnes de 18 ans et plus. Un mineur ne peut l'utiliser qu'avec l'autorisation de son représentant légal. Si vous pensez qu'un mineur nous a transmis des données sans autorisation, contactez-nous.",
        ],
      },
      {
        id: 'modifications',
        title: 'Modification de cette politique',
        blocks: [
          'Nous pouvons mettre à jour cette politique, notamment si nos traitements évoluent. La date de mise à jour figure en haut de la page ; en cas de changement important, vous en serez informé sur le Service. Voir aussi nos [Conditions générales d\'utilisation]({terms}).',
        ],
      },
    ],
  },

  ar: {
    title: 'سياسة الخصوصية',
    short: 'الخصوصية',
    intro:
      'توضّح هذه السياسة المعطيات الشخصية التي تجمعها TanitMarket، وأسباب جمعها، والجهات التي تُشارَك معها، وكيفية ممارسة حقوقك. وتنطبق على موقع tanitmarket.com وتطبيق الويب TanitMarket.',
    sections: [
      {
        id: 'responsable',
        title: 'المسؤول عن المعالجة',
        blocks: [
          'يعالج {publisher}، ناشر TanitMarket، معطياتك طبقاً للقانون الأساسي عدد 63 لسنة 2004 المؤرخ في 27 جويلية 2004 المتعلق بحماية المعطيات الشخصية.',
          'لأي سؤال: **{email}**',
        ],
      },
      {
        id: 'donnees',
        title: 'المعطيات التي نجمعها',
        blocks: [
          {
            list: [
              '**الحساب**: الاسم، البريد الإلكتروني، كلمة المرور (تُخزَّن مشفّرة لدى مزوّد خدمة المصادقة ولا تُحفظ أبداً كنص واضح)، نوع الحساب (فرد / متجر احترافي). عند استخدام Google: الاسم والبريد الإلكتروني وصورة الملف التي يرسلها Google.',
              '**الملف الشخصي**: المدينة ورقم الهاتف والصورة إذا أضفتها، وحالة التحقق من البريد الإلكتروني والهاتف، وتاريخ التسجيل وآخر دخول.',
              '**الإعلانات**: العنوان، الوصف، الصور، السعر، الصنف، حالة السلعة ومكانها.',
              '**الرسائل**: محتوى المحادثات، وعروض الأسعار والعروض المقابلة المتبادلة مع المستخدمين الآخرين.',
              '**المعطيات التقنية**: رمز الإشعارات إذا فعّلت الإشعارات الفورية، ومعطيات التصفّح وقياس الجمهور (الصفحات المزارة، نوع الجهاز، معرّفات تقنية).',
              '**التخزين على جهازك**: اللغة المختارة وقائمة المفضّلة ومعطيات الجلسة اللازمة لإبقائك متصلاً.',
            ],
          },
          'لا نجمع أي معطيات بنكية: لا توفّر TanitMarket أي دفع إلكتروني.',
        ],
      },
      {
        id: 'finalites',
        title: 'لماذا نستخدمها',
        blocks: [
          {
            list: [
              'إنشاء حسابك وتأمينه وتسجيل دخولك والتحقق من بريدك الإلكتروني أو هاتفك؛',
              'نشر إعلاناتك وإتاحتها للمستخدمين الآخرين؛',
              'مراجعة الإعلانات لحماية المجتمع (رصد المحتوى المحظور ومحاولات الاحتيال)؛',
              'تمكين المراسلة والتفاوض بين المشترين والبائعين؛',
              'إرسال رسائل بريد إلكتروني وإشعارات مفيدة (قبول إعلان أو رفضه، رسالة جديدة، رموز التحقق)؛',
              'الترويج للإعلانات المقبولة على صفحتي TanitMarket في فيسبوك وإنستغرام؛',
              'قياس الجمهور وتحسين الخدمة؛',
              'الرد على طلباتك واحترام التزاماتنا القانونية.',
            ],
          },
          'تستند هذه المعالجات إلى موافقتك، التي تعبّر عنها عند التسجيل وعبر اختياراتك في الخدمة (مثل تفعيل الإشعارات)، وإلى ضرورة تقديم الخدمة التي تستعملها.',
        ],
      },
      {
        id: 'visibilite',
        title: 'ما يراه المستخدمون الآخرون',
        blocks: [
          'إعلاناتك المنشورة عامة. يعرض ملف البائع اسمك ومدينتك وإعلاناتك. **إذا أضفت رقم هاتف، فقد يظهر على إعلاناتك** ليتمكّن المشترون من الاتصال بك أو مراسلتك عبر واتساب. لا يُعرض بريدك الإلكتروني للعموم.',
          'لا يرى الرسائل إلا المشاركون في المحادثة.',
        ],
      },
      {
        id: 'partage',
        title: 'مزوّدو الخدمات ومشاركة المعطيات',
        blocks: [
          'لا نبيع معطياتك. لا تُشارَك إلا مع مزوّدي الخدمات الضروريين لتشغيل الخدمة، ولهذا الغرض فقط:',
          {
            list: [
              '**Google Firebase** (Google Cloud): المصادقة، قاعدة البيانات، تخزين الصور، الإشعارات الفورية، الاستضافة وقياس الجمهور (Google Analytics).',
              '**Google Cloud Vision**: تحليل آلي لصور الإعلانات لرصد المحتوى غير اللائق.',
              '**DeepSeek**: تحليل آلي لنص الإعلانات (العنوان، الوصف، السعر، الصنف، المدينة) لغرض المراجعة. لا تُرسَل إليه أي معطيات تخصّ حسابك.',
              '**Resend**: إرسال رسائل البريد الإلكتروني (رموز التحقق والإشعارات).',
              '**Meta (فيسبوك، إنستغرام)**: نشر الإعلانات المقبولة على صفحات TanitMarket (الصورة، العنوان، السعر، المدينة، مقتطف من الوصف)، دون اسمك أو بيانات الاتصال بك.',
            ],
          },
          'قد نُطلع السلط على بعض المعطيات عندما يفرض القانون ذلك.',
        ],
      },
      {
        id: 'transferts',
        title: 'نقل المعطيات خارج تونس',
        blocks: [
          'يستضيف بعض مزوّدي الخدمات المذكورين أعلاه المعطيات أو يعالجونها على خوادم موجودة خارج تونس. يقتصر هذا النقل على ما هو ضروري للخدمة. باستخدامك TanitMarket، فإنك تُعلَم بذلك وتوافق عليه.',
        ],
      },
      {
        id: 'conservation',
        title: 'مدة الاحتفاظ',
        blocks: [
          {
            list: [
              'الحساب والملف الشخصي: طالما كان حسابك نشطاً، ويُحذفان عند حذف الحساب.',
              'الإعلانات: طالما كانت منشورة أو إلى حين حذف حسابك.',
              'الرسائل: طوال مدة وجود الحساب. بعد حذف حسابك، قد تبقى الرسائل المرسلة سابقاً ظاهرة لمحاورك.',
              'معطيات قياس الجمهور: حسب مدد الاحتفاظ الخاصة بـ Google Analytics.',
            ],
          },
          'قد يُحتفظ ببعض المعطيات لمدة أطول عندما يفرض القانون ذلك أو لإدارة نزاع.',
        ],
      },
      {
        id: 'securite',
        title: 'الأمان',
        blocks: [
          'التبادلات مع الخدمة مشفّرة (HTTPS). لا تُخزَّن كلمات المرور أبداً كنص واضح. تحصر قواعد الوصول قراءة المعطيات وتعديلها في أصحابها والفريق المرخّص له. وبما أنه لا يوجد نظام معصوم، ندعوك إلى استخدام كلمة مرور فريدة وقوية.',
        ],
      },
      {
        id: 'droits',
        title: 'حقوقك',
        blocks: [
          'طبقاً للقانون عدد 63 لسنة 2004، تتمتّع بالحقوق التالية على معطياتك:',
          {
            list: [
              '**النفاذ**: معرفة المعطيات التي نحتفظ بها عنك والحصول على نسخة منها؛',
              '**التصحيح**: تصحيح المعطيات غير الدقيقة (يمكن تعديل أغلبها مباشرة من ملفك الشخصي)؛',
              '**الاعتراض**: الاعتراض على معالجة لسبب مشروع، وسحب موافقتك على الإشعارات في أي وقت؛',
              '**الحذف**: طلب حذف حسابك ومعطياتك.',
            ],
          },
          'لممارسة هذه الحقوق، راسلنا على **{email}** من البريد الإلكتروني المرتبط بحسابك. نجيبك في أقرب الآجال.',
          'يمكنك أيضاً اللجوء إلى الهيئة الوطنية لحماية المعطيات الشخصية إذا رأيت أن حقوقك لم تُحترم.',
        ],
      },
      {
        id: 'cookies',
        title: 'ملفات تعريف الارتباط والتخزين المحلي',
        blocks: [
          'تستخدم TanitMarket تخزين متصفحك لإبقائك متصلاً وحفظ لغتك ومفضّلتك. ويستخدم قياس الجمهور (Google Analytics) معرّفات تقنية. يمكنك مسح هذه المعطيات في أي وقت من إعدادات متصفحك، وسيتم حينها تسجيل خروجك وإعادة ضبط تفضيلاتك.',
        ],
      },
      {
        id: 'mineurs',
        title: 'القاصرون',
        blocks: [
          'الخدمة موجّهة للأشخاص البالغين 18 سنة فما فوق. لا يمكن للقاصر استخدامها إلا بإذن من وليّه القانوني. إذا كنت تعتقد أن قاصراً قدّم لنا معطيات دون إذن، تواصل معنا.',
        ],
      },
      {
        id: 'modifications',
        title: 'تعديل هذه السياسة',
        blocks: [
          'يمكننا تحديث هذه السياسة، خاصة إذا تغيّرت معالجاتنا. يظهر تاريخ آخر تحديث أعلى الصفحة، وفي حال حدوث تغيير مهم سيتم إعلامك عبر الخدمة. انظر أيضاً [الشروط العامة للاستخدام]({terms}).',
        ],
      },
    ],
  },
};
