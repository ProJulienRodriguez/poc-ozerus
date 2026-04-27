import { Component, Prop, h, Host, Watch, State } from '@stencil/core';

export interface OzProductRow {
  isin: string;
  name: string;
  under: string;
  coupon: string;
  matur: string;
  prot: string;
  val: string;
  delta: string;
  tone: 'success' | 'danger' | 'neutral';
}

const DEFAULT_ROWS: OzProductRow[] = [
  { isin: 'FR0014001AB7', name: 'Autocall Eurostoxx Q3', under: 'SX5E', coupon: '8.25%', matur: '2029-06-14', prot: '50%', val: '102.34', delta: '+0.42%', tone: 'success' },
  { isin: 'FR0014009CD2', name: 'Phoenix Memoire 5Y', under: 'CAC 40', coupon: '9.10%', matur: '2028-11-02', prot: '60%', val: '97.18', delta: '-1.08%', tone: 'danger' },
  { isin: 'DE000SL3BK42', name: 'Athena Note SPX', under: 'SPX', coupon: '7.75%', matur: '2030-03-20', prot: '55%', val: '104.07', delta: '+0.11%', tone: 'success' },
  { isin: 'FR0014002EF8', name: 'Reverse Convertible', under: 'LVMH / SAN', coupon: '10.50%', matur: '2027-08-30', prot: '70%', val: '99.62', delta: '-0.05%', tone: 'neutral' },
  { isin: 'CH1234567AB9', name: 'Barrier Certificate', under: 'SMI', coupon: '6.40%', matur: '2028-01-15', prot: '65%', val: '101.55', delta: '+0.28%', tone: 'success' },
];

@Component({
  tag: 'oz-product-table',
  styleUrl: 'oz-product-table.css',
  shadow: true,
})
export class OzProductTable {
  @Prop() rows: OzProductRow[] | string = DEFAULT_ROWS;
  @Prop() compact: boolean = false;

  @State() private parsed: OzProductRow[] = DEFAULT_ROWS;

  componentWillLoad() { this.parseRows(this.rows); }

  @Watch('rows')
  onRowsChange(next: OzProductRow[] | string) { this.parseRows(next); }

  private parseRows(input: OzProductRow[] | string) {
    if (typeof input === 'string') {
      try { this.parsed = JSON.parse(input); } catch { this.parsed = DEFAULT_ROWS; }
    } else {
      this.parsed = Array.isArray(input) && input.length ? input : DEFAULT_ROWS;
    }
  }

  private deltaColor(tone: OzProductRow['tone']) {
    if (tone === 'danger') return 'var(--oz-danger)';
    if (tone === 'success') return 'var(--oz-forest)';
    return 'var(--oz-ink-3)';
  }

  render() {
    const headers = ['ISIN', 'Produit', 'Sous-jacent', 'Coupon', 'Maturité', 'Protection', 'Valorisation', ''];
    return (
      <Host>
        <div class={`wrap ${this.compact ? 'wrap--compact' : ''}`}>
          <table>
            <thead>
              <tr>
                {headers.map((label, i) => (
                  <th class={i >= 3 && i <= 6 ? 'th right' : 'th'}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {this.parsed.map((r, i) => (
                <tr class={i < this.parsed.length - 1 ? 'row row--sep' : 'row'}>
                  <td class="cell isin" data-label="ISIN">{r.isin}</td>
                  <td class="cell name" data-label="Produit">{r.name}</td>
                  <td class="cell" data-label="Sous-jacent"><oz-tag tone="navy" variant="outline">{r.under}</oz-tag></td>
                  <td class="cell right mono" data-label="Coupon">{r.coupon}</td>
                  <td class="cell right mono muted" data-label="Maturité">{r.matur}</td>
                  <td class="cell right mono muted" data-label="Protection">{r.prot}</td>
                  <td class="cell right" data-label="Valorisation">
                    <div class="val-group">
                      <span class="mono val">{r.val}</span>
                      <span class="mono delta" style={{ color: this.deltaColor(r.tone) }}>{r.delta}</span>
                    </div>
                  </td>
                  <td class="cell right chevron-cell">
                    <span class="chevron"><oz-icon name="arrow-right" size={14} /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Host>
    );
  }
}
