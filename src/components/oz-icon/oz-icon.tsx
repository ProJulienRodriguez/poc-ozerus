import { Component, Prop, h, Host } from '@stencil/core';

export type OzIconName =
  | 'dashboard' | 'products' | 'portfolio' | 'reporting' | 'doc' | 'calendar'
  | 'bell' | 'search' | 'filter' | 'plus' | 'arrow-down' | 'arrow-right'
  | 'check' | 'x' | 'download' | 'settings' | 'users' | 'logout' | 'more'
  | 'trend-up' | 'trend-down' | 'upload' | 'shield';

const PATHS: Record<string, string> = {
  'dashboard': 'M3 3h7v8H3V3zm0 10h7v8H3v-8zm10-10h8v5h-8V3zm0 7h8v11h-8V10z',
  'products': 'M12 2l9 5v10l-9 5-9-5V7l9-5zM3 7l9 5 9-5M12 12v10',
  'portfolio': 'M3 4h18v4H3zM3 12h18v4H3zM3 20h12v1H3z',
  'reporting': 'M4 20V6l8-3 8 3v14M8 14v4M12 10v8M16 13v5',
  'doc': 'M6 2h9l5 5v15H6V2zM15 2v5h5',
  'calendar': 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  'bell': 'M6 16V11a6 6 0 1 1 12 0v5l2 3H4l2-3zM10 21h4',
  'search': 'M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm6-2l5 5',
  'filter': 'M3 4h18l-7 9v6l-4 2v-8L3 4z',
  'plus': 'M12 4v16M4 12h16',
  'arrow-down': 'M6 9l6 6 6-6',
  'arrow-right': 'M9 6l6 6-6 6',
  'check': 'M4 12l5 5L20 6',
  'x': 'M6 6l12 12M18 6L6 18',
  'download': 'M12 3v14m0 0l-5-5m5 5l5-5M4 21h16',
  'settings': 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 4a8.94 8.94 0 0 1-.23 2l2.1 1.65-2 3.46-2.49-1a8.96 8.96 0 0 1-3.46 2l-.38 2.65h-4l-.38-2.65a8.96 8.96 0 0 1-3.46-2l-2.49 1-2-3.46L3.3 14a8.94 8.94 0 0 1 0-4l-2.1-1.65 2-3.46 2.49 1a8.96 8.96 0 0 1 3.46-2L9.53 0h4l.38 2.65a8.96 8.96 0 0 1 3.46 2l2.49-1 2 3.46L19.7 10a8.94 8.94 0 0 1 .24 2z',
  'users': 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM1 21a8 8 0 0 1 16 0M17 11a4 4 0 0 0 0-8M23 21a8 8 0 0 0-4-7',
  'logout': 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  'more': 'M5 12h.01M12 12h.01M19 12h.01',
  'trend-up': 'M3 17l6-6 4 4 8-8M14 7h7v7',
  'trend-down': 'M3 7l6 6 4-4 8 8M14 17h7v-7',
  'upload': 'M12 21V5m0 0l-5 5m5-5l5 5M4 3h16',
  'shield': 'M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z',
};

@Component({
  tag: 'oz-icon',
  shadow: true,
})
export class OzIcon {
  @Prop() name: OzIconName = 'dashboard';
  @Prop() size: number = 16;
  @Prop() color: string = 'currentColor';
  @Prop() strokeWidth: number = 1.6;

  render() {
    const d = PATHS[this.name] || PATHS['dashboard'];
    return (
      <Host style={{ display: 'inline-flex', verticalAlign: 'middle', flexShrink: '0', lineHeight: '0' }}>
        <svg
          width={this.size}
          height={this.size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={this.color}
          stroke-width={this.strokeWidth}
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d={d} />
        </svg>
      </Host>
    );
  }
}
