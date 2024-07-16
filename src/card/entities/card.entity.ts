import { List } from '../../list/entities/list.entity';
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
import { CardAssignee } from './card-assignee.entity';
import { Comment } from '../../comment/entities/comment.entity';
import { Attachment } from '../../attachment/entities/attachment.entity';
import { Checklist } from '../../checklist/entities/checklist.entity';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ name: 'list_id', type: 'int', nullable: false })
  listId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar', default: null })
  description: string;

  @Column({ type: 'float' })
  position: number;

  @Column({ type: 'varchar', length: 7, default: null })
  color: string;

  @Column({ type: 'datetime', default: null })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @ManyToOne(() => List, (list) => list.cards)
  @JoinColumn({ name: 'list_id', referencedColumnName: 'id' })
  list: List;

  @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comments: Comment[];

  @OneToMany(() => CardAssignee, (cardAssignee) => cardAssignee.card, { cascade: true })
  cardAssignees: CardAssignee[];

  @OneToMany(() => Attachment, (attachment) => attachment.card, { cascade: true })
  attachments: Attachment[];

  @OneToMany(() => Checklist, (checklist) => checklist.card, { cascade: true })
  checklists: Checklist[];
}
