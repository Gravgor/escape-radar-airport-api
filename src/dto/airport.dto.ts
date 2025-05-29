import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchAirportsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  iata?: string;

  @IsOptional()
  @IsString()
  icao?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class AirportResponseDto {
  id: number;
  name: string;
  city: string;
  country: string;
  iata: string | null;
  icao: string | null;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: number;
  dst: string;
  tz: string;
  type: string;
  source: string;
}

export class SearchResponseDto {
  airports: AirportResponseDto[];
  total: number;
  limit: number;
  offset: number;
} 