import type { HistorialEjercicioFila } from "@/services/entrenamientos/entrenamientosService";

/** Un punto por sesión (entreno finalizado) */
export type PuntoEvolucionEjercicio = {
  entrenamientoId: number;
  fecha: string;
  /** Peso máximo movido en alguna serie de esa sesión */
  maxPeso: number;
  /** Suma de reps × kg de todas las series de ese ejercicio en la sesión */
  volumenTotal: number;
  /** Repeticiones de la serie con mayor peso (si empate, la de más reps) */
  repsEnSerieMasPesada: number;
};

function parseFecha(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Agrupa el historial plano en una serie temporal por entreno.
 * Convención habitual en fuerza: comparar sesiones por peso máximo, volumen o “mejor serie”.
 */
export function puntosEvolucionPorSesion(rows: HistorialEjercicioFila[]): PuntoEvolucionEjercicio[] {
  const byEntreno = new Map<number, HistorialEjercicioFila[]>();
  const orden: number[] = [];

  for (const r of rows) {
    if (!byEntreno.has(r.entrenamientoId)) {
      byEntreno.set(r.entrenamientoId, []);
      orden.push(r.entrenamientoId);
    }
    byEntreno.get(r.entrenamientoId)!.push(r);
  }

  const puntos: PuntoEvolucionEjercicio[] = [];

  for (const eid of orden) {
    const series = byEntreno.get(eid)!;
    const fecha = series[0].fecha;
    let maxPeso = 0;
    let volumenTotal = 0;
    let repsEnSerieMasPesada = 0;

    for (const s of series) {
      const w = Number(s.peso);
      const reps = Number(s.reps);
      const pesoOk = Number.isFinite(w) && w >= 0;
      const repsOk = Number.isFinite(reps) && reps > 0;
      if (pesoOk && repsOk) {
        volumenTotal += reps * w;
      }
      if (pesoOk && w > maxPeso) {
        maxPeso = w;
        repsEnSerieMasPesada = repsOk ? reps : 0;
      } else if (pesoOk && w === maxPeso && repsOk && reps > repsEnSerieMasPesada) {
        repsEnSerieMasPesada = reps;
      }
    }

    puntos.push({
      entrenamientoId: eid,
      fecha,
      maxPeso,
      volumenTotal,
      repsEnSerieMasPesada,
    });
  }

  puntos.sort((a, b) => parseFecha(a.fecha, b.fecha));
  return puntos;
}

export type MetricaEvolucion = "maxPeso" | "volumen" | "repsMejorSerie";

export function valorMetrica(p: PuntoEvolucionEjercicio, m: MetricaEvolucion): number {
  switch (m) {
    case "maxPeso":
      return p.maxPeso;
    case "volumen":
      return p.volumenTotal;
    case "repsMejorSerie":
      return p.repsEnSerieMasPesada;
    default:
      return 0;
  }
}

export function etiquetaMetrica(m: MetricaEvolucion): string {
  switch (m) {
    case "maxPeso":
      return "Peso máx. (kg)";
    case "volumen":
      return "Volumen (kg × reps)";
    case "repsMejorSerie":
      return "Reps (serie más pesada)";
    default:
      return "";
  }
}
