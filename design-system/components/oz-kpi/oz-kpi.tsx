import { Component, Prop, h, Host } from '@stencil/core';
import type { OzTagTone } from '../oz-tag/oz-tag';

@Component({
  tag: 'oz-kpi',
  styleUrl: 'oz-kpi.css',
  shadow: true,
})
export class OzKPI {
  @Prop() label: string = '';
  @Prop() value: string = '';
  @Prop() unit?: string;
  @Prop() delta?: string;
  @Prop() deltaTone: OzTagTone = 'success';
  @Prop() sub?: string;

  render() {
    const trendIcon = this.deltaTone === 'success' ? 'trend-up' : 'trend-down';
    return (
      <Host>
        <div class="card">
          <div class="oz-micro label">{this.label}</div>
          <div class="value-row">
            <span class="oz-mono value">{this.value}</span>
            {this.unit && <span class="unit">{this.unit}</span>}
          </div>
          <div class="meta-row">
            {this.delta && (
              <oz-tag tone={this.deltaTone} variant="soft">
                <oz-icon slot="leading" name={trendIcon} size={11} />
                {this.delta}
              </oz-tag>
            )}
            {this.sub && <span class="sub">{this.sub}</span>}
          </div>
          <div class="chart"><slot name="chart" /></div>
        </div>
      </Host>
    );
  }
}
