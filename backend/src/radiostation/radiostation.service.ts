import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRadioStationDto, UpdateRadioStationDto } from './dto/create-radio-station.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApprovalStatus, SlotStatus } from '@prisma/client';

@Injectable()
export class RadioStationService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRadioStationDto) {
    return this.prisma.radioStation.create({ data });
  }

  async findAll() {
    return this.prisma.radioStation.findMany({
      include: {
        rjs: true,
        advertisementSlots: true,
        bookings: true,
        adminApprovalRequests: true,
      },
    });
  }

  async findOne(id: string) {
    const station = await this.prisma.radioStation.findUnique({
      where: { id },
      include: {
        rjs: true,
        advertisementSlots: true,
        bookings: true,
        adminApprovalRequests: true,
      },
    });
    if (!station) throw new NotFoundException('Radio Station not found');
    return station;
  }

  async update(id: string, data: UpdateRadioStationDto) {
    return this.prisma.radioStation.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.radioStation.delete({
      where: { id },
    });
  }


  async approveOrRejectApproval(approvalId: string, data: UpdateRadioStationDto) {
    const approvalRequest = await this.prisma.adminApprovalRequest.findUnique({
      where: { id: approvalId },
    });
    if (!approvalRequest) {
      throw new NotFoundException('Approval request not found');
    }

    const updatedApproval = await this.prisma.adminApprovalRequest.update({
      where: { id: approvalId },
      data: {
        approvalStatus: data.approvalStatus,
      },
    });

    if (!approvalRequest.bookingId && data.approvalStatus === ApprovalStatus.APPROVED) {
      await this.prisma.radioStation.update({
        where: { id: approvalRequest.stationId },
        data: {
          // isActive: true,
        },
      });
    }

    return updatedApproval;
  }

  async createWithApproval(data: CreateRadioStationDto, adminId: string) {
    if (!adminId) {
      throw new BadRequestException('adminId is required for approval');
    }

    const station = await this.prisma.radioStation.create({
      data,
      // data: { ...data, isActive: false }
    });

    const approval = await this.prisma.adminApprovalRequest.create({
      data: {
        stationId: station.id,
        adminId: adminId,
        approvalStatus: ApprovalStatus.PENDING,
        bookingId: null, 
      },
    });

    return { station, approval };
  }
}
