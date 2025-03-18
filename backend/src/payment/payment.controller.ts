import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { UserDecorator } from 'src/decorator';
import { CompletePaymentDTo, CreatePaymentDTO } from './dto';
import { JwtGuard } from 'src/guards';

@UseGuards(JwtGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }


  @Post('initializePayment')
  async initializePayment(
    @UserDecorator() usr,
    @Body() dto: CreatePaymentDTO
  ) {
    return this.paymentService.createPayment(dto.bookingId, usr.id, dto.amount, dto.transactionId);
  }

  @Put("completePayment")
  async completePayment(@Body() dto: CompletePaymentDTo) {
    return this.paymentService.completePayment(dto.paymentId)
  }

  @Get('/user')
  async listPaymentsByUser(@UserDecorator() usr) {
    return this.paymentService.listPaymentsByUser(usr.id);
  }
}
