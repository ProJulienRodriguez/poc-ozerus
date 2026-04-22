import { Component, Prop, h, Host, Event, EventEmitter } from '@stencil/core';

export type OzInputSize = 'sm' | 'md' | 'lg';

@Component({
  tag: 'oz-input',
  styleUrl: 'oz-input.css',
  shadow: true,
})
export class OzInput {
  @Prop() label?: string;
  @Prop() placeholder?: string;
  @Prop({ mutable: true }) value: string = '';
  @Prop() hint?: string;
  @Prop() error: boolean = false;
  @Prop() size: OzInputSize = 'md';
  @Prop() type: string = 'text';
  @Prop() disabled: boolean = false;

  @Event() ozInput!: EventEmitter<string>;
  @Event() ozChange!: EventEmitter<string>;

  private onInput = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.value = target.value;
    this.ozInput.emit(this.value);
  };

  private onChange = (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    this.ozChange.emit(target.value);
  };

  render() {
    return (
      <Host>
        <label class="wrap">
          {this.label && <div class="oz-micro label">{this.label}</div>}
          <div class={`field field--${this.size} ${this.error ? 'field--error' : ''} ${this.disabled ? 'field--disabled' : ''}`}>
            <span class="adorn leading"><slot name="leading" /></span>
            <input
              class="input"
              type={this.type}
              placeholder={this.placeholder}
              value={this.value}
              disabled={this.disabled}
              onInput={this.onInput}
              onChange={this.onChange}
            />
            <span class="adorn trailing"><slot name="trailing" /></span>
          </div>
          {this.hint && <div class={`hint ${this.error ? 'hint--error' : ''}`}>{this.hint}</div>}
        </label>
      </Host>
    );
  }
}
