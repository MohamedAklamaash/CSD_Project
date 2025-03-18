import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AdContentService } from './adcontent.service';
import { UploadAdDto } from './dto/upload-ad.dto';

@Controller('ads')
export class AdContentController {
  constructor(private readonly adContentService: AdContentService) { }

  @Post('/upload')
  async upload(@Body() uploadDto: UploadAdDto) {
    return this.adContentService.upload(uploadDto);
  }

  @Get(':bookingId')
  async findByBooking(@Param('bookingId') bookingId: string) {
    return this.adContentService.findByBooking(bookingId);
  }
}
