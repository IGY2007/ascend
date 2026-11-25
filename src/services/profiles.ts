import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type Profile = Tables<'profiles'>

export const profilesService = {
  async getMine(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw error
    return data
  },
}
