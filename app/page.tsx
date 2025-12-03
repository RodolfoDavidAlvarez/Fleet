import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // Server-side redirect for faster performance
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()
    
    if (profile?.approval_status === 'approved' && (profile.role === 'admin' || profile.role === 'mechanic')) {
      redirect('/dashboard')
    }
  }
  
  redirect('/login')
}
