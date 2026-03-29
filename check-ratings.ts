import { db } from './src/lib/db'

async function checkRatings() {
  try {
    console.log('=== Checking Ratings in Database ===\n')

    const ratings = await db.rating.findMany({
      include: {
        case_: {
          include: {
            application: {
              include: {
                student: {
                  include: {
                    user: true
                  }
                },
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

    console.log(`Found ${ratings.length} ratings in database:\n`)

    for (const rating of ratings) {
      console.log(`Rating ID: ${rating.id}`)
      console.log(`  Case ID: ${rating.caseId}`)
      console.log(`  Student ID: ${rating.studentId}`)
      console.log(`  Patient ID: ${rating.patientId}`)
      console.log(`  Overall Rating: ${rating.overallRating}/5`)
      console.log(`  Is Visible: ${rating.isVisible}`)
      console.log(`  Review: ${rating.reviewText || 'No review'}`)
      console.log(`  Case Student ID: ${rating.case_?.application?.studentId}`)
      console.log(`  Case Student User: ${rating.case_?.application?.student?.user?.name}`)
      console.log(`  Patient User: ${rating.case_?.application?.patient?.user?.name}`)
      console.log(`  Post Title: ${rating.case_?.application?.post?.title}`)
      console.log('---\n')
    }

    if (ratings.length === 0) {
      console.log('No ratings found in the database!')
    }
  } catch (error: any) {
    console.error('Error checking ratings:', error)
  } finally {
    await db.$disconnect()
  }
}

checkRatings()
