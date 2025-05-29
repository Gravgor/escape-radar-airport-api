import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, Not, IsNull } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Airport } from '../entities/airport.entity';
import { SearchAirportsDto, SearchResponseDto, AirportResponseDto } from '../dto/airport.dto';
import { AiFilterService } from './ai-filter.service';

@Injectable()
export class AirportsService {
  constructor(
    @InjectRepository(Airport)
    private airportRepository: Repository<Airport>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private aiFilterService: AiFilterService,
  ) {}

  async searchAirports(searchDto: SearchAirportsDto): Promise<SearchResponseDto> {
    const cacheKey = `airports:search:${JSON.stringify(searchDto)}`;
    
    const cached = await this.cacheManager.get<SearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const queryBuilder = this.airportRepository.createQueryBuilder('airport');

    if (searchDto.search) {
      queryBuilder.andWhere(
        '(airport.name LIKE :search OR airport.city LIKE :search OR airport.country LIKE :search OR airport.iata LIKE :search OR airport.icao LIKE :search)',
        { search: `%${searchDto.search}%` }
      );
    }

    if (searchDto.country) {
      queryBuilder.andWhere('airport.country LIKE :country', { country: `%${searchDto.country}%` });
    }

    if (searchDto.city) {
      queryBuilder.andWhere('airport.city LIKE :city', { city: `%${searchDto.city}%` });
    }

    if (searchDto.iata) {
      queryBuilder.andWhere('airport.iata = :iata', { iata: searchDto.iata.toUpperCase() });
    }

    if (searchDto.icao) {
      queryBuilder.andWhere('airport.icao = :icao', { icao: searchDto.icao.toUpperCase() });
    }

    const total = await queryBuilder.getCount();

    const airports = await queryBuilder
      .orderBy('airport.name', 'ASC')
      .skip(searchDto.offset || 0)
      .take(searchDto.limit || 50)
      .getMany();

    const result: SearchResponseDto = {
      airports: airports.map(airport => this.mapToDto(airport)),
      total,
      limit: searchDto.limit || 50,
      offset: searchDto.offset || 0,
    };

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async getAirportById(id: number): Promise<AirportResponseDto | null> {
    const cacheKey = `airport:${id}`;
    
    const cached = await this.cacheManager.get<AirportResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const airport = await this.airportRepository.findOne({ where: { id } });
    
    if (!airport) {
      return null;
    }

    const result = this.mapToDto(airport);
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  async getAirportByIata(iata: string): Promise<AirportResponseDto | null> {
    const cacheKey = `airport:iata:${iata.toUpperCase()}`;
    
    const cached = await this.cacheManager.get<AirportResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const airport = await this.airportRepository.findOne({ 
      where: { iata: iata.toUpperCase() } 
    });
    
    if (!airport) {
      return null;
    }

    const result = this.mapToDto(airport);
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  async getAirportByIcao(icao: string): Promise<AirportResponseDto | null> {
    const cacheKey = `airport:icao:${icao.toUpperCase()}`;
    
    const cached = await this.cacheManager.get<AirportResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const airport = await this.airportRepository.findOne({ 
      where: { icao: icao.toUpperCase() } 
    });
    
    if (!airport) {
      return null;
    }

    const result = this.mapToDto(airport);
    await this.cacheManager.set(cacheKey, result, 600000);

    return result;
  }

  async getAirportsByCountry(country: string, limit: number = 50, offset: number = 0): Promise<SearchResponseDto> {
    const cacheKey = `airports:country:${country}:${limit}:${offset}`;
    
    const cached = await this.cacheManager.get<SearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const [airports, total] = await this.airportRepository.findAndCount({
      where: { country: ILike(`%${country}%`) },
      order: { name: 'ASC' },
      take: limit,
      skip: offset,
    });

    const result: SearchResponseDto = {
      airports: airports.map(airport => this.mapToDto(airport)),
      total,
      limit,
      offset,
    };

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async getStats(): Promise<any> {
    const cacheKey = 'airports:stats';
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const total = await this.airportRepository.count();
    const withIata = await this.airportRepository.count({ where: { iata: Not(IsNull()) } });
    const withIcao = await this.airportRepository.count({ where: { icao: Not(IsNull()) } });
    
    const countryStats = await this.airportRepository
      .createQueryBuilder('airport')
      .select('airport.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .groupBy('airport.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const result = {
      total,
      withIata,
      withIcao,
      topCountries: countryStats,
    };

    await this.cacheManager.set(cacheKey, result, 3600000);

    return result;
  }

  async searchMainAirports(searchDto: SearchAirportsDto): Promise<SearchResponseDto> {
    const allResults = await this.searchAirports(searchDto);
    const filteredAirports = await this.aiFilterService.filterMainAirports(allResults.airports);
    
    return {
      airports: filteredAirports,
      total: filteredAirports.length,
      limit: searchDto.limit || 50,
      offset: searchDto.offset || 0,
    };
  }

  async getMainAirportForCity(cityName: string): Promise<AirportResponseDto | null> {
    const cacheKey = `main-airport:city:${cityName.toLowerCase()}`;
    
    const cached = await this.cacheManager.get<AirportResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const cityAirports = await this.airportRepository.find({
      where: { city: ILike(`%${cityName}%`) },
      order: { name: 'ASC' },
    });

    if (cityAirports.length === 0) {
      return null;
    }

    const airportDtos = cityAirports.map(airport => this.mapToDto(airport));
    const mainAirport = await this.aiFilterService.getMainAirportForCity(cityName, airportDtos);

    if (mainAirport) {
      await this.cacheManager.set(cacheKey, mainAirport, 3600000);
    }

    return mainAirport;
  }

  private mapToDto(airport: Airport): AirportResponseDto {
    return {
      id: airport.id,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      iata: airport.iata,
      icao: airport.icao,
      latitude: airport.latitude,
      longitude: airport.longitude,
      altitude: airport.altitude,
      timezone: airport.timezone,
      dst: airport.dst,
      tz: airport.tz,
      type: airport.type,
      source: airport.source,
    };
  }
} 