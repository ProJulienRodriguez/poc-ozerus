import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type OzBase<T extends HTMLElement = HTMLElement> = DetailedHTMLProps<HTMLAttributes<T>, T> & Record<string, any>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'oz-button': OzBase;
      'oz-input': OzBase;
      'oz-tag': OzBase;
      'oz-avatar': OzBase;
      'oz-icon': OzBase;
      'oz-card': OzBase;
      'oz-kpi': OzBase;
      'oz-sparkline': OzBase;
      'oz-line-chart': OzBase;
      'oz-swatch': OzBase;
      'oz-product-table': OzBase;
      'oz-sidebar': OzBase;
      'oz-header': OzBase;
      'oz-event-row': OzBase;
      'oz-empty-state': OzBase;
    }
  }
}

export {};
