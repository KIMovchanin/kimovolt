import {
  solveCircuit,
  solveLogicCircuit,
  type CircuitDocument,
  type LogicSimulationResult,
  type SimulationResult,
  type SolveOptions,
} from '@kimovolt/simulation';

export interface WorkerSolveRequest {
  requestId: number;
  doc: CircuitDocument;
  options?: SolveOptions;
}

export interface WorkerSolveResponse {
  requestId: number;
  sim: SimulationResult;
  logicSim: LogicSimulationResult | null;
}

self.onmessage = (event: MessageEvent<WorkerSolveRequest>) => {
  const { requestId, doc, options } = event.data;
  const sim = solveCircuit(doc, options);
  const hasLogic = doc.components.some(
    (c) => c.type === 'logic_input' || c.type === 'logic_gate' || c.type === 'logic_output'
  );
  const logicSim = hasLogic ? solveLogicCircuit(doc) : null;
  const response: WorkerSolveResponse = { requestId, sim, logicSim };
  self.postMessage(response);
};
