import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto, UpdateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class AdvertisementSlotService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateSlotDto) {
        return this.prisma.advertisementSlot.create({ data });
    }

    async findAll() {
        return this.prisma.advertisementSlot.findMany({
            include: { station: true, rj: true, bookings: true },
        });
    }

    async findOne(id: string) {
        const slot = await this.prisma.advertisementSlot.findUnique({
            where: { id },
            include: { station: true, rj: true, bookings: true },
        });

        if (!slot) throw new NotFoundException('Slot not found');
        return slot;
    }

    async update(id: string, data: UpdateSlotDto) {
        return this.prisma.advertisementSlot.update({
            where: { id },
            data,
        });
    }

    async remove(id: string) {
        return this.prisma.advertisementSlot.delete({
            where: { id },
        });
    }
}
