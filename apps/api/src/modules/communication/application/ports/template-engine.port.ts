export const TEMPLATE_ENGINE_PORT = Symbol('TEMPLATE_ENGINE_PORT');

export interface TemplateEnginePort {
  render(
    template: string,
    variables: Record<string, string | number | boolean>,
    engineVersion: number,
  ): string;
}
