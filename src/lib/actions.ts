import { getAuthToken } from 'deepspace'

export type ActionResponse<T> = { success: boolean; data?: T; error?: string }

export async function callAction<T = undefined>(name: string, params: Record<string, unknown>): Promise<ActionResponse<T>> {
  const res = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getAuthToken()}` },
    body: JSON.stringify(params),
  })
  return res.json()
}
