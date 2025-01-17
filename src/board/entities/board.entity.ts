import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BoardMember } from './board-member.entity';
import { List } from '../../list/entities/list.entity';
import { User } from '../../user/entities/user.entity';

@Entity('boards')
export class Board {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'admin_id', type: 'int' })
  adminId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ name: 'background_color', type: 'varchar', default: '#A52A2A' })
  backgroundColor: string;

  @Column({ type: 'text' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ select: false })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.boards)
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin: User;

  @OneToMany(() => List, (list) => list.board, { cascade: ['soft-remove'] })
  lists: List[];

  @OneToMany(() => BoardMember, (boardMember) => boardMember.board, { cascade: ['soft-remove'] })
  members: BoardMember[];
}
