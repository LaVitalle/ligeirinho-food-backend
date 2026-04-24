export function buildBaseEmail(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F3F4F6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <tr>
              <td style="background:linear-gradient(90deg,#F97316 0%,#EA580C 100%);padding:32px 24px;text-align:center;">
                <h1 style="margin:0;color:#FFFFFF;font-size:28px;font-weight:700;letter-spacing:0.5px;">Ligeirinho Food</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px 32px;color:#111827;">
                <h2 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#111827;">${title}</h2>
                ${contentHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;color:#6B7280;font-size:12px;text-align:center;border-top:1px solid #E5E7EB;">
                <p style="margin:16px 0 0 0;">Equipe Ligeirinho Food &middot; Esta mensagem foi gerada automaticamente.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildPasswordRecoveryEmail(code: string): string {
  const content = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;">
      Recebemos uma solicitação para redefinir a sua senha. Use o código abaixo para continuar o processo. Este código é válido por <strong>15 minutos</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td align="center">
          <div style="display:inline-block;padding:16px 32px;background-color:#FFF7ED;border:2px dashed #F97316;border-radius:12px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#EA580C;font-family:'Courier New',monospace;">${code}</span>
          </div>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px 0;font-size:14px;color:#6B7280;">
      Se você não solicitou a redefinição de senha, pode ignorar este email com segurança — nenhuma alteração será feita na sua conta.
    </p>
  `;
  return buildBaseEmail("Seu código de recuperação", content);
}
