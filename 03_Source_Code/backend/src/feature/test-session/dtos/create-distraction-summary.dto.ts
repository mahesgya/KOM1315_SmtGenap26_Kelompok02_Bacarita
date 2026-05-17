import { IsInt, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateDistractionSummaryDTO {
  @IsNotEmpty({ message: 'totalSessionDurationSec tidak boleh kosong' })
  @IsNumber({}, { message: 'totalSessionDurationSec harus berupa angka' })
  @IsPositive({ message: 'totalSessionDurationSec harus berupa angka positif' })
  totalSessionDurationSec: number;

  @IsNotEmpty({ message: 'timeBreakdownFocus tidak boleh kosong' })
  @IsNumber({}, { message: 'timeBreakdownFocus harus berupa angka' })
  @Min(0, { message: 'timeBreakdownFocus harus berupa angka non-negatif' })
  timeBreakdownFocus: number;

  @IsNotEmpty({ message: 'timeBreakdownTurning tidak boleh kosong' })
  @IsNumber({}, { message: 'timeBreakdownTurning harus berupa angka' })
  @Min(0, { message: 'timeBreakdownTurning harus berupa angka non-negatif' })
  timeBreakdownTurning: number;

  @IsNotEmpty({ message: 'timeBreakdownGlance tidak boleh kosong' })
  @IsNumber({}, { message: 'timeBreakdownGlance harus berupa angka' })
  @Min(0, { message: 'timeBreakdownGlance harus berupa angka non-negatif' })
  timeBreakdownGlance: number;

  @IsNotEmpty({ message: 'timeBreakdownNotDetected tidak boleh kosong' })
  @IsNumber({}, { message: 'timeBreakdownNotDetected harus berupa angka' })
  @Min(0, {
    message: 'timeBreakdownNotDetected harus berupa angka non-negatif',
  })
  timeBreakdownNotDetected: number;

  @IsNotEmpty({ message: 'turningTriggersCount tidak boleh kosong' })
  @IsInt({ message: 'turningTriggersCount harus berupa angka bulat' })
  @Min(0, { message: 'turningTriggersCount harus berupa angka non-negatif' })
  turningTriggersCount: number;

  @IsNotEmpty({ message: 'glanceTriggersCount tidak boleh kosong' })
  @IsInt({ message: 'glanceTriggersCount harus berupa angka bulat' })
  @Min(0, { message: 'glanceTriggersCount harus berupa angka non-negatif' })
  glanceTriggersCount: number;

  @IsNotEmpty({ message: 'avgPoseVariance tidak boleh kosong' })
  @IsNumber({}, { message: 'avgPoseVariance harus berupa angka' })
  @Min(0, { message: 'avgPoseVariance harus berupa angka non-negatif' })
  avgPoseVariance: number;

  @IsNotEmpty({ message: 'longFixationCount tidak boleh kosong' })
  @IsInt({ message: 'longFixationCount harus berupa angka bulat' })
  @Min(0, { message: 'longFixationCount harus berupa angka non-negatif' })
  longFixationCount: number;
}
