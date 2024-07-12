import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardMember } from './board-member.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Column({ name: 'admin_id' })
  adminId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ name: 'background_color', type: 'varchar', default: '#A52A2A' })
  backgroundColor: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //   @OneToMany(() => List, (list) => list.board)
  //   list: List[];

  //   @OneToMany(() => BoardMember, (boardMember) => boardMember.board)
  //   boardMember: BoardMember[];
}
