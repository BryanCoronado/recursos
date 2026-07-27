"use server"

import {
  createProviderDownloadJob,
  getProviderDownloadJob,
  listProviderDownloadHistory,
  type ProviderDownloadState,
  type ProviderHistoryItem,
} from "@/app/(dashboard)/resources/provider-download-actions"

export type MagnificDownloadState = ProviderDownloadState
export type MagnificHistoryItem = ProviderHistoryItem

export async function createMagnificDownloadJob(
  state: ProviderDownloadState,
  formData: FormData
) {
  return createProviderDownloadJob("MAGNIFIC", state, formData)
}

export async function getMagnificDownloadJob(jobId: string) {
  return getProviderDownloadJob("MAGNIFIC", jobId)
}

export async function listMagnificDownloadHistory() {
  return listProviderDownloadHistory("MAGNIFIC")
}
