import { Component, Prop, h, Host } from '@stencil/core';

export type OzTagTone = 'neutral' | 'forest' | 'navy' | 'ochre' | 'success' | 'warn' | 'danger';
export type OzTagVariant = 'soft' | 'solid' | 'outline';

@Component({
  tag: 'oz-tag',
  styleUrl: 'oz-tag.css',
  shadow: true,
})
export class OzTag {
  @Prop() tone: OzTagTone = 'neutral';
  @Prop() variant: OzTagVariant = 'soft';

  render() {
    return (
      <Host>
        <span class={`tag tag--${this.tone} tag--${this.variant}`}>
          <span class="leading"><slot name="leading" /></span>
          <slot />
        </span>
      </Host>
    );
  }
}
