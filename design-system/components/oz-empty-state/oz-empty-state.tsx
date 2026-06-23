import { Component, Prop, h, Host } from '@stencil/core';
import type { OzIconName } from '../oz-icon/oz-icon';

@Component({
  tag: 'oz-empty-state',
  styleUrl: 'oz-empty-state.css',
  shadow: true,
})
export class OzEmptyState {
  @Prop() icon: OzIconName = 'doc';
  @Prop() heading: string = '';
  @Prop() body?: string;

  render() {
    return (
      <Host>
        <div class="wrap">
          <div class="icon">
            <oz-icon name={this.icon} size={20} color="var(--oz-ink-3)" />
          </div>
          <div class="text">
            <div class="title">{this.heading}</div>
            {this.body && <div class="body">{this.body}</div>}
          </div>
          <div class="action"><slot name="action" /></div>
        </div>
      </Host>
    );
  }
}
