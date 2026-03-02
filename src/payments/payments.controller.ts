import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import {
  ApiCreatePaymentIntent,
  ApiListPurchases,
} from './swagger/payments.swagger';
import {
  SUCCESS_MESSAGES,
  fetchSuccess,
} from '../common/constants/success-messages.constant';

@ApiTags('Payments')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @ApiCreatePaymentIntent()
  async createPaymentIntent(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    const data = await this.paymentsService.createPaymentIntent(user.id, dto);
    return { _message: SUCCESS_MESSAGES.PURCHASE_SUCCESS, data };
  }

  @Get('history')
  @ApiListPurchases()
  async listPurchases(@CurrentUser() user: User) {
    const data = await this.paymentsService.listUserPurchases(user.id);
    return { _message: fetchSuccess('purchase history'), data };
  }
}
