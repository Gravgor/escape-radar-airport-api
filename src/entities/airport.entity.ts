import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('airports')
export class Airport {
  @PrimaryColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  city: string;

  @Column({ type: 'text' })
  country: string;

  @Column({ nullable: true, type: 'text' })
  iata: string | null;

  @Column({ nullable: true, type: 'text' })
  icao: string | null;

  @Column({ type: 'real' })
  latitude: number;

  @Column({ type: 'real' })
  longitude: number;

  @Column({ type: 'integer' })
  altitude: number;

  @Column({ type: 'real' })
  timezone: number;

  @Column({ type: 'text' })
  dst: string;

  @Column({ type: 'text' })
  tz: string;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  source: string;
} 