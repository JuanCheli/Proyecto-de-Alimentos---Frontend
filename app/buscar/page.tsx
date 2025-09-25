"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Filter, Apple, Zap, Heart, Leaf, ArrowLeft, Loader2, Wheat, Droplets, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ApiService, type Alimento, type AlimentoFilter } from "@/lib/api";

interface FiltrosNutricionales {
  // Calorías
  minCalorias: number[];
  maxCalorias: number[];
  // Carbohidratos
  minCarbohidratos: number[];
  maxCarbohidratos: number[];
  // Proteínas
  minProteinas: number[];
  maxProteinas: number[];
  // Lípidos/Grasas
  minLipidos: number[];
  maxLipidos: number[];
  // Fibra
  minFibra: number[];
  maxFibra: number[];
}

export default function BuscarPage() {
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtros, setFiltros] = useState<FiltrosNutricionales>({
    // Calorías (0-1000 kcal)
    minCalorias: [0],
    maxCalorias: [1000],
    // Carbohidratos (0-100g)
    minCarbohidratos: [0],
    maxCarbohidratos: [100],
    // Proteínas (0-100g) - ACTUALIZADO
    minProteinas: [0],
    maxProteinas: [100],
    // Lípidos/Grasas (0-100g)
    minLipidos: [0],
    maxLipidos: [100],
    // Fibra (0-50g) - ACTUALIZADO
    minFibra: [0],
    maxFibra: [50],
  });
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 20;

  // Función para validar que min no sea mayor que max
  const validarRango = (min: number, max: number) => min <= max;

  // Función para buscar por código específico
  const buscarPorCodigo = async (codigo: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const alimento = await ApiService.getAlimento(codigo);
      setAlimentos([alimento]);
      setTotalPages(1);
      setCurrentPage(1);
      setHasMore(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) {
        setError(`No se encontró ningún alimento con el código ${codigo}`);
      } else {
        setError(err instanceof Error ? err.message : "Error al buscar el alimento por código");
      }
      setAlimentos([]);
      setTotalPages(1);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const buscarAlimentos = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      // Si hay un código de búsqueda, buscar por código específico
      const codigoNum = parseInt(codigoBusqueda);
      if (codigoBusqueda && !isNaN(codigoNum)) {
        await buscarPorCodigo(codigoNum);
        return;
      }

      const offset = (page - 1) * itemsPerPage;
      
      const filtrosAPI: AlimentoFilter = {
        // Calorías
        calorias_min: filtros.minCalorias[0] > 0 ? filtros.minCalorias[0] : undefined,
        calorias_max: filtros.maxCalorias[0] < 1000 ? filtros.maxCalorias[0] : undefined,
        
        // Carbohidratos
        carbohidratos_min: filtros.minCarbohidratos[0] > 0 ? filtros.minCarbohidratos[0] : undefined,
        carbohidratos_max: filtros.maxCarbohidratos[0] < 100 ? filtros.maxCarbohidratos[0] : undefined,
        
        // Proteínas
        proteinas_min: filtros.minProteinas[0] > 0 ? filtros.minProteinas[0] : undefined,
        proteinas_max: filtros.maxProteinas[0] < 100 ? filtros.maxProteinas[0] : undefined,
        
        // Lípidos/Grasas
        lipidos_min: filtros.minLipidos[0] > 0 ? filtros.minLipidos[0] : undefined,
        lipidos_max: filtros.maxLipidos[0] < 100 ? filtros.maxLipidos[0] : undefined,
        
        // Fibra
        fibra_min: filtros.minFibra[0] > 0 ? filtros.minFibra[0] : undefined,
        fibra_max: filtros.maxFibra[0] < 50 ? filtros.maxFibra[0] : undefined,
      };

      let resultados: Alimento[];

      const hasFilters =
        filtros.minCalorias[0] > 0 ||
        filtros.maxCalorias[0] < 1000 ||
        filtros.minCarbohidratos[0] > 0 ||
        filtros.maxCarbohidratos[0] < 100 ||
        filtros.minProteinas[0] > 0 ||
        filtros.maxProteinas[0] < 100 ||
        filtros.minLipidos[0] > 0 ||
        filtros.maxLipidos[0] < 100 ||
        filtros.minFibra[0] > 0 ||
        filtros.maxFibra[0] < 50;

      if (hasFilters) {
        resultados = await ApiService.buscarAlimentos(filtrosAPI, itemsPerPage, offset);
      } else {
        resultados = await ApiService.getAlimentos(itemsPerPage, offset);
      }

      if (page === 1) {
        setAlimentos(resultados);
      } else {
        setAlimentos(prev => [...prev, ...resultados]);
      }

      // Actualizar estados de paginación
      setHasMore(resultados.length === itemsPerPage);
      setCurrentPage(page);
      
      // Calcular páginas totales aproximadas (esto es una estimación)
      if (resultados.length < itemsPerPage) {
        setTotalPages(page);
      }

    } catch (err) {
      // Manejo específico para cuando no se encuentran alimentos con filtros
      if (err instanceof Error && err.message.includes('404')) {
        setError("No se encontraron alimentos que cumplan con los filtros seleccionados. Intenta ajustar los criterios de búsqueda.");
      } else {
        setError(err instanceof Error ? err.message : "Error al buscar alimentos");
      }
      
      if (page === 1) {
        setAlimentos([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar más resultados
  const cargarMas = () => {
    if (!isLoading && hasMore) {
      buscarAlimentos(currentPage + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    buscarAlimentos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      buscarAlimentos(1);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoBusqueda, filtros]);

  const limpiarFiltros = () => {
    setFiltros({
      minCalorias: [0],
      maxCalorias: [1000],
      minCarbohidratos: [0],
      maxCarbohidratos: [100],
      minProteinas: [0],
      maxProteinas: [100],
      minLipidos: [0],
      maxLipidos: [100],
      minFibra: [0],
      maxFibra: [50],
    });
    setCodigoBusqueda("");
  };

  // Funciones para actualizar filtros con validación de rango
  const actualizarFiltroMin = (campo: keyof FiltrosNutricionales, value: number[], maxField: keyof FiltrosNutricionales) => {
    const newMin = value[0];
    const currentMax = filtros[maxField][0];
    
    if (newMin <= currentMax) {
      setFiltros(p => ({ ...p, [campo]: value }));
    }
  };

  const actualizarFiltroMax = (campo: keyof FiltrosNutricionales, value: number[], minField: keyof FiltrosNutricionales) => {
    const newMax = value[0];
    const currentMin = filtros[minField][0];
    
    if (newMax >= currentMin) {
      setFiltros(p => ({ ...p, [campo]: value }));
    }
  };

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
            <div className="text-sm text-muted-foreground">Buscador de Alimentos</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar de Filtros */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={limpiarFiltros} className="text-muted-foreground hover:text-foreground">
                    Limpiar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">


                {/* Búsqueda por código */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Buscar por código
                  </Label>
                  <Input 
                    placeholder="Ej: 101001, 101002..." 
                    value={codigoBusqueda} 
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    type="number"
                  />
                </div>

                <Separator />

                {/* Filtros de Calorías */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Calorías (kcal)
                  </h4>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Mínimo: {filtros.minCalorias[0]} kcal
                    </Label>
                    <Slider 
                      value={filtros.minCalorias} 
                      onValueChange={(value) => actualizarFiltroMin('minCalorias', value, 'maxCalorias')} 
                      max={1000} 
                      min={0} 
                      step={10} 
                      className="w-full" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Máximo: {filtros.maxCalorias[0]} kcal
                    </Label>
                    <Slider 
                      value={filtros.maxCalorias} 
                      onValueChange={(value) => actualizarFiltroMax('maxCalorias', value, 'minCalorias')} 
                      max={1000} 
                      min={0} 
                      step={10} 
                      className="w-full" 
                    />
                  </div>
                  
                  {!validarRango(filtros.minCalorias[0], filtros.maxCalorias[0]) && (
                    <p className="text-xs text-destructive">El mínimo no puede ser mayor que el máximo</p>
                  )}
                </div>

                <Separator />

                {/* Filtros de Proteínas */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4 text-chart-3" />
                    Proteínas (g)
                  </h4>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Mínimo: {filtros.minProteinas[0]}g
                    </Label>
                    <Slider 
                      value={filtros.minProteinas} 
                      onValueChange={(value) => actualizarFiltroMin('minProteinas', value, 'maxProteinas')} 
                      max={100} 
                      min={0} 
                      step={1} 
                      className="w-full" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Máximo: {filtros.maxProteinas[0]}g
                    </Label>
                    <Slider 
                      value={filtros.maxProteinas} 
                      onValueChange={(value) => actualizarFiltroMax('maxProteinas', value, 'minProteinas')} 
                      max={100} 
                      min={0} 
                      step={1} 
                      className="w-full" 
                    />
                  </div>
                  
                  {!validarRango(filtros.minProteinas[0], filtros.maxProteinas[0]) && (
                    <p className="text-xs text-destructive">El mínimo no puede ser mayor que el máximo</p>
                  )}
                </div>

                <Separator />

                {/* Filtros de Carbohidratos */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-chart-2" />
                    Carbohidratos (g)
                  </h4>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Mínimo: {filtros.minCarbohidratos[0]}g
                    </Label>
                    <Slider 
                      value={filtros.minCarbohidratos} 
                      onValueChange={(value) => actualizarFiltroMin('minCarbohidratos', value, 'maxCarbohidratos')} 
                      max={100} 
                      min={0} 
                      step={1} 
                      className="w-full" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Máximo: {filtros.maxCarbohidratos[0]}g
                    </Label>
                    <Slider 
                      value={filtros.maxCarbohidratos} 
                      onValueChange={(value) => actualizarFiltroMax('maxCarbohidratos', value, 'minCarbohidratos')} 
                      max={100} 
                      min={0} 
                      step={1} 
                      className="w-full" 
                    />
                  </div>
                  
                  {!validarRango(filtros.minCarbohidratos[0], filtros.maxCarbohidratos[0]) && (
                    <p className="text-xs text-destructive">El mínimo no puede ser mayor que el máximo</p>
                  )}
                </div>

                <Separator />

                {/* Filtros de Lípidos/Grasas */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-chart-4" />
                    Grasas (g)
                  </h4>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Mínimo: {filtros.minLipidos[0]}g
                    </Label>
                    <Slider 
                      value={filtros.minLipidos} 
                      onValueChange={(value) => actualizarFiltroMin('minLipidos', value, 'maxLipidos')} 
                      max={100} 
                      min={0} 
                      step={1} 
                      className="w-full" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Máximo: {filtros.maxLipidos[0]}g
                    </Label>
                    <Slider 
                      value={filtros.maxLipidos} 
                      onValueChange={(value) => actualizarFiltroMax('maxLipidos', value, 'minLipidos')} 
                      max={100} 
                      min={0} 
                      step={1} 
                      className="w-full" 
                    />
                  </div>
                  
                  {!validarRango(filtros.minLipidos[0], filtros.maxLipidos[0]) && (
                    <p className="text-xs text-destructive">El mínimo no puede ser mayor que el máximo</p>
                  )}
                </div>

                <Separator />

                {/* Filtros de Fibra */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-primary" />
                    Fibra (g)
                  </h4>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Mínimo: {filtros.minFibra[0]}g
                    </Label>
                    <Slider 
                      value={filtros.minFibra} 
                      onValueChange={(value) => actualizarFiltroMin('minFibra', value, 'maxFibra')} 
                      max={50} 
                      min={0} 
                      step={0.5} 
                      className="w-full" 
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm">
                      Máximo: {filtros.maxFibra[0]}g
                    </Label>
                    <Slider 
                      value={filtros.maxFibra} 
                      onValueChange={(value) => actualizarFiltroMax('maxFibra', value, 'minFibra')} 
                      max={50} 
                      min={0} 
                      step={0.5} 
                      className="w-full" 
                    />
                  </div>
                  
                  {!validarRango(filtros.minFibra[0], filtros.maxFibra[0]) && (
                    <p className="text-xs text-destructive">El mínimo no puede ser mayor que el máximo</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Buscar Alimentos</h1>
              <p className="text-muted-foreground">
                {isLoading && currentPage === 1 ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando alimentos...
                  </span>
                ) : (
                  `Mostrando ${alimentos.length} alimentos${hasMore ? ' (cargando más disponible)' : ''}`
                )}
              </p>
            </div>

            {error && (
              <Card className="border-destructive/50 bg-destructive/5 mb-6">
                <CardContent className="pt-6">
                  <p className="text-destructive text-sm">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => buscarAlimentos(1)} className="mt-2 bg-transparent">
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {alimentos.map((alimento) => (
                <Card key={alimento.codigomex2} className="hover:border-primary/50 transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{alimento.nombre}</CardTitle>
                        <CardDescription>Código: {alimento.codigomex2}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-accent/10 text-accent">
                        {Math.round(alimento.energ_kcal)} kcal
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Proteína:</span>
                          <span className="font-medium">{alimento.protein_g.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Carbohidratos:</span>
                          <span className="font-medium">{alimento.carbohidratos_g.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grasa Total:</span>
                          <span className="font-medium">{alimento.lipid_tot_g.toFixed(1)}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fibra:</span>
                          <span className="font-medium">{alimento.fiber_td_g.toFixed(1)}g</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Calcio:</span>
                          <span className="font-medium">{alimento.calcium_mg.toFixed(0)}mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hierro:</span>
                          <span className="font-medium">{alimento.iron_mg.toFixed(1)}mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Zinc:</span>
                          <span className="font-medium">{alimento.zinc_mg.toFixed(1)}mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vit C:</span>
                          <span className="font-medium">{alimento.vit_c_mg.toFixed(1)}mg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vit A:</span>
                          <span className="font-medium">{alimento.vit_a_rae_mcg.toFixed(0)}μg</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Grasa Sat:</span>
                            <span className="font-medium">{alimento.fa_sat_g.toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Grasa Mono:</span>
                            <span className="font-medium">{alimento.fa_mono_g.toFixed(1)}g</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Grasa Poli:</span>
                            <span className="font-medium">{alimento.fa_poly_g.toFixed(1)}g</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Colesterol:</span>
                            <span className="font-medium">{alimento.chole_mg.toFixed(0)}mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vit E:</span>
                            <span className="font-medium">{alimento.vit_e_mg.toFixed(1)}mg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Folato:</span>
                            <span className="font-medium">{alimento.folate_dfe_mcg.toFixed(0)}μg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex gap-2 flex-wrap">
                        {alimento.protein_g > 15 && <Badge className="text-xs bg-chart-3/10 text-chart-3">Alto en proteína</Badge>}
                        {alimento.fiber_td_g > 5 && <Badge className="text-xs bg-primary/10 text-primary">Rico en fibra</Badge>}
                        {alimento.energ_kcal < 100 && <Badge className="text-xs bg-green-500/10 text-green-600">Bajo en calorías</Badge>}
                        {alimento.vit_c_mg > 30 && <Badge className="text-xs bg-orange-500/10 text-orange-600">Alto en Vit C</Badge>}
                        {alimento.calcium_mg > 150 && <Badge className="text-xs bg-blue-500/10 text-blue-600">Rico en calcio</Badge>}
                        {alimento.iron_mg > 5 && <Badge className="text-xs bg-red-500/10 text-red-600">Rico en hierro</Badge>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botón para cargar más */}
            {hasMore && !isLoading && (
              <div className="mt-8 text-center">
                <Button 
                  onClick={cargarMas} 
                  variant="outline" 
                  size="lg"
                  className="px-8"
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Cargar más alimentos
                </Button>
              </div>
            )}

            {/* Loading para cargar más */}
            {isLoading && currentPage > 1 && (
              <div className="mt-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Cargando más alimentos...</span>
                </div>
              </div>
            )}

            {!isLoading && alimentos.length === 0 && !error && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No se encontraron alimentos</h3>
                  <p className="text-muted-foreground mb-4">Intenta ajustar tus filtros o buscar con otros términos</p>
                  <Button onClick={limpiarFiltros} variant="outline">
                    Limpiar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}