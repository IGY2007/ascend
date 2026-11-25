import { useQuery } from '@tanstack/react-query'
import { profilesService } from '@/services/profiles'
import { useUser } from '@/features/auth/auth-context'

export const profileKeys = {
  mine: (userId: string) => ['profile', userId] as const,
}

export function useProfile() {
  const user = useUser()
  return useQuery({
    queryKey: profileKeys.mine(user.id),
    queryFn: () => profilesService.getMine(user.id),
    staleTime: 5 * 60_000,
  })
}

/** Nombre a mostrar: el del perfil, o el del registro mientras carga / sin conexión. */
export function useDisplayName(): string | null {
  const user = useUser()
  const { data } = useProfile()
  return data?.display_name ?? user.metadataName
}
