// import { Card } from 'src/card/entities/card.entity';
import { Card } from '../../card/entities/card.entity';
import { User } from '../../user/entities/user.entity';
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

@Entity({ name: 'comments' })
export class Comment {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  cardId: number;

  @Column()
  commenterId: number;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => Card, (card) => card.comments)
  @JoinColumn({ name: 'card_id', referencedColumnName: 'id' })
  card: Card;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'commenter_id', referencedColumnName: 'id' })
  commenter: User;
}
