import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  //   JoinColumn,
  // ManyToOne,
  // OneToMany,
} from 'typeorm';

// import { Board } from '../boards/board.entity';
// import { Card } from '../cards/card.entity';

@Entity('lists')
export class List {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  boardId: number;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'float' })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;

  //   // 관계 정의
  //   @ManyToOne(() => Board, (board) => board.lists)
  //   //   DB에 들어갈 컬럼명으로
  //   @JoinColumn({ name: 'board_id', referencedColumnName: 'id' })
  //   board: Board;

  //   @OneToMany(() => Card, card => card.list)
  //   cards: Card[];
}
