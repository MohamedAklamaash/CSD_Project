import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreateRadioStationDto, UpdateRadioStationDto } from './dto/create-radio-station.dto';
import { RadioStationService } from './radiostation.service';
import { JwtGuard } from 'src/guards';
import { UserDecorator } from 'src/decorator';

@UseGuards(JwtGuard)
@Controller('stations')
export class RadioStationController {
  constructor(private readonly radioStationService: RadioStationService) { }

  @Post()
  async create(@UserDecorator() usr, @Body() createDto: CreateRadioStationDto) {
    return this.radioStationService.createWithApproval(createDto, usr.id);
  }

  @Get()
  async findAll() {
    return this.radioStationService.findAll();
  }

  @Patch('/approve/:id')
  async updateApproval(
    @Param('id') approvalId: string,
    @Body() updateApprovalDto: UpdateRadioStationDto,
  ) {
    return this.radioStationService.approveOrRejectApproval(approvalId, updateApprovalDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.radioStationService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateRadioStationDto) {
    return this.radioStationService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.radioStationService.remove(id);
  }
}
