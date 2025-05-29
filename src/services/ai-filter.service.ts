import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AirportResponseDto } from '../dto/airport.dto';

@Injectable()
export class AiFilterService {
  private readonly logger = new Logger(AiFilterService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    } else {
      this.logger.warn('OpenAI API key not configured. AI filtering will be disabled.');
    }
  }

  async filterMainAirports(airports: AirportResponseDto[]): Promise<AirportResponseDto[]> {
    if (!this.openai) {
      this.logger.warn('OpenAI not configured, returning all airports');
      return airports;
    }

    const airportsByCity = this.groupAirportsByCity(airports);
    const filteredAirports: AirportResponseDto[] = [];

    for (const [cityKey, cityAirports] of Object.entries(airportsByCity)) {
      if (cityAirports.length === 1) {
        filteredAirports.push(cityAirports[0]);
      } else {
        try {
          const mainAirport = await this.selectMainAirport(cityAirports);
          if (mainAirport) {
            filteredAirports.push(mainAirport);
          }
        } catch (error) {
          this.logger.error(`Failed to filter airports for ${cityKey}:`, error);
          filteredAirports.push(cityAirports[0]);
        }
      }
    }

    return filteredAirports;
  }

  private groupAirportsByCity(airports: AirportResponseDto[]): Record<string, AirportResponseDto[]> {
    const grouped: Record<string, AirportResponseDto[]> = {};
    
    for (const airport of airports) {
      const key = `${airport.city.toLowerCase()}-${airport.country.toLowerCase()}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(airport);
    }
    
    return grouped;
  }

  private async selectMainAirport(airports: AirportResponseDto[]): Promise<AirportResponseDto | null> {
    if (airports.length === 0) return null;
    if (airports.length === 1) return airports[0];

    const airportData = airports.map((airport, index) => ({
      index,
      name: airport.name,
      city: airport.city,
      country: airport.country,
      iata: airport.iata,
      icao: airport.icao,
      type: airport.type,
    }));

    const prompt = `
You are an aviation expert. Given the following airports in the same city, identify which one is the MAIN/PRIMARY commercial airport that most travelers would use.

Consider these factors:
1. International vs domestic airports
2. Size and passenger volume (inferred from name)
3. IATA code presence (airports with IATA codes are usually more significant)
4. Airport type
5. Common naming patterns (International, Central, Main, etc.)

Airports:
${airportData.map(a => `${a.index}: ${a.name} (${a.iata || 'No IATA'}) - ${a.city}, ${a.country} - Type: ${a.type}`).join('\n')}

Respond with ONLY the index number (0, 1, 2, etc.) of the main airport. No explanation needed.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('openai.model') || 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      const selectedIndex = parseInt(response.choices[0]?.message?.content?.trim() || '0');
      
      if (selectedIndex >= 0 && selectedIndex < airports.length) {
        this.logger.debug(`AI selected airport ${selectedIndex} for ${airports[0].city}: ${airports[selectedIndex].name}`);
        return airports[selectedIndex];
      } else {
        this.logger.warn(`Invalid AI response for ${airports[0].city}, using first airport`);
        return airports[0];
      }
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      return airports[0];
    }
  }

  async getMainAirportForCity(cityName: string, airports: AirportResponseDto[]): Promise<AirportResponseDto | null> {
    if (!airports || airports.length === 0) {
      return null;
    }

    const cityAirports = airports.filter(airport => 
      airport.city.toLowerCase().includes(cityName.toLowerCase()) ||
      cityName.toLowerCase().includes(airport.city.toLowerCase())
    );

    if (cityAirports.length === 0) {
      return null;
    }

    if (cityAirports.length === 1) {
      return cityAirports[0];
    }

    return await this.selectMainAirport(cityAirports);
  }
} 