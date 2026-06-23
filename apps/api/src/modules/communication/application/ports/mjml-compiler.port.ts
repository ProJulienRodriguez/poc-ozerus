export const MJML_COMPILER_PORT = Symbol('MJML_COMPILER_PORT');

export interface MjmlCompilerPort {
  compile(mjml: string): Promise<string>;
}
