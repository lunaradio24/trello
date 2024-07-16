import { Card } from '../../card/entities/card.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'attachments' })
export class Attachment {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: false })
  cardId: number;

  @Column({ type: 'varchar' })
  fileUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => Card, (card) => card.attachments)
  @JoinColumn({ name: 'card_id', referencedColumnName: 'id' })
  card: Card;
}
