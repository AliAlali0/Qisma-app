# ⚽ تطبيق قِسمة (Qismah App)
### المنصة الذكية لإدارة تمارين وبطولات كرة القدم وتوزيع الفرق بالذكاء الاصطناعي
> **Smart Pickup Football Organizer, Tactical Pitch & AI-Powered WhatsApp List Parser**

---

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo_SDK_58-000000?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Node.js_&_Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/AI_Engine-Google_Gemini_API-8E75B2?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" />
</p>

---

## 📌 عن المشروع (Overview)

يعالج تطبيق **قِسمة** الفوضى الأسبوعية التي يواجهها مئات الآلاف من منظّمي مباريات كرة القدم الودية (تمارين الحواري والملاعب المستأجرة). بدلاً من التقسيم اليدوي المرهق والخلافات المستمرة حول توازن الفرق وقوائم الواتساب العشوائية، يوفّر **قِسمة** حلاً متكاملاً يبدأ من قراءة رسائل الواتساب بالذكاء الاصطناعي، مروراً برسم التشكيلات التكتيكية على ملعب تفاعلي، وصولاً إلى بطاقات فيفا (FUT Cards) وإدارة البطولات وسجلات اللاعبين.

---

## 🌟 أبرز مميزات التطبيق (Key Features)

### 1. 🤖 التقسيم الذكي بمودل الذكاء الاصطناعي (AI WhatsApp Parser)
* الصق قائمة أسماء اللاعبين المنسوخة من قروب الواتساب بأي شكل وصيغة عفوية.
* يقوم نموذج **Google Gemini API** بتحليل النص، تنظيف الرموز والأرقام، واستخراج اسم كل لاعب ومركزه الأساسي والاحتياطي تلقائياً.
* خوارزمية موازنة تكتيكية تضمن تكافؤ القوى بين الفريقين وحساب جبر الأعداد الفردية تلقائياً.

### 2. 🏟️ الملعب التفاعلي والتشكيلات التكتيكية (Tactical Pitch)
* محاكاة بصرية لملعب كرة قدم كامل يعرض الفريقين وجهاً لوجه مع خطط اللعب (Formations).
* إمكانية تغيير مراكز اللاعبين أو تبديل الأماكن بالنقر المباشر أو الضغط المطوّل.
* مشاركة تشكيلة الملعب فوراً كصورة عالية الدقة (High-Res Image) أو رسالة نصية منسقة للواتساب.

### 3. 🎴 مولّد بطاقات فيفا للاعبين (EA FC / FUT Player Card Generator)
* تحويل بروفايل وإحصائيات أي لاعب إلى بطاقة **Ultimate Team** احترافية (ذهبية نادرة، كلاسيكية، أو بطاقة نجم الأسبوع **MVP In-Form**).
* تتضمن البطاقة تقييم اللاعب العام، مركزه، خصائص فيفا الستة (PAC, SHO, PAS, DRI, DEF, PHY)، ووسم مجموعته.
* إمكانية حفظ ومشاركة بطاقة اللاعب كصورة لنشرها في ستوري إنستقرام أو قروبات الواتساب.

### 4. 👥 دعم المجموعات والتمارين المتعددة (Multi-Squad Circles)
* إدارة تمارين متعددة بدون خلط اللاعبين (مثلاً: `🏢 قروب الدوام`، `⚽ تمرين الحارة`، `🏆 دوري الاستراحة`).
* فلترة سريعة للتشكيلات واختيار اللاعبين بحسب المجموعة.

### 5. 🏆 محرك البطولات والدوريات (Tournaments Engine)
* إنشاء بطولات سريعة بنظام المجموعات/الدوري بالنقاط أو بنظام خروج المغلوب.
* جدولة المباريات وحساب جدول الترتيب والنقاط وفارق الأهداف تلقائياً.

### 6. 🛡️ سجل الأفرقة وتخصيص الأطقم (Custom Teams & Kits)
* حفظ الأفرقة بهويتها وألوان أطقمها المفضلة (Kit Colors & Badges).
* تعيين أي فريق مباشرة في الملعب كـ **الفريق الأول (A)** أو **الفريق الثاني (B)** بنقرة واحدة.

### 7. 👑 نظام الحسابات والصلاحيات (Role-Based Access)
* **وضع الضيف (Guest Mode):** استخدام سريع ومباشر للتقسيم بدون تسجيل دخول.
* **وضع المسجل والبرو (Admin / Registered):** حفظ دائم في قاعدة البيانات، إدارة سجل اللاعبين، رصد النتائج، واختيار نجم المباراة MVP مع ترقية التقييمات.

---

## 🛠️ البنية التقنية (Tech Stack)

| الطبقة (Layer) | التقنيات المستخدمة |
|---|---|
| **تطبيق الجوال (Frontend)** | React Native, Expo SDK 58, Expo Sharing, View Shot |
| **الواجهات والتصميم (UI/UX)** | Custom Modern Dark/Emerald Sports Theme (Mobile First) |
| **الخادم الخلفي (Backend)** | Node.js, Express.js RESTful API |
| **قاعدة البيانات (Database)** | PostgreSQL (Containerized via Docker) |
| **محرك الذكاء الاصطناعي (AI)** | Google Gemini API (`@google/genai`) |

---

## 🚀 تشغيل المشروع محلياً (Getting Started)

### المتطلبات المسبقة:
* [Node.js](https://nodejs.org/) (v18 أو أحدث)
* [Docker Desktop](https://www.docker.com/) (لتشغيل قاعدة بيانات PostgreSQL)
* [Expo Go](https://expo.dev/go) على هاتفك الجوال، أو محاكي Android / iOS.

### 1. استنساخ المشروع (Clone Repository):
```bash
git clone https://github.com/AliAlali0/Qisma-app.git
cd Qisma-app
```

### 2. تشغيل قاعدة البيانات (Database):
```bash
docker-compose up -d
```

### 3. إعداد وتشغيل الخادم الخلفي (Backend Server):
```bash
cd mobile/backend
npm install
npm run dev
# السيرفر سيعمل على المنفذ http://localhost:5000
```

### 4. تشغيل تطبيق الجوال (Expo Mobile App):
```bash
cd ../
npm install
npx expo start
```
امسح رمز الـ QR عبر تطبيق **Expo Go** على هاتفك لتجربة التطبيق مباشرة!

---

## 📂 هيكل المجلدات (Project Architecture)

```
QismaApp/
├── docker-compose.yml          # تكوين قاعدة بيانات PostgreSQL
├── PLAN.md                     # خارطة طريق التطوير
├── mobile/
│   ├── App.js                  # المتحكم الرئيسي وإدارة التنقل والحالة
│   ├── styles.js               # السمات والتنسيقات البصرية
│   ├── components/
│   │   ├── FutCardModal.js     # بطاقة فيفا التفاعلية ومشاركتها
│   │   ├── HeaderBar.js        # شريط العنوان والرجوع السريع والصلاحيات
│   │   ├── PlayerCard.js       # بطاقات اللاعبين في الملعب
│   │   └── AppModals.js        # نوافذ تسجيل النتائج والدخول
│   ├── screens/
│   │   ├── HomeScreen.js       # القائمة الرئيسية (شبكة مربعات تفاعلية)
│   │   ├── DivideScreen.js     # تقسيم اللستة النصية والملعب التفاعلي
│   │   ├── DraftScreen.js      # التقسيم التكتيكي وبناء الخطط
│   │   ├── PlayersScreen.js    # سجل اللاعبين وفلترة المجموعات وبطاقات FUT
│   │   ├── TeamsScreen.js      # إدارة الأفرقة وتعيين التشكيلات في الملعب
│   │   ├── MatchesScreen.js    # أرشيف المباريات وجوائز MVP
│   │   └── Tournaments...      # إدارة وجداول ومباريات البطولات
│   └── backend/
│       ├── server.js           # خادم Express API ومسارات Gemini AI
│       └── db.js               # تهيئة جداول PostgreSQL
```

---

## 👨‍💻 المطوّر (Author)

تم بناء وتطوير المشروع بشغف لخدمة مجتمع رياضة كرة القدم الهاوية.  
* **GitHub:** [@AliAlali0](https://github.com/AliAlali0)
* **LinkedIn:** [Ali Alali](https://linkedin.com)

---

## 📄 الترخيص (License)
هذا المشروع مرخّص تحت رخصة [MIT License](LICENSE).
