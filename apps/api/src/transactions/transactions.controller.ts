import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Transaction, TransactionsSummary } from '@balance/shared';
import { CurrentUser, type AuthUser } from '../auth/contracts';
import {
  CreateTransactionDto,
  TransactionDto,
  TransactionsFilterDto,
  TransactionsSummaryDto,
  UpdateTransactionDto,
} from './transactions.dto';
import { TransactionsService } from './transactions.service';

/** Закрыт глобальным JwtAuthGuard; работает только с транзакциями текущего пользователя. */
@ApiTags('transactions')
@ApiCookieAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @ApiOkResponse({ type: [TransactionDto] })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() filter: TransactionsFilterDto,
  ): Promise<Transaction[]> {
    return this.transactions.findAll(user.userId, filter);
  }

  /** Объявлен до `:id`, иначе `summary` попадёт в ParseUUIDPipe. */
  @Get('summary')
  @ApiOkResponse({ type: TransactionsSummaryDto })
  summary(
    @CurrentUser() user: AuthUser,
    @Query() filter: TransactionsFilterDto,
  ): Promise<TransactionsSummary> {
    return this.transactions.summary(user.userId, filter);
  }

  @Get(':id')
  @ApiOkResponse({ type: TransactionDto })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    return this.transactions.findOne(user.userId, id);
  }

  @Post()
  @ApiCreatedResponse({ type: TransactionDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto): Promise<Transaction> {
    return this.transactions.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: TransactionDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    return this.transactions.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.transactions.remove(user.userId, id);
  }
}
