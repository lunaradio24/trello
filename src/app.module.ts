import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { BoardModule } from './board/board.module';
import { ListModule } from './list/list.module';
import { CardModule } from './card/card.module';
import { CommentModule } from './comment/comment.module';
import { ChecklistModule } from './checklist/checklist.module';
import { AttachmentModule } from './attachment/attachment.module';

@Module({
  imports: [AuthModule, UserModule, BoardModule, ListModule, CardModule, CommentModule, ChecklistModule, AttachmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
