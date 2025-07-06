"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePartnershipsApi, type Partnership } from "@/lib/hooks/usePartnershipsApi"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { LoginPage } from "@/components/auth/login-page"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Handshake, Search, Filter, Plus, Calendar, Building2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"

function ParceriasContent() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")

  const debouncedSearch = useDebounce(searchTerm, 500)
  const { partnerships, loading, error, fetchPartnerships, updatePartnership } = usePartnershipsApi()

  // Fetch partnerships when filters change - no limit parameter
  useEffect(() => {
    fetchPartnerships({
      search: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
  }, [debouncedSearch, statusFilter, fetchPartnerships])

  // Initial fetch - no limit parameter
  useEffect(() => {
    fetchPartnerships()
  }, [fetchPartnerships])

  const getStatusBadge = (status: string) => {
    const variants = {
      Ativa: "default",
      Vencida: "destructive",
      Pendente: "outline",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  const getStatusButtonVariant = (status: string) => {
    const variants = {
      ativa: "default",
      vencida: "destructive",
      pendente: "outline",
    } as const

    return variants[status.toLowerCase() as keyof typeof variants] || "secondary"
  }

  const handleStatusToggle = async (partnership: Partnership) => {
    const currentStatus = partnership.status.toLowerCase()

    // Only allow toggling between "ativa" and "vencida"
    let newStatus: string
    if (currentStatus === "ativa") {
      newStatus = "vencida"
    } else if (currentStatus === "vencida") {
      newStatus = "ativa"
    } else {
      return // Do nothing for any other status (pendente, inativa, etc.)
    }

    try {
      // Include storeId and oscId when updating partnership status
      await updatePartnership(partnership.id, {
        status: newStatus,
        storeId: partnership.storeId,
        oscId: partnership.oscId,
      })
    } catch (error) {
      console.error("Error updating partnership status:", error)
    }
  }

  const handleNewPartnership = () => {
    router.push("/parcerias/add")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const isVencimentoProximo = (vencimento: string) => {
    const hoje = new Date()
    const dataVencimento = new Date(vencimento)
    const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    return diasRestantes <= 30 && diasRestantes > 0
  }

  // Filter partnerships by period (client-side filtering for now)
  const filteredPartnerships = partnerships.filter((parceria) => {
    if (periodFilter === "all") return true

    const hoje = new Date()
    const dataVencimento = new Date(parceria.dataVencimento)
    const diasRestantes = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    switch (periodFilter) {
      case "30":
        return diasRestantes <= 30 && diasRestantes > 0
      case "60":
        return diasRestantes <= 60 && diasRestantes > 0
      case "90":
        return diasRestantes <= 90 && diasRestantes > 0
      default:
        return true
    }
  })

  // Calculate stats from real data
  const totalParcerias = partnerships.length
  const parceriasAtivas = partnerships.filter((p) => p.status === "Ativa").length
  const parceriasVencidas = partnerships.filter((p) => p.status === "Vencida").length
  const totalCampanhas = partnerships.reduce((acc, p) => acc + p.campanhas, 0)

  return (
    <div className="flex-1 md:ml-64">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Parcerias - Versão Antiga</h1>
            <p className="text-gray-600 mt-2">Gestão de Parcerias entre OSCs e Lojas</p>
          </div>
          <Button className="bg-[#f26b26] hover:bg-[#e55a1f]" onClick={handleNewPartnership}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Parceria
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{totalParcerias}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{parceriasAtivas}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="text-2xl font-bold text-red-600">{parceriasVencidas}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campanhas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{totalCampanhas}</div>}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por OSC ou loja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button size="icon" disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Vencida">Vencida</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  <SelectItem value="30">Próximos 30 dias</SelectItem>
                  <SelectItem value="60">Próximos 60 dias</SelectItem>
                  <SelectItem value="90">Próximos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Parcerias</CardTitle>
            <CardDescription>Visualize e gerencie todas as parcerias cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredPartnerships.length === 0 ? (
              <div className="text-center py-8">
                <Handshake className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma parceria encontrada</h3>
                <p className="text-gray-500">
                  {partnerships.length === 0
                    ? "Não há parcerias cadastradas no sistema."
                    : "Nenhuma parceria corresponde aos filtros aplicados."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OSC</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Campanhas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartnerships.map((parceria) => (
                    <TableRow key={parceria.id}>
                      <TableCell className="font-medium">{parceria.osc}</TableCell>
                      <TableCell>{parceria.loja}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{formatDate(parceria.dataInicio)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span
                            className={`text-sm ${
                              isVencimentoProximo(parceria.dataVencimento)
                                ? "text-yellow-600 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            {formatDate(parceria.dataVencimento)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={getStatusButtonVariant(parceria.status)}
                          size="sm"
                          className="w-full"
                          onClick={() => handleStatusToggle(parceria)}
                          disabled={
                            loading ||
                            (parceria.status.toLowerCase() !== "ativa" && parceria.status.toLowerCase() !== "vencida")
                          }
                        >
                          {parceria.status}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[#f26b26] border-[#f26b26]">
                          {parceria.campanhas}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ParceriasPage() {
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
      <ParceriasContent />
    </div>
  )
}
