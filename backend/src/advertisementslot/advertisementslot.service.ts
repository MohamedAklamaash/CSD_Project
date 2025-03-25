import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSlotDto, UpdateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class AdvertisementSlotService {
    constructor(private prisma: PrismaService) { }

    async create(data: CreateSlotDto) {
        // Convert slotTime to a proper ISO-8601 string
        const slotTimeISOString = new Date(data.slotTime).toISOString();

        const existingSlot = await this.prisma.advertisementSlot.findFirst({
            where: {
                stationId: data.stationId,
                rjId: data.rjId,
                slotTime: slotTimeISOString,
            },
        });

        if (existingSlot) {
            throw new BadRequestException('Slot already exists for this station, RJ, and time.');
        }

        // Ensure you also pass the formatted date when creating the slot.
        return this.prisma.advertisementSlot.create({
            data: { ...data, slotTime: slotTimeISOString },
        });
    }

    async findAll() {
        return this.prisma.advertisementSlot.findMany({
            include: { station: true, rj: true, bookings: true },
        });
    }

    async findAllAvailableSlotsWithFilter(availabilityStatus?: string) {
        const filter: any = {};
        if (availabilityStatus) {
            filter.availabilityStatus = availabilityStatus;
        }
        return this.prisma.advertisementSlot.findMany({
            where: filter,
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
        let updatedData = { ...data };
        if (data.slotTime) {
            updatedData.slotTime = new Date(data.slotTime);
        }
        return this.prisma.advertisementSlot.update({
            where: { id },
            data: updatedData,
        });
    }

    async remove(id: string) {
        return this.prisma.advertisementSlot.delete({
            where: { id },
        });
    }
}
