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
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Category } from '@balance/shared';
import { CurrentUser, type AuthUser } from '../auth/contracts';
import { CategoriesService } from './categories.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

/** Закрыт глобальным JwtAuthGuard; работает только с категориями текущего пользователя. */
@ApiTags('categories')
@ApiCookieAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOkResponse({ type: [CategoryDto] })
  findAll(@CurrentUser() user: AuthUser): Promise<Category[]> {
    return this.categories.findAll(user.userId);
  }

  @Get(':id')
  @ApiOkResponse({ type: CategoryDto })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Category> {
    return this.categories.findOne(user.userId, id);
  }

  @Post()
  @ApiCreatedResponse({ type: CategoryDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categories.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOkResponse({ type: CategoryDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categories.update(user.userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categories.remove(user.userId, id);
  }
}
