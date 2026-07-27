"use server"

import {
  cancelProviderDownloadJob,
  createProviderDownloadJob,
  getProviderDownloadJob,
  listProviderDownloadHistory,
  type ProviderDownloadState,
  type ProviderHistoryItem,
} from "@/app/(dashboard)/resources/provider-download-actions"

export type EnvatoDownloadState = ProviderDownloadState
export type EnvatoHistoryItem = ProviderHistoryItem

export async function createEnvatoDownloadJob(
  state: ProviderDownloadState,
  formData: FormData
) {
  return createProviderDownloadJob("ENVATO", state, formData)
}

export async function getEnvatoDownloadJob(jobId: string) {
  return getProviderDownloadJob("ENVATO", jobId)
}

export async function listEnvatoDownloadHistory() {
  return listProviderDownloadHistory("ENVATO")
}

export async function cancelEnvatoDownloadJob(jobId: string) {
  return cancelProviderDownloadJob("ENVATO", jobId)
}
