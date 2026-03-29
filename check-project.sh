#!/bin/bash
# 🚀 فحص سريع للمشروع

echo "==================================="
echo "🔍 فحص سريع لمشروع سمايلي"
echo "==================================="
echo ""

# 1. فحص السيرفر
echo "1️⃣ فحص السيرفر..."
if pgrep -f "next dev" > /dev/null; then
    echo "✅ السيرفر يعمل"
else
    echo "❌ السيرفر لا يعمل"
    echo "   لتشغيله: bun run dev"
fi
echo ""

# 2. فحص قاعدة البيانات
echo "2️⃣ فحص قاعدة البيانات..."
if [ -f "db/custom.db" ]; then
    SIZE=$(ls -lh db/custom.db | awk '{print $5}')
    echo "✅ قاعدة البيانات موجودة (الحجم: $SIZE)"
else
    echo "❌ قاعدة البيانات غير موجودة"
    echo "   لإنشائها: bun run db:push"
fi
echo ""

# 3. فحص ESLint
echo "3️⃣ فحص الكود..."
if bun run lint > /dev/null 2>&1; then
    echo "✅ لا توجد أخطاء في الكود"
else
    echo "❌ توجد أخطاء في الكود"
fi
echo ""

# 4. فحص الملفات الرئيسية
echo "4️⃣ فحص الملفات الرئيسية..."
FILES=(
    "src/app/page.tsx"
    "src/app/auth/login/page.tsx"
    "src/app/admin/page.tsx"
    "src/hooks/useCurrentUser.ts"
    "src/lib/db.ts"
    "prisma/schema.prisma"
)

ALL_EXIST=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file مفقود"
        ALL_EXIST=false
    fi
done
echo ""

# 5. فحص المنفذ
echo "5️⃣ فحص المنفذ 3000..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ المنفذ 3000 قيد الاستخدام"
else
    echo "❌ المنفذ 3000 غير مستخدم"
fi
echo ""

# الخلاصة
echo "==================================="
if [ "$ALL_EXIST" = true ]; then
    echo "✅ المشروع في حالة ممتازة!"
    echo ""
    echo "للتشغيل:"
    echo "  bun run dev"
    echo ""
    echo "للفتح المشروع:"
    echo "  http://localhost:3000"
else
    echo "⚠️  بعض الملفات مفقودة"
fi
echo "==================================="
