/* Base minimale pour les value objects du module communication : props gelées +
   validation à la construction. Calquée sur la convention du module identity
   (objets immuables validés à la création), mais factorisée car le mailing en a
   plusieurs très semblables. */
export abstract class ValueObject<T extends object> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze({ ...props });
    this.validate();
  }

  protected abstract validate(): void;

  equals(other?: ValueObject<T>): boolean {
    if (!other) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}
