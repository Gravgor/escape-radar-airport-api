import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import configuration from './config/configuration';
import { Airport } from './entities/airport.entity';
import { AirportsController } from './controllers/airports.controller';
import { AdminController } from './controllers/admin.controller';
import { AirportsService } from './services/airports.service';
import { DataImportService } from './services/data-import.service';
import { AiFilterService } from './services/ai-filter.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite' as const,
        database: configService.get<string>('database.database') || 'airports.db',
        entities: [Airport],
        synchronize: configService.get<boolean>('database.synchronize') ?? true,
        logging: configService.get<boolean>('database.logging') ?? false,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = configService.get('redis') || {};
        try {
          return {
            store: redisStore as any,
            host: redisConfig.host || 'localhost',
            port: redisConfig.port || 6379,
            password: redisConfig.password || undefined,
            ttl: 300,
          };
        } catch (error) {
          console.warn('Redis connection failed, falling back to memory cache');
          return {
            ttl: 300,
          };
        }
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Airport]),
  ],
  controllers: [AirportsController, AdminController],
  providers: [AirportsService, DataImportService, AiFilterService, ApiKeyGuard],
})
export class AppModule {}
