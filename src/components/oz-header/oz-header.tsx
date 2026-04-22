import { Component, Prop, h, Host } from '@stencil/core';

@Component({
  tag: 'oz-header',
  styleUrl: 'oz-header.css',
  shadow: true,
})
export class OzHeader {
  @Prop() heading: string = 'Tableau de bord';
  @Prop() searchPlaceholder: string = 'Rechercher un ISIN, produit, client…';
  @Prop() notificationCount: number = 3;

  render() {
    return (
      <Host>
        <div class="header">
          <div class="title">{this.heading}</div>
          <div class="search">
            <oz-input size="sm" placeholder={this.searchPlaceholder}>
              <oz-icon slot="leading" name="search" size={14} />
            </oz-input>
          </div>
          <div class="spacer" />
          <slot name="actions">
            <oz-button variant="ghost" size="sm">
              <oz-icon slot="leading" name="bell" size={15} />
              <span class="badge">{this.notificationCount}</span>
            </oz-button>
            <oz-button variant="outline" size="sm">
              <oz-icon slot="leading" name="download" size={14} />
              Exporter
            </oz-button>
            <oz-button variant="primary" size="sm">
              <oz-icon slot="leading" name="plus" size={14} />
              Nouveau reporting
            </oz-button>
          </slot>
        </div>
      </Host>
    );
  }
}
