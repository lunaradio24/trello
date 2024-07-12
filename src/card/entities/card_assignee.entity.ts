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
import { User } from 'src/user/entities/user.entity';

@Entity({ name: 'card_assignees' })
export class CardAssignee {
  @PrimaryGeneratedColumn()
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

  @ManyToOne(() => Card, (card) => card.cardAssignee)
  @JoinColumn({ name: 'card_id', referencedColumnName: 'id' })
  card: Card;

  @ManyToOne(() => User, (user) => user.cardAssignee)
  @JoinColumn({ name: 'assignee_id', referencedColumnName: 'id' })
  user: User;
}
