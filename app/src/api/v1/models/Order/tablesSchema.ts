import { Schema } from 'mongoose';

export interface ITable {
  tableName: string;
  tableShape: string;
  numberOfPlaces: number;
  numberOfTables: number;
  numberOfTablesAvailable: number;
}

export const TableSchema: Schema = new Schema<ITable>({
  tableName: { type: String, required: true },
  tableShape: { type: String, required: true },
  numberOfPlaces: { type: Number, required: true },
  numberOfTables: { type: Number, required: true },
  numberOfTablesAvailable: { type: Number, required: true },
});
