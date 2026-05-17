import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminModule } from '../users/admin/admin.module';
import { CuratorModule } from '../users/curator/curator.module';
import { ParentModule } from '../users/parent/parent.module';
import { StudentModule } from '../users/student/student.module';
import { TeacherModule } from '../users/teacher/teacher.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('app.jwt.expires') || '7d',
        },
      }),
    }),

    forwardRef(() => TeacherModule),
    ParentModule,
    StudentModule,
    AdminModule,
    CuratorModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
