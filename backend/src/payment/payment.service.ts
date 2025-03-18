import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
    constructor(private prisma: PrismaService) { }

    async createPayment(bookingId: string, userId: string, amount: number, transactionId: string) {
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                bookingId,
                userId,
            },
        });

        if (existingPayment) {
            if (existingPayment.paymentStatus === PaymentStatus.PENDING) {
                throw new BadRequestException('Payment has already been initiated for this booking.');
            }
            if (existingPayment.paymentStatus === PaymentStatus.COMPLETED) {
                throw new BadRequestException('Payment has already been completed for this booking.');
            }
        }

        return this.prisma.payment.create({
            data: {
                bookingId,
                userId,
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

        if (!payment) {
            throw new NotFoundException('Payment not found.');
        }

        if (payment.paymentStatus === PaymentStatus.COMPLETED) {
            throw new BadRequestException('Payment is already completed.');
        }

        return this.prisma.payment.update({
            where: { id: paymentId },
            data: { paymentStatus: PaymentStatus.COMPLETED },
        });
    }

    async listPaymentsByUser(userId: string) {
        const payments = await this.prisma.payment.findMany({
            where: { userId },
            include: {
                booking: true,
            },
        });
        return payments;
    }
}
