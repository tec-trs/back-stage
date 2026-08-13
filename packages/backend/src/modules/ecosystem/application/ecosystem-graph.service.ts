import type {
  EcosystemGraph,
  IEcosystemGraphRepository,
} from '../infrastructure/ecosystem-graph.repository.js';

export class EcosystemGraphService {
  public constructor(private readonly ecosystemGraphRepository: IEcosystemGraphRepository) {}

  public async getGraph(): Promise<EcosystemGraph> {
    return this.ecosystemGraphRepository.getGraph();
  }
}
