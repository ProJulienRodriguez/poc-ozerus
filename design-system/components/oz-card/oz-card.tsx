import { Component, Prop, h, Host } from '@stencil/core';

export type OzCardPadding = 'none' | 'sm' | 'md' | 'lg';
export type OzCardTone = 'default' | 'cream' | 'sand' | 'navy';
export type OzCardBorder = 'solid' | 'dashed' | 'none';

@Component({
  tag: 'oz-card',
  styleUrl: 'oz-card.css',
  shadow: true,
})
export class OzCard {
  @Prop() heading?: string;
  @Prop() subheading?: string;
  @Prop() padding: OzCardPadding = 'md';
  @Prop() tone: OzCardTone = 'default';
  @Prop() border: OzCardBorder = 'solid';
  @Prop() interactive: boolean = false;
  @Prop() elevated: boolean = false;

  render() {
    const hasHeader = !!this.heading || !!this.subheading;
    return (
      <Host>
        <div
          class={{
            card: true,
            [`card--p-${this.padding}`]: true,
            [`card--tone-${this.tone}`]: true,
            [`card--border-${this.border}`]: true,
            'card--interactive': this.interactive,
            'card--elevated': this.elevated,
          }}
        >
          {hasHeader && (
            <div class="head">
              <div class="head-start"><slot name="head-start" /></div>
              <div class="titles">
                {this.heading && <div class="heading">{this.heading}</div>}
                {this.subheading && <div class="sub">{this.subheading}</div>}
              </div>
              <div class="head-end"><slot name="head-end" /></div>
            </div>
          )}
          <div class="body"><slot /></div>
          <div class="foot"><slot name="footer" /></div>
        </div>
      </Host>
    );
  }
}
