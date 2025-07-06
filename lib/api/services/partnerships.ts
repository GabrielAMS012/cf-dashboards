// Serviços para API de Parcerias
import { apiClient } from "@/lib/api/client"

// Backend API response interface - reflects exact structure from API
interface BackendPartnershipApiItem {
  id: number
  osc: {
    id: number
    nome: string
    cnpj: string
  }
  store: {
    id: number
    nome: string
    cnpj: string
  }
  campaign: {
    id: number
    nome: string
  }
  data_inicio: string // ISO date string
  data_vencimento: string // ISO date string
  status: string
  created_at: string
  updated_at: string
}

// Frontend DTO interface
export interface Partnership {
  id: number
  oscId: number
  storeId: number
  osc: string
  loja: string
  dataInicio: string
  dataVencimento: string
  status: string
  campanhas: number // Campaign ID
  createdAt: string
  updatedAt: string
}

export class PartnershipsService {
  private endpoint = "/partnership/"

  // Private helper for transforming raw backend item to frontend Partnership
  private mapRawPartnershipToFrontend(raw: BackendPartnershipApiItem): Partnership {
    return {
      id: raw.id,
      oscId: raw.osc.id,
      storeId: raw.store.id,
      osc: raw.osc.nome,
      loja: raw.store.nome,
      dataInicio: raw.data_inicio.split("T")[0], // Convert ISO to YYYY-MM-DD
      dataVencimento: raw.data_vencimento.split("T")[0], // Convert ISO to YYYY-MM-DD
      status: raw.status,
      campanhas: raw.campaign.id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    }
  }

  // Private helper for transforming frontend data to backend format for creation
  private mapFrontendPartnershipToBackendPayload(frontendData: Partial<Partnership>): any {
    const backendData: any = {}

    // For creation, send direct IDs as per API requirement
    if (frontendData.oscId !== undefined) backendData.osc = frontendData.oscId
    if (frontendData.storeId !== undefined) backendData.store = frontendData.storeId
    if (frontendData.campanhas !== undefined) backendData.campaign = frontendData.campanhas
    if (frontendData.status !== undefined) backendData.status = frontendData.status
    if (frontendData.dataInicio !== undefined) backendData.data_inicio = frontendData.dataInicio + "T00:00:00Z"
    if (frontendData.dataVencimento !== undefined)
      backendData.data_vencimento = frontendData.dataVencimento + "T23:59:59Z"

    return backendData
  }

  // Private helper for transforming frontend data to backend format for updates
  private mapFrontendPartnershipToBackendUpdate(frontendData: Partial<Partnership>): any {
    const backendData: any = {}

    // For updates, send direct IDs as per API requirement
    if (frontendData.oscId !== undefined) backendData.osc = frontendData.oscId
    if (frontendData.storeId !== undefined) backendData.store = frontendData.storeId
    if (frontendData.campanhas !== undefined) backendData.campaign = frontendData.campanhas
    if (frontendData.status !== undefined) backendData.status = frontendData.status
    if (frontendData.dataInicio !== undefined) backendData.data_inicio = frontendData.dataInicio + "T00:00:00Z"
    if (frontendData.dataVencimento !== undefined)
      backendData.data_vencimento = frontendData.dataVencimento + "T23:59:59Z"

    return backendData
  }

  async getAll(params?: {
    page?: number
    limit?: number
    search?: string
    status?: string
  }): Promise<Partnership[]> {
    const queryParams = params
      ? Object.fromEntries(
          Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)]),
        )
      : undefined

    const rawDataArray = await apiClient.get<BackendPartnershipApiItem[]>(this.endpoint, queryParams)

    if (!rawDataArray) {
      throw new Error("Resposta vazia ou inválida da API ao buscar parcerias.")
    }

    return rawDataArray.map((item) => this.mapRawPartnershipToFrontend(item))
  }

  async create(data: Omit<Partnership, "id" | "createdAt" | "updatedAt" | "osc" | "loja">): Promise<Partnership> {
    const rawDataToSend = this.mapFrontendPartnershipToBackendPayload(data)

    // Filter out undefined properties
    const filteredRawDataToSend = Object.fromEntries(
      Object.entries(rawDataToSend).filter(([, value]) => value !== undefined),
    )

    const rawData = await apiClient.post<BackendPartnershipApiItem>(this.endpoint, filteredRawDataToSend)

    if (!rawData) {
      throw new Error("Resposta vazia ou inválida da API ao criar parceria.")
    }

    return this.mapRawPartnershipToFrontend(rawData)
  }

  async update(id: number, data: Partial<Partnership>): Promise<Partnership> {
    const rawDataToSend = this.mapFrontendPartnershipToBackendUpdate(data)

    // Filter out undefined properties
    const filteredRawDataToSend = Object.fromEntries(
      Object.entries(rawDataToSend).filter(([, value]) => value !== undefined),
    )

    const rawData = await apiClient.put<BackendPartnershipApiItem>(`${this.endpoint}${id}/`, filteredRawDataToSend)

    if (!rawData) {
      throw new Error("Resposta vazia ou inválida da API ao atualizar parceria.")
    }

    return this.mapRawPartnershipToFrontend(rawData)
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.endpoint}${id}/`)
  }

  async getById(id: number): Promise<Partnership> {
    const rawData = await apiClient.get<BackendPartnershipApiItem>(`${this.endpoint}${id}/`)

    if (!rawData) {
      throw new Error("Resposta vazia ou inválida da API ao buscar parceria.")
    }

    return this.mapRawPartnershipToFrontend(rawData)
  }

  async updateStatus(id: number, status: string, storeId?: number, oscId?: number): Promise<Partnership> {
    const updateData: any = { status }

    // Include store and osc IDs if provided for status updates
    if (storeId !== undefined) updateData.store = storeId
    if (oscId !== undefined) updateData.osc = oscId

    const rawData = await apiClient.patch<BackendPartnershipApiItem>(`${this.endpoint}${id}/status/`, updateData)

    if (!rawData) {
      throw new Error("Resposta vazia ou inválida da API ao atualizar status da parceria.")
    }

    return this.mapRawPartnershipToFrontend(rawData)
  }
}

export const partnershipsService = new PartnershipsService()
