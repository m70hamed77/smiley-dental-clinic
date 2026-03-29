'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, FileText, Search, Plus, Bell, LogOut, User, Settings } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-1000 to-teal-900 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🦷</span>
            </div>
            <span className="text-xl font-bold">سمايلي</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-emerald-800 font-medium">لوحة التحكم</a>
            <a href="#" className="text-sm hover:text-emerald-800">البحث</a>
            <a href="#" className="text-sm hover:text-emerald-800">المحادثات</a>
            <a href="#" className="text-sm hover:text-emerald-800">المواعيد</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">مرحباً، أحمد 👋</h1>
          <p className="text-muted-foreground">إليك ملخص نشاطك على منصة سمايلي</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription suppressHydrationWarning={true}>الطلبات النشطة</CardDescription>
              <CardTitle className="text-3xl">2</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription suppressHydrationWarning={true}>الحالات المكتملة</CardDescription>
              <CardTitle className="text-3xl">5</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription suppressHydrationWarning={true}>المواعيد القادمة</CardDescription>
              <CardTitle className="text-3xl">1</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription suppressHydrationWarning={true}>الرسائل غير المقروءة</CardDescription>
              <CardTitle className="text-3xl">3</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                بحث عن حالات
              </CardTitle>
              <CardDescription suppressHydrationWarning={true}>ابحث عن الطلاب والحالات المتاحة</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-to-r from-emerald-800 to-teal-900" asChild>
                <Link href="/search" suppressHydrationWarning={true}>
                  ابدأ البحث
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                طلباتي
              </CardTitle>
              <CardDescription suppressHydrationWarning={true}>تتبع حالة طلباتك الحالية</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/applications" suppressHydrationWarning={true}>
                  عرض الطلبات
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Cases */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle suppressHydrationWarning={true}>الحالات النشطة</CardTitle>
            <CardDescription suppressHydrationWarning={true}>المواعيد القادمة والحالات الجارية</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Active Case 1 */}
              <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">حشو سن - فك مسن</h3>
                      <Badge className="bg-emerald-800 text-emerald-50">نشط</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      مع د. سارة أحمد - كلية طب الأسنان جامعة القاهرة
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>15 فبراير 2024</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>3:00 مساءً</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" suppressHydrationWarning={true}>
                    عرض التفاصيل
                  </Button>
                </div>
              </div>

              {/* Active Case 2 */}
              <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">تنظيف أسنان وتبييض</h3>
                      <Badge className="bg-yellow-100 text-yellow-700">قيد الانتظار</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      مع د. محمد خالد - كلية طب الأسنان جامعة الإسكندرية
                    </p>
                    <p className="text-sm text-muted-foreground">
                      تم إرسال الطلب - بانتظار قبول الطالب
                    </p>
                  </div>
                  <Button variant="outline" size="sm" suppressHydrationWarning={true}>
                    عرض الطلب
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning={true}>النشاط الأخير</CardTitle>
            <CardDescription suppressHydrationWarning={true}>آخر التحديثات على حسابك</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-slate-1000 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">تم قبول طلبك من د. سارة أحمد</p>
                  <p className="text-xs text-muted-foreground">منذ ساعتين</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">رسالة جديدة من د. سارة أحمد</p>
                  <p className="text-xs text-muted-foreground">منذ 3 ساعات</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">تذكير بموعدك غداً الساعة 3:00</p>
                  <p className="text-xs text-muted-foreground">منذ 5 ساعات</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
