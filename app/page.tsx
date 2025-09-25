import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, MessageCircle, ChefHat, BarChart3, Sparkles, Apple, Leaf, Zap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Apple className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">NutriAI</span>
            </div>
            <div className="hidden md:flex items-center gap-6 flex-grow justify-center -ml-26">
              <Link href="/buscar" className="text-muted-foreground hover:text-foreground transition-colors">
                Buscar Alimentos
              </Link>
              <Link href="/chat" className="text-muted-foreground hover:text-foreground transition-colors">
                Chat IA
              </Link>
              <Link href="/recetas" className="text-muted-foreground hover:text-foreground transition-colors">
                Recetas
              </Link>
              <Link href="/nutricion" className="text-muted-foreground hover:text-foreground transition-colors">
                Análisis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Inteligencia Artificial Nutricional
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6">
            Descubre la{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              nutrición perfecta
            </span>{" "}
            para ti
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Consulta información nutricional de alimentos, haz preguntas en lenguaje natural y genera recetas
            personalizadas con nuestra IA especializada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/buscar">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Search className="w-5 h-5 mr-2" />
                Buscar Alimentos
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="lg" variant="outline" className="border-border hover:bg-accent/10 bg-transparent">
                <MessageCircle className="w-5 h-5 mr-2" />
                Pregunta a la IA
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades principales</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Herramientas potentes para explorar el mundo de la nutrición con inteligencia artificial
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/buscar">
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Búsqueda Avanzada</CardTitle>
                  <CardDescription>
                    Encuentra alimentos por filtros nutricionales específicos como calorías, proteínas y vitaminas.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/chat">
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle className="text-xl">Chat Nutricional</CardTitle>
                  <CardDescription>
                    Haz preguntas en lenguaje natural sobre nutrición y obtén respuestas precisas de nuestra IA.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/recetas">
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-chart-3/20 transition-colors">
                    <ChefHat className="w-6 h-6 text-chart-3" />
                  </div>
                  <CardTitle className="text-xl">Generador de Recetas</CardTitle>
                  <CardDescription>
                    Crea recetas personalizadas con ingredientes seleccionados y cálculo nutricional automático.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/nutricion">
              <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-chart-4/20 transition-colors">
                    <BarChart3 className="w-6 h-6 text-chart-4" />
                  </div>
                  <CardTitle className="text-xl">Análisis Nutricional</CardTitle>
                  <CardDescription>
                    Visualiza información nutricional detallada con gráficos interactivos y comparaciones.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">Alimentos en base de datos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">25+</div>
              <div className="text-muted-foreground">Nutrientes analizados</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-chart-3 mb-2">∞</div>
              <div className="text-muted-foreground">Recetas posibles</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 max-w-2xl mx-auto">
            <CardHeader className="pb-8">
              <div className="flex justify-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-primary" />
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">Comienza tu viaje nutricional</CardTitle>
              <CardDescription className="text-lg">
                Explora miles de alimentos, haz preguntas inteligentes y crea recetas únicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/buscar">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Explorar Alimentos
                  </Button>
                </Link>
                <Link href="/recetas">
                  <Button size="lg" variant="outline">
                    Generar Recetas
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Apple className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">NutriAI</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Proyecto de Alimentos + IA</span>
              <span>•</span>
              <span>Prueba Técnica</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
