// Layout commun des emails Ozerus — inliné ici plutôt que dans une lib
// dédiée. Le footer utilise les variables mustache appName / supportEmail / currentYear.

export const EMAIL_COLORS = {
  bgPage: '#f4f5f7',
  bgCard: '#ffffff',
  textHeading: '#111827',
  textBody: '#374151',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  primary: '#E2231A',
} as const;

export function wrapEmailMjml(innerContent: string): string {
  return `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Helvetica, Arial, sans-serif" />
      <mj-text font-size="16px" line-height="24px" color="${EMAIL_COLORS.textBody}" />
      <mj-button background-color="${EMAIL_COLORS.primary}" color="#ffffff" border-radius="6px" font-weight="600" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="${EMAIL_COLORS.bgPage}">
    <mj-spacer height="32px" />
    <mj-section background-color="${EMAIL_COLORS.bgCard}" border-radius="8px" padding="32px">
      <mj-column>
${innerContent}
      </mj-column>
    </mj-section>
    <mj-section padding="16px 0">
      <mj-column>
        <mj-text align="center" font-size="12px" color="${EMAIL_COLORS.textFaint}">
          &copy; {{currentYear}} {{appName}} — <a href="mailto:{{supportEmail}}" style="color:${EMAIL_COLORS.textFaint};">{{supportEmail}}</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
