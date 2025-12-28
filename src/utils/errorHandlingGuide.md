# دليل معالجة الأخطاء

يشرح هذا المستند الفرق بين أدوات `AppError` و`responseHandler` ومتى تستخدم كل واحدة منها.

## نظرة عامة

يستخدم تطبيقنا نهجين متكاملين لمعالجة الأخطاء:

1. **AppError** - لإنشاء أخطاء منظمة في المنطق التجاري
2. **responseHandler** - لإرسال استجابات موحدة للعملاء

## AppError مقابل responseHandler

### AppError

**الغرض**: إنشاء كائنات أخطاء منظمة في طبقة المنطق التجاري
**الموقع**: يُستخدم في الخدمات، النماذج، ومتحكمات
**متى تستخدمه**: عندما تحتاج إلى رمي/التقاط الأخطاء في منطق تطبيقك

#### مثال على الاستخدام:

``javascript
// في ملف خدمة (مثل authService.js)
const { User } = require('../models');
const AppError = require('../utils/AppError');

const registerUser = async (userData) => {
  // التحقق من وجود المستخدم مسبقًا
  const existingUser = await User.findOne({ 
    where: { email: userData.email } 
  });
  
  if (existingUser) {
    // استخدام AppError لإنشاء خطأ منظم
    throw new AppError('المستخدم موجود بالفعل بهذا البريد الإلكتروني', 400);
  }
  
  // متابعة إنشاء المستخدم...
  const user = await User.create(userData);
  return user;
};

module.exports = { registerUser };
```

### responseHandler

**الغرض**: إرسال استجابات موحدة للعملاء
**الموقع**: يُستخدم مباشرة في المتحكمات
**متى تستخدمه**: عندما تريد إرسال استجابة مباشرة إلى العميل

#### مثال على الاستخدام:

```
// في ملف متحكم (مثل authController.js)
const { successResponse, failureResponse, createdResponse } = require('../utils/responseHandler');
const { authService } = require('../services/index');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    // استخدام responseHandler لإرسال استجابة موحدة
    return createdResponse(res, { user }, 'تم تسجيل المستخدم بنجاح');
  } catch (error) {
    // للاستجابات المباشرة للأخطاء في المتحكمات
    if (error.message === 'فشل التحقق') {
      return failureResponse(res, 'بيانات المستخدم غير صالحة', 400);
    }
    
    // تمرير AppError إلى معالج الأخطاء العام
    next(error);
  }
};

module.exports = { register };
```

## معالج أخطاء قواعد البيانات (databaseErrorHandler)

### الغرض
تحويل أخطاء قواعد البيانات التقنية إلى رسائل مفهومة للمستخدم تلقائيًا.

### الموقع
يُستخدم داخليًا في معالج الأخطاء العام لمعالجة أخطاء قواعد البيانات.

### مثال على الاستخدام:

```
// في ملف databaseErrorHandler.js
const { handleDatabaseError } = require('../utils/databaseErrorHandler');

// في معالج الأخطاء العام
const errorHandler = (err, req, res, next) => {
  // معالجة تلقائية لأخطاء قواعد البيانات
  const dbError = handleDatabaseError(err);
  if (dbError && !err.statusCode) {
    return failureResponse(res, dbError.message, dbError.statusCode);
  }
  
  // باقي منطق معالجة الأخطاء...
};
```

### أمثلة لأنواع أخطاء قواعد البيانات المدعومة:

1. **أخطاء MySQL**:
   - `ER_DUP_ENTRY`: "السجل موجود بالفعل"
   - `ER_NO_REFERENCED_ROW_2`: "لا يمكن الحذف: مُشار إليه من سجلات أخرى"

2. **أخطاء PostgreSQL**:
   - `23505` (unique_violation): "السجل موجود بالفعل"
   - `23503` (foreign_key_violation): "لا يمكن الحذف: مُشار إليه من سجلات أخرى"

3. **أخطاء SQLite**:
   - `SQLITE_CONSTRAINT`: "انتهاك القيد"

## مثال كامل: تدفق تسجيل المستخدم

### 1. طبقة الخدمة (باستخدام AppError)

```
// src/services/authService.js
const { User } = require('../models');
const AppError = require('../utils/AppError');

const registerUser = async (userData) => {
  try {
    // التحقق من منطق الأعمال
    if (!userData.email && !userData.phone) {
      throw new AppError('يجب تقديم البريد الإلكتروني أو رقم الهاتف', 400);
    }
    
    // التحقق من المستخدم الحالي
    const whereClause = userData.email ? { email: userData.email } : { phone: userData.phone };
    const existingUser = await User.findOne({ where: whereClause });
    
    if (existingUser) {
      const field = userData.email ? 'البريد الإلكتروني' : 'رقم الهاتف';
      throw new AppError(`المستخدم موجود بالفعل بهذا ${field}`, 409);
    }
    
    // إنشاء مستخدم جديد
    const user = await User.create(userData);
    return user;
  } catch (error) {
    // إعادة رمي أخطاء قاعدة البيانات كأخطاء AppError
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('المستخدم موجود بالفعل', 409);
    }
    throw error; // إعادة رمي الأخطاء الأخرى
  }
};

module.exports = { registerUser };
```

### 2. طبقة المتحكم (باستخدام responseHandler)

```
// src/controllers/authController.js
const { createdResponse, successResponse } = require('../utils/responseHandler');
const { authService } = require('../services/index');
const AppError = require('../utils/AppError');

const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    
    // إرسال استجابة نجاح
    return createdResponse(res, { 
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone
      }
    }, 'تم تسجيل المستخدم بنجاح');
  } catch (error) {
    // تمرير الأخطاء المنظمة إلى المعالج العام
    next(error);
  }
};

module.exports = { register };
```

### 3. معالج الأخطاء العام (يستخدم responseHandler داخليًا)

```
// src/middleware/errorHandler.js
const { failureResponse, errorResponse } = require('../utils/responseHandler');
const { handleDatabaseError } = require('../utils/databaseErrorHandler');

const errorHandler = (err, req, res, next) => {
  // تسجيل الخطأ للتصحيح
  console.error('خطأ:', err);
  
  // معالجة تلقائية لأخطاء قواعد البيانات
  const dbError = handleDatabaseError(err);
  if (dbError && !err.statusCode) {
    return failureResponse(res, dbError.message, dbError.statusCode);
  }
  
  // معالجة AppErrors
  if (err.isOperational) {
    return failureResponse(res, err.message, err.statusCode, err.errors);
  }
  
  // معالجة الأخطاء غير المتوقعة
  return errorResponse(res, 'خطأ في الخادم الداخلي', 500);
};

module.exports = { errorHandler };
```




## مثال مع AuthService

```
const { authService } = require('../services/index');

// Using the service
try {
  const result = await authService.someMethod();
} catch (error) {
  // Handle error appropriately
}
```

## Another Example with AuthService

```
const { authService } = require('../services/index');

// Using the service
try {
  const result = await authService.anotherMethod();
} catch (error) {
  // Handle error appropriately
}
```

## متى تستخدم أي منهما؟

### استخدم AppError когда:
- ✅ تنفيذ منطق الأعمال في الخدمات
- ✅ التحقق من صحة البيانات في النماذج
- ✅ تحتاج إلى رمي أخطاء منظمة سيتم التقاطها لاحقًا
- ✅ تريد الحفاظ على سياق الخطأ عبر المكالمات غير المتزامنة

### استخدم responseHandler عندما:
- ✅ إرسال استجابات فورية في المتحكمات
- ✅ معالجة حالات النجاح في المتحكمات
- ✅ تريد إرسال استجابة مباشرة دون رمي أخطاء
- ✅ تحتاج إلى إرسال رموز حالة HTTP محددة فورًا

### استخدم databaseErrorHandler عندما:
- ✅ تريد معالجة تلقائية لأخطاء قواعد البيانات
- ✅ تحتاج إلى تحويل أخطاء قاعدة البيانات التقنية إلى رسائل مفهومة
- ✅ تريد دعم أنواع متعددة من قواعد البيانات

## أفضل الممارسات

1. **استخدم AppError في الخدمات**: ارمِ أخطاء منظمة يمكن معالجتها بواسطة معالج الأخطاء العام
2. **استخدم responseHandler في المتحكمات**: للاستجابات المباشرة وحالات النجاح
3. **دع databaseErrorHandler يعالج أخطاء قواعد البيانات تلقائيًا**: لا تحتاج لمعالجتها يدويًا
4. **لا تخلط بين النهجين**: إما رمي AppError أو إرسال استجابة مع responseHandler، وليس كلاهما
5. **دع المعالج العام يتعامل مع AppErrors**: مرر AppErrors إلى `next()` في المتحكمات

## مخطط التدفق

```
طلب العميل
     ↓
المتحكم (قد يستخدم responseHandler للاستجابات المباشرة)
     ↓
الخدمة (يجب استخدام AppError لأخطاء منطق الأعمال)
     ↓
النموذج (قد يستخدم AppError لأخطاء التحقق)
     ↓
قاعدة البيانات (الأخطاء التي تم التقاطها وتحويلها إلى AppError)
     ↓
معالج الأخطاء العام (يستخدم databaseErrorHandler وresponseHandler)
     ↓
استجابة العميل
```

## أمثلة عملية

### مثال 1: معالجة تكرار البريد الإلكتروني

``javascript
// في الخدمة
const registerUser = async (userData) => {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    // databaseErrorHandler سيحول هذا تلقائيًا إلى:
    // "السجل موجود بالفعل" مع رمز الحالة 409
    throw error;
  }
};
```

### مثال 2: معالجة حقل غير موجود

```
// عند محاولة الوصول لحقل غير موجود
// databaseErrorHandler سيحول خطأ ER_BAD_FIELD_ERROR تلقائيًا إلى:
// "اسم الحقل غير صالح" مع رمز الحالة 400
```

يضمن هذا النهج:
- استجابات أخطاء متسقة عبر التطبيق
- فصل واضح للمهام
- معالجة أخطاء قابلة للصيانة والتوسع
- تمييز واضح بين أخطاء منطق الأعمال وتنسيق الاستجابة
- معالجة تلقائية لأخطاء قواعد البيانات