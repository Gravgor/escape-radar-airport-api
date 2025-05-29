import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Airport } from '../entities/airport.entity';
import axios from 'axios';

@Injectable()
export class DataImportService {
  private readonly logger = new Logger(DataImportService.name);

  constructor(
    @InjectRepository(Airport)
    private airportRepository: Repository<Airport>,
    private configService: ConfigService,
  ) {}

  async importAirportsData(): Promise<void> {
    try {
      const dataUrl = this.configService.get<string>('airports.dataUrl');
      if (!dataUrl) {
        throw new Error('Airport data URL not configured');
      }
      this.logger.log('Starting airport data import...');

      const response = await axios.get(dataUrl);
      const csvData = response.data;

      const airports = this.parseCsvData(csvData);
      
      await this.airportRepository.clear();
      
      const batchSize = 1000;
      for (let i = 0; i < airports.length; i += batchSize) {
        const batch = airports.slice(i, i + batchSize);
        await this.airportRepository.save(batch);
        this.logger.log(`Imported ${Math.min(i + batchSize, airports.length)} / ${airports.length} airports`);
      }

      this.logger.log(`Successfully imported ${airports.length} airports`);
    } catch (error) {
      this.logger.error('Failed to import airport data', error);
      throw error;
    }
  }

  private parseCsvData(csvData: string): Airport[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    const airports: Airport[] = [];

    for (const line of lines) {
      try {
        const fields = this.parseCSVLine(line);
        
        if (fields.length >= 14) {
          const airport = new Airport();
          airport.id = parseInt(fields[0]) || 0;
          airport.name = this.cleanField(fields[1]);
          airport.city = this.cleanField(fields[2]);
          airport.country = this.cleanField(fields[3]);
          airport.iata = this.cleanField(fields[4]) === '\\N' ? null : this.cleanField(fields[4]);
          airport.icao = this.cleanField(fields[5]) === '\\N' ? null : this.cleanField(fields[5]);
          airport.latitude = parseFloat(fields[6]) || 0;
          airport.longitude = parseFloat(fields[7]) || 0;
          airport.altitude = parseInt(fields[8]) || 0;
          airport.timezone = parseFloat(fields[9]) || 0;
          airport.dst = this.cleanField(fields[10]);
          airport.tz = this.cleanField(fields[11]);
          airport.type = this.cleanField(fields[12]);
          airport.source = this.cleanField(fields[13]);

          airports.push(airport);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse line: ${line}`, error);
      }
    }

    return airports;
  }

  private parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    fields.push(current);
    return fields;
  }

  private cleanField(field: string): string {
    return field.replace(/^"/, '').replace(/"$/, '').trim();
  }
} 