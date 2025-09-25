"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Apple, ArrowLeft, Zap, Heart, Leaf, Hash, TrendingUp, Activity, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Pie,
} from "recharts"
import { ApiService, type Alimento } from "@/lib/api"

// Valores diarios recomendados (aproximados para adultos)
const valoresDiariosRecomendados = {
  energ_kcal: 2000,
  protein_g: 50,
  carbohidratos_g: 300,
  lipid_tot_g: 65,
  fiber_td_g: 25,
  calcium_mg: 1000,
  iron_mg: 18,
  vit_c_mg: 90,
  vit_a_rae_mcg: 900,
  vit_e_mg: 15,
  vit_k_mcg: 120,
}

const COLORS = ["#65a30d", "#f59e0b", "#8b5cf6"]

// Tipos para los datos de gráficos
interface MacronutrienteData {
  name: string;
  value: number;
  color: string;
}

interface VitaminaMineralData {
  name: string;
  value: number;
  max: number;
}

interface RadarData {
  nutriente: string;
  valor: number;
}

// Componente de tooltip personalizado para evitar errores de tipos
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{`${data.name}: ${typeof data.value === 'number' ? data.value.toFixed(1) : data.value}g`}</p>
      </div>
    );
  }
  return null;
};

export default function NutricionPage() {
  // Estados principales
  const [alimentos, setAlimentos] = useState<Alimento[]>([])
  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState<Alimento | null>(null)
  const [codigoBusqueda, setCodigoBusqueda] = useState("")
  
  // Estados de carga y paginación
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const itemsPerPage = 20

  // Cargar alimentos iniciales
  const cargarAlimentos = async (page: number = 1) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const offset = (page - 1) * itemsPerPage
      const resultados = await ApiService.getAlimentos(itemsPerPage, offset)
      
      if (page === 1) {
        setAlimentos(resultados)
        // Seleccionar el primer alimento por defecto si no hay ninguno seleccionado
        if (resultados.length > 0 && !alimentoSeleccionado) {
          setAlimentoSeleccionado(resultados[0])
        }
      } else {
        setAlimentos(prev => [...prev, ...resultados])
      }
      
      setHasMore(resultados.length === itemsPerPage)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar alimentos")
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar más alimentos
  const cargarMasAlimentos = () => {
    if (!isLoading && hasMore) {
      cargarAlimentos(currentPage + 1)
    }
  }

  // Buscar alimento por código
  const buscarPorCodigo = async (codigo: string) => {
    if (!codigo.trim()) {
      setSearchError(null)
      return
    }

    const codigoNum = parseInt(codigo)
    if (isNaN(codigoNum)) {
      setSearchError("El código debe ser un número válido")
      return
    }

    setIsLoadingSearch(true)
    setSearchError(null)
    
    try {
      const alimento = await ApiService.getAlimento(codigoNum)
      setAlimentoSeleccionado(alimento)
      
      // Agregar al inicio de la lista si no está ya
      setAlimentos(prev => {
        const exists = prev.find(a => a.codigomex2 === alimento.codigomex2)
        if (exists) return prev
        return [alimento, ...prev]
      })
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setSearchError(`No se encontró ningún alimento con el código ${codigo}`)
      } else {
        setSearchError(err instanceof Error ? err.message : "Error al buscar el alimento")
      }
    } finally {
      setIsLoadingSearch(false)
    }
  }

  // Efectos
  useEffect(() => {
    cargarAlimentos(1)
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (codigoBusqueda) {
        buscarPorCodigo(codigoBusqueda)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [codigoBusqueda])

  // Si no hay alimento seleccionado, mostrar loading o mensaje
  if (!alimentoSeleccionado && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Cargando alimentos</h3>
            <p className="text-muted-foreground mb-4">Por favor espera mientras cargamos la información nutricional</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!alimentoSeleccionado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Cargando alimentos...</span>
        </div>
      </div>
    )
  }

  // Datos para gráficos basados en el alimento seleccionado
  const macronutrientesData: MacronutrienteData[] = [
    { name: "Proteína", value: alimentoSeleccionado.protein_g, color: "#65a30d" },
    { name: "Carbohidratos", value: alimentoSeleccionado.carbohidratos_g, color: "#f59e0b" },
    { name: "Grasa", value: alimentoSeleccionado.lipid_tot_g, color: "#8b5cf6" },
  ]

  const vitaminasData: VitaminaMineralData[] = [
    { name: "Vit C", value: alimentoSeleccionado.vit_c_mg, max: valoresDiariosRecomendados.vit_c_mg },
    { name: "Vit A", value: alimentoSeleccionado.vit_a_rae_mcg, max: valoresDiariosRecomendados.vit_a_rae_mcg },
    { name: "Vit E", value: alimentoSeleccionado.vit_e_mg, max: valoresDiariosRecomendados.vit_e_mg },
    { name: "Vit K", value: alimentoSeleccionado.vit_k_mcg, max: valoresDiariosRecomendados.vit_k_mcg },
  ]

  const mineralesData: VitaminaMineralData[] = [
    { name: "Calcio", value: alimentoSeleccionado.calcium_mg, max: valoresDiariosRecomendados.calcium_mg },
    { name: "Hierro", value: alimentoSeleccionado.iron_mg, max: valoresDiariosRecomendados.iron_mg },
  ]

  const radarData: RadarData[] = [
    { nutriente: "Proteína", valor: (alimentoSeleccionado.protein_g / valoresDiariosRecomendados.protein_g) * 100 },
    { nutriente: "Fibra", valor: (alimentoSeleccionado.fiber_td_g / valoresDiariosRecomendados.fiber_td_g) * 100 },
    { nutriente: "Calcio", valor: (alimentoSeleccionado.calcium_mg / valoresDiariosRecomendados.calcium_mg) * 100 },
    { nutriente: "Hierro", valor: (alimentoSeleccionado.iron_mg / valoresDiariosRecomendados.iron_mg) * 100 },
    { nutriente: "Vit C", valor: (alimentoSeleccionado.vit_c_mg / valoresDiariosRecomendados.vit_c_mg) * 100 },
    { nutriente: "Vit A", valor: (alimentoSeleccionado.vit_a_rae_mcg / valoresDiariosRecomendados.vit_a_rae_mcg) * 100 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <ArrowLeft className="w-5 h-5" />
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Apple className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">NutriAI</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="w-4 h-4" />
              Análisis Nutricional
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar de selección */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Seleccionar Alimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Búsqueda por código */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Buscar por código
                  </Label>
                  <div className="relative">
                    <Input 
                      placeholder="Ej: 101001, 101002..." 
                      value={codigoBusqueda} 
                      onChange={(e) => setCodigoBusqueda(e.target.value)}
                      type="number"
                    />
                    {isLoadingSearch && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  {searchError && (
                    <p className="text-xs text-destructive">{searchError}</p>
                  )}
                </div>

                {/* Lista de alimentos */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <Label className="text-sm font-medium">Alimentos disponibles</Label>
                  {error && (
                    <div className="p-2 bg-destructive/10 text-destructive text-xs rounded">
                      {error}
                    </div>
                  )}
                  {alimentos.map((alimento) => (
                    <button
                      key={alimento.codigomex2}
                      onClick={() => setAlimentoSeleccionado(alimento)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        alimentoSeleccionado.codigomex2 === alimento.codigomex2
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-accent/5"
                      }`}
                    >
                      <div className="font-medium text-sm">{alimento.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        Código: {alimento.codigomex2} • {Math.round(alimento.energ_kcal)} kcal • {alimento.protein_g.toFixed(1)}g proteína
                      </div>
                    </button>
                  ))}
                  
                  {/* Botón cargar más */}
                  {hasMore && (
                    <Button 
                      onClick={cargarMasAlimentos} 
                      variant="outline" 
                      size="sm"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-4 h-4" />
                          Cargar más alimentos
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel principal */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Análisis Nutricional</h1>
              <p className="text-muted-foreground">
                Visualización detallada de información nutricional de {alimentoSeleccionado.nombre}
              </p>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="macros">Macronutrientes</TabsTrigger>
                <TabsTrigger value="micros">Micronutrientes</TabsTrigger>
              </TabsList>

              {/* Tab Resumen */}
              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{alimentoSeleccionado.nombre}</CardTitle>
                        <CardDescription>Información nutricional por 100g • Código: {alimentoSeleccionado.codigomex2}</CardDescription>
                      </div>
                      <Badge className="bg-accent/10 text-accent text-lg px-4 py-2">
                        {Math.round(alimentoSeleccionado.energ_kcal)} kcal
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Macronutrientes principales */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-accent" />
                        Macronutrientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Heart className="w-4 h-4 text-chart-3" />
                            Proteína
                          </span>
                          <span className="font-medium">{alimentoSeleccionado.protein_g.toFixed(1)}g</span>
                        </div>
                        <Progress
                          value={(alimentoSeleccionado.protein_g / valoresDiariosRecomendados.protein_g) * 100}
                          className="h-2"
                        />

                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-4 h-4 bg-chart-2 rounded-full" />
                            Carbohidratos
                          </span>
                          <span className="font-medium">{alimentoSeleccionado.carbohidratos_g.toFixed(1)}g</span>
                        </div>
                        <Progress
                          value={(alimentoSeleccionado.carbohidratos_g / valoresDiariosRecomendados.carbohidratos_g) * 100}
                          className="h-2"
                        />

                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-4 h-4 bg-chart-4 rounded-full" />
                            Grasa
                          </span>
                          <span className="font-medium">{alimentoSeleccionado.lipid_tot_g.toFixed(1)}g</span>
                        </div>
                        <Progress
                          value={(alimentoSeleccionado.lipid_tot_g / valoresDiariosRecomendados.lipid_tot_g) * 100}
                          className="h-2"
                        />

                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-primary" />
                            Fibra
                          </span>
                          <span className="font-medium">{alimentoSeleccionado.fiber_td_g.toFixed(1)}g</span>
                        </div>
                        <Progress
                          value={(alimentoSeleccionado.fiber_td_g / valoresDiariosRecomendados.fiber_td_g) * 100}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Perfil nutricional radar */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Perfil Nutricional
                      </CardTitle>
                      <CardDescription>% del valor diario recomendado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="nutriente" tick={{ fontSize: 12 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                          <Radar
                            name="Valor"
                            dataKey="valor"
                            stroke="#65a30d"
                            fill="#65a30d"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Destacados nutricionales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Destacados Nutricionales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      {alimentoSeleccionado.protein_g > 15 && (
                        <div className="p-3 bg-chart-3/10 rounded-lg">
                          <div className="text-sm font-medium text-chart-3">Alto en Proteína</div>
                          <div className="text-xs text-muted-foreground">Excelente para desarrollo muscular</div>
                        </div>
                      )}
                      {alimentoSeleccionado.fiber_td_g > 5 && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <div className="text-sm font-medium text-primary">Rico en Fibra</div>
                          <div className="text-xs text-muted-foreground">Beneficioso para la digestión</div>
                        </div>
                      )}
                      {alimentoSeleccionado.calcium_mg > 100 && (
                        <div className="p-3 bg-accent/10 rounded-lg">
                          <div className="text-sm font-medium text-accent">Alto en Calcio</div>
                          <div className="text-xs text-muted-foreground">Fortalece huesos y dientes</div>
                        </div>
                      )}
                      {alimentoSeleccionado.vit_c_mg > 20 && (
                        <div className="p-3 bg-chart-2/10 rounded-lg">
                          <div className="text-sm font-medium text-chart-2">Rico en Vitamina C</div>
                          <div className="text-xs text-muted-foreground">Antioxidante natural</div>
                        </div>
                      )}
                      {alimentoSeleccionado.iron_mg > 2 && (
                        <div className="p-3 bg-chart-4/10 rounded-lg">
                          <div className="text-sm font-medium text-chart-4">Alto en Hierro</div>
                          <div className="text-xs text-muted-foreground">Previene la anemia</div>
                        </div>
                      )}
                      {alimentoSeleccionado.energ_kcal < 50 && (
                        <div className="p-3 bg-chart-5/10 rounded-lg">
                          <div className="text-sm font-medium text-chart-5">Bajo en Calorías</div>
                          <div className="text-xs text-muted-foreground">Ideal para control de peso</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab Macronutrientes */}
              <TabsContent value="macros" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribución de Macronutrientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={macronutrientesData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value.toFixed(1)}g`}
                          >
                            {macronutrientesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Calorías por Macronutriente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm">Proteína (4 kcal/g)</span>
                          <span className="font-medium">{Math.round(alimentoSeleccionado.protein_g * 4)} kcal</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm">Carbohidratos (4 kcal/g)</span>
                          <span className="font-medium">{Math.round(alimentoSeleccionado.carbohidratos_g * 4)} kcal</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <span className="text-sm">Grasa (9 kcal/g)</span>
                          <span className="font-medium">{Math.round(alimentoSeleccionado.lipid_tot_g * 9)} kcal</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <span className="text-sm font-medium">Total Calculado</span>
                          <span className="font-bold">
                            {Math.round(
                              alimentoSeleccionado.protein_g * 4 +
                                alimentoSeleccionado.carbohidratos_g * 4 +
                                alimentoSeleccionado.lipid_tot_g * 9,
                            )}{" "}
                            kcal
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab Micronutrientes */}
              <TabsContent value="micros" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vitaminas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={vitaminasData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#65a30d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Minerales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={mineralesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de Micronutrientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Vitaminas</h4>
                        {vitaminasData.map((vit) => (
                          <div key={vit.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{vit.name}</span>
                              <span>
                                {vit.value.toFixed(1)}
                                {vit.name.includes("A") || vit.name.includes("K") ? "μg" : "mg"}
                              </span>
                            </div>
                            <Progress value={(vit.value / vit.max) * 100} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {Math.round((vit.value / vit.max) * 100)}% del valor diario
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Minerales</h4>
                        {mineralesData.map((min) => (
                          <div key={min.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{min.name}</span>
                              <span>{min.value.toFixed(1)}mg</span>
                            </div>
                            <Progress value={(min.value / min.max) * 100} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {Math.round((min.value / min.max) * 100)}% del valor diario
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}