import { Component, Prop, h, Host, Element } from '@stencil/core';

export type OzButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'soft' | 'danger';
export type OzButtonSize = 'sm' | 'md' | 'lg';

@Component({
  tag: 'oz-button',
  styleUrl: 'oz-button.css',
  shadow: true,
})
export class OzButton {
  @Element() hostEl!: HTMLElement;

  @Prop() variant: OzButtonVariant = 'primary';
  @Prop() size: OzButtonSize = 'md';
  @Prop() disabled: boolean = false;
  @Prop() type: 'button' | 'submit' | 'reset' = 'button';

  private onHostClick = (ev: MouseEvent) => {
    if (this.disabled) {
      ev.stopImmediatePropagation();
      ev.preventDefault();
      return;
    }
    if (this.type !== 'submit' && this.type !== 'reset') return;
    const form = this.hostEl.closest('form');
    if (!form) return;
    if (this.type === 'submit') {
      if (typeof (form as any).requestSubmit === 'function') {
        (form as any).requestSubmit();
      } else {
        form.submit();
      }
    } else {
      form.reset();
    }
  };

  render() {
    return (
      <Host onClick={this.onHostClick}>
        <button
          type={this.type}
          disabled={this.disabled}
          class={`btn btn--${this.variant} btn--${this.size}`}
        >
          <slot name="leading" />
          <span class="label"><slot /></span>
          <slot name="trailing" />
        </button>
      </Host>
    );
  }
}
