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
import { List } from 'src/list/entities/list.entity';
import { User } from 'src/user/entities/user.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ select: false })
  deletedAt: Date | null;

  @ManyToOne(() => User, (user) => user.boards)
  @JoinColumn({ name: 'admin_id', referencedColumnName: 'id' })
  admin: User;

  @OneToMany(() => List, (list) => list.board)
  lists: List[];

  @OneToMany(() => BoardMember, (boardMember) => boardMember.board)
  members: BoardMember[];
}
