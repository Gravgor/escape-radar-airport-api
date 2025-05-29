import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  UseGuards, 
  ValidationPipe, 
  NotFoundException,
  ParseIntPipe 
} from '@nestjs/common';
import { AirportsService } from '../services/airports.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { SearchAirportsDto, SearchResponseDto, AirportResponseDto } from '../dto/airport.dto';

@Controller('airports')
@UseGuards(ApiKeyGuard)
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Get('search')
  async searchAirports(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchAirportsDto
  ): Promise<SearchResponseDto> {
    return this.airportsService.searchAirports(searchDto);
  }

  @Get('search/main')
  async searchMainAirports(
    @Query(new ValidationPipe({ transform: true })) searchDto: SearchAirportsDto
  ): Promise<SearchResponseDto> {
    return this.airportsService.searchMainAirports(searchDto);
  }

  @Get('main-airport/:city')
  async getMainAirportForCity(@Param('city') city: string): Promise<AirportResponseDto> {
    const airport = await this.airportsService.getMainAirportForCity(city);
    if (!airport) {
      throw new NotFoundException(`No main airport found for city: ${city}`);
    }
    return airport;
  }

  @Get('stats')
  async getStats() {
    return this.airportsService.getStats();
  }

  @Get('id/:id')
  async getAirportById(@Param('id', ParseIntPipe) id: number): Promise<AirportResponseDto> {
    const airport = await this.airportsService.getAirportById(id);
    if (!airport) {
      throw new NotFoundException(`Airport with ID ${id} not found`);
    }
    return airport;
  }

  @Get('iata/:iata')
  async getAirportByIata(@Param('iata') iata: string): Promise<AirportResponseDto> {
    const airport = await this.airportsService.getAirportByIata(iata);
    if (!airport) {
      throw new NotFoundException(`Airport with IATA code ${iata} not found`);
    }
    return airport;
  }

  @Get('icao/:icao')
  async getAirportByIcao(@Param('icao') icao: string): Promise<AirportResponseDto> {
    const airport = await this.airportsService.getAirportByIcao(icao);
    if (!airport) {
      throw new NotFoundException(`Airport with ICAO code ${icao} not found`);
    }
    return airport;
  }

  @Get('country/:country')
  async getAirportsByCountry(
    @Param('country') country: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0
  ): Promise<SearchResponseDto> {
    return this.airportsService.getAirportsByCountry(country, limit, offset);
  }
} 