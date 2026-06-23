import { Component, Prop, h, Host } from '@stencil/core';
import type { OzTagTone } from '../oz-tag/oz-tag';

@Component({
  tag: 'oz-event-row',
  styleUrl: 'oz-event-row.css',
  shadow: true,
})
export class OzEventRow {
  @Prop() dateMonth: string = '';
  @Prop() dateDay: string = '';
  @Prop() kind: string = '';
  @Prop() product: string = '';
  @Prop() amount: string = '';
  @Prop() tone: OzTagTone = 'forest';

  render() {
    return (
      <Host>
        <div class="row">
          <div class="date">
            <div class="oz-micro date-m">{this.dateMonth}</div>
            <div class="date-d">{this.dateDay}</div>
          </div>
          <div class={`bar bar--${this.tone}`} />
          <div class="content">
            <div class="head">
              <oz-tag tone={this.tone} variant="soft">{this.kind}</oz-tag>
              <span class="product">{this.product}</span>
            </div>
            <div class="amount oz-mono">{this.amount}</div>
          </div>
          <oz-icon name="arrow-right" size={14} color="var(--oz-ink-4)" />
        </div>
      </Host>
    );
  }
}
