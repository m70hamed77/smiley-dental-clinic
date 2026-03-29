import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    console.log('[Activity API] userId from cookie:', userId)

    if (!userId) {
      console.log('[Activity API] No userId found, returning 401')
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      console.log('[Activity API] User not found:', userId)
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    console.log('[Activity API] User found:', user.id, user.role)

    const activities: any[] = []

    // Formatter for time ago
    const getTimeAgo = (date: Date) => {
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) {
        return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`
      } else if (hours > 0) {
        return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`
      } else if (minutes > 0) {
        return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`
      } else {
        return 'الآن'
      }
    }

    if (user.role === 'PATIENT') {
      // Get patient applications
      const applications = await db.application.findMany({
        where: {
          patientId: user.id
        },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })

      applications.forEach((app: any) => {
        let type = 'APPLICATION'
        let title = ''
        let colorClass = 'bg-blue-100 text-blue-600'

        if (app.status === 'ACCEPTED') {
          type = 'ACCEPTED'
          title = `تم قبول طلبك لحالة "${app.post.title}"`
          colorClass = 'bg-emerald-800 text-emerald-800'
        } else if (app.status === 'REJECTED') {
          type = 'REJECTED'
          title = `تم رفض طلبك لحالة "${app.post.title}"`
          colorClass = 'bg-red-100 text-red-600'
        } else {
          title = `قدمت على حالة "${app.post.title}"`
          colorClass = 'bg-blue-100 text-blue-600'
        }

        activities.push({
          id: `app-${app.id}`,
          type,
          title,
          timeAgo: getTimeAgo(new Date(app.createdAt)),
          date: app.createdAt,
          colorClass,
          icon: 'FileText'
        })
      })

      // Get patient ratings
      const ratings = await db.rating.findMany({
        where: {
          patientId: user.id
        },
        include: {
          case_: {
            include: {
              application: {
                include: {
                  post: {
                    select: {
                      title: true
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
        take: 10
      })

      ratings.forEach((rating: any) => {
        activities.push({
          id: `rating-${rating.id}`,
          type: 'RATING',
          title: `قيمت تجربة علاجك بـ ${rating.overallRating} نجوم`,
          timeAgo: getTimeAgo(new Date(rating.createdAt)),
          date: rating.createdAt,
          colorClass: 'bg-amber-100 text-amber-600',
          icon: 'Star'
        })
      })

      // Get patient appointments
      const appointments = await db.appointment.findMany({
        where: {
          case_: {
            application: {
              patientId: user.id
            }
          }
        },
        include: {
          case_: {
            include: {
              application: {
                include: {
                  post: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          scheduledAt: 'desc'
        },
        take: 10
      })

      appointments.forEach((apt: any) => {
        let title = ''
        let colorClass = ''

        if (apt.status === 'COMPLETED') {
          title = `أكملت موعدك لحالة "${apt.case_.application.post.title}"`
          colorClass = 'bg-purple-100 text-purple-600'
        } else if (apt.status === 'CANCELLED') {
          title = `ألغيت موعدك لحالة "${apt.case_.application.post.title}"`
          colorClass = 'bg-gray-100 text-gray-600'
        } else {
          title = `موعده القادم لحالة "${apt.case_.application.post.title}"`
          colorClass = 'bg-blue-100 text-blue-600'
        }

        activities.push({
          id: `apt-${apt.id}`,
          type: 'APPOINTMENT',
          title,
          timeAgo: getTimeAgo(new Date(apt.scheduledAt)),
          date: apt.scheduledAt,
          colorClass,
          icon: 'Calendar'
        })
      })

    } else if (user.role === 'STUDENT') {
      // Get student record
      const student = await db.student.findFirst({
        where: { userId: user.id },
        select: { id: true }
      })

      if (student) {
        // Get student posts
        const posts = await db.post.findMany({
          where: {
            studentId: student.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        })

        posts.forEach((post: any) => {
          activities.push({
            id: `post-${post.id}`,
            type: 'POST',
            title: `نشرت حالة جديدة: "${post.title}"`,
            timeAgo: getTimeAgo(new Date(post.createdAt)),
            date: post.createdAt,
            colorClass: 'bg-emerald-800 text-emerald-800',
            icon: 'FileText'
          })
        })

        // Get applications to student's posts
        const applications = await db.application.findMany({
          where: {
            post: {
              studentId: student.id
            }
          },
          include: {
            post: {
              select: {
                title: true
              }
            },
            patient: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        })

        applications.forEach((app: any) => {
          let title = ''
          let colorClass = ''

          if (app.status === 'ACCEPTED') {
            title = `قبلت طلب المريض ${app.patient.user.name} لحالة "${app.post.title}"`
            colorClass = 'bg-emerald-800 text-emerald-800'
          } else if (app.status === 'REJECTED') {
            title = `رفضت طلب المريض ${app.patient.user.name} لحالة "${app.post.title}"`
            colorClass = 'bg-red-100 text-red-600'
          } else {
            title = `قدم المريض ${app.patient.user.name} على حالة "${app.post.title}"`
            colorClass = 'bg-blue-100 text-blue-600'
          }

          activities.push({
            id: `app-${app.id}`,
            type: 'APPLICATION',
            title,
            timeAgo: getTimeAgo(new Date(app.createdAt)),
            date: app.createdAt,
            colorClass,
            icon: 'Users'
          })
        })

        // Get student appointments
        const appointments = await db.appointment.findMany({
          where: {
            case_: {
              application: {
                post: {
                  studentId: student.id
                }
              }
            }
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
                            name: true
                          }
                        }
                      }
                    },
                    post: {
                      select: {
                        title: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            scheduledAt: 'desc'
          },
          take: 10
        })

        appointments.forEach((apt: any) => {
          let title = ''
          let colorClass = ''

          if (apt.status === 'COMPLETED') {
            title = `أكملت علاج المريض ${apt.case_.application.patient.user.name} - "${apt.case_.application.post.title}"`
            colorClass = 'bg-purple-100 text-purple-600'
          } else if (apt.status === 'CANCELLED') {
            title = `ألغيت موعدك مع ${apt.case_.application.patient.user.name}`
            colorClass = 'bg-gray-100 text-gray-600'
          } else {
            title = `موعده القادم مع ${apt.case_.application.patient.user.name} - "${apt.case_.application.post.title}"`
            colorClass = 'bg-blue-100 text-blue-600'
          }

          activities.push({
            id: `apt-${apt.id}`,
            type: 'APPOINTMENT',
            title,
            timeAgo: getTimeAgo(new Date(apt.scheduledAt)),
            date: apt.scheduledAt,
            colorClass,
            icon: 'Calendar'
          })
        })

        // Get student ratings received
        const ratings = await db.rating.findMany({
          where: {
            studentId: student.id
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
                            name: true
                          }
                        }
                      }
                    },
                    post: {
                      select: {
                        title: true
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
          take: 10
        })

        ratings.forEach((rating: any) => {
          activities.push({
            id: `rating-${rating.id}`,
            type: 'RATING',
            title: `قيّمك ${rating.case_.application.patient.user.name} بـ ${rating.overallRating} نجوم - "${rating.case_.application.post.title}"`,
            timeAgo: getTimeAgo(new Date(rating.createdAt)),
            date: rating.createdAt,
            colorClass: 'bg-amber-100 text-amber-600',
            icon: 'Star'
          })
        })
      }
    }

    // Sort all activities by date (newest first)
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Limit to 20 most recent activities
    const recentActivities = activities.slice(0, 20)

    return NextResponse.json({
      success: true,
      activities: recentActivities,
      total: activities.length
    })

  } catch (error: any) {
    console.error('[Activity API] Error:', error)
    return NextResponse.json(
      { error: 'فشل في جلب النشاط', details: error.message },
      { status: 500 }
    )
  }
}
