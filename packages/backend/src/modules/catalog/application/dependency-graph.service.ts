import type {
  DependencyGraph,
  IDependencyGraphRepository,
} from '../infrastructure/dependency-graph.repository.js';

export class DependencyGraphService {
  public constructor(private readonly dependencyGraphRepository: IDependencyGraphRepository) {}

  public async getGraph(): Promise<DependencyGraph> {
    return this.dependencyGraphRepository.getGraph();
  }
}
