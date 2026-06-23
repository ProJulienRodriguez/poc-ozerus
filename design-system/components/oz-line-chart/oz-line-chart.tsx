import { Component, Prop, h, Host, Watch, State } from '@stencil/core';

export interface OzSeries {
  data: number[];
  color: string;
  dashed?: boolean;
  fill?: boolean;
}

@Component({
  tag: 'oz-line-chart',
  shadow: true,
})
export class OzLineChart {
  @Prop() series: OzSeries[] | string = [];
  @Prop() yLabels: string[] | string = [];
  @Prop() w: number = 560;
  @Prop() h: number = 220;

  @State() private parsedSeries: OzSeries[] = [];
  @State() private parsedLabels: string[] = [];

  componentWillLoad() {
    this.parsedSeries = this.parse<OzSeries[]>(this.series, []);
    this.parsedLabels = this.parse<string[]>(this.yLabels, []);
  }

  @Watch('series')
  onSeriesChange(next: OzSeries[] | string) { this.parsedSeries = this.parse<OzSeries[]>(next, []); }

  @Watch('yLabels')
  onLabelsChange(next: string[] | string) { this.parsedLabels = this.parse<string[]>(next, []); }

  private parse<T>(input: T | string, fallback: T): T {
    if (typeof input === 'string') {
      try { return JSON.parse(input) as T; } catch { return fallback; }
    }
    return (input ?? fallback) as T;
  }

  render() {
    const series = this.parsedSeries;
    const yLabels = this.parsedLabels;
    const width = this.w;
    const height = this.h;
    const allVals = series.flatMap(s => s.data);
    if (allVals.length === 0) {
      return <Host style={{ display: 'block' }}><svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet" /></Host>;
    }
    const max = Math.max(...allVals);
    const min = Math.min(...allVals);
    const padL = 40, padR = 10, padT = 10, padB = 24;
    const iw = width - padL - padR;
    const ih = height - padT - padB;
    const project = (arr: number[]) => arr.map((v, i) => {
      const x = padL + (i / (arr.length - 1 || 1)) * iw;
      const y = padT + ih - ((v - min) / (max - min || 1)) * ih;
      return [x, y] as const;
    });

    return (
      <Host style={{ display: 'block' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible', display: 'block', width: '100%', height: 'auto' }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <g>
              <line
                x1={padL} x2={padL + iw}
                y1={padT + ih * t} y2={padT + ih * t}
                stroke="var(--oz-line)"
                stroke-dasharray={i === 0 || i === 4 ? '' : '2 3'}
              />
              <text
                x={padL - 8}
                y={padT + ih * t + 4}
                font-size="10"
                fill="var(--oz-ink-3)"
                text-anchor="end"
                font-family="var(--oz-font-mono)"
              >
                {(max - (max - min) * t).toFixed(0)}
              </text>
            </g>
          ))}
          {series.map(s => {
            const pts = project(s.data);
            const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
            const area = `${path} L${pts[pts.length - 1][0]},${padT + ih} L${pts[0][0]},${padT + ih} Z`;
            return (
              <g>
                {s.fill !== false && <path d={area} fill={s.color} opacity="0.08" />}
                <path
                  d={path}
                  fill="none"
                  stroke={s.color}
                  stroke-width="1.75"
                  stroke-linejoin="round"
                  stroke-linecap="round"
                  stroke-dasharray={s.dashed ? '4 3' : ''}
                />
              </g>
            );
          })}
          {yLabels.map((lbl, i) => (
            <text
              x={padL + (i / (yLabels.length - 1 || 1)) * iw}
              y={height - 6}
              font-size="10"
              fill="var(--oz-ink-3)"
              text-anchor="middle"
              font-family="var(--oz-font-mono)"
            >{lbl}</text>
          ))}
        </svg>
      </Host>
    );
  }
}
