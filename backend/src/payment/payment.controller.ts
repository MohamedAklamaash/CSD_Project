// payment.controller.ts
import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UserDecorator } from 'src/decorator';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/guards';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) { }

  @Post()
  @UseGuards(JwtGuard)
  async createPayment(
    @Body() body: { bookingId: string; amount: number; transactionId: string },
    @UserDecorator() usr: User
  ) {
    return this.paymentService.createPayment(
      body.bookingId,
      usr.id,
      body.amount,
      body.transactionId
    );
  }

  @Post('complete/:id')
  async completePayment(@Param('id') paymentId: string) {
    return this.paymentService.completePayment(paymentId);
  }

  @Get('user')
  @UseGuards(JwtGuard)
  async listPaymentsByUser(@UserDecorator() usr: User) {
    return this.paymentService.listPaymentsByUser(usr.id);
  }
}
