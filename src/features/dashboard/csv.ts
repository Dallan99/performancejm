import Papa from 'papaparse';
import { columns } from './data';
export function parseDailyCsv(text: string) {
 const result=Papa.parse<string[]>(text.replace(/^\uFEFF/,''), {skipEmptyLines:'greedy'});
 const [headers=[],...rows]=result.data;
 const normalize=(s:string)=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const errors:string[]=result.errors.map(e=>`Linha ${(e.row??0)+1}: ${e.message}`);
 if(headers.length!==12) errors.push(`Esperadas 12 colunas; encontradas ${headers.length}.`);
 columns.forEach(c=>{if(!headers.some(h=>normalize(h)===normalize(c.label))) errors.push(`Coluna ausente: ${c.label}.`);});
 const seen=new Set<string>();
 rows.forEach((row,i)=>{
  if(row.length!==12) errors.push(`Linha ${i+2}: quantidade de colunas inválida.`);
  const base=row[headers.findIndex(h=>normalize(h)===normalize('Base/Código'))]?.trim();
  if(!base) errors.push(`Linha ${i+2}: base obrigatória.`);
  else if(seen.has(normalize(base))) errors.push(`Linha ${i+2}: base duplicada (${base}).`);
  else seen.add(normalize(base));
  columns.slice(2).forEach(c=>{
   const raw=row[headers.findIndex(h=>normalize(h)===normalize(c.label))]?.trim()??'';
   if(!raw && c.key.startsWith('without') || !raw && c.key==='logistics') return;
   const value=Number(raw.replace(/%$/,'').replace(',','.'));
   const performance=['logistics','withoutDc','withoutClaims'].includes(c.key);
   if(!raw || !Number.isFinite(value) || value<0 || (performance ? value>100 : !Number.isInteger(value))) errors.push(`Linha ${i+2}: valor inválido em ${c.label}.`);
  });
 });
 if(!rows.length) errors.push('O arquivo não possui registros.');
 return {headers,rows,errors};
}
