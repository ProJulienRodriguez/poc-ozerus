import { Component, Prop, h, Host } from '@stencil/core';

export type OzAvatarTone = 'forest' | 'navy' | 'mist' | 'ochre' | 'sand';

const TONES: Record<OzAvatarTone, { bg: string; fg: string }> = {
  forest: { bg: 'var(--oz-forest)', fg: '#FAF7F2' },
  navy: { bg: 'var(--oz-navy)', fg: '#FAF7F2' },
  mist: { bg: 'var(--oz-mist)', fg: 'var(--oz-navy)' },
  ochre: { bg: 'var(--oz-ochre)', fg: 'var(--oz-ink)' },
  sand: { bg: 'var(--oz-line-2)', fg: 'var(--oz-ink-2)' },
};

@Component({
  tag: 'oz-avatar',
  styleUrl: 'oz-avatar.css',
  shadow: true,
})
export class OzAvatar {
  @Prop() name: string = '';
  @Prop() size: number = 32;
  @Prop() tone: OzAvatarTone = 'forest';

  private initials() {
    return this.name
      .split(' ')
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  render() {
    const t = TONES[this.tone] || TONES.forest;
    const style = {
      width: `${this.size}px`,
      height: `${this.size}px`,
      background: t.bg,
      color: t.fg,
      fontSize: `${this.size * 0.38}px`,
    };
    return (
      <Host>
        <div class="avatar" style={style}>{this.initials()}</div>
      </Host>
    );
  }
}
