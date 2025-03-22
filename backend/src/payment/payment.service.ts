// payment.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPayment(bookingId: string, userId: string, amount: number, transactionId: string) {
    // Validate that userId is provided
    if (!userId) {
      throw new BadRequestException('userId is required to create a payment.');
    }
  
    // Check if a payment record already exists for this booking and user
    const existingPayment = await this.prisma.payment.findFirst({
      where: { bookingId, userId },
    });
  
    if (existingPayment) {
      if (existingPayment.paymentStatus === PaymentStatus.PENDING) {
        throw new BadRequestException('Payment has already been initiated for this booking.');
      }
      if (existingPayment.paymentStatus === PaymentStatus.COMPLETED) {
        throw new BadRequestException('Payment has already been completed for this booking.');
      }
    }
  
    // Create a new payment with PENDING status by connecting the booking and user records
    return this.prisma.payment.create({
      data: {
        booking: { connect: { id: bookingId } },
        user: { connect: { id: userId } },
        amount,
        transactionId,
        paymentStatus: PaymentStatus.PENDING,
      },
    });
  }
  
  async completePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found.');
    if (payment.paymentStatus === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment is already completed.');
    }
    // Mark the payment as COMPLETED
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: PaymentStatus.COMPLETED },
    });
  }

  async listPaymentsByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: { booking: true },
    });
  }
}
