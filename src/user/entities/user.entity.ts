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
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Board } from 'src/board/entities/board.entity';
import { BoardMember } from 'src/board/entities/board-member.entity';
import { CardAssignee } from 'src/card/entities/card_assignee.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
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

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshToken: RefreshToken;

  @OneToMany(() => Comment, (comment) => comment.commenter)
  comments: Comment[];

  @OneToMany(() => Board, (board) => board.admin)
  boards: Board[];

  @OneToMany(() => BoardMember, (member) => member.user)
  members: BoardMember[];

  @OneToMany(() => CardAssignee, (assignee) => assignee.user)
  assignee: CardAssignee[];
}
