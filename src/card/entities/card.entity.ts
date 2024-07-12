import { List } from 'src/list/entities/list.entity';
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
import { CardAssignee } from './card_assignee.entity';
import { Comment } from 'src/comment/entities/comment.entity';
// import { Attachment } from 'src/attachment/entities/attachment.entity';
// import { Checklist } from 'src/checklist/entities/checklist.entity';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'list_id', type: 'int', nullable: false })
  listId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'float' })
  position: number;

  @Column({ type: 'varchar', length: 7 })
  color: string;

  @Column({ type: 'datetime' })
  due_date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  // @ManyToOne(() => List, (list) => list.card)
  @JoinColumn({ name: 'list_id', referencedColumnName: 'id' })
  list: List;

  // @OneToMany(() => Comment, (comment) => comment.card, { cascade: true })
  comment: Comment;

  @OneToMany(() => CardAssignee, (cardAssignee) => cardAssignee.card, { cascade: true })
  cardAssignee: CardAssignee;

  // @OneToMany(() => attachment, (attachment) => attachment.card, { cascade: true })
  // attachment: Attachment;
  //
  // @OneToMany(() => checklist, (checklist) => checklist.card, { cascade: true })
  // checklist: Checklist;
}
