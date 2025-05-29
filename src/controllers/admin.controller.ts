import { Controller, Post, Delete, UseGuards } from '@nestjs/common';
import { DataImportService } from '../services/data-import.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Controller('admin')
@UseGuards(ApiKeyGuard)
export class AdminController {
  constructor(
    private readonly dataImportService: DataImportService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Post('import-data')
  async importAirportsData() {
    await this.dataImportService.importAirportsData();
    await this.cacheManager.reset();
    return { message: 'Airport data imported successfully and cache cleared' };
  }

  @Delete('cache')
  async clearCache() {
    await this.cacheManager.reset();
    return { message: 'Cache cleared successfully' };
  }
} 