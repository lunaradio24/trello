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

  //   @ManyToOne(() => Board, (board) => board.boardMember)
  //   @JoinColumn({ name: 'board_id' })
  //   board: Board;
}
