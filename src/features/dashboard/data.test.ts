import {describe,it,expect} from 'vitest';
import {performanceTone,aggregate,rowsForDate,dates,columns} from './data';
import {parseDailyCsv} from './csv';
describe('Official performance thresholds',()=>{
 it.each([[98.2,'success'],[98.19999,'warning'],[96.5,'warning'],[96.49999,'danger'],[0,'danger'],[null,'neutral'],[NaN,'neutral']] as const)('classifies %s using raw value',(value,tone)=>expect(performanceTone(value)).toBe(tone));
 it('marks no operation as neutral',()=>expect(performanceTone(99,false)).toBe('neutral'));
 it('aggregates volume rather than averaging base percentages',()=>{const r=rowsForDate(dates[0]);const a=aggregate(r);expect(a.logistics).toBe(a.deliveries/a.packages*100);expect(r).toHaveLength(16);});
});
describe('Daily CSV preview',()=>{
 const rows=rowsForDate(dates[0]);const csv=[columns.map(c=>c.label).join(';'),...rows.map(r=>columns.map(c=>r[c.key]).join(';'))].join('\n');
 it('accepts all 12 original columns',()=>expect(parseDailyCsv(csv).errors).toEqual([]));
 it('rejects missing columns',()=>expect(parseDailyCsv('Base/Código;Pacotes\nSSP3;200').errors.length).toBeGreaterThan(0));
 it('rejects duplicates',()=>expect(parseDailyCsv(csv+'\n'+columns.map(c=>rows[0][c.key]).join(';')).errors.some(e=>e.includes('duplicada'))).toBe(true));
 it('supports quoted decimal commas',()=>expect(parseDailyCsv(csv.replace(String(rows[0].logistics),`"${String(rows[0].logistics).replace('.',',')}"`)).errors).toEqual([]));
});
