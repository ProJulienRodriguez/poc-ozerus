import { Component, Prop, h, Host, Watch, State } from '@stencil/core';

@Component({
  tag: 'oz-sparkline',
  shadow: true,
})
export class OzSparkline {
  @Prop() data: number[] | string = [];
  @Prop() w: number = 160;
  @Prop() h: number = 36;
  @Prop() color: string = 'var(--oz-forest)';

  @State() private parsed: number[] = [];

  componentWillLoad() { this.parseData(this.data); }

  @Watch('data')
  onDataChange(next: number[] | string) { this.parseData(next); }

  private parseData(input: number[] | string) {
    if (typeof input === 'string') {
      try { this.parsed = JSON.parse(input); } catch { this.parsed = []; }
    } else {
      this.parsed = Array.isArray(input) ? input : [];
    }
  }

  render() {
    const data = this.parsed;
    const width = this.w;
    const height = this.h;
    if (!data.length) {
      return <Host style={{ display: 'inline-block' }}><svg width={width} height={height} /></Host>;
    }
    const max = Math.max(...data);
    const min = Math.min(...data);
    const pad = 2;
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1 || 1)) * (width - pad * 2);
      const y = height - pad - ((v - min) / (max - min || 1)) * (height - pad * 2);
      return [x, y] as const;
    });
    const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    const area = `${path} L${pts[pts.length - 1][0]},${height} L${pts[0][0]},${height} Z`;
    return (
      <Host style={{ display: 'inline-block', lineHeight: '0' }}>
        <svg width={width} height={height}>
          <path d={area} fill={this.color} opacity="0.1" />
          <path d={path} fill="none" stroke={this.color} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
      </Host>
    );
  }
}
