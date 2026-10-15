import {createFileRoute} from '@tanstack/react-router';
import {DashboardPage} from '@/features/dashboard/dashboard-page';
export const Route=createFileRoute('/historico')({head:()=>({meta:[{title:'Histórico | JM Dashboard DS'},{name:'description',content:'Evolução histórica dos indicadores Last Mile da JM Transportes.'},{property:'og:title',content:'Histórico | JM Dashboard DS'},{property:'og:description',content:'Resultados diários e evolução da performance operacional JM.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}),component:History});
function History(){return <DashboardPage view="history"/>;}
