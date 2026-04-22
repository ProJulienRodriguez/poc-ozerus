import { Component, Prop, h, Host } from '@stencil/core';
import type { OzIconName } from '../oz-icon/oz-icon';

interface NavItem { id: string; icon: OzIconName; label: string; }

const NAV: NavItem[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Tableau de bord' },
  { id: 'products', icon: 'products', label: 'Offre produits' },
  { id: 'portfolio', icon: 'portfolio', label: 'Portefeuilles' },
  { id: 'reporting', icon: 'reporting', label: 'Reporting' },
  { id: 'doc', icon: 'doc', label: 'Documents' },
  { id: 'calendar', icon: 'calendar', label: 'Événements' },
];

const ADMIN: NavItem[] = [
  { id: 'users', icon: 'users', label: 'Utilisateurs' },
  { id: 'settings', icon: 'settings', label: 'Paramètres' },
];

@Component({
  tag: 'oz-sidebar',
  styleUrl: 'oz-sidebar.css',
  shadow: true,
})
export class OzSidebar {
  @Prop() active: string = 'dashboard';
  @Prop() user: string = 'Marie Laurent';
  @Prop() org: string = 'Cabinet Helios';

  private renderItem(it: NavItem) {
    const on = it.id === this.active;
    return (
      <div class={`item ${on ? 'item--active' : ''}`}>
        <oz-icon name={it.icon} size={15} />
        <span>{it.label}</span>
      </div>
    );
  }

  render() {
    return (
      <Host>
        <aside class="aside">
          <div class="brand">
            <span class="brand-name">Ozerus</span>
            <oz-tag tone="forest" variant="soft">extranet</oz-tag>
          </div>
          <div class="group">
            <div class="oz-micro group-label">Espace partenaire</div>
            <div class="group-list">{NAV.map(it => this.renderItem(it))}</div>
          </div>
          <div class="group">
            <div class="oz-micro group-label">Administration</div>
            <div class="group-list">{ADMIN.map(it => this.renderItem(it))}</div>
          </div>
          <div class="user-card">
            <oz-avatar name={this.user} size={32} tone="navy" />
            <div class="user-info">
              <div class="user-name">{this.user}</div>
              <div class="user-org">{this.org}</div>
            </div>
            <oz-icon name="more" size={16} color="var(--oz-ink-3)" />
          </div>
        </aside>
      </Host>
    );
  }
}
