import { redirect } from 'next/navigation'

export default function PostsPage() {
  // توجيه تلقائي لصفحة "بوستاتي"
  redirect('/posts/my-posts')
}
