import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardMemberType } from '../types/board-member.type';
import { Board } from './board.entity';
import { User } from 'src/user/entities/user.entity';

@Entity('boards/members')
export class BoardMember {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'board_id' })
  boardId: number;

  @Column({ name: 'member_id' })
  memberId: number;

  @Column({ name: 'member_type', type: 'enum', enum: BoardMemberType })
  memberType: BoardMemberType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.members)
  @JoinColumn({ name: 'member_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Board, (board) => board.members)
  @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  board: Board;
}
