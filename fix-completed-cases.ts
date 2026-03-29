import { db } from './src/lib/db'

async function fixCompletedCases() {
  console.log('🔧 Starting to fix completed cases...')

  // Find all cases that have public photos but are not marked as completed
  const casesWithPhotos = await db.case.findMany({
    where: {
      isCompleted: false,
      photos: {
        some: {
          isPublic: true
        }
      }
    },
    include: {
      photos: true
    }
  })

  console.log(`Found ${casesWithPhotos.length} cases with public photos but not marked as completed`)

  for (const case_ of casesWithPhotos) {
    await db.case.update({
      where: { id: case_.id },
      data: {
        isCompleted: true,
        endDate: new Date()
      }
    })
    console.log(`✅ Updated case ${case_.id} to completed`)

    // Increment completed cases for the student
    const studentId = case_.application?.studentId
    if (studentId) {
      await db.student.update({
        where: { id: studentId },
        data: {
          completedCases: {
            increment: 1
          }
        }
      })
      console.log(`✅ Incremented completed cases for student ${studentId}`)
    }
  }

  console.log('✅ All completed cases have been fixed!')
}

fixCompletedCases()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
