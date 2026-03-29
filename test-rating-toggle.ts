import { db } from './src/lib/db'

async function testRatingToggle() {
  try {
    console.log('=== Testing Rating Toggle ===\n')

    // Get the rating
    const rating = await db.rating.findFirst({
      include: {
        case_: {
          include: {
            application: {
              include: {
                student: true,
                patient: {
                  include: {
                    user: true
                  }
                },
                post: true
              }
            }
          }
        }
      }
    })

    if (!rating) {
      console.log('No rating found in database')
      return
    }

    console.log('Current rating state:')
    console.log('  Rating ID:', rating.id)
    console.log('  Is Visible:', rating.isVisible)
    console.log('  Student ID:', rating.studentId)
    console.log('  Case Student ID:', rating.case_?.application?.studentId)
    console.log('  Student User:', rating.case_?.application?.student?.user?.name)
    console.log('  Patient User:', rating.case_?.application?.patient?.user?.name)
    console.log()

    // Try to update
    console.log('Attempting to update visibility...')
    const newVisibility = !rating.isVisible

    const updated = await db.rating.update({
      where: { id: rating.id },
      data: { isVisible: newVisibility }
    })

    console.log('✅ Update successful!')
    console.log('  New visibility:', updated.isVisible)
    console.log()

    // Revert back
    console.log('Reverting back...')
    await db.rating.update({
      where: { id: rating.id },
      data: { isVisible: rating.isVisible }
    })

    console.log('✅ Revert successful!')
  } catch (error: any) {
    console.error('❌ Error:', error)
    console.error('Error message:', error.message)
    console.error('Error name:', error.name)
  } finally {
    await db.$disconnect()
  }
}

testRatingToggle()
