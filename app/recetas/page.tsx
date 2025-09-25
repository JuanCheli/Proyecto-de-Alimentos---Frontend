"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChefHat,
  Plus,
  Minus,
  Apple,
  ArrowLeft,
  Clock,
  Users,
  Zap,
  Heart,
  Leaf,
  BarChart3,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { ApiService, type Alimento, type Ingrediente, type RecetaRequest } from "@/lib/api"

interface IngredienteSeleccionado {
  alimento: Alimento
  cantidad: number
}

// Interfaz que coincide con la respuesta real de la API
interface RecetaApiResponse {
  titulo: string
  ingredientes: string[]
  instrucciones: string
  nutricion_total: {
    energ_kcal: number
    protein: number
    fat: number
    carbs: number
  }
}

// Interfaz para uso interno de la UI
interface RecetaGenerada {
  titulo: string
  ingredientes: string[]
  instrucciones: string
  tiempoCoccion: string
  porciones: number
  nutricionTotal: {
    energ_kcal: number
    protein: number
    lipid_tot: number
    carbohydrt: number
    fiber_td: number
    calcium: number
    iron: number
    vit_c: number
  }
}

export default function RecetasPage() {
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState<IngredienteSeleccionado[]>([])
  const [busquedaIngrediente, setBusquedaIngrediente] = useState("")
  const [recetaGenerada, setRecetaGenerada] = useState<RecetaGenerada | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [alimentosEncontrados, setAlimentosEncontrados] = useState<Alimento[]>([])
  const [isBuscando, setIsBuscando] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const buscarAlimentos = async (termino: string) => {
    if (!termino || termino.length < 2) {
      setAlimentosEncontrados([])
      return
    }

    setIsBuscando(true)
    try {
      const alimentos = await ApiService.buscarAlimentosPorNombre(termino, 10, 0)
      setAlimentosEncontrados(alimentos)
    } catch (error) {
      console.error("Error buscando alimentos:", error)
      setAlimentosEncontrados([])
    } finally {
      setIsBuscando(false)
    }
  }

  const manejarCambioBusqueda = (valor: string) => {
    setBusquedaIngrediente(valor)

    // Limpiar timeout anterior si existe
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Si el input está vacío o muy corto, limpiar resultados inmediatamente
    if (!valor || valor.length < 2) {
      setAlimentosEncontrados([])
      setIsBuscando(false)
      return
    }

    // Configurar nuevo timeout para buscar después de 500ms
    const nuevoTimeoutId = setTimeout(() => {
      buscarAlimentos(valor)
    }, 500)

    setTimeoutId(nuevoTimeoutId)
  }

  const alimentosFiltrados = alimentosEncontrados.filter(
    (alimento) =>
      !ingredientesSeleccionados.some((ing) => ing.alimento.codigomex2 === alimento.codigomex2)
  )

  const agregarIngrediente = (alimento: Alimento) => {
    setIngredientesSeleccionados((prev) => [...prev, { alimento, cantidad: 100 }])
    setBusquedaIngrediente("")
    setAlimentosEncontrados([])
  }

  const removerIngrediente = (codigomex2: number) => {
    setIngredientesSeleccionados((prev) => prev.filter((ing) => ing.alimento.codigomex2 !== codigomex2))
  }

  const actualizarCantidad = (codigomex2: number, nuevaCantidad: number) => {
    setIngredientesSeleccionados((prev) =>
      prev.map((ing) =>
        ing.alimento.codigomex2 === codigomex2 ? { ...ing, cantidad: Math.max(10, nuevaCantidad) } : ing,
      ),
    )
  }

  const generarRecetaCompleta = async () => {
    if (ingredientesSeleccionados.length === 0) return

    setIsGenerating(true)
    try {
      // Preparar ingredientes para la API
      const ingredientesAPI: Ingrediente[] = ingredientesSeleccionados.map((ing) => ({
        codigomex2: ing.alimento.codigomex2,
        cantidad_g: ing.cantidad,
      }))

      const recetaRequest: RecetaRequest = {
        ingredientes: ingredientesAPI,
      }

      const recetaAPI = await ApiService.generarReceta(recetaRequest) as RecetaApiResponse

      // Calcular nutrición total basada en ingredientes seleccionados para valores adicionales
      const nutricionCalculada = ingredientesSeleccionados.reduce(
        (total, ing) => {
          const factor = ing.cantidad / 100
          return {
            energ_kcal: total.energ_kcal + ing.alimento.energ_kcal * factor,
            protein: total.protein + ing.alimento.protein_g * factor,
            lipid_tot: total.lipid_tot + ing.alimento.lipid_tot_g * factor,
            carbohydrt: total.carbohydrt + ing.alimento.carbohidratos_g * factor,
            fiber_td: total.fiber_td + ing.alimento.fiber_td_g * factor,
            calcium: total.calcium + ing.alimento.calcium_mg * factor,
            iron: total.iron + ing.alimento.iron_mg * factor,
            vit_c: total.vit_c + ing.alimento.vit_c_mg * factor,
          }
        },
        {
          energ_kcal: 0,
          protein: 0,
          lipid_tot: 0,
          carbohydrt: 0,
          fiber_td: 0,
          calcium: 0,
          iron: 0,
          vit_c: 0,
        },
      )

      // Formatear la respuesta de la API
      const receta: RecetaGenerada = {
        titulo: recetaAPI.titulo || `Receta con ${ingredientesSeleccionados[0]?.alimento.nombre}`,
        ingredientes: recetaAPI.ingredientes || ingredientesSeleccionados.map(
          (ing) => `${ing.cantidad}g de ${ing.alimento.nombre.toLowerCase()}`
        ),
        instrucciones: recetaAPI.instrucciones || "Instrucciones generadas por IA",
        tiempoCoccion: "20 min", // No viene en la API, valor por defecto
        porciones: 2, // No viene en la API, valor por defecto
        nutricionTotal: {
          // Usar valores de la API cuando estén disponibles, sino usar los calculados
          energ_kcal: Math.round(recetaAPI.nutricion_total?.energ_kcal || nutricionCalculada.energ_kcal),
          protein: Math.round((recetaAPI.nutricion_total?.protein || nutricionCalculada.protein) * 10) / 10,
          lipid_tot: Math.round((recetaAPI.nutricion_total?.fat || nutricionCalculada.lipid_tot) * 10) / 10,
          carbohydrt: Math.round((recetaAPI.nutricion_total?.carbs || nutricionCalculada.carbohydrt) * 10) / 10,
          fiber_td: Math.round(nutricionCalculada.fiber_td * 10) / 10,
          calcium: Math.round(nutricionCalculada.calcium),
          iron: Math.round(nutricionCalculada.iron * 10) / 10,
          vit_c: Math.round(nutricionCalculada.vit_c),
        },
      }

      setRecetaGenerada(receta)
    } catch (error) {
      console.error("Error generando receta:", error)
      // Fallback a generación local si la API falla
      const recetaFallback = generarRecetaLocal(ingredientesSeleccionados)
      setRecetaGenerada(recetaFallback)
    } finally {
      setIsGenerating(false)
    }
  }

  const generarRecetaLocal = (ingredientes: IngredienteSeleccionado[]): RecetaGenerada => {
    const nombres = ingredientes.map((ing) => ing.alimento.nombre.toLowerCase())

    let titulo = "Receta Nutritiva"
    let instrucciones = ""
    const tiempoCoccion = "20 min"
    const porciones = 2

    // Lógica básica para generar receta
    if (nombres.some((n) => n.includes("pollo")) && nombres.some((n) => n.includes("arroz"))) {
      titulo = "Bowl de Pollo con Arroz"
      instrucciones =
        "1. Cocina el arroz según las instrucciones del paquete.\n2. Sazona y cocina el pollo a la plancha.\n3. Combina todos los ingredientes y sirve caliente."
    } else {
      titulo = `Plato Saludable con ${ingredientes[0]?.alimento.nombre}`
      instrucciones = "1. Prepara todos los ingredientes.\n2. Cocina según sea necesario.\n3. Combina y sirve."
    }

    // Calcular nutrición (corregido para usar las propiedades correctas)
    const nutricionTotal = ingredientes.reduce(
      (total, ing) => {
        const factor = ing.cantidad / 100
        return {
          energ_kcal: total.energ_kcal + ing.alimento.energ_kcal * factor,
          protein: total.protein + ing.alimento.protein_g * factor,
          lipid_tot: total.lipid_tot + ing.alimento.lipid_tot_g * factor,
          carbohydrt: total.carbohydrt + ing.alimento.carbohidratos_g * factor,
          fiber_td: total.fiber_td + ing.alimento.fiber_td_g * factor,
          calcium: total.calcium + ing.alimento.calcium_mg * factor,
          iron: total.iron + ing.alimento.iron_mg * factor,
          vit_c: total.vit_c + ing.alimento.vit_c_mg * factor,
        }
      },
      { energ_kcal: 0, protein: 0, lipid_tot: 0, carbohydrt: 0, fiber_td: 0, calcium: 0, iron: 0, vit_c: 0 },
    )

    return {
      titulo,
      ingredientes: ingredientes.map((ing) => `${ing.cantidad}g de ${ing.alimento.nombre.toLowerCase()}`),
      instrucciones,
      tiempoCoccion,
      porciones,
      nutricionTotal: {
        energ_kcal: Math.round(nutricionTotal.energ_kcal),
        protein: Math.round(nutricionTotal.protein * 10) / 10,
        lipid_tot: Math.round(nutricionTotal.lipid_tot * 10) / 10,
        carbohydrt: Math.round(nutricionTotal.carbohydrt * 10) / 10,
        fiber_td: Math.round(nutricionTotal.fiber_td * 10) / 10,
        calcium: Math.round(nutricionTotal.calcium),
        iron: Math.round(nutricionTotal.iron * 10) / 10,
        vit_c: Math.round(nutricionTotal.vit_c),
      },
    }
  }

  const limpiarTodo = () => {
    setIngredientesSeleccionados([])
    setRecetaGenerada(null)
    setBusquedaIngrediente("")
    setAlimentosEncontrados([])
  }

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
              <ChefHat className="w-4 h-4" />
              Generador de Recetas
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panel de selección de ingredientes */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Ingredientes
                  </CardTitle>
                  {ingredientesSeleccionados.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={limpiarTodo}>
                      Limpiar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Búsqueda de ingredientes */}
                <div className="space-y-2">
                  <Label>Buscar ingredientes</Label>
                  <Input
                    placeholder="Ej: pollo, aceite..."
                    value={busquedaIngrediente}
                    onChange={(e) => manejarCambioBusqueda(e.target.value)}
                    disabled={isBuscando}
                  />

                  {isBuscando && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Buscando alimentos...
                    </div>
                  )}

                  {busquedaIngrediente && alimentosFiltrados.length > 0 && (
                    <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                      {alimentosFiltrados.slice(0, 5).map((alimento) => (
                        <button
                          key={alimento.codigomex2}
                          onClick={() => agregarIngrediente(alimento)}
                          className="w-full text-left p-2 hover:bg-accent/10 transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="font-medium text-sm">{alimento.nombre}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round(alimento.energ_kcal)} kcal • {alimento.protein_g.toFixed(1)}g proteína
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {busquedaIngrediente && busquedaIngrediente.length >= 2 && alimentosFiltrados.length === 0 && !isBuscando && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No se encontraron alimentos con "{busquedaIngrediente}"
                    </div>
                  )}
                </div>

                <Separator />

                {/* Ingredientes seleccionados */}
                <div className="space-y-3">
                  <Label>Ingredientes seleccionados ({ingredientesSeleccionados.length})</Label>
                  {ingredientesSeleccionados.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Busca y selecciona ingredientes para crear tu receta
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {ingredientesSeleccionados.map((ing) => (
                        <Card key={ing.alimento.codigomex2} className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{ing.alimento.nombre}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerIngrediente(ing.alimento.codigomex2)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={ing.cantidad}
                              onChange={(e) =>
                                actualizarCantidad(ing.alimento.codigomex2, Number.parseInt(e.target.value) || 10)
                              }
                              className="w-20 h-8 text-sm"
                              min="10"
                              max="1000"
                            />
                            <span className="text-xs text-muted-foreground">gramos</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {ingredientesSeleccionados.length > 0 && (
                  <Button
                    onClick={generarRecetaCompleta}
                    disabled={isGenerating}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando receta...
                      </>
                    ) : (
                      <>
                        <ChefHat className="w-4 h-4 mr-2" />
                        Generar Receta
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel de receta generada */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Generador de Recetas</h1>
              <p className="text-muted-foreground">
                Selecciona ingredientes y genera recetas personalizadas con cálculo nutricional automático
              </p>
            </div>

            {!recetaGenerada ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Crea tu primera receta</h3>
                  <p className="text-muted-foreground mb-4">
                    Escribe en el buscador para encontrar ingredientes (ej: "pollo", "arroz", "tomate")
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Título y metadatos de la receta */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">{recetaGenerada.titulo}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {recetaGenerada.tiempoCoccion}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {recetaGenerada.porciones} porciones
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary">
                        {recetaGenerada.nutricionTotal.energ_kcal} kcal total
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Ingredientes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ingredientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recetaGenerada.ingredientes.map((ingrediente, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm">{ingrediente}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Instrucciones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instrucciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{recetaGenerada.instrucciones}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Información nutricional */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Información Nutricional Total
                    </CardTitle>
                    <CardDescription>
                      Valores calculados para toda la receta ({recetaGenerada.porciones} porciones)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Zap className="w-4 h-4 text-accent" />
                            Calorías
                          </span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.energ_kcal} kcal</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Heart className="w-4 h-4 text-chart-3" />
                            Proteína
                          </span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.protein}g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-4 h-4 bg-chart-4 rounded-full" />
                            Grasa
                          </span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.lipid_tot}g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <div className="w-4 h-4 bg-chart-2 rounded-full" />
                            Carbohidratos
                          </span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.carbohydrt}g</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-primary" />
                            Fibra
                          </span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.fiber_td}g</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Calcio</span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.calcium}mg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Hierro</span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.iron}mg</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Vitamina C</span>
                          <span className="font-medium">{recetaGenerada.nutricionTotal.vit_c}mg</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Valores por porción ({recetaGenerada.porciones} porciones)
                      </p>
                      <div className="flex justify-center gap-4 text-sm">
                        <span>
                          {Math.round(recetaGenerada.nutricionTotal.energ_kcal / recetaGenerada.porciones)} kcal
                        </span>
                        <span>•</span>
                        <span>
                          {Math.round((recetaGenerada.nutricionTotal.protein / recetaGenerada.porciones) * 10) / 10}g
                          proteína
                        </span>
                        <span>•</span>
                        <span>
                          {Math.round((recetaGenerada.nutricionTotal.carbohydrt / recetaGenerada.porciones) * 10) / 10}g
                          carbohidratos
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}