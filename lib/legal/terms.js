// Conditions générales d'utilisation — FR / AR.
// Inline markup understood by LegalPage: **gras**, [libellé](/lien) and the
// {email} / {publisher} / {privacy} placeholders (filled from lib/legal/config.js).

export const TERMS = {
  fr: {
    title: "Conditions générales d'utilisation",
    short: 'CGU',
    intro:
      "Bienvenue sur TanitMarket. Ces conditions encadrent l'utilisation de la plateforme de petites annonces entre particuliers et professionnels en Tunisie. Merci de les lire attentivement.",
    sections: [
      {
        id: 'objet',
        title: 'Objet et acceptation',
        blocks: [
          "Les présentes conditions générales d'utilisation (« CGU ») définissent les règles d'accès et d'utilisation du site tanitmarket.com et de l'application web TanitMarket (le « Service »).",
          "En créant un compte ou en utilisant le Service, vous acceptez sans réserve les présentes CGU ainsi que notre [Politique de confidentialité]({privacy}). Si vous ne les acceptez pas, vous ne devez pas utiliser le Service.",
        ],
      },
      {
        id: 'editeur',
        title: 'Éditeur du service',
        blocks: [
          'Le Service est édité par {publisher}.',
          'Contact : **{email}**',
        ],
      },
      {
        id: 'service',
        title: 'Description du service',
        blocks: [
          'TanitMarket permet de publier et de consulter des annonces pour vendre, acheter, échanger ou donner des biens, partout en Tunisie. Le Service propose notamment :',
          {
            list: [
              "la publication gratuite d'annonces, sans commission sur les ventes ;",
              'une messagerie pour échanger et négocier le prix directement entre utilisateurs, en dinars tunisiens (TND) ;',
              'une liste de favoris et des notifications (e-mail et, si vous les activez, notifications push).',
            ],
          },
          "**TanitMarket ne propose aucun paiement en ligne.** Le paiement et la remise des biens se font directement entre l'acheteur et le vendeur (paiement à la livraison ou remise en main propre).",
        ],
      },
      {
        id: 'compte',
        title: 'Inscription et compte',
        blocks: [
          "La consultation des annonces est libre. La publication d'annonces, la messagerie et les favoris nécessitent un compte, créé avec une adresse e-mail et un mot de passe ou via un compte Google.",
          'Deux types de compte existent : **Particulier** et **Boutique Pro** (pour les professionnels). Le type de compte doit correspondre à votre situation réelle.',
          "Vous devez avoir au moins 18 ans, ou disposer de l'autorisation de votre représentant légal, pour créer un compte.",
          "Vous vous engagez à fournir des informations exactes, à les tenir à jour et à garder votre mot de passe confidentiel. Toute activité réalisée depuis votre compte est réputée faite par vous. En cas d'utilisation non autorisée, prévenez-nous sans délai à {email}.",
          "La vérification de l'adresse e-mail ou du numéro de téléphone peut être demandée pour accéder à certaines fonctionnalités.",
        ],
      },
      {
        id: 'annonces',
        title: 'Publication et modération des annonces',
        blocks: [
          "Vous êtes seul responsable du contenu de vos annonces (titre, description, photos, prix, état, localisation). L'annonce doit décrire un bien réel, que vous avez le droit de vendre, avec des photos qui le représentent fidèlement.",
          "Chaque annonce est vérifiée avant sa mise en ligne. Cette modération combine une analyse automatique du texte et des photos et, si besoin, une vérification par l'équipe. Une annonce peut être refusée ou retirée à tout moment si elle ne respecte pas les présentes CGU ; le motif vous est indiqué lorsque c'est possible.",
          'Sont notamment interdits :',
          {
            list: [
              'les armes, munitions, drogues et substances illicites ;',
              'les contrefaçons et les biens volés ou obtenus illégalement ;',
              'les contenus à caractère sexuel ou pornographique ;',
              'les services illégaux, les offres trompeuses et toute tentative d\'arnaque (par exemple une demande de paiement anticipé pour un bien inexistant) ;',
              'les insultes, propos haineux, discriminatoires ou violents, dans quelque langue que ce soit ;',
              'le spam, les annonces en double et les contenus sans rapport avec une véritable annonce ;',
              'plus généralement, tout bien ou contenu dont la vente ou la diffusion est interdite par la loi tunisienne.',
            ],
          },
        ],
      },
      {
        id: 'transactions',
        title: 'Relations entre utilisateurs et transactions',
        blocks: [
          "TanitMarket est un intermédiaire technique qui met en relation acheteurs et vendeurs. **TanitMarket n'est partie à aucune vente** : le contrat est conclu directement entre les utilisateurs, qui en assument seuls l'exécution (description du bien, prix, livraison, paiement, garanties).",
          'Pour votre sécurité, nous vous recommandons de :',
          {
            list: [
              "ne jamais payer à l'avance un bien que vous n'avez pas vu ;",
              "privilégier la remise en main propre dans un lieu public ou le paiement à la livraison, après vérification de l'objet ;",
              'ne jamais communiquer vos codes bancaires, mots de passe ou codes de vérification ;',
              'nous signaler toute annonce ou tout comportement suspect à {email}.',
            ],
          },
        ],
      },
      {
        id: 'messagerie',
        title: 'Messagerie et négociation',
        blocks: [
          "La messagerie sert uniquement aux échanges liés aux annonces (questions, offres et contre-offres de prix, organisation de la remise). Le harcèlement, le démarchage commercial non sollicité et l'envoi de contenus interdits sont proscrits.",
          "Une offre de prix acceptée dans la messagerie traduit un accord entre les utilisateurs ; elle n'entraîne aucun paiement via TanitMarket.",
          "L'équipe peut accéder aux conversations uniquement pour traiter un signalement, un litige, un abus ou répondre à une obligation légale.",
        ],
      },
      {
        id: 'diffusion',
        title: 'Diffusion des annonces',
        blocks: [
          'En publiant une annonce, vous accordez à TanitMarket, pour la durée de sa mise en ligne, le droit gratuit et non exclusif de la reproduire et de l\'afficher sur le Service et de la promouvoir, notamment sur les pages Facebook et Instagram de TanitMarket (photo, titre, prix, ville et extrait de la description, sans vos coordonnées).',
          'Vous garantissez détenir les droits sur les textes et photos que vous publiez.',
        ],
      },
      {
        id: 'propriete',
        title: 'Propriété intellectuelle',
        blocks: [
          'La marque TanitMarket, le logo, le design, les textes et le code du Service sont protégés. Toute reproduction ou extraction, notamment automatisée (aspiration de données), est interdite sans autorisation écrite.',
        ],
      },
      {
        id: 'responsabilite',
        title: 'Responsabilité',
        blocks: [
          "TanitMarket s'efforce d'assurer un accès continu et sécurisé au Service, sans pouvoir le garantir : des interruptions peuvent survenir pour maintenance ou en cas de panne.",
          "TanitMarket ne garantit pas l'exactitude des annonces, la qualité ou la conformité des biens, ni la solvabilité ou le comportement des utilisateurs, et ne saurait être tenu responsable des transactions conclues entre eux, dans les limites prévues par la loi.",
        ],
      },
      {
        id: 'suspension',
        title: 'Suspension et suppression du compte',
        blocks: [
          'En cas de manquement aux présentes CGU, de fraude ou de comportement portant atteinte aux autres utilisateurs, TanitMarket peut retirer des annonces, suspendre ou supprimer le compte concerné.',
          'Vous pouvez à tout moment demander la suppression de votre compte en écrivant à {email}. La suppression entraîne celle de votre profil et de vos annonces.',
        ],
      },
      {
        id: 'donnees',
        title: 'Données personnelles',
        blocks: [
          'Le traitement de vos données personnelles est décrit dans notre [Politique de confidentialité]({privacy}), conformément à la loi organique n° 2004-63 du 27 juillet 2004 portant sur la protection des données à caractère personnel.',
        ],
      },
      {
        id: 'modifications',
        title: 'Modification des CGU',
        blocks: [
          'TanitMarket peut modifier les présentes CGU. La date de mise à jour figure en haut de cette page. En cas de changement important, vous en serez informé sur le Service. Continuer à utiliser le Service après la mise à jour vaut acceptation des nouvelles CGU.',
        ],
      },
      {
        id: 'droit',
        title: 'Droit applicable et litiges',
        blocks: [
          "Les présentes CGU sont régies par le droit tunisien, notamment la loi n° 2000-83 du 9 août 2000 relative aux échanges et au commerce électroniques. En cas de litige, nous vous invitons à nous contacter d'abord pour rechercher une solution amiable ; à défaut, les tribunaux tunisiens compétents seront saisis.",
        ],
      },
    ],
  },

  ar: {
    title: 'الشروط العامة للاستخدام',
    short: 'الشروط',
    intro:
      'مرحباً بك في TanitMarket. تنظّم هذه الشروط استخدام منصة الإعلانات المبوّبة بين الأفراد والمهنيين في تونس. يرجى قراءتها بعناية.',
    sections: [
      {
        id: 'objet',
        title: 'الموضوع والقبول',
        blocks: [
          'تحدّد هذه الشروط العامة للاستخدام («الشروط») قواعد الدخول إلى موقع tanitmarket.com وتطبيق الويب TanitMarket واستخدامهما («الخدمة»).',
          'بإنشاء حساب أو باستخدام الخدمة، فإنك تقبل هذه الشروط دون تحفظ، وكذلك [سياسة الخصوصية]({privacy}). إذا كنت لا تقبلها، فيجب عليك عدم استخدام الخدمة.',
        ],
      },
      {
        id: 'editeur',
        title: 'ناشر الخدمة',
        blocks: ['يتولى نشر الخدمة {publisher}.', 'للتواصل: **{email}**'],
      },
      {
        id: 'service',
        title: 'وصف الخدمة',
        blocks: [
          'تتيح TanitMarket نشر الإعلانات والاطلاع عليها لبيع السلع أو شرائها أو مبادلتها أو التبرع بها في كامل أنحاء تونس. وتوفّر الخدمة خاصة:',
          {
            list: [
              'نشر الإعلانات مجاناً ودون أي عمولة على المبيعات؛',
              'خدمة مراسلة للتواصل والتفاوض على السعر مباشرة بين المستخدمين بالدينار التونسي؛',
              'قائمة مفضّلة وإشعارات (عبر البريد الإلكتروني، وإشعارات فورية إذا قمت بتفعيلها).',
            ],
          },
          '**لا توفّر TanitMarket أي دفع إلكتروني.** يتمّ الدفع وتسليم السلع مباشرة بين المشتري والبائع (الدفع عند الاستلام أو التسليم يداً بيد).',
        ],
      },
      {
        id: 'compte',
        title: 'التسجيل والحساب',
        blocks: [
          'تصفّح الإعلانات متاح للجميع. أما نشر الإعلانات والمراسلة والمفضّلة فتتطلّب حساباً يُنشأ ببريد إلكتروني وكلمة مرور أو عبر حساب Google.',
          'يوجد نوعان من الحسابات: **فرد** و**متجر احترافي** (للمهنيين). يجب أن يتوافق نوع الحساب مع وضعك الفعلي.',
          'يجب أن يكون عمرك 18 سنة على الأقل، أو أن تحصل على إذن وليّك القانوني، لإنشاء حساب.',
          'تلتزم بتقديم معلومات صحيحة وتحديثها والحفاظ على سرية كلمة المرور. يُعتبر كل نشاط يتمّ من حسابك صادراً عنك. في حال استخدام غير مرخّص، أعلمنا فوراً على {email}.',
          'قد يُطلب التحقق من البريد الإلكتروني أو رقم الهاتف للوصول إلى بعض الميزات.',
        ],
      },
      {
        id: 'annonces',
        title: 'نشر الإعلانات ومراجعتها',
        blocks: [
          'أنت وحدك المسؤول عن محتوى إعلاناتك (العنوان، الوصف، الصور، السعر، الحالة، المكان). يجب أن يصف الإعلان سلعة حقيقية يحقّ لك بيعها، مع صور تمثّلها بأمانة.',
          'يُراجَع كل إعلان قبل نشره. تجمع هذه المراجعة بين تحليل آلي للنص والصور، ومراجعة من الفريق عند الحاجة. يمكن رفض أي إعلان أو سحبه في أي وقت إذا لم يحترم هذه الشروط، ويُعلَمك بالسبب متى أمكن ذلك.',
          'يُمنع خاصة:',
          {
            list: [
              'الأسلحة والذخيرة والمخدرات والمواد المحظورة؛',
              'السلع المقلّدة والمسروقة أو المتحصّل عليها بطرق غير قانونية؛',
              'المحتوى ذو الطابع الجنسي أو الإباحي؛',
              'الخدمات غير القانونية والعروض المضلّلة وكل محاولة احتيال (مثل طلب دفع مسبق مقابل سلعة غير موجودة)؛',
              'الشتائم وخطاب الكراهية أو التمييز أو العنف، بأي لغة كانت؛',
              'الرسائل المزعجة والإعلانات المكرّرة والمحتوى الذي لا علاقة له بإعلان حقيقي؛',
              'وبصفة عامة، كل سلعة أو محتوى يحظر القانون التونسي بيعه أو نشره.',
            ],
          },
        ],
      },
      {
        id: 'transactions',
        title: 'العلاقات بين المستخدمين والمعاملات',
        blocks: [
          'TanitMarket وسيط تقني يربط بين المشترين والبائعين. **ليست TanitMarket طرفاً في أي عملية بيع**: يُبرم العقد مباشرة بين المستخدمين الذين يتحمّلون وحدهم تنفيذه (وصف السلعة، السعر، التسليم، الدفع، الضمانات).',
          'حفاظاً على سلامتك، ننصحك بما يلي:',
          {
            list: [
              'لا تدفع أبداً مسبقاً ثمن سلعة لم ترها؛',
              'فضّل التسليم يداً بيد في مكان عام أو الدفع عند الاستلام بعد التثبّت من السلعة؛',
              'لا تشارك أبداً بياناتك البنكية أو كلمات المرور أو رموز التحقق؛',
              'أبلغنا عن أي إعلان أو سلوك مشبوه على {email}.',
            ],
          },
        ],
      },
      {
        id: 'messagerie',
        title: 'المراسلة والتفاوض',
        blocks: [
          'تُستعمل المراسلة فقط للتواصل المتعلق بالإعلانات (الأسئلة، عروض الأسعار والعروض المقابلة، تنظيم التسليم). يُمنع التحرّش والإشهار غير المرغوب فيه وإرسال المحتوى المحظور.',
          'يعكس عرض السعر المقبول في المراسلة اتفاقاً بين المستخدمين، ولا يترتّب عنه أي دفع عبر TanitMarket.',
          'لا يطّلع الفريق على المحادثات إلا لمعالجة بلاغ أو نزاع أو إساءة، أو للاستجابة لالتزام قانوني.',
        ],
      },
      {
        id: 'diffusion',
        title: 'نشر الإعلانات والترويج لها',
        blocks: [
          'بنشرك لإعلان، تمنح TanitMarket، طوال مدة نشره، حقاً مجانياً وغير حصري في نسخه وعرضه على الخدمة والترويج له، لا سيما على صفحتي TanitMarket في فيسبوك وإنستغرام (الصورة، العنوان، السعر، المدينة ومقتطف من الوصف، دون بيانات الاتصال الخاصة بك).',
          'تضمن أنك تملك الحقوق على النصوص والصور التي تنشرها.',
        ],
      },
      {
        id: 'propriete',
        title: 'الملكية الفكرية',
        blocks: [
          'علامة TanitMarket وشعارها وتصميمها ونصوصها والشفرة البرمجية للخدمة محمية. يُمنع كل نسخ أو استخراج، خاصة بطريقة آلية (جمع البيانات)، دون ترخيص كتابي.',
        ],
      },
      {
        id: 'responsabilite',
        title: 'المسؤولية',
        blocks: [
          'تسعى TanitMarket إلى توفير وصول متواصل وآمن إلى الخدمة دون أن تضمن ذلك: قد تحدث انقطاعات بسبب الصيانة أو الأعطال.',
          'لا تضمن TanitMarket صحة الإعلانات ولا جودة السلع أو مطابقتها ولا ملاءة المستخدمين أو سلوكهم، ولا تتحمّل مسؤولية المعاملات المبرمة بينهم، في الحدود التي يسمح بها القانون.',
        ],
      },
      {
        id: 'suspension',
        title: 'تعليق الحساب وحذفه',
        blocks: [
          'في حال الإخلال بهذه الشروط أو الاحتيال أو أي سلوك يضرّ بالمستخدمين الآخرين، يمكن لـ TanitMarket سحب الإعلانات أو تعليق الحساب المعني أو حذفه.',
          'يمكنك في أي وقت طلب حذف حسابك بمراسلتنا على {email}. يترتّب عن الحذف حذف ملفك الشخصي وإعلاناتك.',
        ],
      },
      {
        id: 'donnees',
        title: 'المعطيات الشخصية',
        blocks: [
          'تُوضّح [سياسة الخصوصية]({privacy}) كيفية معالجة معطياتك الشخصية، طبقاً للقانون الأساسي عدد 63 لسنة 2004 المؤرخ في 27 جويلية 2004 المتعلق بحماية المعطيات الشخصية.',
        ],
      },
      {
        id: 'modifications',
        title: 'تعديل الشروط',
        blocks: [
          'يمكن لـ TanitMarket تعديل هذه الشروط. يظهر تاريخ آخر تحديث أعلى هذه الصفحة. في حال حدوث تغيير مهم، سيتم إعلامك عبر الخدمة. ويُعدّ استمرارك في استخدام الخدمة بعد التحديث قبولاً للشروط الجديدة.',
        ],
      },
      {
        id: 'droit',
        title: 'القانون المنطبق والنزاعات',
        blocks: [
          'تخضع هذه الشروط للقانون التونسي، لا سيما القانون عدد 83 لسنة 2000 المؤرخ في 9 أوت 2000 المتعلق بالمبادلات والتجارة الإلكترونية. في حال نزاع، ندعوك إلى التواصل معنا أولاً للبحث عن حلّ ودّي، وإلا فتختصّ المحاكم التونسية المختصة بالنظر فيه.',
        ],
      },
    ],
  },
};
