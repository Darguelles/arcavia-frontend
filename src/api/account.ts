import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { queryClient, queryKeys } from './queryClient'
import { useAuthStore } from '../stores/authStore'
import type {
  AccountUpdateRequest,
  AnswerHistoryResponse,
  AvatarUploadUrlResponse,
  SetPasswordRequest,
  UserProfile,
  UserRewardList,
} from '../types/api'

const V1 = '/api/v1'

export function useAccount() {
  return useQuery({
    queryKey: queryKeys.account,
    queryFn: () => apiClient.get<UserProfile>(`${V1}/account`),
    initialData: () => useAuthStore.getState().user ?? undefined,
  })
}

export function useUpdateAccount() {
  return useMutation({
    mutationFn: (body: AccountUpdateRequest) => apiClient.patch<UserProfile>(`${V1}/account`, body),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user)
      queryClient.setQueryData(queryKeys.account, user)
    },
  })
}

export function useSetPassword() {
  return useMutation({
    mutationFn: (body: SetPasswordRequest) => apiClient.post<void>(`${V1}/account/password`, body),
  })
}

export function useMyAnswers(limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.myAnswers(limit, offset),
    queryFn: () =>
      apiClient.get<AnswerHistoryResponse>(`${V1}/me/answers?limit=${limit}&offset=${offset}`),
  })
}

export function useMyRewards(limit = 20, offset = 0) {
  return useQuery({
    queryKey: queryKeys.myRewards(limit, offset),
    queryFn: () =>
      apiClient.get<UserRewardList>(`${V1}/me/rewards?limit=${limit}&offset=${offset}`),
  })
}

/**
 * Two-step avatar upload (spec §8.11/§13):
 *  1. POST /account/avatar/upload-url → presigned S3 PUT + asset_key
 *  2. direct browser PUT of the raw bytes to S3
 *  3. PATCH /account/avatar { asset_key } to confirm
 */
export function useAvatarUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { upload_url, asset_key } = await apiClient.post<AvatarUploadUrlResponse>(
        `${V1}/account/avatar/upload-url`
      )
      const put = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!put.ok) throw new Error('AVATAR_UPLOAD_FAILED')
      return apiClient.patch<UserProfile>(`${V1}/account/avatar`, { asset_key })
    },
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user)
      queryClient.setQueryData(queryKeys.account, user)
    },
  })
}
