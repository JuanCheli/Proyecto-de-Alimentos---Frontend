// src/lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Interfaz tal como viene desde el backend (nombres exactos del modelo SQLAlchemy)
 */
export interface AlimentoApi {
  codigomex2: number;
  nombre_del_alimento: string;
  energ_kcal?: number | null;
  carbohydrt?: number | null;
  lipid_tot?: number | null;
  protein?: number | null;
  fiber_td?: number | null;
  calcium?: number | null;
  iron?: number | null;
  ironhem?: number | null;
  ironnohem?: number | null;
  zinc?: number | null;
  vit_c?: number | null;
  thiamin?: number | null;
  riboflavin?: number | null;
  niacin?: number | null;
  panto_acid?: number | null;
  vit_b6?: number | null;
  folic_acid?: number | null;
  food_folate?: number | null;
  folate_dfe?: number | null;
  vit_b12?: number | null;
  vit_a_rae?: number | null;
  vit_e?: number | null;
  vit_d_iu?: number | null;
  vit_k?: number | null;
  fa_sat?: number | null;
  fa_mono?: number | null;
  fa_poly?: number | null;
  chole?: number | null;
}

/**
 * Interfaz que utiliza la UI (nombres amigables y consistentes)
 */
export interface Alimento {
  codigomex2: number;
  nombre: string;
  energ_kcal: number;
  carbohidratos_g: number;
  lipid_tot_g: number;
  protein_g: number;
  fiber_td_g: number;
  calcium_mg: number;
  iron_mg: number;
  ironhem_mg: number;
  ironnohem_mg: number;
  zinc_mg: number;
  vit_c_mg: number;
  thiamin_mg: number;
  riboflavin_mg: number;
  niacin_mg: number;
  panto_acid_mg: number;
  vit_b6_mg: number;
  folic_acid_mcg: number;
  food_folate_mcg: number;
  folate_dfe_mcg: number;
  vit_b12_mcg: number;
  vit_a_rae_mcg: number;
  vit_e_mg: number;
  vit_d_iu: number;
  vit_k_mcg: number;
  fa_sat_g: number;
  fa_mono_g: number;
  fa_poly_g: number;
  chole_mg: number;
}

/**
 * Filtros UI (corregidos para coincidir con la lógica de buscarAlimentos)
 */
export interface AlimentoFilter {
  nombre?: string;
  // Calorías
  calorias_min?: number;
  calorias_max?: number;
  // Carbohidratos
  carbohidratos_min?: number;
  carbohidratos_max?: number;
  // Proteínas
  proteinas_min?: number;
  proteinas_max?: number;
  // Lípidos/Grasas
  lipidos_min?: number;
  lipidos_max?: number;
  // Fibra
  fibra_min?: number;
  fibra_max?: number;
}

/** Otros tipos */
export interface Ingrediente {
  codigomex2: number;
  cantidad_g: number;
}

export interface RecetaRequest {
  ingredientes: Ingrediente[];
}

export interface AskRequest {
  question: string;
  max_results?: number;
}

/** Mapeo de API -> UI */
function mapApiAlimentoToUi(a: AlimentoApi): Alimento {
  return {
    codigomex2: a.codigomex2,
    nombre: a.nombre_del_alimento ?? "Sin nombre",
    energ_kcal: Number(a.energ_kcal ?? 0),
    carbohidratos_g: Number(a.carbohydrt ?? 0),
    lipid_tot_g: Number(a.lipid_tot ?? 0),
    protein_g: Number(a.protein ?? 0),
    fiber_td_g: Number(a.fiber_td ?? 0),
    calcium_mg: Number(a.calcium ?? 0),
    iron_mg: Number(a.iron ?? 0),
    ironhem_mg: Number(a.ironhem ?? 0),
    ironnohem_mg: Number(a.ironnohem ?? 0),
    zinc_mg: Number(a.zinc ?? 0),
    vit_c_mg: Number(a.vit_c ?? 0),
    thiamin_mg: Number(a.thiamin ?? 0),
    riboflavin_mg: Number(a.riboflavin ?? 0),
    niacin_mg: Number(a.niacin ?? 0),
    panto_acid_mg: Number(a.panto_acid ?? 0),
    vit_b6_mg: Number(a.vit_b6 ?? 0),
    folic_acid_mcg: Number(a.folic_acid ?? 0),
    food_folate_mcg: Number(a.food_folate ?? 0),
    folate_dfe_mcg: Number(a.folate_dfe ?? 0),
    vit_b12_mcg: Number(a.vit_b12 ?? 0),
    vit_a_rae_mcg: Number(a.vit_a_rae ?? 0),
    vit_e_mg: Number(a.vit_e ?? 0),
    vit_d_iu: Number(a.vit_d_iu ?? 0),
    vit_k_mcg: Number(a.vit_k ?? 0),
    fa_sat_g: Number(a.fa_sat ?? 0),
    fa_mono_g: Number(a.fa_mono ?? 0),
    fa_poly_g: Number(a.fa_poly ?? 0),
    chole_mg: Number(a.chole ?? 0),
  };
}

/** Helper request con manejo básico de errores */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const fetchOpts: RequestInit = { ...options };

  if (fetchOpts.body !== undefined) {
    fetchOpts.headers = {
      "Content-Type": "application/json",
      ...(fetchOpts.headers ?? {}),
    };
  }

  const res = await fetch(url, fetchOpts);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) return null as unknown as T;
  const data = await res.json();
  return data as T;
}

/** Servicio API */
export class ApiService {
  static async getAlimentos(limit = 100, offset = 0): Promise<Alimento[]> {
    const endpoint = `/alimentos?limit=${limit}&offset=${offset}`;
    const data = await request<AlimentoApi[]>(endpoint, { method: "GET" });
    if (!Array.isArray(data)) return [];
    return data.map(mapApiAlimentoToUi);
  }

  static async getAlimento(codigo: number): Promise<Alimento> {
    const data = await request<AlimentoApi>(`/alimento/${codigo}`, { method: "GET" });
    return mapApiAlimentoToUi(data);
  }

  /**
   * Buscar alimentos: mapea filtros UI -> keys backend
   */
  static async buscarAlimentos(filters: AlimentoFilter, limit = 100, offset = 0): Promise<Alimento[]> {
    const body: Record<string, any> = {};

    if (filters.nombre) body["nombre"] = filters.nombre;

    // calorías - CORREGIDO
    if (filters.calorias_min !== undefined) body["min_calorias"] = Number(filters.calorias_min);
    if (filters.calorias_max !== undefined) body["max_calorias"] = Number(filters.calorias_max);

    // carbohidratos - CORREGIDO
    if (filters.carbohidratos_min !== undefined) body["min_carbohidratos"] = Number(filters.carbohidratos_min);
    if (filters.carbohidratos_max !== undefined) body["max_carbohidratos"] = Number(filters.carbohidratos_max);

    // proteínas - CORREGIDO
    if (filters.proteinas_min !== undefined) body["min_proteina"] = Number(filters.proteinas_min);
    if (filters.proteinas_max !== undefined) body["max_proteina"] = Number(filters.proteinas_max);

    // lípidos / grasas - CORREGIDO
    if (filters.lipidos_min !== undefined) body["min_lipidos"] = Number(filters.lipidos_min);
    if (filters.lipidos_max !== undefined) body["max_lipidos"] = Number(filters.lipidos_max);

    // fibra - CORREGIDO
    if (filters.fibra_min !== undefined) body["min_fiber_td"] = Number(filters.fibra_min);
    if (filters.fibra_max !== undefined) body["max_fiber_td"] = Number(filters.fibra_max);

    const endpoint = `/buscar?limit=${limit}&offset=${offset}`;
    const data = await request<AlimentoApi[]>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!Array.isArray(data)) return [];
    return data.map(mapApiAlimentoToUi);
  }

  static async buscarAlimentosPorNombre(nombre: string, limit = 50, offset = 0): Promise<Alimento[]> {
    const params = new URLSearchParams({
      nombre,
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    const endpoint = `/buscar_alimento?${params.toString()}`;
    const data = await request<AlimentoApi[]>(endpoint, { method: "GET" });
    
    if (!Array.isArray(data)) return [];
    return data.map(mapApiAlimentoToUi);
  }

  static async crearAlimento(alimento: Partial<AlimentoApi>): Promise<Alimento> {
    const data = await request<AlimentoApi>("/alimento", {
      method: "POST",
      body: JSON.stringify(alimento),
    });
    return mapApiAlimentoToUi(data);
  }

  static async askIA(requestBody: AskRequest): Promise<any[]> {
    const data = await request<any[]>("/ask", {
      method: "POST",
      body: JSON.stringify(requestBody),
    });
    return data;
  }

  static async generarReceta(req: RecetaRequest): Promise<any> {
    const data = await request<any>("/receta", {
      method: "POST",
      body: JSON.stringify(req),
    });
    return data;
  }
}