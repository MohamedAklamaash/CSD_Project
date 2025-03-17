import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  // config module for envs
  imports: [ConfigModule.forRoot({
    isGlobal: true
  }), AuthModule, UserModule, PrismaModule]
})
export class AppModule { }
