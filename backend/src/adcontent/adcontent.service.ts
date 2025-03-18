import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UploadAdDto } from './dto/upload-ad.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdContentService {
    constructor(private prisma: PrismaService) { }


    async upload(data: UploadAdDto) {
        // Validate bookingId is provided and exists
        if (!data.bookingId) {
            throw new BadRequestException('bookingId is required');
        }
        const booking = await this.prisma.booking.findUnique({
            where: { id: data.bookingId },
        });
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // Validate userId is provided and exists
        if (!data.userId) {
            throw new BadRequestException('userId is required');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: data.userId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Create Ad Content and properly connect booking and user
        return this.prisma.adContent.create({
            data: {
                booking: { connect: { id: data.bookingId } },
                user: { connect: { id: data.userId } },
                filePath: data.filePath,
                adDescription: data.adDescription,
            },
        });
    }

    async findByBooking(bookingId: string) {
        return this.prisma.adContent.findMany({ where: { bookingId } });
    }
}
