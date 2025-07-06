"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePartnershipsApi } from "@/lib/hooks/usePartnershipsApi"
import { oscsService } from "@/lib/api/services/oscs"
import { campaignsService } from "@/lib/api/services/campaigns"
import { storesService } from "@/lib/api/services/stores"
import { LoginPage } from "@/components/auth/login-page"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft } from "lucide-react"

function AddPartnershipContent() {
  const router = useRouter()
  const { createPartnership } = usePartnershipsApi()

  const [oscCnpj, setOscCnpj] = useState("")
  const [storeCnpj, setStoreCnpj] = useState("")
  const [campaignId, setCampaignId] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // CNPJ masking and unmasking utility functions
  const formatCnpj = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "")

    // Apply CNPJ mask: XX.XXX.XXX/XXXX-XX
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12)
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
  }

  const unformatCnpj = (value: string): string => {
    // Remove all non-digit characters
    return value.replace(/\D/g, "")
  }

  const handleOscCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCnpj(e.target.value)
    setOscCnpj(formattedValue)
  }

  const handleStoreCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCnpj(e.target.value)
    setStoreCnpj(formattedValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      // Input validation
      if (!oscCnpj || !storeCnpj || !campaignId) {
        setErrorMessage("Preencha todos os campos obrigatórios.")
        return
      }

      // Convert campaign ID to number and validate
      const campaignIdNumber = Number(campaignId)
      if (isNaN(campaignIdNumber)) {
        setErrorMessage("ID da Campanha deve ser um número válido.")
        return
      }

      // CNPJ format validation
      const unmaskedOscCnpj = unformatCnpj(oscCnpj)
      const unmaskedStoreCnpj = unformatCnpj(storeCnpj)

      if (unmaskedOscCnpj.length !== 14) {
        setErrorMessage("CNPJ da OSC deve conter 14 dígitos.")
        return
      }

      if (unmaskedStoreCnpj.length !== 14) {
        setErrorMessage("CNPJ da Loja deve conter 14 dígitos.")
        return
      }

      // Existence validation - sequential API calls
      let oscIdNumber: number
      let storeIdNumber: number

      try {
        // OSC Validation (by CNPJ)
        const oscsResponse = await oscsService.getAll({ search: unmaskedOscCnpj })
        const oscsFound = Array.isArray(oscsResponse) ? oscsResponse : oscsResponse.data || []

        if (!oscsFound || oscsFound.length !== 1) {
          setErrorMessage("CNPJ da OSC não encontrado ou ambíguo.")
          return
        }

        // Capture OSC ID
        oscIdNumber = oscsFound[0].id
      } catch (error) {
        setErrorMessage("CNPJ da OSC não encontrado ou ambíguo.")
        return
      }

      try {
        // Store Validation (by CNPJ)
        const storesResponse = await storesService.getAll({ search: unmaskedStoreCnpj })
        const storesFound = Array.isArray(storesResponse) ? storesResponse : storesResponse.data || []

        if (!storesFound || storesFound.length !== 1) {
          setErrorMessage("CNPJ da Loja não encontrado ou ambíguo.")
          return
        }

        // Capture Store ID
        storeIdNumber = storesFound[0].id
      } catch (error) {
        setErrorMessage("CNPJ da Loja não encontrado ou ambíguo.")
        return
      }

      try {
        // Campaign Validation (by ID)
        const campaignData = await campaignsService.getById(campaignIdNumber)
        if (!campaignData) {
          setErrorMessage("ID da Campanha não encontrado.")
          return
        }
      } catch (error) {
        setErrorMessage("ID da Campanha não encontrado.")
        return
      }

      // Create Partnership with captured IDs
      await createPartnership({
        oscId: oscIdNumber,
        storeId: storeIdNumber,
        campanhas: campaignIdNumber,
        osc: "", // Will be populated by the API response
        loja: "", // Will be populated by the API response
        dataInicio: "", // Will be populated by the API response
        dataVencimento: "", // Will be populated by the API response
        status: "pendente", // Default status
      })

      // Success - navigate back to partnerships list
      router.push("/parcerias")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erro ao criar parceria."
      setErrorMessage(errorMsg)
      console.error("Error creating partnership:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/parcerias")
  }

  return (
    <div className="flex-1 md:ml-64">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nova Parceria</h1>
              <p className="text-muted-foreground mt-2">
                Crie uma nova parceria associando uma Organização da Sociedade Civil (OSC), Loja e Campanha.
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Dados da Parceria</CardTitle>
            <CardDescription>
              Insira os CNPJs de OSC e Loja, e o ID da Campanha para criar uma nova parceria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oscCnpj">CNPJ da OSC</Label>
                  <Input
                    id="oscCnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={oscCnpj}
                    onChange={handleOscCnpjChange}
                    disabled={loading}
                    maxLength={18}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeCnpj">CNPJ da Loja</Label>
                  <Input
                    id="storeCnpj"
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={storeCnpj}
                    onChange={handleStoreCnpjChange}
                    disabled={loading}
                    maxLength={18}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaignId">ID da Campanha</Label>
                <Input
                  id="campaignId"
                  type="number"
                  placeholder="Digite o ID da Campanha"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="bg-[#f26b26] hover:bg-[#e55a1f]"
                  disabled={loading || !oscCnpj || !storeCnpj || !campaignId}
                >
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AddPartnershipPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#f26b26] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <AddPartnershipContent />
    </div>
  )
}
