import { useEffect, useMemo, useRef, useState } from 'react';
import {
  solveCircuit,
  solveLogicCircuit,
  type CircuitDocument,
  type LogicSimulationResult,
  type SimulationResult,
  type SolveOptions,
} from '@kimovolt/simulation';
import type { WorkerSolveResponse } from '../workers/simulation.worker';

export function useSimulation(doc: CircuitDocument, options: SolveOptions = {}) {
  const strictGround = Boolean(options.strictGround);
  const sandboxMode = Boolean(options.sandboxMode);

  // Instant synchronous initial solve so first paint is never blank or delayed
  const initialSim = useMemo(() => solveCircuit(doc, { strictGround, sandboxMode }), []);
  const [sim, setSim] = useState<SimulationResult>(initialSim);
  const [logicSim, setLogicSim] = useState<LogicSimulationResult | null>(() => {
    const hasLogic = doc.components.some(
      (c) => c.type === 'logic_input' || c.type === 'logic_gate' || c.type === 'logic_output'
    );
    return hasLogic ? solveLogicCircuit(doc) : null;
  });

  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    try {
      const worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = (event: MessageEvent<WorkerSolveResponse>) => {
        if (event.data.requestId === reqIdRef.current) {
          setSim(event.data.sim);
          setLogicSim(event.data.logicSim);
        }
      };
      workerRef.current = worker;
      return () => {
        worker.terminate();
        workerRef.current = null;
      };
    } catch {
      workerRef.current = null;
      return undefined;
    }
  }, []);

  useEffect(() => {
    const nextId = ++reqIdRef.current;
    if (workerRef.current) {
      workerRef.current.postMessage({
        requestId: nextId,
        doc,
        options: { strictGround, sandboxMode },
      });
    } else {
      setSim(solveCircuit(doc, { strictGround, sandboxMode }));
      const hasLogic = doc.components.some(
        (c) => c.type === 'logic_input' || c.type === 'logic_gate' || c.type === 'logic_output'
      );
      setLogicSim(hasLogic ? solveLogicCircuit(doc) : null);
    }
  }, [doc, strictGround, sandboxMode]);

  return { sim, logicSim };
}
