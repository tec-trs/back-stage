type Factory<T> = () => T;

export class Container {
  private readonly factories = new Map<string, Factory<unknown>>();
  private readonly singletons = new Map<string, unknown>();

  public register<T>(token: string, factory: Factory<T>): void {
    this.factories.set(token, factory as Factory<unknown>);
  }

  public resolve<T>(token: string): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token) as T;
    }

    const factory = this.factories.get(token);
    if (!factory) {
      throw new Error(`Nenhuma dependencia registrada para o token: ${token}`);
    }

    const instance = factory() as T;
    this.singletons.set(token, instance);
    return instance;
  }
}

export const container = new Container();
