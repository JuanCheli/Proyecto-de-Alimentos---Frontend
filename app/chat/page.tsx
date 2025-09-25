"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Apple, ArrowLeft, Lightbulb, MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { ApiService, type AskRequest } from "@/lib/api"

// Interfaz para la respuesta directa de la API /ask
interface AlimentoChatResponse {
  codigomex2: number
  nombre_del_alimento: string
  protein?: number
  lipid_tot?: number
  energ_kcal?: number
  carbohydrt?: number
  fiber_td?: number
  iron?: number
  vit_c?: number
  calcium?: number
  zinc?: number
  vit_a_rae?: number
  vit_e?: number
  vit_k?: number
}

interface Mensaje {
  id: string
  tipo: "usuario" | "ia"
  contenido: string
  timestamp: Date
  alimentos?: AlimentoChatResponse[]
}

const preguntasSugeridas = [
  "¿Qué alimentos tienen más proteína?",
  "Dame opciones bajas en calorías",
  "¿Cuáles son ricos en hierro?",
  "Alimentos con grasas saludables",
  "¿Qué tiene más zinc?",
  "Fuentes de vitamina C",
  "Alimentos ricos en calcio",
  "¿Cuáles tienen más fibra?",
]

export default function ChatPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: "1",
      tipo: "ia",
      contenido:
        "¡Hola! Soy tu asistente nutricional con IA. Puedo ayudarte a encontrar información sobre alimentos, nutrientes y responder preguntas sobre nutrición basándome en nuestra base de datos real. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto scroll mejorado
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [mensajes])

  const enviarMensaje = async () => {
    if (!inputValue.trim() || isLoading) return

    const nuevoMensajeUsuario: Mensaje = {
      id: Date.now().toString(),
      tipo: "usuario",
      contenido: inputValue,
      timestamp: new Date(),
    }

    setMensajes((prev) => [...prev, nuevoMensajeUsuario])
    const pregunta = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      const askRequest: AskRequest = {
        question: pregunta,
        max_results: 10,
      }

      const resultados = await ApiService.askIA(askRequest)

      let respuesta = ""
      let alimentos: AlimentoChatResponse[] = []

      if (resultados && Array.isArray(resultados) && resultados.length > 0) {
        // Los resultados ya vienen en el formato correcto desde la API
        alimentos = resultados.map((alimento: AlimentoChatResponse) => ({
          codigomex2: alimento.codigomex2 || 0,
          nombre_del_alimento: alimento.nombre_del_alimento || "Alimento desconocido",
          energ_kcal: alimento.energ_kcal || 0,
          protein: alimento.protein || 0,
          lipid_tot: alimento.lipid_tot || 0,
          carbohydrt: alimento.carbohydrt || 0,
          fiber_td: alimento.fiber_td || 0,
          iron: alimento.iron || 0,
          vit_c: alimento.vit_c || 0,
          calcium: alimento.calcium || 0,
          zinc: alimento.zinc || 0,
          vit_a_rae: alimento.vit_a_rae || 0,
          vit_e: alimento.vit_e || 0,
          vit_k: alimento.vit_k || 0,
        }))

        respuesta = `Encontré ${resultados.length} alimentos que coinciden con tu consulta:`
      } else {
        respuesta =
          "No encontré alimentos específicos para tu consulta. Intenta ser más específico sobre qué nutriente o tipo de alimento te interesa. Por ejemplo: 'alimentos altos en proteína', 'fuentes de hierro', o 'opciones bajas en calorías'."
      }

      const mensajeIA: Mensaje = {
        id: (Date.now() + 1).toString(),
        tipo: "ia",
        contenido: respuesta,
        timestamp: new Date(),
        alimentos: alimentos.length > 0 ? alimentos : undefined,
      }

      setMensajes((prev) => [...prev, mensajeIA])
    } catch (error) {
      console.error("Error en chat:", error)
      const mensajeError: Mensaje = {
        id: (Date.now() + 1).toString(),
        tipo: "ia",
        contenido: `Lo siento, hubo un error procesando tu pregunta. ${
          error instanceof Error ? error.message : "Error desconocido"
        }. Por favor, inténtalo de nuevo con una pregunta más específica.`,
        timestamp: new Date(),
      }
      setMensajes((prev) => [...prev, mensajeError])
    } finally {
      setIsLoading(false)
    }
  }

  const usarPreguntaSugerida = (pregunta: string) => {
    setInputValue(pregunta)
  }

  // Función MEJORADA - convierte a número y filtra valores inválidos
  const esValorValido = (valor: any): boolean => {
    const num = Number(valor)
    return !isNaN(num) && num > 0.01
  }

  // Función para formatear SOLO valores válidos
  const formatearValorNutricional = (valor: any, unidad: string = ""): string => {
    if (!esValorValido(valor)) return "-"
    const num = Number(valor)
    const valorRedondeado = Math.round(num * 100) / 100
    return `${valorRedondeado}${unidad}`
  }

  // Componente para mostrar nutriente SOLO si es válido
  const NutrienteItem = ({ label, value, unit }: { label: string, value: any, unit: string }) => {
    if (!esValorValido(value)) return null
    
    return (
      <div className="flex justify-between items-center py-1 px-2 bg-gray-50 dark:bg-gray-800/30 rounded text-xs">
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{formatearValorNutricional(value, unit)}</span>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background">
      {/* Header fijo */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm h-16 flex-shrink-0">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
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
            <MessageCircle className="w-4 h-4" />
            Chat Nutricional
          </div>
        </div>
      </header>

      {/* Container principal */}
      <div className="container mx-auto px-4 py-4 max-w-6xl" style={{ height: 'calc(100vh - 4rem)' }}>
        <div className="grid lg:grid-cols-4 gap-6 h-full">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-accent" />
                  Preguntas Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent className="h-0 flex-1">
                <div className="space-y-2">
                  {preguntasSugeridas.map((pregunta, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full text-left justify-start h-auto p-3 text-sm hover:bg-accent/10 whitespace-normal"
                      onClick={() => usarPreguntaSugerida(pregunta)}
                      disabled={isLoading}
                    >
                      {pregunta}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat principal  */}
          <div className="lg:col-span-3">
            <div className="h-full flex flex-col">
              
              {/* Header del chat */}
              <Card className="flex-shrink-0 mb-4">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>

                    <div className="flex flex-col justify-center">
                      <CardTitle className="text-xl">Asistente Nutricional IA</CardTitle>
                      <p className="text-sm text-muted-foreground">Pregúntame sobre alimentos, nutrientes y nutrición</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>



              {/* Área de mensajes - CON ALTURA FIJA Y SCROLL */}
              <Card className="flex-1 flex flex-col min-h-0">
                <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                  <div 
                    className="h-full overflow-y-auto p-4" 
                    ref={scrollAreaRef}
                    style={{ maxHeight: 'calc(100vh - 27rem)' }}
                  >
                    <div className="space-y-4">
                      {mensajes.map((mensaje) => (
                        <div
                          key={mensaje.id}
                          className={`flex gap-3 ${mensaje.tipo === "usuario" ? "justify-end" : "justify-start"}`}
                        >
                          {mensaje.tipo === "ia" && (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-4 h-4 text-primary" />
                            </div>
                          )}

                          <div className={`max-w-[80%] ${mensaje.tipo === "usuario" ? "order-1" : ""}`}>
                            <div
                              className={`rounded-lg p-3 ${
                                mensaje.tipo === "usuario" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{mensaje.contenido}</p>
                            </div>

                            {/* Tarjetas de alimentos */}
                            {mensaje.alimentos && mensaje.alimentos.length > 0 && (
                              <div className="mt-3 grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                                {mensaje.alimentos.map((alimento, index) => (
                                  <Card key={index} className="bg-card/50 border-border/50">
                                    <CardContent className="p-4">
                                      {/* Header */}
                                      <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-medium text-sm leading-tight pr-2 flex-1">
                                          {alimento.nombre_del_alimento}
                                        </h4>
                                        {esValorValido(alimento.energ_kcal) && (
                                          <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">
                                            {formatearValorNutricional(alimento.energ_kcal)} kcal
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      {/* Macronutrientes */}
                                      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                          <div className="font-medium text-blue-700 dark:text-blue-300">Proteína</div>
                                          <div className="text-blue-600 dark:text-blue-400">
                                            {formatearValorNutricional(alimento.protein, " g")}
                                          </div>
                                        </div>
                                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                          <div className="font-medium text-green-700 dark:text-green-300">Carboh.</div>
                                          <div className="text-green-600 dark:text-green-400">
                                            {formatearValorNutricional(alimento.carbohydrt, " g")}
                                          </div>
                                        </div>
                                        <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                          <div className="font-medium text-yellow-700 dark:text-yellow-300">Grasa</div>
                                          <div className="text-yellow-600 dark:text-yellow-400">
                                            {formatearValorNutricional(alimento.lipid_tot, " g")}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Micronutrientes - SOLO MOSTRAR SI SON VÁLIDOS */}
                                      <div className="space-y-1">
                                        <NutrienteItem label="Fibra" value={alimento.fiber_td} unit=" g" />
                                        <NutrienteItem label="Hierro" value={alimento.iron} unit=" mg" />
                                        <NutrienteItem label="Calcio" value={alimento.calcium} unit=" mg" />
                                        <NutrienteItem label="Vit. C" value={alimento.vit_c} unit=" mg" />
                                        <NutrienteItem label="Zinc" value={alimento.zinc} unit=" mg" />
                                        <NutrienteItem label="Vit. A" value={alimento.vit_a_rae} unit=" μg" />
                                        <NutrienteItem label="Vit. E" value={alimento.vit_e} unit=" mg" />
                                        <NutrienteItem label="Vit. K" value={alimento.vit_k} unit=" μg" />
                                      </div>
                                      
                                      {alimento.codigomex2 && (
                                        <div className="text-xs text-muted-foreground/60 mt-3 pt-2 border-t">
                                          Código: {alimento.codigomex2}
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-1">
                              {mensaje.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>

                          {mensaje.tipo === "usuario" && (
                            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                              <User className="w-4 h-4 text-accent" />
                            </div>
                          )}
                        </div>
                      ))}

                      {isLoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-primary" />
                          </div>
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Analizando tu pregunta y consultando la base de datos...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Input fijo en la parte inferior */}
              <Card className="flex-shrink-0 mt-4">
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Pregúntame sobre nutrición, alimentos, vitaminas..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviarMensaje()}
                      disabled={isLoading}
                      className="flex-1"
                      maxLength={500}
                    />
                    <Button
                      onClick={enviarMensaje}
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Presiona Enter para enviar. La IA buscará en nuestra base de datos nutricional.
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}