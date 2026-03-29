import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const studentId = resolvedParams.id

    // Get the student with user info
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      )
    }

    // Check if student has disabled their public profile
    if (!student.publicProfileEnabled) {
      return NextResponse.json(
        { error: 'البروفايل العام غير متاح حالياً' },
        { status: 403 }
      )
    }

    // Get completed cases with photos (public only and privacy settings respected)
    const completedCases = student.showCases ? await db.case.findMany({
      where: {
        isCompleted: true, // Only show completed cases
        application: {
          studentId: studentId,
          status: 'ACCEPTED'
        },
        photos: {
          some: {
            isPublic: true
          }
        }
      },
      include: {
        application: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                treatmentType: true
              }
            },
            patient: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        photos: {
          where: {
            isPublic: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        certificate: true,
        rating: true // Include rating data
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 most recent cases
    }) : []

    // Get ratings for this student (if allowed and visible)
    const ratings = student.showRatings ? await db.rating.findMany({
      where: {
        studentId,
        isVisible: true // Only show visible ratings
      },
      include: {
        case_: {
          include: {
            application: {
              include: {
                patient: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Latest 10 reviews
    }) : []

    // Calculate average rating (only from visible ratings)
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length) * 10) / 10
      : 0

    // Get student's active posts (if allowed)
    const activePosts = student.showActivePosts ? await db.post.findMany({
      where: {
        studentId,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        title: true,
        treatmentType: true,
        city: true,
        priority: true,
        acceptedCount: true,
        requiredCount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    }) : []

    // Format the response respecting privacy settings
    const publicProfile = {
      student: {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        avatarUrl: student.user.avatarUrl,
        universityName: student.universityName,
        collegeName: student.collegeName,
        collegeAddress: student.collegeAddress,
        academicYear: student.academicYear,
        completedCases: student.showCompletedCount ? (student.completedCases || 0) : null,
        activeCases: student.activeCases || 0,
        cancelledCases: student.cancelledCases || 0,
        isVerified: student.isVerified,
        specialization: student.showSpecialization ? (student.specialization || null) : null,
        bio: student.showBio ? (student.bio || null) : null,
        location: student.showLocation ? (student.location || null) : null,
        city: student.showLocation ? (student.city || null) : null
      },
      stats: {
        totalCases: student.showCompletedCount ? (student.completedCases || 0) : null,
        avgRating: student.showRatings ? avgRating : null,
        totalRatings: student.showRatings ? ratings.length : null,
        activePosts: student.showActivePosts ? activePosts.length : null
      },
      completedCases: student.showCases ? completedCases.map(c => ({
        id: c.id,
        patientId: c.application.patientId,
        postTitle: c.application.post.title,
        treatmentType: c.application.post.treatmentType,
        patientName: c.application.patient.user.name,
        photos: c.photos.map(p => ({
          id: p.id,
          fileUrl: p.fileUrl,
          photoType: p.photoType,
          description: p.description
        })),
        hasCertificate: !!c.certificate,
        rating: c.rating ? {
          overallRating: c.rating.overallRating,
          reviewText: c.rating.reviewText
        } : null,
        createdAt: c.createdAt
      })) : [],
      reviews: student.showReviews ? ratings.map(r => ({
        id: r.id,
        patientId: r.patientId,
        patientName: r.case_?.application?.patient?.user?.name || 'مريض',
        patientAvatar: r.case_?.application?.patient?.user?.avatarUrl,
        overallRating: r.overallRating,
        qualityRating: r.qualityRating,
        professionalRating: r.professionalRating,
        punctualityRating: r.punctualityRating,
        cleanlinessRating: r.cleanlinessRating,
        explanationRating: r.explanationRating,
        reviewText: r.reviewText,
        createdAt: r.createdAt
      })) : [],
      activePosts: student.showActivePosts ? activePosts : []
    }

    console.log(`[PUBLIC PROFILE] ✅ Fetched public profile for student ${studentId}`)

    return NextResponse.json({
      success: true,
      profile: publicProfile
    })
  } catch (error: any) {
    console.error('[PUBLIC PROFILE] Error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء جلب البروفايل' },
      { status: 500 }
    )
  }
}
