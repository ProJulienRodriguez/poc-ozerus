import { Component, Prop, h, Host } from '@stencil/core';

@Component({
  tag: 'oz-swatch',
  styleUrl: 'oz-swatch.css',
  shadow: true,
})
export class OzSwatch {
  @Prop() name: string = '';
  @Prop() value: string = '';
  @Prop() label?: string;
  @Prop() fg: string = 'var(--oz-ink)';
  @Prop() w: number = 132;
  @Prop() h: number = 84;

  render() {
    return (
      <Host style={{ width: `${this.w}px`, flexShrink: '0', display: 'inline-block' }}>
        <div
          class="chip"
          style={{ background: this.value, height: `${this.h}px`, color: this.fg }}
        >
          {this.value}
        </div>
        <div class="meta">
          <div class="name">{this.name}</div>
          {this.label && <div class="label">{this.label}</div>}
        </div>
      </Host>
    );
  }
}
