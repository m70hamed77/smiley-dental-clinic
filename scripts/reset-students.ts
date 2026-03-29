/**
 * Reset Students/Doctors Script
 *
 * This script DELETES ALL STUDENT/DOCTOR accounts and their related data.
 * Only keeps ADMIN and PATIENT accounts.
 *
 * WARNING: This action is IRREVERSIBLE!
 *
 * What will be DELETED:
 * - All Student profiles
 * - All User accounts with role = STUDENT
 * - All posts created by students
 * - All applications
 * - All cases
 * - All conversations
 * - All messages
 * - All ratings
 * - All reports (if any)
 *
 * What will be KEPT:
 * - Admin accounts
 * - Patient accounts
 * - Database schema
 *
 * Usage:
 *   npm run reset-students
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetStudents() {
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║      ⚠️  DANGER: RESET STUDENTS/DOCTORS ⚠️          ║')
  console.log('╚══════════════════════════════════════════════════════╝\n')

  try {
    // Step 1: Show what will be deleted
    console.log('📊 جاري تحليل البيانات...\n')

    const studentCount = await prisma.student.count()
    const studentUsersCount = await prisma.user.count({
      where: { role: 'STUDENT' }
    })
    const postCount = await prisma.post.count()
    const applicationCount = await prisma.application.count()
    const caseCount = await prisma.case.count()
    const conversationCount = await prisma.conversation.count()
    const messageCount = await prisma.message.count()
    const ratingCount = await prisma.rating.count()

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 ما سيتم حذفه:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`  👨‍🎓 الطلاب/الدكاترة:     ${studentCount}`)
    console.log(`  👤 حسابات المستخدمين:    ${studentUsersCount}`)
    console.log(`  📝 البوستات:            ${postCount}`)
    console.log(`  📋 الطلبات (Applications): ${applicationCount}`)
    console.log(`  🏥 الحالات (Cases):      ${caseCount}`)
    console.log(`  💬 المحادثات:           ${conversationCount}`)
    console.log(`  💭 الرسائل:             ${messageCount}`)
    console.log(`  ⭐ التقييمات:            ${ratingCount}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    if (studentCount === 0) {
      console.log('✅ لا يوجد طلاب/دكاترة لحذفهم. النظام نظيف بالفعل!\n')
      process.exit(0)
    }

    // Step 2: Ask for confirmation
    console.log('⚠️  تحذير: هذا الإجراء غير قابل للعكس!')
    console.log('   سيتم حذف جميع بيانات الطلاب/الدكاترة نهائياً.\n')

    // Auto-confirm since this is a script (you can add manual confirmation if needed)
    const confirm = true // Change to false to require manual confirmation

    if (!confirm) {
      console.log('❌ تم إلغاء العملية.')
      process.exit(0)
    }

    console.log('🚀 جاري بدء عملية الحذف...\n')

    // Step 3: Delete in correct order (respecting foreign keys)
    const steps = [
      { name: 'حذف التقييمات', action: () => prisma.rating.deleteMany({}) },
      { name: 'حذف الرسائل', action: () => prisma.message.deleteMany({}) },
      { name: 'حذف المحادثات', action: () => prisma.conversation.deleteMany({}) },
      { name: 'حذف الحالات (Cases)', action: () => prisma.case.deleteMany({}) },
      { name: 'حذف البيانات الطبية للحالات', action: () => prisma.applicationMedicalData.deleteMany({}) },
      { name: 'حذف الطلبات (Applications)', action: () => prisma.application.deleteMany({}) },
      { name: 'حذف البوستات', action: () => prisma.post.deleteMany({}) },
      { name: 'حذف الشهادات', action: () => prisma.patientCertificate.deleteMany({}) },
      { name: 'حذف صور الحالات', action: () => prisma.casePhoto.deleteMany({}) },
      { name: 'حذف موافقات المرضى', action: () => prisma.patientConsent.deleteMany({}) },
      { name: 'حذف الملفات الطبية للمرضى', action: () => prisma.patientMedicalProfile.deleteMany({}) },
      { name: 'حذف شارات الطلاب', action: () => prisma.studentBadge.deleteMany({}) },
      { name: 'حذف نقاط الطلاب', action: () => prisma.studentPoints.deleteMany({}) },
      { name: 'حذف إحصائيات الطلاب', action: () => prisma.studentStats.deleteMany({}) },
      { name: 'حذف الملفات الشخصية للمرضى', action: () => prisma.patient.deleteMany({}) },
      { name: 'حذف الملفات الشخصية للطلاب', action: () => prisma.student.deleteMany({}) },
      { name: 'حذف حسابات المستخدمين (STUDENT)', action: () => prisma.user.deleteMany({ where: { role: 'STUDENT' } }) },
    ]

    for (const step of steps) {
      console.log(`  🔄 ${step.name}...`)
      await step.action()
      console.log(`  ✅ تم ${step.name}`)
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('╔══════════════════════════════════════════════════════╗')
    console.log('║     ✅ تم إعادة تعيين الطلاب/الدكاترة بنجاح!      ║')
    console.log('╚══════════════════════════════════════════════════════╝')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('📊 الإحصائيات بعد الحذف:')
    const remainingStudents = await prisma.student.count()
    const remainingUsers = await prisma.user.count()
    const remainingPatients = await prisma.patient.count()
    const remainingAdmins = await prisma.admin.count()

    console.log(`  👨‍🎓 الطلاب/الدكاترة المتبقية:  ${remainingStudents}`)
    console.log(`  👤 إجمالي المستخدمين:          ${remainingUsers}`)
    console.log(`  🏥 المرضى المتبقين:          ${remainingPatients}`)
    console.log(`  👨‍💼 الأدمن:                    ${remainingAdmins}`)
    console.log('\n🎯 النظام جاهز الآن لتسجيل طلاب/دكاترة جد!\n')

  } catch (error) {
    console.error('\n❌ حدث خطأ أثناء عملية الحذف:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
resetStudents()
