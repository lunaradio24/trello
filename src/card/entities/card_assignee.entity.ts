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
import { Card } from './card.entity';
import { User } from '../../user/entities/user.entity';

@Entity({ name: 'card_assignees' })
export class CardAssignee {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'card_id', type: 'int', nullable: false })
  cardId: number;

  @Column({ name: 'assignee_id', type: 'int', nullable: false })
  assigneeId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => Card, (card) => card.cardAssignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'card_id', referencedColumnName: 'id' })
  card: Card;

  @ManyToOne(() => User, (user) => user.cardAssignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assignee_id', referencedColumnName: 'id' })
  user: User;
}
