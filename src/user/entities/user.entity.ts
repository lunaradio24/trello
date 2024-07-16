import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Board } from '../../board/entities/board.entity';
import { BoardMember } from '../../board/entities/board-member.entity';
import { CardAssignee } from '../../card/entities/card_assignee.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', select: false, nullable: false })
  password: string;

  @Column({ type: 'varchar', nullable: false })
  nickname: string;

  @Column({ type: 'varchar', nullable: true })
  bio: string;

  @Column({ type: 'varchar', nullable: true })
  image: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ select: false })
  deletedAt: Date;

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user, { cascade: ['remove', 'soft-remove'] })
  refreshToken: RefreshToken;

  @OneToMany(() => Comment, (comment) => comment.commenter, { cascade: ['soft-remove'] })
  comments: Comment[];

  @OneToMany(() => Board, (board) => board.admin, { cascade: ['soft-remove'] })
  boards: Board[];

  @OneToMany(() => BoardMember, (member) => member.user, { cascade: ['soft-remove'] })
  members: BoardMember[];

  @OneToMany(() => CardAssignee, (assignee) => assignee.user, { cascade: ['soft-remove'] })
  cardAssignees: CardAssignee[];
}
