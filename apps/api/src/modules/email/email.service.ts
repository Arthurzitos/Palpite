import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly provider: string;
  private readonly adminEmail: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get<string>('EMAIL_PROVIDER') || 'console';
    this.adminEmail = this.configService.get<string>('ADMIN_EMAIL') || '';
  }

  private async send(options: EmailOptions): Promise<void> {
    if (this.provider === 'console') {
      this.logger.log(`[EMAIL] To: ${options.to}`);
      this.logger.log(`[EMAIL] Subject: ${options.subject}`);
      this.logger.log(`[EMAIL] Body: ${options.text || options.html}`);
      return;
    }

    // In the future, implement actual email sending here
    // For now, just log
    this.logger.log(`Would send email to ${options.to}: ${options.subject}`);
  }

  async sendWithdrawalRequested(email: string, amount: number): Promise<void> {
    const subject = 'Solicitacao de Saque Recebida';
    const html = `
      <h2>Solicitacao de Saque</h2>
      <p>Sua solicitacao de saque de <strong>$${amount.toFixed(2)}</strong> foi recebida e esta em analise.</p>
      <p>Voce sera notificado quando for processada. Tempo medio: 24 horas.</p>
      <br>
      <p>Atenciosamente,<br>Equipe Palpite Market</p>
    `;

    await this.send({
      to: email,
      subject,
      html,
      text: `Sua solicitacao de saque de $${amount.toFixed(2)} foi recebida e esta em analise.`,
    });
  }

  async sendWithdrawalApproved(email: string, amount: number): Promise<void> {
    const subject = 'Saque Aprovado';
    const html = `
      <h2>Saque Aprovado</h2>
      <p>Seu saque de <strong>$${amount.toFixed(2)}</strong> foi aprovado e esta sendo processado.</p>
      <p>Voce recebera uma confirmacao quando a transacao for concluida.</p>
      <br>
      <p>Atenciosamente,<br>Equipe Palpite Market</p>
    `;

    await this.send({
      to: email,
      subject,
      html,
      text: `Seu saque de $${amount.toFixed(2)} foi aprovado e esta sendo processado.`,
    });
  }

  async sendWithdrawalRejected(email: string, amount: number, reason: string): Promise<void> {
    const subject = 'Saque Rejeitado';
    const html = `
      <h2>Saque Rejeitado</h2>
      <p>Seu saque de <strong>$${amount.toFixed(2)}</strong> foi rejeitado.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>O valor permanece disponivel em sua conta. Se tiver duvidas, entre em contato conosco.</p>
      <br>
      <p>Atenciosamente,<br>Equipe Palpite Market</p>
    `;

    await this.send({
      to: email,
      subject,
      html,
      text: `Seu saque de $${amount.toFixed(2)} foi rejeitado. Motivo: ${reason}`,
    });
  }

  async sendWithdrawalCompleted(email: string, amount: number, txHash?: string): Promise<void> {
    const subject = 'Saque Concluido';
    const txInfo = txHash ? `<p><strong>Hash da transacao:</strong> ${txHash}</p>` : '';
    const html = `
      <h2>Saque Concluido</h2>
      <p>Seu saque de <strong>$${amount.toFixed(2)}</strong> foi enviado com sucesso!</p>
      ${txInfo}
      <br>
      <p>Atenciosamente,<br>Equipe Palpite Market</p>
    `;

    await this.send({
      to: email,
      subject,
      html,
      text: `Seu saque de $${amount.toFixed(2)} foi enviado com sucesso!${txHash ? ` TxHash: ${txHash}` : ''}`,
    });
  }

  async sendAdminNewWithdrawal(amount: number, username: string): Promise<void> {
    if (!this.adminEmail) {
      this.logger.warn('No admin email configured, skipping notification');
      return;
    }

    const subject = `Nova Solicitacao de Saque: $${amount.toFixed(2)}`;
    const html = `
      <h2>Nova Solicitacao de Saque</h2>
      <p>Uma nova solicitacao de saque foi recebida:</p>
      <ul>
        <li><strong>Usuario:</strong> ${username}</li>
        <li><strong>Valor:</strong> $${amount.toFixed(2)}</li>
      </ul>
      <p>Acesse o painel de administracao para revisar.</p>
    `;

    await this.send({
      to: this.adminEmail,
      subject,
      html,
      text: `Nova solicitacao de saque de $${amount.toFixed(2)} do usuario ${username}.`,
    });
  }

  async sendWithdrawalCancelled(email: string, amount: number): Promise<void> {
    const subject = 'Saque Cancelado';
    const html = `
      <h2>Saque Cancelado</h2>
      <p>Sua solicitacao de saque de <strong>$${amount.toFixed(2)}</strong> foi cancelada conforme solicitado.</p>
      <p>O valor permanece disponivel em sua conta.</p>
      <br>
      <p>Atenciosamente,<br>Equipe Palpite Market</p>
    `;

    await this.send({
      to: email,
      subject,
      html,
      text: `Sua solicitacao de saque de $${amount.toFixed(2)} foi cancelada conforme solicitado.`,
    });
  }
}
