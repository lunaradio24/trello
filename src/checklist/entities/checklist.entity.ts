import { Card } from '../../card/entities/card.entity';
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

@Entity({ name: 'checklists' })
export class Checklist {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  cardId: number;

  @Column({ type: 'varchar' })
  content: string;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date;

  @Column({ type: 'boolean', default: false })
  isChecked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;

  @ManyToOne(() => Card, (card) => card.checklists)
  @JoinColumn({ name: 'card_id', referencedColumnName: 'id' })
  card: Card;
}
