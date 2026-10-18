import { IsString, IsNotEmpty, Length, Matches, IsIn, IsNumber, IsOptional } from 'class-validator';

export const VALID_SUBSCRIPTION_PLANS = [
  '1 Month',
  '1 Month Pro',
  '3 Months',
  '3 Months Pro',
  '6 Months',
  '6 Months Pro',
  '12 Months',
  '12 Months Pro',
] as const;

export const PLAN_PRICING_CATALOG: Record<string, number> = {
  '1 Month': 49,
  '1 Month Pro': 49,
  '3 Months': 99,
  '3 Months Pro': 99,
  '6 Months': 0, // Special Launch Offer
  '6 Months Pro': 0, // Special Launch Offer
  '12 Months': 999,
  '12 Months Pro': 999,
};

export class CreateSubscriptionRequestDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_SUBSCRIPTION_PLANS, { message: 'Invalid subscription package selected' })
  planName!: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsNotEmpty()
  @Length(6, 25)
  @Matches(/^[A-Za-z0-9]+$/, { message: 'bKash TrxID must be alphanumeric characters' })
  trxCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'bKash number last digits must be exactly 4 numeric digits' })
  bkashLastFour!: string;
}
