import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus, SlotStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateBookingDto) {
        const slot = await this.prisma.advertisementSlot.findUnique({
            where: { id: data.slotId },
        });

        if (!slot) throw new NotFoundException('Slot not found');
        if (slot.availabilityStatus !== SlotStatus.AVAILABLE) {
            throw new BadRequestException('Slot is already booked');
        }

        const booking = await this.prisma.booking.create({
            data: {
                ...data,
                bookingStatus: BookingStatus.PENDING,
            },
        });

        await this.prisma.advertisementSlot.update({
            where: { id: data.slotId },
            data: { availabilityStatus: SlotStatus.BOOKED },
        });

        return booking;
    }

    async findAll() {
        return this.prisma.booking.findMany({ include: { user: true, station: true, rj: true, slot: true } });
    }

    async findOne(id: string) {
        const booking = await this.prisma.booking.findUnique({ where: { id } });
        if (!booking) throw new NotFoundException('Booking not found');
        return booking;
    }
}
